<?php
/**
 * CLI entry point for the batch materializer. Run with:
 *
 *     php build_features.php --count 500 --ttl-seconds 3600
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/FeatureStore.php';
require_once __DIR__ . '/BuildFeatures.php';

$redisUri = 'tcp://127.0.0.1:6379';
$count = 200;
$ttlSeconds = 24 * 60 * 60;
$keyPrefix = 'fs:user:';
$seed = 42;

$argv2 = array_slice($argv, 1);
for ($i = 0; $i < count($argv2); $i++) {
    $arg = $argv2[$i];
    $next = $argv2[$i + 1] ?? null;
    if ($next === null && in_array($arg, ['--redis-uri', '--count', '--ttl-seconds', '--key-prefix', '--seed'], true)) {
        fwrite(STDERR, "Missing value for {$arg}\n");
        exit(2);
    }
    switch ($arg) {
        case '--redis-uri':    $redisUri = $next; $i++; break;
        case '--count':        $count = (int)$next; $i++; break;
        case '--ttl-seconds':  $ttlSeconds = (int)$next; $i++; break;
        case '--key-prefix':   $keyPrefix = $next; $i++; break;
        case '--seed':         $seed = (int)$next; $i++; break;
        case '-h':
        case '--help':
            echo "Usage: php build_features.php [--redis-uri URI] [--count N] [--ttl-seconds S] [--key-prefix PREFIX] [--seed N]\n";
            exit(0);
        default:
            fwrite(STDERR, "Unknown argument: {$arg}\n");
            exit(2);
    }
}

$redis = new \Predis\Client($redisUri);
$store = new FeatureStore($redis, $keyPrefix, $ttlSeconds, FeatureStore::DEFAULT_STREAMING_TTL_SECONDS);
$rows = BuildFeatures::synthesizeUsers($count, $seed);
$loaded = $store->bulkLoad($rows, $ttlSeconds);
echo "Materialized {$loaded} users at {$keyPrefix}* with a {$ttlSeconds}s key-level TTL.\n";
