<?php
/**
 * Redis feature-store demo server (PHP + Predis + php -S).
 *
 * Run with:
 *
 *     composer install
 *     php -S 127.0.0.1:8094 demo_server.php
 *
 * Visit http://127.0.0.1:8094 to watch an online feature store at work:
 * a batch materialization loads N users with a 24-hour key-level TTL,
 * a streaming worker overwrites a handful of users' real-time features
 * every second with a per-field HEXPIRE, and the inference panel reads
 * any subset of features for any user with HMGET in a single round
 * trip.
 *
 * `php -S` runs each HTTP request in a fresh process, so the streaming
 * worker can't live inside this script. The first request to this
 * router spawns a detached CLI worker process (streaming_worker.php)
 * and stores its PID in Redis at fs:control:worker_pid. Subsequent
 * requests verify the PID is still alive and respawn if not.
 *
 * Worker state (paused, tick_in_flight, tick_count, writes_count,
 * stop) lives in Redis under fs:control:* so the server and worker
 * can share it across the process boundary.
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/FeatureStore.php';
require_once __DIR__ . '/BuildFeatures.php';

use Predis\Client;

// Config — env vars only (php -S can't pass CLI flags to a router).
$redisUri = getenv('REDIS_URI') ?: 'tcp://127.0.0.1:6379';
$keyPrefix = getenv('KEY_PREFIX') ?: 'fs:user:';
$batchTtlSeconds = (int)(getenv('BATCH_TTL_SECONDS') ?: (24 * 60 * 60));
$streamingTtlSeconds = (int)(getenv('STREAMING_TTL_SECONDS') ?: (5 * 60));
$usersPerTick = (int)(getenv('USERS_PER_TICK') ?: 5);
$seedUsers = (int)(getenv('SEED_USERS') ?: 200);
$resetOnStart = getenv('NO_RESET') !== '1';

$redis = new Client($redisUri);
$store = new FeatureStore($redis, $keyPrefix, $batchTtlSeconds, $streamingTtlSeconds);

// One-time bootstrap on the very first request: reset, seed, spawn
// the worker. We gate it with a Redis-stored flag so concurrent
// first requests don't double-seed.
ensure_bootstrapped($redis, $store, $resetOnStart, $seedUsers, $batchTtlSeconds);

// Always make sure the streaming worker is alive before serving any
// request that depends on it. `spawn_worker_if_needed` is idempotent
// and cheap (one Redis GET + a PID-alive check) on the hot path.
spawn_worker_if_needed($redis, $redisUri, $keyPrefix, $batchTtlSeconds, $streamingTtlSeconds, $usersPerTick);

// ----- Routing ---------------------------------------------------------

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

switch (true) {
    case $method === 'GET' && ($path === '/' || $path === '/index.html'):
        header('Content-Type: text/html; charset=utf-8');
        echo render_html($keyPrefix, $streamingTtlSeconds, $usersPerTick);
        break;

    case $method === 'GET' && $path === '/state':
        send_json(200, build_state($redis, $store));
        break;

    case $method === 'GET' && $path === '/inspect':
        handle_inspect($redis, $store);
        break;

    case $method === 'POST' && $path === '/bulk-load':
        handle_bulk_load($redis, $store);
        break;

    case $method === 'POST' && $path === '/reset':
        handle_reset($redis, $store, $batchTtlSeconds, $streamingTtlSeconds, $usersPerTick);
        break;

    case $method === 'POST' && $path === '/worker/toggle':
        handle_worker_toggle($redis, $redisUri, $keyPrefix, $batchTtlSeconds, $streamingTtlSeconds, $usersPerTick);
        break;

    case $method === 'POST' && $path === '/read':
        handle_read($redis, $store);
        break;

    case $method === 'POST' && $path === '/batch-read':
        handle_batch_read($redis, $store);
        break;

    default:
        http_response_code(404);
        echo 'Not Found';
}
return; // php -S router scripts return false to fall through to the file
        // system; we never do.

// ----------------------------------------------------------------------
// Bootstrap + worker process management
// ----------------------------------------------------------------------

function ensure_bootstrapped(
    Client $redis, FeatureStore $store, bool $resetOnStart,
    int $seedUsers, int $batchTtlSeconds
): void {
    // Cheap idempotency check: if the demo bootstrap key is set, do
    // nothing. The key is removed by Reset.
    if ($redis->get('fs:control:bootstrapped') === '1') return;

    // Use a short-lived lock so concurrent first requests don't both
    // run the seed path.
    $lockAcquired = $redis->set('fs:control:bootstrap_lock', '1', 'EX', 30, 'NX');
    if (!$lockAcquired) {
        // Wait briefly for the other request to finish.
        for ($i = 0; $i < 30; $i++) {
            usleep(100_000);
            if ($redis->get('fs:control:bootstrapped') === '1') return;
        }
        return; // give up; we'll try again next request
    }
    try {
        if ($resetOnStart) {
            $store->reset();
            $store->resetStats();
            $redis->del(...['fs:control:tick_count', 'fs:control:writes_count']);
        }
        $rows = BuildFeatures::synthesizeUsers($seedUsers, 42);
        $store->bulkLoad($rows, $batchTtlSeconds);
        $redis->set('fs:control:bootstrapped', '1');
    } finally {
        $redis->del(...['fs:control:bootstrap_lock']);
    }
}

function spawn_worker_if_needed(
    Client $redis, string $redisUri, string $keyPrefix,
    int $batchTtl, int $streamingTtl, int $usersPerTick
): void {
    $pid = (int)$redis->get('fs:control:worker_pid');
    if ($pid > 0 && pid_alive($pid)) return;

    // SET NX guards against two concurrent requests both observing a
    // dead PID and both spawning a worker. The 30 s expiry releases
    // the lock if this request dies before clearing it.
    $lock = $redis->set('fs:control:spawn_lock', '1', 'EX', 30, 'NX');
    if ($lock !== true) return;
    try {
        // Re-check inside the lock: another request may have spawned
        // a worker between the first check and the lock acquisition.
        $pid = (int)$redis->get('fs:control:worker_pid');
        if ($pid > 0 && pid_alive($pid)) return;

        // Stale state cleanup, then spawn.
        $redis->del(...[
            'fs:control:worker_pid', 'fs:control:running',
            'fs:control:tick_in_flight', 'fs:control:stop',
        ]);

        $script = escapeshellarg(__DIR__ . '/streaming_worker.php');
        $logFile = escapeshellarg(sys_get_temp_dir() . '/fs-streaming-worker.log');
        $env = [
            'REDIS_URI=' . escapeshellarg($redisUri),
            'KEY_PREFIX=' . escapeshellarg($keyPrefix),
            'BATCH_TTL_SECONDS=' . (int)$batchTtl,
            'STREAMING_TTL_SECONDS=' . (int)$streamingTtl,
            'USERS_PER_TICK=' . (int)$usersPerTick,
        ];
        $envStr = implode(' ', $env);

        // `nohup ... &` is the portable way to spawn a detached child
        // that survives the dying `php -S` request handler. `</dev/null`
        // closes stdin; stdout/stderr go to a fresh log under the
        // system temp dir (`>` truncates on each respawn so a crash
        // loop can't fill the disk). macOS doesn't have GNU setsid,
        // so we intentionally avoid it.
        $cmd = "/usr/bin/env {$envStr} nohup /usr/bin/env php {$script} "
             . ">{$logFile} 2>&1 </dev/null &";
        @shell_exec($cmd);

        // Wait a moment for the worker to register its PID.
        for ($i = 0; $i < 30; $i++) {
            usleep(100_000);
            $pid = (int)$redis->get('fs:control:worker_pid');
            if ($pid > 0 && pid_alive($pid)) return;
        }
    } finally {
        $redis->del(...['fs:control:spawn_lock']);
    }
}

function pid_alive(int $pid): bool
{
    if ($pid <= 0) return false;
    if (function_exists('posix_kill')) {
        return @posix_kill($pid, 0);
    }
    // Fallback: ps lookup.
    return (int)trim(@shell_exec("ps -p {$pid} -o pid= 2>/dev/null") ?? '') === $pid;
}

// ----------------------------------------------------------------------
// Handlers
// ----------------------------------------------------------------------

function build_state(Client $redis, FeatureStore $store): array
{
    $ids = $store->listEntityIds(500);
    $count = $store->countEntities();
    return [
        'key_prefix' => $store->keyPrefix,
        'batch_ttl_seconds' => $store->batchTtlSeconds,
        'streaming_ttl_seconds' => $store->streamingTtlSeconds,
        'entity_count' => $count,
        'entity_ids' => $ids,
        'stats' => $store->statsSnapshot(),
        'worker' => worker_stats($redis),
    ];
}

function worker_stats(Client $redis): array
{
    $pid = (int)$redis->get('fs:control:worker_pid');
    $running = $pid > 0 && pid_alive($pid);
    return [
        'running' => $running,
        'paused' => $redis->get('fs:control:paused') === '1',
        'tick_count' => (int)$redis->get('fs:control:tick_count'),
        'writes_count' => (int)$redis->get('fs:control:writes_count'),
    ];
}

function handle_inspect(Client $redis, FeatureStore $store): void
{
    $user = trim((string)($_GET['user'] ?? ''));
    if ($user === '') {
        send_json(400, ['error' => 'user is required']);
        return;
    }
    $full = $store->getFeatures($user, null);
    $keyTtl = $store->keyTtlSeconds($user);
    if (count($full) === 0) {
        send_json(200, ['exists' => false, 'key_ttl_seconds' => $keyTtl]);
        return;
    }
    // Iterate the known schema (batch + streaming) plus any extras
    // the hash carries so expired streaming fields surface as
    // ttl_seconds=-2 in the Inspect view rather than silently
    // disappearing.
    $names = array_merge(
        FeatureStore::DEFAULT_BATCH_FIELDS,
        FeatureStore::DEFAULT_STREAMING_FIELDS,
    );
    foreach ($full as $k => $_) {
        if (!in_array($k, $names, true)) $names[] = $k;
    }
    $ttls = $store->fieldTtlsSeconds($user, $names);
    sort($names);
    $fields = [];
    foreach ($names as $n) {
        $fields[] = [
            'name' => $n,
            'value' => $full[$n] ?? '',
            'ttl_seconds' => $ttls[$n] ?? -2,
        ];
    }
    send_json(200, [
        'exists' => true,
        'key_ttl_seconds' => $keyTtl,
        'fields' => $fields,
    ]);
}

function handle_bulk_load(Client $redis, FeatureStore $store): void
{
    $count = clamp_int($_POST['count'] ?? 200, 1, 2000);
    $ttl = clamp_int($_POST['ttl'] ?? 86400, 5, 172_800);
    $t0 = microtime(true);
    $loaded = $store->bulkLoad(
        BuildFeatures::synthesizeUsers($count, 42),
        $ttl,
    );
    $elapsedMs = (microtime(true) - $t0) * 1000.0;
    send_json(200, [
        'loaded' => $loaded,
        'ttl_seconds' => $ttl,
        'elapsed_ms' => $elapsedMs,
    ]);
}

function handle_reset(
    Client $redis, FeatureStore $store,
    int $batchTtl, int $streamTtl, int $usersPerTick
): void {
    // Pause the streaming worker (paused=1) and wait for its
    // current tick to drain (tick_in_flight=0). Same race-protection
    // pattern as every other client in this use case.
    $wasPaused = $redis->get('fs:control:paused') === '1';
    $redis->set('fs:control:paused', '1');
    try {
        // Drain any in-flight tick before the DEL sweep. Five seconds
        // is well above the one-second tick interval (so a slow tick
        // can finish) but short enough that a hung worker doesn't
        // wedge the demo indefinitely.
        $deadline = microtime(true) + 5.0;
        while ($redis->get('fs:control:tick_in_flight') === '1') {
            if (microtime(true) >= $deadline) {
                send_json(503, ['error' => 'streaming worker did not become idle']);
                return;
            }
            usleep(20_000);
        }
        $deleted = $store->reset();
        $store->resetStats();
        $redis->del(...['fs:control:tick_count', 'fs:control:writes_count']);
        send_json(200, ['deleted' => $deleted]);
    } finally {
        if (!$wasPaused) $redis->set('fs:control:paused', '0');
    }
}

function handle_worker_toggle(
    Client $redis, string $redisUri, string $keyPrefix,
    int $batchTtl, int $streamTtl, int $usersPerTick
): void {
    // Three states: stopped → respawn (and leave unpaused);
    // running + unpaused → pause; running + paused → resume.
    // Capture liveness BEFORE the respawn so we can tell whether the
    // call is "bring the worker back" vs. "flip the pause flag".
    // Otherwise a respawn lands with whatever `fs:control:paused` was
    // last set to, and the toggle pauses the worker we just spawned.
    $wasRunning = pid_alive((int)$redis->get('fs:control:worker_pid'));
    spawn_worker_if_needed($redis, $redisUri, $keyPrefix, $batchTtl, $streamTtl, $usersPerTick);
    if (!$wasRunning) {
        $redis->set('fs:control:paused', '0');
        send_json(200, ['paused' => false, 'running' => true]);
        return;
    }
    $paused = $redis->get('fs:control:paused') === '1';
    $redis->set('fs:control:paused', $paused ? '0' : '1');
    send_json(200, [
        'paused' => !$paused,
        'running' => true,
    ]);
}

function handle_read(Client $redis, FeatureStore $store): void
{
    // PHP's $_POST collapses repeated keys (the last `field=` wins),
    // but the demo sends `field=a&field=b&field=c` so the model can
    // request several features in one call. Parse the raw body
    // ourselves to keep every value.
    $form = parse_multi_form();
    $user = trim($form['user'][0] ?? '');
    if ($user === '') {
        send_json(400, ['error' => 'user is required']);
        return;
    }
    $fields = array_values(array_filter($form['field'] ?? [], fn($f) => $f !== ''));
    $t0 = microtime(true);
    $values = count($fields) > 0 ? $store->getFeatures($user, $fields) : [];
    $elapsedMs = (microtime(true) - $t0) * 1000.0;
    $ttls = count($fields) > 0 ? $store->fieldTtlsSeconds($user, $fields) : [];
    $keyTtl = $store->keyTtlSeconds($user);
    send_json(200, [
        'requested' => $fields,
        'values' => (object)$values,
        'ttls' => (object)$ttls,
        'key_ttl_seconds' => $keyTtl,
        'returned_count' => count($values),
        'elapsed_ms' => $elapsedMs,
    ]);
}

function handle_batch_read(Client $redis, FeatureStore $store): void
{
    $form = parse_multi_form();
    $count = clamp_int($form['count'][0] ?? 100, 1, 500);
    $fields = array_values(array_filter($form['field'] ?? [], fn($f) => $f !== ''));
    if (count($fields) === 0) {
        $fields = array_merge(FeatureStore::DEFAULT_STREAMING_FIELDS, ['risk_segment']);
    }
    $ids = $store->listEntityIds(max($count * 2, 2000));
    if (count($ids) > $count) $ids = array_slice($ids, 0, $count);
    $t0 = microtime(true);
    $rows = $store->batchGetFeatures($ids, $fields);
    $elapsedMs = (microtime(true) - $t0) * 1000.0;
    $sample = [];
    foreach (array_slice($ids, 0, 10) as $id) {
        $sample[] = ['id' => $id, 'field_count' => count($rows[$id] ?? [])];
    }
    send_json(200, [
        'entity_count' => count($ids),
        'field_count' => count($fields),
        'elapsed_ms' => $elapsedMs,
        'sample' => $sample,
    ]);
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function send_json(int $status, mixed $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}

function clamp_int(mixed $value, int $lo, int $hi): int
{
    $n = is_numeric($value) ? (int)$value : $lo;
    return max($lo, min($hi, $n));
}

/**
 * Parse the raw application/x-www-form-urlencoded request body into a
 * multi-value map (`['field' => ['a', 'b', 'c'], ...]`). PHP's
 * built-in `$_POST` collapses repeated keys (`field=a&field=b` keeps
 * only `b`); the demo sends repeated `field=` for the inference and
 * batch-read forms, so we parse the body ourselves to preserve every
 * value.
 *
 * @return array<string, array<string>>
 */
function parse_multi_form(): array
{
    $body = file_get_contents('php://input');
    $out = [];
    if (!is_string($body) || $body === '') return $out;
    foreach (explode('&', $body) as $pair) {
        if ($pair === '') continue;
        $eq = strpos($pair, '=');
        if ($eq === false) {
            $k = urldecode($pair); $v = '';
        } else {
            $k = urldecode(substr($pair, 0, $eq));
            $v = urldecode(substr($pair, $eq + 1));
        }
        $out[$k] ??= [];
        $out[$k][] = $v;
    }
    return $out;
}

function render_html(string $keyPrefix, int $streamingTtl, int $usersPerTick): string
{
    $tpl = file_get_contents(__DIR__ . '/demo_template.html');
    return strtr($tpl, [
        '__KEY_PREFIX__' => $keyPrefix,
        '__STREAM_TTL__' => (string)$streamingTtl,
        '__USERS_PER_TICK__' => (string)$usersPerTick,
        '__BATCH_FIELDS_JSON__' => json_encode(FeatureStore::DEFAULT_BATCH_FIELDS),
        '__STREAM_FIELDS_JSON__' => json_encode(FeatureStore::DEFAULT_STREAMING_FIELDS),
    ]);
}
