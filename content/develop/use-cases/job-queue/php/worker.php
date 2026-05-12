<?php
/**
 * Job-queue worker CLI entry point.
 *
 * Run one or more of these alongside the demo server (the demo server
 * spawns them via proc_open when you click "Start workers"; you can also
 * launch them manually with `php worker.php --name worker-1 ...`).
 *
 * Usage:
 *     php worker.php [--name NAME] [--queue NAME]
 *                    [--visibility-ms MS] [--max-attempts N]
 *                    [--work-latency-ms MS] [--fail-rate F] [--hang-rate F]
 *                    [--redis-host HOST] [--redis-port PORT]
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/JobQueue.php';
require_once __DIR__ . '/JobWorker.php';

use Predis\Client as PredisClient;

function parse_cli_args(array $argv): array
{
    $opts = [
        'name' => 'worker-' . getmypid(),
        'queue' => 'jobs',
        'visibility-ms' => 5000,
        'max-attempts' => 3,
        'work-latency-ms' => 400,
        'fail-rate' => 0.0,
        'hang-rate' => 0.0,
        'redis-host' => '127.0.0.1',
        'redis-port' => 6379,
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
            fwrite(STDERR, "[worker] unknown option --{$key}\n");
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
    fwrite(STDERR, "[worker] cannot reach Redis at {$opts['redis-host']}:{$opts['redis-port']}: " . $exc->getMessage() . "\n");
    exit(1);
}

$queue = new JobQueue(
    $redis,
    (string) $opts['queue'],
    (int) $opts['visibility-ms'],
    300,
    50,
    (int) $opts['max-attempts']
);

$worker = new JobWorker(
    (string) $opts['name'],
    $queue,
    (int) $opts['work-latency-ms'],
    (float) $opts['fail-rate'],
    (float) $opts['hang-rate']
);

fwrite(STDERR, "[worker {$opts['name']}] started pid=" . getmypid() . " queue={$opts['queue']}\n");
$worker->run();
fwrite(STDERR, "[worker {$opts['name']}] stopped\n");
