<?php
/**
 * Cache-aside stampede worker.
 *
 * Invoked by the demo server via proc_open to get genuine process-level
 * concurrency that the PHP built-in development server cannot provide on
 * its own (it serves requests one at a time).
 *
 * Usage:
 *   php stampede_worker.php <redis-host> <redis-port> <product-id> <primary-latency-ms> <cache-ttl>
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/Cache.php';
require_once __DIR__ . '/Primary.php';

if ($argc < 6) {
    fwrite(STDERR, "usage: php stampede_worker.php <host> <port> <id> <latency-ms> <ttl>\n");
    exit(2);
}

[$_, $host, $port, $productId, $latencyMs, $ttl] = $argv;

$redis = new \Predis\Client(['host' => $host, 'port' => (int) $port]);
$cache = new RedisCache($redis, ttl: (int) $ttl);
$primary = new MockPrimaryStore($redis, (int) $latencyMs);

$result = $cache->get($productId, fn(string $k) => $primary->read($k));

echo json_encode([
    'hit' => $result['hit'],
    'redis_latency_ms' => ((int) ($result['redis_latency_ms'] * 100)) / 100.0,
    'found' => $result['record'] !== null,
]);
