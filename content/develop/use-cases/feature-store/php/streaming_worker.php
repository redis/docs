<?php
/**
 * Streaming worker entry point. Spawned as a detached CLI process by
 * `demo_server.php` and runs the worker tick loop until the demo
 * server flips `fs:control:stop` to 1 (or SIGTERM lands).
 *
 * Run manually with:
 *
 *     php streaming_worker.php
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/FeatureStore.php';
require_once __DIR__ . '/StreamingWorker.php';

$redisUri = getenv('REDIS_URI') ?: 'tcp://127.0.0.1:6379';
$keyPrefix = getenv('KEY_PREFIX') ?: 'fs:user:';
$batchTtl  = (int)(getenv('BATCH_TTL_SECONDS') ?: (24 * 60 * 60));
$streamTtl = (int)(getenv('STREAMING_TTL_SECONDS') ?: (5 * 60));
$usersPerTick = (int)(getenv('USERS_PER_TICK') ?: 5);

$redis = new \Predis\Client($redisUri);
$store = new FeatureStore($redis, $keyPrefix, $batchTtl, $streamTtl);
$worker = new StreamingWorker($redis, $store, $usersPerTick);
$worker->run();
