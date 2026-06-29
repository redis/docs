<?php
/**
 * Subscriber worker for the PHP pub/sub demo.
 *
 * This is a long-lived CLI process spawned by the demo server's
 * `RedisPubSubHub::subscribe()` / `psubscribe()` calls. It connects to
 * Redis, runs `pubSubLoop()` against the configured channels or
 * patterns, and appends every received message to a Redis list under
 * `demo:pubsub:sub:{name}:messages` so the demo server (which runs each
 * HTTP request in its own fresh process under `php -S`) can read what
 * the subscriber has been receiving.
 *
 * Usage:
 *     php subscriber_worker.php
 *         --name <subscription-name>
 *         --kind <channel|pattern>
 *         --target <comma-separated channels or patterns>
 *         [--redis-host HOST] [--redis-port PORT] [--buffer-size N]
 *
 * The worker is detached from the demo server's process group by
 * `RedisPubSubHub` (via `setsid` on Linux and a shell wrapper on macOS)
 * so it survives the request cycle that started it. SIGTERM (sent by
 * `unsubscribe()` via `posix_kill`) tells the worker to leave the loop
 * cleanly.
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Predis\Client as PredisClient;

function parse_cli_args(array $argv): array
{
    $opts = [
        'name' => '',
        'kind' => 'channel',
        'target' => '',
        'redis-host' => '127.0.0.1',
        'redis-port' => 6379,
        'buffer-size' => 50,
    ];

    $count = count($argv);
    for ($i = 1; $i < $count; $i++) {
        $arg = $argv[$i];
        if (strpos($arg, '--') !== 0) {
            continue;
        }
        $key = substr($arg, 2);
        $value = null;
        $eq = strpos($key, '=');
        if ($eq !== false) {
            $value = substr($key, $eq + 1);
            $key = substr($key, 0, $eq);
        } elseif ($i + 1 < $count) {
            $value = $argv[++$i];
        }
        if (!array_key_exists($key, $opts)) {
            fwrite(STDERR, "[subscriber_worker] unknown option --{$key}\n");
            exit(2);
        }
        $opts[$key] = $value;
    }
    return $opts;
}

$opts = parse_cli_args($argv);

if ($opts['name'] === '') {
    fwrite(STDERR, "[subscriber_worker] --name is required\n");
    exit(2);
}
if ($opts['target'] === '') {
    fwrite(STDERR, "[subscriber_worker] --target is required\n");
    exit(2);
}
if (!in_array($opts['kind'], ['channel', 'pattern'], true)) {
    fwrite(STDERR, "[subscriber_worker] --kind must be 'channel' or 'pattern'\n");
    exit(2);
}

$name = (string) $opts['name'];
$kind = (string) $opts['kind'];
$targets = array_values(array_filter(array_map('trim', explode(',', (string) $opts['target']))));
if (empty($targets)) {
    fwrite(STDERR, "[subscriber_worker] --target had no usable entries\n");
    exit(2);
}
$bufferSize = (int) $opts['buffer-size'];

// Predis enters subscribe-only mode on the connection used by
// pubSubLoop(). Trying to LPUSH on that same connection raises:
//   "ERR Can't execute 'lpush': only (P|S)SUBSCRIBE / ..."
// So the worker keeps two clients:
//   $subRedis — the subscribe socket the pubSubLoop iterates on
//   $writeRedis — a regular client used to buffer received messages
//                 into the demo:pubsub:sub:{name}:messages list.
$subRedis = new PredisClient([
    'host' => (string) $opts['redis-host'],
    'port' => (int) $opts['redis-port'],
    'read_write_timeout' => 0,        // never time out the subscribe socket
]);
$writeRedis = new PredisClient([
    'host' => (string) $opts['redis-host'],
    'port' => (int) $opts['redis-port'],
]);

try {
    $subRedis->ping();
    $writeRedis->ping();
} catch (\Throwable $exc) {
    fwrite(STDERR, "[subscriber_worker {$name}] cannot reach Redis: " . $exc->getMessage() . "\n");
    exit(1);
}

$metaKey = 'demo:pubsub:sub:' . $name . ':meta';
$messagesKey = 'demo:pubsub:sub:' . $name . ':messages';

// Honour SIGTERM / SIGINT so the demo server's `unsubscribe()` (which
// posix_kills our PID) gives us a chance to leave the loop cleanly.
$stop = false;
if (function_exists('pcntl_async_signals')) {
    pcntl_async_signals(true);
    pcntl_signal(SIGTERM, function () use (&$stop) { $stop = true; });
    pcntl_signal(SIGINT, function () use (&$stop) { $stop = true; });
}

fwrite(STDERR, "[subscriber_worker {$name}] starting pid=" . getmypid()
    . " kind={$kind} targets=" . implode(',', $targets) . "\n");

try {
    // Predis 3.x exposes the pub/sub consumer through pubSubLoop(). The
    // returned object is iterable: each iteration is a (sub|psub)scribe
    // ack or a real message. We treat acks as no-ops and only buffer
    // real (p)messages.
    $loop = $subRedis->pubSubLoop();

    if ($kind === 'pattern') {
        $loop->psubscribe(...$targets);
    } else {
        $loop->subscribe(...$targets);
    }

    foreach ($loop as $event) {
        if ($stop) {
            break;
        }
        if (!is_object($event) || !isset($event->kind)) {
            continue;
        }
        if ($event->kind === 'message' || $event->kind === 'pmessage') {
            $channel = $event->kind === 'pmessage'
                ? (string) ($event->channel ?? '')
                : (string) ($event->channel ?? '');
            $pattern = $event->kind === 'pmessage'
                ? (string) ($event->pattern ?? '')
                : null;
            $rawPayload = (string) ($event->payload ?? '');

            $decoded = json_decode($rawPayload, true);
            $payload = (json_last_error() === JSON_ERROR_NONE) ? $decoded : $rawPayload;

            $record = [
                'channel' => $channel,
                'pattern' => $pattern,
                'payload' => $payload,
                'received_at_ms' => (int) round(microtime(true) * 1000),
            ];

            $pipe = $writeRedis->pipeline();
            $pipe->lpush($messagesKey, [json_encode($record, JSON_UNESCAPED_SLASHES)]);
            $pipe->ltrim($messagesKey, 0, $bufferSize - 1);
            $pipe->hincrby($metaKey, 'received_total', 1);
            $pipe->execute();
        }
        // 'subscribe' / 'psubscribe' / 'unsubscribe' acks fall through.
    }

    // Tell Redis we're leaving cleanly. stop() sends UNSUBSCRIBE.
    try {
        $loop->stop();
    } catch (\Throwable $e) {
        // The connection may already be closed.
    }
} catch (\Throwable $exc) {
    fwrite(STDERR, "[subscriber_worker {$name}] error: " . $exc->getMessage() . "\n");
    exit(1);
}

fwrite(STDERR, "[subscriber_worker {$name}] stopped pid=" . getmypid() . "\n");
