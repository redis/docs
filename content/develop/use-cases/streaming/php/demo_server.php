<?php
/**
 * Redis streaming demo server (PHP).
 *
 * Run with:
 *     php -S 127.0.0.1:8786 demo_server.php
 *
 * Visit http://127.0.0.1:8786 to produce events to a single Redis Stream,
 * watch two independent consumer groups read it at their own pace, and
 * recover stuck deliveries with XAUTOCLAIM after simulating a consumer
 * crash.
 *
 * `php -S` runs each HTTP request in a fresh process, so consumer
 * workers can't live inside this server — they're spawned as separate
 * OS processes by the `/produce`/`/add-worker`/seed path, with their
 * state (PID, recent buffer, processed/reaped counts) kept in Redis
 * under `demo:streaming:*` so every request can see them.
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/EventStream.php';
require_once __DIR__ . '/ConsumerWorker.php';

use Predis\Client as PredisClient;

// ---------------------------------------------------------------------
// Configuration via env vars (CLI flags can't be passed through `php -S`
// to a router script directly, so we accept overrides through env vars
// and document the equivalent CLI flag names in _index.md).
// ---------------------------------------------------------------------

$redisHost = getenv('REDIS_HOST') ?: '127.0.0.1';
$redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
$streamKey = getenv('STREAM_KEY') ?: 'demo:events:orders';
$maxlen = (int) (getenv('MAXLEN') ?: 2000);
$claimIdleMs = (int) (getenv('CLAIM_IDLE_MS') ?: 5000);
$resetOnStart = (getenv('NO_RESET') === '1') ? false : true;
$processLatencyMs = (int) (getenv('PROCESS_LATENCY_MS') ?: 25);

const DEFAULT_GROUPS = [
    'notifications' => ['worker-a', 'worker-b'],
    'analytics' => ['worker-c'],
];

const EVENT_TYPES = [
    'order.placed',
    'order.paid',
    'order.shipped',
    'order.cancelled',
];

const SEED_FLAG_KEY = 'demo:streaming:seeded';
const WORKER_REGISTRY_KEY = 'demo:streaming:workers';

// ---------------------------------------------------------------------
// Connect
// ---------------------------------------------------------------------

try {
    $redis = new PredisClient([
        'host' => $redisHost,
        'port' => $redisPort,
    ]);
    $redis->ping();
} catch (\Throwable $exc) {
    http_response_code(500);
    header('Content-Type: text/plain');
    echo "Failed to connect to Redis at {$redisHost}:{$redisPort}: " . $exc->getMessage();
    return;
}

$stream = new EventStream($redis, $streamKey, $maxlen, $claimIdleMs);

// First-request bootstrap: reset (unless NO_RESET=1) and seed the
// default groups + workers. We use a Redis-side flag so subsequent
// requests don't re-run this every time.
if (!$redis->exists(SEED_FLAG_KEY)) {
    if ($resetOnStart) {
        reset_demo($stream, $redis, $processLatencyMs);
    } else {
        seed_groups_and_workers($stream, $redis, $processLatencyMs);
    }
    $redis->set(SEED_FLAG_KEY, '1');
}

// ---------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($method === 'GET' && ($path === '/' || $path === '/index.html')) {
    send_html(render_page($stream));
    return;
}
if ($method === 'GET' && $path === '/state') {
    send_json(build_state($stream, $redis));
    return;
}
if ($method === 'GET' && $path === '/replay') {
    handle_replay($stream);
    return;
}
if ($method === 'POST' && $path === '/produce') {
    handle_produce($stream);
    return;
}
if ($method === 'POST' && $path === '/add-worker') {
    handle_add_worker($stream, $redis, $processLatencyMs);
    return;
}
if ($method === 'POST' && $path === '/remove-worker') {
    handle_remove_worker($stream, $redis);
    return;
}
if ($method === 'POST' && $path === '/crash') {
    handle_crash($stream);
    return;
}
if ($method === 'POST' && $path === '/autoclaim') {
    handle_autoclaim($stream);
    return;
}
if ($method === 'POST' && $path === '/trim') {
    handle_trim($stream);
    return;
}
if ($method === 'POST' && $path === '/reset') {
    $count = reset_demo($stream, $redis, $processLatencyMs);
    send_json(['consumers' => $count]);
    return;
}

http_response_code(404);
echo 'Not Found';

// =====================================================================
// Helpers
// =====================================================================

function reset_demo(EventStream $stream, $redis, int $processLatencyMs): int
{
    // Stop every known worker, drop the stream, zero counters, re-seed.
    $registered = $redis->smembers(WORKER_REGISTRY_KEY);
    foreach ((array) $registered as $entry) {
        [$g, $n] = parse_worker_key((string) $entry);
        if ($g !== '' && $n !== '') {
            kill_worker($redis, $g, $n);
            ConsumerWorker::deleteWorkerState($redis, $g, $n);
        }
    }
    $redis->del([WORKER_REGISTRY_KEY]);
    $stream->deleteStream();
    $stream->resetStats();

    return seed_groups_and_workers($stream, $redis, $processLatencyMs);
}

function seed_groups_and_workers(EventStream $stream, $redis, int $processLatencyMs): int
{
    $count = 0;
    foreach (DEFAULT_GROUPS as $group => $names) {
        $stream->ensureGroup($group, '0-0');
        foreach ($names as $name) {
            spawn_worker($stream, $redis, $group, $name, $processLatencyMs);
            $count++;
        }
    }
    return $count;
}

function spawn_worker(EventStream $stream, $redis, string $group, string $name, int $processLatencyMs): bool
{
    if ($redis->sismember(WORKER_REGISTRY_KEY, worker_key($group, $name))) {
        // Already registered. Verify it's alive; if not, clear and respawn.
        $existing = (int) $redis->get(EventStream::workerKey($group, $name, 'pid'));
        if ($existing > 0 && ConsumerWorker::isAlive($existing)) {
            return false;
        }
        $redis->srem(WORKER_REGISTRY_KEY, [worker_key($group, $name)]);
        ConsumerWorker::deleteWorkerState($redis, $group, $name);
    }

    $workerScript = __DIR__ . '/ConsumerWorker.php';
    $phpBinary = PHP_BINARY ?: 'php';
    $args = [
        $phpBinary,
        $workerScript,
        '--group', $group,
        '--name', $name,
        '--redis-host', getenv('REDIS_HOST') ?: '127.0.0.1',
        '--redis-port', (string) (getenv('REDIS_PORT') ?: 6379),
        '--stream-key', $stream->streamKey(),
        '--maxlen', (string) $stream->maxlenApprox(),
        '--claim-idle-ms', (string) $stream->claimMinIdleMs(),
        '--process-latency-ms', (string) $processLatencyMs,
    ];

    // The dev server's listen socket leaks into any child we don't
    // detach from. The shell wrapper pattern below backgrounds the
    // worker (`&`) and echoes its real PID via `$!`, redirects stdio
    // away from any inherited socket, and (on Linux) prepends
    // `setsid` so the worker becomes its own session leader. On
    // macOS, `setsid` isn't shipped — the wrapper alone is enough.
    //
    // We deliberately do NOT use `proc_open(['setsid','-f',...])`
    // here: setsid -f forks once, leaving the now-dead wrapper as
    // the captured PID and the actual worker disconnected. Capturing
    // `$!` from a shell that owns the background job is the only
    // reliable way to get the worker's own PID across both platforms.
    // Use /tmp directly rather than sys_get_temp_dir() so the log
    // path is predictable on macOS (where sys_get_temp_dir returns a
    // per-user /var/folders/... path) and easy to inspect.
    $logFile = '/tmp/streaming-php-worker-' . preg_replace('/[^A-Za-z0-9_-]/', '_', $group . '-' . $name) . '.log';
    $escaped = array_map('escapeshellarg', $args);
    $workerCmd = implode(' ', $escaped);
    $prefix = (PHP_OS_FAMILY === 'Darwin') ? '' : 'setsid ';
    $shellCmd = sprintf(
        '%s%s >>%s 2>&1 </dev/null & echo $!',
        $prefix,
        $workerCmd,
        escapeshellarg($logFile)
    );
    $procArgs = ['/bin/sh', '-c', $shellCmd];

    $descriptorSpec = [
        0 => ['file', '/dev/null', 'r'],
        1 => ['pipe', 'w'],
        2 => ['file', $logFile, 'a'],
    ];
    $proc = proc_open($procArgs, $descriptorSpec, $pipes);
    if (!is_resource($proc)) {
        return false;
    }
    $pidLine = trim((string) fgets($pipes[1]));
    foreach ($pipes as $p) {
        if (is_resource($p)) {
            fclose($p);
        }
    }
    proc_close($proc);
    $pid = (int) $pidLine;
    if ($pid <= 0) {
        return false;
    }

    $redis->set(EventStream::workerKey($group, $name, 'pid'), (string) $pid);
    $redis->sadd(WORKER_REGISTRY_KEY, [worker_key($group, $name)]);
    return true;
}

function kill_worker($redis, string $group, string $name): bool
{
    $pid = (int) $redis->get(EventStream::workerKey($group, $name, 'pid'));
    if ($pid <= 0 || !function_exists('posix_kill')) {
        return false;
    }
    @posix_kill($pid, defined('SIGTERM') ? SIGTERM : 15);
    // Give the worker a chance to leave the loop cleanly (its
    // XREADGROUP block is up to 500 ms).
    for ($i = 0; $i < 12; $i++) {
        if (!ConsumerWorker::isAlive($pid)) {
            return true;
        }
        usleep(60 * 1000);
    }
    @posix_kill($pid, defined('SIGKILL') ? SIGKILL : 9);
    return true;
}

/**
 * Pause every worker in the named group (except the optional opt-out)
 * and wait for each to acknowledge `idle=1`.
 *
 * Returns ['touched' => list<[group, name]> of workers we asked to
 * pause, 'failed' => list<[group, name]> of workers that did not
 * acknowledge before their per-worker deadline]. **The caller MUST
 * check `failed` and act accordingly** — a worker that never paused
 * may still be reading new entries onto its PEL, so any subsequent
 * destructive operation (handover, DELCONSUMER, reset) can race the
 * worker and lose work. A non-empty `failed` is a hard error for
 * remove-worker; a soft warning for autoclaim/reset.
 *
 * Each worker gets its own deadline (rather than sharing one across
 * the loop) so a slow first worker doesn't eat the budget for the
 * rest.
 */
function pause_workers_in_group($redis, string $group, ?string $exceptName = null, float $timeoutSec = 1.5): array
{
    $registered = $redis->smembers(WORKER_REGISTRY_KEY);
    $touched = [];
    foreach ((array) $registered as $entry) {
        [$g, $n] = parse_worker_key((string) $entry);
        if ($g !== $group) {
            continue;
        }
        if ($exceptName !== null && $n === $exceptName) {
            continue;
        }
        $redis->set(EventStream::workerKey($g, $n, 'paused'), '1');
        $touched[] = [$g, $n];
    }
    // Wait for each touched worker to acknowledge it's idle. Each
    // worker gets its own deadline; the previous implementation shared
    // one deadline across the loop so a slow first worker could leave
    // zero budget for the rest, and the silent-fallthrough exit on
    // deadline expiry left the caller thinking the pause succeeded.
    $failed = [];
    foreach ($touched as [$g, $n]) {
        $deadline = microtime(true) + $timeoutSec;
        $acked = false;
        while (microtime(true) < $deadline) {
            if ((string) $redis->get(EventStream::workerKey($g, $n, 'idle')) === '1') {
                $acked = true;
                break;
            }
            usleep(20 * 1000);
        }
        if (!$acked) {
            $failed[] = [$g, $n];
        }
    }
    return ['touched' => $touched, 'failed' => $failed];
}

function resume_workers($redis, array $workers): void
{
    foreach ($workers as [$g, $n]) {
        $redis->del([
            EventStream::workerKey($g, $n, 'paused'),
            EventStream::workerKey($g, $n, 'idle'),
        ]);
    }
}

function worker_key(string $group, string $name): string
{
    return $group . '/' . $name;
}

function parse_worker_key(string $key): array
{
    $pos = strpos($key, '/');
    if ($pos === false) {
        return ['', ''];
    }
    return [substr($key, 0, $pos), substr($key, $pos + 1)];
}

function list_workers($redis): array
{
    $registered = $redis->smembers(WORKER_REGISTRY_KEY);
    $out = [];
    foreach ((array) $registered as $entry) {
        [$g, $n] = parse_worker_key((string) $entry);
        if ($g !== '' && $n !== '') {
            $out[] = [$g, $n];
        }
    }
    // Sort by group then name for stable rendering.
    usort($out, function ($a, $b) {
        $c = strcmp($a[0], $b[0]);
        return $c !== 0 ? $c : strcmp($a[1], $b[1]);
    });
    return $out;
}

// ---------------------------------------------------------------------
// HTTP handlers
// ---------------------------------------------------------------------

function handle_produce(EventStream $stream): void
{
    $params = read_form_data();
    $count = max(1, min(500, (int) ($params['count'] ?? 1)));
    $type = trim((string) ($params['type'] ?? ''));

    $events = [];
    for ($i = 0; $i < $count; $i++) {
        $picked = $type !== '' ? $type : EVENT_TYPES[array_rand(EVENT_TYPES)];
        $events[] = [$picked, fake_payload()];
    }
    $ids = $stream->produceBatch($events);
    send_json(['produced' => count($ids), 'ids' => $ids]);
}

function handle_add_worker(EventStream $stream, $redis, int $processLatencyMs): void
{
    $params = read_form_data();
    $group = trim((string) ($params['group'] ?? ''));
    $name = trim((string) ($params['name'] ?? ''));
    if ($group === '' || $name === '') {
        send_json(['error' => 'group and name are required'], 400);
        return;
    }
    $stream->ensureGroup($group, '0-0');
    $added = spawn_worker($stream, $redis, $group, $name, $processLatencyMs);
    if (!$added) {
        send_json(['error' => "{$group}/{$name} already exists"], 409);
        return;
    }
    send_json(['group' => $group, 'name' => $name]);
}

function handle_remove_worker(EventStream $stream, $redis): void
{
    $params = read_form_data();
    $group = trim((string) ($params['group'] ?? ''));
    $name = trim((string) ($params['name'] ?? ''));
    if ($group === '' || $name === '') {
        send_json(['error' => 'group and name are required'], 400);
        return;
    }
    if (!$redis->sismember(WORKER_REGISTRY_KEY, worker_key($group, $name))) {
        send_json(['removed' => false, 'reason' => 'not-found'], 200);
        return;
    }
    // Find a peer in the same group to hand the PEL over to.
    $peer = null;
    foreach (list_workers($redis) as [$g, $n]) {
        if ($g === $group && $n !== $name) {
            $peer = $n;
            break;
        }
    }
    if ($peer === null) {
        send_json([
            'removed' => false,
            'reason' => 'no-peer',
            'message' => "{$group}/{$name} still owns pending entries and is the only consumer in its group; add another consumer first so its PEL can be handed over before deletion.",
        ], 409);
        return;
    }

    // Pause the source worker (so XREADGROUP > can't pull any more
    // entries onto its PEL mid-handover), hand its PEL off, then
    // stop it, then XGROUP DELCONSUMER. The peer is left running so
    // it can keep processing.
    //
    // If the source worker doesn't acknowledge pause in time, abort
    // the removal — DELCONSUMER would destroy any entries the worker
    // pulled onto its PEL after we stopped polling but before it
    // observed the pause flag.
    $pauseResult = pause_workers_in_group($redis, $group, /*exceptName*/ $peer);
    if (!empty($pauseResult['failed'])) {
        // Resume whatever we did pause so a retry can succeed.
        $resumeList = $pauseResult['touched'];
        $resumeList[] = [$group, $name];
        resume_workers($redis, $resumeList);
        send_json([
            'removed' => false,
            'reason' => 'pause-failed',
            'message' => "{$group}/{$name} did not acknowledge the pre-handover pause within the deadline. The worker may still be pulling entries from XREADGROUP > onto its PEL; aborting the remove so XGROUP DELCONSUMER does not destroy in-flight work. Investigate the worker process and retry.",
        ], 409);
        return;
    }

    // Run the handover. Any exception from XPENDING / XCLAIM must
    // abort the removal — XGROUP DELCONSUMER would destroy the
    // source's pending list.
    try {
        $claimedCount = $stream->handoverPending($group, $name, $peer);
    } catch (\Throwable $e) {
        // Resume the workers we paused so the demo isn't stuck.
        $resumeList = $pauseResult['touched'];
        $resumeList[] = [$group, $name];
        resume_workers($redis, $resumeList);
        send_json([
            'removed' => false,
            'reason' => 'handover-failed',
            'message' => "Handover from {$group}/{$name} to {$peer} failed before XGROUP DELCONSUMER could run: " . $e->getMessage() . ". {$group}/{$name} is still in the group; retry the remove or investigate the Redis error before deleting (DELCONSUMER would destroy the source consumer's pending entries).",
        ], 409);
        return;
    }

    kill_worker($redis, $group, $name);
    $stream->deleteConsumer($group, $name);
    $redis->srem(WORKER_REGISTRY_KEY, [worker_key($group, $name)]);
    ConsumerWorker::deleteWorkerState($redis, $group, $name);

    resume_workers($redis, [[$group, $name]]); // best-effort cleanup
    // Resume any other paused workers in the group too.
    foreach (list_workers($redis) as [$g, $n]) {
        if ($g === $group) {
            $redis->del([
                EventStream::workerKey($g, $n, 'paused'),
                EventStream::workerKey($g, $n, 'idle'),
            ]);
        }
    }

    send_json([
        'removed' => true,
        'handed_over_to' => $peer,
        'handed_over_count' => $claimedCount,
    ]);
}

function handle_crash(EventStream $stream): void
{
    $params = read_form_data();
    $group = trim((string) ($params['group'] ?? ''));
    $name = trim((string) ($params['name'] ?? ''));
    $count = (int) ($params['count'] ?? 1);
    if ($group === '' || $name === '') {
        send_json(['error' => 'group and name are required'], 400);
        return;
    }
    $registry = $stream->client();
    if (!$registry->sismember(WORKER_REGISTRY_KEY, worker_key($group, $name))) {
        send_json(['error' => "unknown consumer {$group}/{$name}"], 404);
        return;
    }
    $worker = new ConsumerWorker($stream, $group, $name);
    $worker->crashNext($count);
    send_json(['queued' => $count]);
}

function handle_autoclaim(EventStream $stream): void
{
    $params = read_form_data();
    $group = trim((string) ($params['group'] ?? ''));
    $consumer = trim((string) ($params['consumer'] ?? ''));
    if ($group === '' || $consumer === '') {
        send_json(['error' => 'group and consumer are required'], 400);
        return;
    }
    $redis = $stream->client();
    if (!$redis->sismember(WORKER_REGISTRY_KEY, worker_key($group, $consumer))) {
        send_json(['error' => "unknown consumer {$group}/{$consumer}"], 404);
        return;
    }
    // The worker process is the one normally responsible for its
    // reaps; but the demo's "XAUTOCLAIM to selected" button needs
    // the action to be visible to the user in one request cycle.
    // Pause the target so its in-process loop can't process the same
    // entries simultaneously and credit them to `processed` instead
    // of `reaped`, then run the reap here, then resume.
    $redis->set(EventStream::workerKey($group, $consumer, 'paused'), '1');
    $deadline = microtime(true) + 1.0;
    while (microtime(true) < $deadline) {
        if ((string) $redis->get(EventStream::workerKey($group, $consumer, 'idle')) === '1') {
            break;
        }
        usleep(20 * 1000);
    }
    $worker = new ConsumerWorker($stream, $group, $consumer);
    $result = $worker->reapIdlePel();
    $redis->del([
        EventStream::workerKey($group, $consumer, 'paused'),
        EventStream::workerKey($group, $consumer, 'idle'),
    ]);
    send_json([
        'claimed' => $result['claimed'],
        'processed' => $result['processed'],
        'deleted' => $result['deleted_ids'],
        'min_idle_ms' => $stream->claimMinIdleMs(),
    ]);
}

function handle_trim(EventStream $stream): void
{
    $params = read_form_data();
    $maxlen = (int) ($params['maxlen'] ?? 0);
    $deleted = $stream->trimMaxlen($maxlen);
    send_json(['deleted' => $deleted, 'maxlen' => $maxlen]);
}

function handle_replay(EventStream $stream): void
{
    $query = $_GET ?? [];
    $start = (string) ($query['start'] ?? '-');
    if ($start === '') {
        $start = '-';
    }
    $end = (string) ($query['end'] ?? '+');
    if ($end === '') {
        $end = '+';
    }
    $limit = max(1, min(500, (int) ($query['count'] ?? 20)));
    $entries = $stream->replay($start, $end, $limit);
    $rows = [];
    foreach ($entries as [$id, $fields]) {
        $rows[] = ['id' => $id, 'fields' => $fields];
    }
    send_json([
        'start' => $start,
        'end' => $end,
        'limit' => $limit,
        'entries' => $rows,
    ]);
}

// ---------------------------------------------------------------------
// State assembly
// ---------------------------------------------------------------------

function build_state(EventStream $stream, $redis): array
{
    $streamInfo = $stream->infoStream();
    $groups = $stream->infoGroups();

    $registered = list_workers($redis);
    $byGroup = [];
    foreach ($registered as [$g, $n]) {
        $byGroup[$g][] = $n;
    }

    $groupsDetail = [];
    $pendingRows = [];
    foreach ($groups as $group) {
        $groupName = (string) $group['name'];
        $consumerInfoRaw = $stream->infoConsumers($groupName);
        $consumerInfo = [];
        foreach ($consumerInfoRaw as $row) {
            $consumerInfo[(string) $row['name']] = $row;
        }

        $consumersDetail = [];
        $seen = [];

        $owned = $byGroup[$groupName] ?? [];
        foreach ($owned as $consumerName) {
            $worker = new ConsumerWorker($stream, $groupName, $consumerName);
            $status = $worker->status();
            $info = $consumerInfo[$consumerName] ?? ['pending' => 0, 'idle_ms' => 0];
            $consumersDetail[] = array_merge(
                $status,
                [
                    'pending' => (int) ($info['pending'] ?? 0),
                    'idle_ms' => (int) ($info['idle_ms'] ?? 0),
                    'recent' => $worker->recent(),
                ]
            );
            $seen[$consumerName] = true;
        }
        // Also include consumers that exist in Redis but not in our
        // registry (e.g. orphaned after a restart).
        foreach ($consumerInfo as $cName => $info) {
            if (isset($seen[$cName])) {
                continue;
            }
            $consumersDetail[] = [
                'name' => $cName,
                'group' => $groupName,
                'processed' => 0,
                'reaped' => 0,
                'crashed_drops' => 0,
                'paused' => false,
                'crash_queued' => 0,
                'alive' => false,
                'pending' => (int) ($info['pending'] ?? 0),
                'idle_ms' => (int) ($info['idle_ms'] ?? 0),
                'recent' => [],
            ];
        }
        usort($consumersDetail, function ($a, $b) { return strcmp((string) $a['name'], (string) $b['name']); });
        $group['consumers_detail'] = $consumersDetail;
        $groupsDetail[] = $group;

        foreach ($stream->pendingDetail($groupName, 50) as $row) {
            $row['group'] = $groupName;
            $pendingRows[] = $row;
        }
    }

    $tailRaw = $stream->tail(10);
    $tail = [];
    foreach ($tailRaw as [$id, $fields]) {
        $tail[] = ['id' => $id, 'fields' => $fields];
    }

    return [
        'stream' => $streamInfo,
        'tail' => $tail,
        'groups' => $groupsDetail,
        'pending' => $pendingRows,
        'stats' => $stream->stats(),
    ];
}

function fake_payload(): array
{
    $customers = ['alice', 'bob', 'carol', 'dan', 'erin'];
    return [
        'order_id' => 'o-' . random_int(1000, 9999),
        'customer' => $customers[array_rand($customers)],
        'amount' => sprintf('%.2f', mt_rand(500, 25000) / 100),
    ];
}

// ---------------------------------------------------------------------
// HTTP plumbing
// ---------------------------------------------------------------------

function read_form_data(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $parsed = [];
    parse_str($raw, $parsed);
    return $parsed;
}

function send_html(string $html, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
}

function send_json($payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}

function render_page(EventStream $stream): string
{
    $streamKey = htmlspecialchars($stream->streamKey(), ENT_QUOTES, 'UTF-8');
    $maxlen = (string) $stream->maxlenApprox();
    $claimIdle = (string) $stream->claimMinIdleMs();
    $html = <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Streaming Demo</title>
  <style>
    :root {
      --bg: #eef3f1;
      --panel: #ffffff;
      --ink: #1d2730;
      --accent: #267d6b;
      --accent-dark: #1a594c;
      --muted: #5c6770;
      --line: #d4dfdb;
      --ok: #d2ecdf;
      --warn: #f8e0d0;
      --pill: #d9ebe6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #f3faf7, transparent 32rem),
        linear-gradient(180deg, #ecf2f0 0%, var(--bg) 100%);
      min-height: 100vh;
    }
    main { max-width: 1080px; margin: 0 auto; padding: 40px 20px 72px; }
    h1 { font-size: clamp(2rem, 4.6vw, 3.4rem); line-height: 1.05; margin-bottom: 8px; }
    p.lede { max-width: 58rem; font-size: 1.05rem; color: var(--muted); }
    .grid {
      display: grid; gap: 18px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      margin-top: 24px;
    }
    .panel {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 32px rgba(20, 60, 50, 0.07);
    }
    .panel.wide { grid-column: 1 / -1; }
    .panel h2 { margin-top: 0; margin-bottom: 8px; font-size: 1.25rem; }
    .panel h3 { margin: 14px 0 6px; font-size: 1rem; }
    .pill {
      display: inline-block; border-radius: 999px;
      background: var(--pill); color: var(--accent-dark);
      padding: 6px 10px; font-size: 0.85rem; margin-bottom: 10px;
    }
    label { display: block; font-weight: bold; margin: 10px 0 4px; }
    input, select {
      width: 100%; padding: 9px 11px;
      border-radius: 9px; border: 1px solid #c0d2cc;
      font: inherit; background: white;
    }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 10px 16px; font: inherit; cursor: pointer;
      margin-right: 6px; margin-top: 10px;
    }
    button.secondary { background: #3b4951; }
    button.danger { background: #8a3a3a; }
    button.small { padding: 5px 10px; font-size: 0.85rem; margin-top: 4px; }
    button:hover { filter: brightness(0.92); }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 110px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); }
    th { color: var(--muted); font-weight: bold; }
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                  font-size: 0.85rem; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 2px 7px; font-size: 0.8rem; font-weight: bold;
    }
    .badge.ack { background: var(--ok); color: #1d4a2c; }
    .badge.drop { background: var(--warn); color: #6b3220; }
    .badge.idle { background: #e6e0f0; color: #43326a; }
    .group { border-top: 1px dashed var(--line); padding-top: 10px; margin-top: 10px; }
    .group:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
    .consumers { margin-top: 6px; }
    .consumer-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .consumer-row .name { font-weight: bold; min-width: 90px; }
    #status {
      margin-top: 18px; padding: 12px 14px;
      border-radius: 12px; display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
  </style>
</head>
<body>
  <main>
    <div class="pill">Predis + PHP built-in dev server</div>
    <h1>Redis Streaming Demo</h1>
    <p class="lede">
      Producers append events to a single Redis Stream
      (<code>__STREAM_KEY__</code>). Two consumer groups read the same
      stream independently: <code>notifications</code> shares its work
      across two consumers, <code>analytics</code> processes the full
      flow on its own. Acknowledge with <code>XACK</code>, recover
      crashed deliveries with <code>XAUTOCLAIM</code>, replay any range
      with <code>XRANGE</code>, and bound retention with <code>XTRIM</code>.
    </p>

    <div class="grid">
      <section class="panel wide">
        <h2>Stream state</h2>
        <div id="stream-view">Loading...</div>
        <button id="refresh-button" class="secondary">Refresh</button>
        <button id="reset-button" class="danger">Reset demo (drop stream and re-seed)</button>
      </section>

      <section class="panel">
        <h2>Produce events</h2>
        <p>Events are appended with <code>XADD</code> with an approximate
        <code>MAXLEN ~ __MAXLEN__</code> retention cap.</p>
        <label for="produce-count">How many</label>
        <input id="produce-count" type="number" min="1" max="500" value="10">
        <label for="produce-type">Event type</label>
        <select id="produce-type">
          <option value="">(random)</option>
          <option value="order.placed">order.placed</option>
          <option value="order.paid">order.paid</option>
          <option value="order.shipped">order.shipped</option>
          <option value="order.cancelled">order.cancelled</option>
        </select>
        <button id="produce-button">Produce</button>
      </section>

      <section class="panel">
        <h2>Replay range (XRANGE)</h2>
        <p>Reads a slice of history. Replay is independent of any
        consumer group &mdash; no cursors move, no acks happen.</p>
        <label for="replay-start">Start ID</label>
        <input id="replay-start" value="-">
        <label for="replay-end">End ID</label>
        <input id="replay-end" value="+">
        <label for="replay-count">Limit</label>
        <input id="replay-count" type="number" min="1" max="500" value="20">
        <button id="replay-button">Replay</button>
      </section>

      <section class="panel">
        <h2>Trim retention (XTRIM)</h2>
        <p>Cap the stream length. Approximate trimming releases whole
        macro-nodes, which is much cheaper than exact trimming.</p>
        <label for="trim-maxlen">MAXLEN ~</label>
        <input id="trim-maxlen" type="number" min="0" value="100">
        <button id="trim-button" class="secondary">XTRIM</button>
      </section>

      <section class="panel wide">
        <h2>Consumer groups</h2>
        <div id="groups-view">Loading...</div>
      </section>

      <section class="panel wide">
        <h2>Pending entries (XPENDING)</h2>
        <p>Entries delivered to a consumer that haven't been acked yet.
        Idle time &ge; <code>__CLAIM_IDLE__</code> ms is eligible for
        <code>XAUTOCLAIM</code>.</p>
        <div id="pending-view">Loading...</div>
        <div class="row">
          <select id="autoclaim-target"></select>
          <button id="autoclaim-button" class="secondary">XAUTOCLAIM to selected</button>
        </div>
      </section>

      <section class="panel wide">
        <h2>Last result</h2>
        <div id="result-view"><p>Produce events, replay a range, or trigger an autoclaim to see results.</p></div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const streamView = document.getElementById("stream-view");
    const groupsView = document.getElementById("groups-view");
    const pendingView = document.getElementById("pending-view");
    const resultView = document.getElementById("result-view");
    const autoclaimTarget = document.getElementById("autoclaim-target");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function renderStream(state) {
      const stream = state.stream || {};
      const tail = state.tail || [];
      const tailRows = tail.map((entry) => `
        <tr>
          <td class="mono">${escapeHtml(entry.id)}</td>
          <td>${escapeHtml((entry.fields || {}).type)}</td>
          <td class="mono">${escapeHtml((entry.fields || {}).order_id || "")}</td>
          <td>${escapeHtml((entry.fields || {}).amount || "")}</td>
          <td class="mono">${escapeHtml((entry.fields || {}).customer || "")}</td>
        </tr>`).join("");
      streamView.innerHTML = `
        <dl>
          <dt>Length</dt><dd>${stream.length ?? 0}</dd>
          <dt>First ID</dt><dd class="mono">${escapeHtml(stream.first_entry_id) || "&mdash;"}</dd>
          <dt>Last ID</dt><dd class="mono">${escapeHtml(stream.last_entry_id) || "&mdash;"}</dd>
          <dt>Produced</dt><dd>${state.stats.produced_total ?? 0}</dd>
          <dt>Acked</dt><dd>${state.stats.acked_total ?? 0}</dd>
          <dt>Claimed</dt><dd>${state.stats.claimed_total ?? 0}</dd>
        </dl>
        <h3>Tail (most recent)</h3>
        ${tail.length === 0 ? "<p>(empty)</p>" :
          `<table>
             <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th><th>customer</th></tr></thead>
             <tbody>${tailRows}</tbody>
           </table>`}
      `;
    }

    function renderGroups(state) {
      const groups = state.groups || [];
      if (groups.length === 0) {
        groupsView.innerHTML = "<p>No groups.</p>";
        return;
      }
      const addWorkerValues = {};
      let focusedGroup = null;
      let focusedSelectionStart = null;
      groupsView.querySelectorAll("input[id^='addworker-']").forEach((input) => {
        const group = input.id.slice("addworker-".length);
        addWorkerValues[group] = input.value;
        if (document.activeElement === input) {
          focusedGroup = group;
          focusedSelectionStart = input.selectionStart;
        }
      });
      groupsView.innerHTML = groups.map((g) => {
        const consumers = (g.consumers_detail || []).map((c) => {
          const recent = (c.recent || []).slice(0, 3).map((m) => `
            <span class="mono" title="${escapeHtml(JSON.stringify(m.fields))}">
              <span class="badge ${m.acked ? "ack" : "drop"}">${m.acked ? "ack" : "drop"}</span>
              ${escapeHtml(m.id)} ${escapeHtml(m.type)}
            </span>`).join(" &nbsp; ");
          const badges = [];
          if (c.paused) badges.push('<span class="badge idle">paused</span>');
          if (c.crash_queued > 0) badges.push(`<span class="badge drop">will drop ${c.crash_queued}</span>`);
          return `
            <div class="consumer-row">
              <span class="name">${escapeHtml(c.name)}</span>
              <span class="mono">pending=${c.pending} idle=${c.idle_ms}ms processed=${c.processed} reaped=${c.reaped ?? 0}</span>
              ${badges.join(" ")}
              <button class="small secondary" data-action="crash" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Crash next 3</button>
              <button class="small danger" data-action="remove" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Remove</button>
            </div>
            ${recent ? `<div class="mono" style="margin-left: 100px; font-size: 0.85rem;">${recent}</div>` : ""}`;
        }).join("");
        return `
          <div class="group">
            <h3>${escapeHtml(g.name)}
              <span class="mono" style="font-weight: normal; font-size: 0.9rem;">
                pending=${g.pending} lag=${g.lag ?? "?"} last_delivered=${escapeHtml(g.last_delivered_id)}
              </span>
            </h3>
            <div class="consumers">${consumers || "<em>(no consumers)</em>"}</div>
            <div class="row" style="max-width: 360px; margin-top: 6px;">
              <input id="addworker-${escapeHtml(g.name)}" placeholder="new-worker-name">
              <button class="small" data-action="add" data-group="${escapeHtml(g.name)}">Add consumer</button>
            </div>
          </div>`;
      }).join("");

      for (const [group, value] of Object.entries(addWorkerValues)) {
        const input = document.getElementById(`addworker-${group}`);
        if (input) input.value = value;
      }
      if (focusedGroup) {
        const input = document.getElementById(`addworker-${focusedGroup}`);
        if (input) {
          input.focus();
          if (focusedSelectionStart !== null) {
            try { input.setSelectionRange(focusedSelectionStart, focusedSelectionStart); } catch (_) {}
          }
        }
      }

      const previous = autoclaimTarget.value;
      const options = [];
      for (const g of groups) {
        for (const c of g.consumers_detail || []) {
          options.push(`<option value="${escapeHtml(g.name)}|${escapeHtml(c.name)}">${escapeHtml(g.name)} → ${escapeHtml(c.name)}</option>`);
        }
      }
      autoclaimTarget.innerHTML = options.join("");
      if (Array.from(autoclaimTarget.options).some((o) => o.value === previous)) {
        autoclaimTarget.value = previous;
      }
    }

    function renderPending(state) {
      const rows = (state.pending || []).map((p) => `
        <tr>
          <td class="mono">${escapeHtml(p.group)}</td>
          <td class="mono">${escapeHtml(p.consumer)}</td>
          <td class="mono">${escapeHtml(p.id)}</td>
          <td>${p.idle_ms} ms</td>
          <td>${p.deliveries}</td>
        </tr>`).join("");
      pendingView.innerHTML = (state.pending || []).length === 0
        ? "<p>(no entries currently pending)</p>"
        : `<table>
             <thead><tr><th>group</th><th>consumer</th><th>id</th><th>idle</th><th>deliveries</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>`;
    }

    async function refresh() {
      const r = await fetch("/state");
      const state = await r.json();
      renderStream(state);
      renderGroups(state);
      renderPending(state);
    }

    document.getElementById("refresh-button").addEventListener("click", refresh);

    document.getElementById("produce-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("produce-count").value, 10) || 1;
      const type = document.getElementById("produce-type").value;
      const body = new URLSearchParams({ count, type });
      const r = await fetch("/produce", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Produce failed.", "error"); return; }
      setStatus(`Produced ${d.produced} event(s).`, "ok");
      resultView.innerHTML = `<p>Produced <strong>${d.produced}</strong> events. New IDs:</p>
        <pre class="mono">${d.ids.map(escapeHtml).join("\n")}</pre>`;
      await refresh();
    });

    document.getElementById("replay-button").addEventListener("click", async () => {
      const params = new URLSearchParams({
        start: document.getElementById("replay-start").value,
        end: document.getElementById("replay-end").value,
        count: document.getElementById("replay-count").value,
      });
      const r = await fetch(`/replay?${params.toString()}`);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Replay failed.", "error"); return; }
      setStatus(`Replayed ${d.entries.length} entry/entries (XRANGE).`, "ok");
      const rows = d.entries.map((e) => `
        <tr>
          <td class="mono">${escapeHtml(e.id)}</td>
          <td>${escapeHtml((e.fields || {}).type)}</td>
          <td class="mono">${escapeHtml((e.fields || {}).order_id || "")}</td>
          <td>${escapeHtml((e.fields || {}).amount || "")}</td>
        </tr>`).join("");
      resultView.innerHTML = `
        <p>XRANGE ${escapeHtml(d.start)} → ${escapeHtml(d.end)} (limit ${d.limit})</p>
        ${d.entries.length === 0 ? "<p>(no entries)</p>" :
          `<table>
            <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th></tr></thead>
            <tbody>${rows}</tbody>
           </table>`}`;
    });

    document.getElementById("trim-button").addEventListener("click", async () => {
      const maxlen = document.getElementById("trim-maxlen").value;
      const body = new URLSearchParams({ maxlen });
      const r = await fetch("/trim", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Trim failed.", "error"); return; }
      setStatus(`XTRIM removed ${d.deleted} entr${d.deleted === 1 ? "y" : "ies"}.`, "ok");
      await refresh();
    });

    document.getElementById("autoclaim-button").addEventListener("click", async () => {
      const target = autoclaimTarget.value;
      if (!target) { setStatus("No consumer selected.", "error"); return; }
      const [group, consumer] = target.split("|");
      const body = new URLSearchParams({ group, consumer });
      const r = await fetch("/autoclaim", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Autoclaim failed.", "error"); return; }
      const deletedCount = (d.deleted || []).length;
      const msg = deletedCount
        ? `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}; ${deletedCount} pending ID(s) were already trimmed out of the stream and removed from the PEL by Redis.`
        : `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}.`;
      setStatus(msg, "ok");
      const deletedBlock = deletedCount
        ? `<h3>Deleted IDs (payload already trimmed &mdash; removed from PEL by Redis)</h3>
           <p class="mono">${(d.deleted || []).map(escapeHtml).join(", ")}</p>
           <p>In production these would also be routed to a dead-letter store for offline inspection.</p>`
        : "";
      resultView.innerHTML = `
        <p><strong>${escapeHtml(group)}/${escapeHtml(consumer)}</strong> ran <code>XAUTOCLAIM</code>
           into itself with <code>min_idle_time = ${d.min_idle_ms} ms</code>,
           claimed <strong>${d.claimed}</strong> stuck entry/entries, processed
           <strong>${d.processed}</strong>, and acked them.</p>
        ${d.claimed === 0 ? "<p>(nothing was idle enough yet &mdash; try again after a few seconds)</p>" : ""}
        ${deletedBlock}`;
      await refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      if (!confirm("Drop the stream and re-seed the default groups?")) return;
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      setStatus(`Reset. ${d.consumers} consumer(s) re-seeded.`, "ok");
      await refresh();
    });

    document.body.addEventListener("click", async (ev) => {
      const t = ev.target.closest("button[data-action]");
      if (!t) return;
      const action = t.dataset.action;
      const group = t.dataset.group;
      if (action === "crash") {
        const name = t.dataset.name;
        const body = new URLSearchParams({ group, name, count: "3" });
        await fetch("/crash", { method: "POST", body });
        setStatus(`Queued next 3 deliveries to ${group}/${name} for drop.`, "ok");
        await refresh();
      } else if (action === "remove") {
        const name = t.dataset.name;
        if (!confirm(`Remove ${group}/${name}? Any pending entries it still owns will be handed over to a peer consumer in the group via XCLAIM before XGROUP DELCONSUMER.`)) return;
        const body = new URLSearchParams({ group, name });
        const r = await fetch("/remove-worker", { method: "POST", body });
        const d = await r.json();
        if (!d.removed) {
          setStatus(d.message || `Could not remove ${group}/${name} (${d.reason || "unknown"}).`, "error");
        } else if (d.handed_over_count > 0) {
          setStatus(`Removed ${group}/${name}. Handed ${d.handed_over_count} pending entr${d.handed_over_count === 1 ? "y" : "ies"} over to ${d.handed_over_to}.`, "ok");
        } else {
          setStatus(`Removed ${group}/${name} (no pending entries to hand over).`, "ok");
        }
        await refresh();
      } else if (action === "add") {
        const input = document.getElementById(`addworker-${group}`);
        const name = (input.value || "").trim();
        if (!name) { setStatus("Enter a consumer name.", "error"); return; }
        const body = new URLSearchParams({ group, name });
        const r = await fetch("/add-worker", { method: "POST", body });
        const d = await r.json();
        if (!r.ok) { setStatus(d.error || "Add failed.", "error"); return; }
        input.value = "";
        setStatus(`Added ${group}/${name}.`, "ok");
        await refresh();
      }
    });

    refresh();
    setInterval(refresh, 1500);
  </script>
</body>
</html>
HTML;
    return strtr($html, [
        '__STREAM_KEY__' => $streamKey,
        '__MAXLEN__' => $maxlen,
        '__CLAIM_IDLE__' => $claimIdle,
    ]);
}
