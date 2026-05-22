<?php
/**
 * Sync-worker CLI entry point.
 *
 * Run alongside demo_server.php. The demo server's startup code spawns
 * one of these via proc_open; you can also launch it manually with
 *
 *     php sync_worker.php --cache-prefix cache:category: --ttl-seconds 3600
 *
 * The worker drains demo:primary:changes (Redis list) via BRPOP and
 * applies each change to the prefetch cache. Pause/resume coordination
 * happens through Redis-backed flags (demo:sync:paused / demo:sync:idle)
 * so the demo server's HTTP handlers can stop the worker from a
 * different process.
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/Cache.php';
require_once __DIR__ . '/Primary.php';
require_once __DIR__ . '/SyncWorker.php';

use Predis\Client as PredisClient;

function parse_cli_args(array $argv): array
{
    $opts = [
        'redis-host' => '127.0.0.1',
        'redis-port' => 6379,
        'cache-prefix' => 'cache:category:',
        'ttl-seconds' => 3600,
        'primary-latency-ms' => 80,
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
            fwrite(STDERR, "[sync] unknown option --{$key}\n");
            exit(2);
        }
        $opts[$key] = $value;
    }
    return $opts;
}

$opts = parse_cli_args($argv);

$redis = new PredisClient([
    'host' => (string) $opts['redis-host'],
    'port' => (int) $opts['redis-port'],
]);

try {
    $redis->ping();
} catch (\Throwable $exc) {
    fwrite(STDERR, "[sync] cannot reach Redis at {$opts['redis-host']}:{$opts['redis-port']}: " . $exc->getMessage() . "\n");
    exit(1);
}

$primary = new MockPrimaryStore($redis, (int) $opts['primary-latency-ms']);
$cache = new PrefetchCache(
    $redis,
    (string) $opts['cache-prefix'],
    (int) $opts['ttl-seconds']
);
$worker = new SyncWorker($redis, $primary, $cache);

fwrite(STDERR, "[sync] started pid=" . getmypid() . " prefix={$opts['cache-prefix']}\n");
$worker->run();
fwrite(STDERR, "[sync] stopped\n");
