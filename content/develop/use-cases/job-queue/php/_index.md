---
aliases:
- /develop/use-cases/job-queue/predis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis job queue in PHP with Predis
linkTitle: Predis example (PHP)
title: Redis job queue with Predis
weight: 7
---

This guide shows you how to implement a Redis-backed job queue in PHP with [Predis](https://github.com/predis/predis). It includes a small local web server built on PHP's built-in dev server so you can enqueue jobs, watch a pool of workers drain them, and see the reclaimer recover jobs from a simulated worker crash.

## Overview

A job queue lets your application offload background work — sending email, processing payments, image transcoding, ML inference, webhooks — from the request path. Producers enqueue jobs in milliseconds and return to the user; workers pull from the queue and process them on their own schedule.

That gives you:

* Low-latency user-facing requests, even when downstream work is slow or bursty
* Horizontal scale across many worker processes that share one Redis instance
* At-least-once delivery so a worker crash doesn't lose work
* Visibility-timeout reclaim that returns stuck jobs to the queue automatically
* Job metadata, retry counts, and completion results in Redis hashes with TTL

In this example, each job is identified by a random hex ID and its payload, status, and result live in a Redis hash under `queue:jobs:job:{id}`. Pending IDs sit in a list, claimed IDs move atomically to a *processing* list, and completed or failed IDs land in short history lists.

## How it works

The flow looks like this:

1. The application calls `$queue->enqueue($payload)`
2. The helper writes the job metadata hash and `LPUSH`es the job ID onto the pending list
3. A worker calls `$queue->claim($timeoutMs)`
4. The helper runs `BRPOPLPUSH` to atomically move the next pending ID into the processing list and writes a per-claim `claim_token` plus `claimed_at_ms` on the hash
5. The worker runs the job and calls `$queue->complete($job, $result)` or `$queue->fail($job, $error)`
6. `complete` removes the job from the processing list, writes the result, and `LPUSH`es the ID onto the completed history (with `LTRIM` and an `EXPIRE` on the hash for cleanup)
7. `fail` either retries the job (back to pending) or moves it to the failed list once retries are exhausted

If a worker dies before completing a job, the job sits in the processing list with a `claimed_at_ms` older than the visibility timeout. A periodic call to `$queue->reclaimStuck()` finds those jobs and moves them back to pending so another worker can pick them up.

Every state change holds the token: a worker that has been reclaimed cannot later complete or fail a job another worker has already claimed.

## The job queue helper

The `JobQueue` class wraps the queue operations ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/php/JobQueue.php)):

```php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/JobQueue.php';

use Predis\Client as PredisClient;

$redis = new PredisClient(['host' => '127.0.0.1', 'port' => 6379]);
$queue = new JobQueue($redis, 'jobs', 5000);

$jobId = $queue->enqueue(['kind' => 'email', 'recipient' => 'alice@example.com']);

// In a worker process:
$job = $queue->claim(1000);
if ($job !== null) {
    try {
        // ... run the job ...
        $queue->complete($job, ['sent_at' => date('c')]);
    } catch (\Throwable $exc) {
        $queue->fail($job, $exc->getMessage());
    }
}

// In a periodic sweeper:
$reclaimed = $queue->reclaimStuck();
```

### Data model

Each job's state lives in a Redis hash plus a position in one of four lists:

```text
queue:jobs:pending          (list)   pending job IDs, oldest at the right
queue:jobs:processing       (list)   claimed but not yet completed
queue:jobs:completed        (list)   recent successes (LTRIM-capped history)
queue:jobs:failed           (list)   terminally failed jobs
queue:jobs:job:{id}         (hash)   per-job metadata
queue:jobs:events           (pubsub) completion notifications
```

A job's hash carries:

```text
queue:jobs:job:9a4f...
  id              = 9a4f...
  payload         = {"kind":"email","recipient":"alice@example.com"}
  status          = pending | processing | completed | failed
  attempts        = 1
  enqueued_at_ms  = 1715441000000
  claimed_at_ms   = 1715441000123
  claim_token     = b3c0d1e2...        (per-claim random token)
  completed_at_ms = 1715441000456
  result          = {"sent_at":"..."}
  last_error      = "smtp timeout"
```

Because PHP's built-in dev server runs each HTTP request in a fresh process, per-process counters (`enqueued_total`, `completed_total`, etc.) can't live in object properties — they wouldn't survive between requests. Instead the helper stores them in a Redis hash under `demo:queue_stats:{queueName}`, incremented with `HINCRBY` on each state change.

The implementation uses:

* [`LPUSH`]({{< relref "/commands/lpush" >}}) to add new job IDs to the pending list
* [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}) to atomically claim a job into the processing list
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a claimed job from the processing list on complete or fail
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history lists
* [`HSET`]({{< relref "/commands/hset" >}}) / [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata
* [`EXPIRE`]({{< relref "/commands/expire" >}}) on completed and failed hashes for automatic cleanup
* [`PUBLISH`]({{< relref "/commands/publish" >}}) on `queue:jobs:events` for completion signalling
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) for the complete, fail, and reclaim flows so each runs atomically against the processing list and metadata hash

## Enqueueing jobs

`enqueue()` writes the metadata hash and pushes the job ID onto the pending list in one pipeline:

```php
public function enqueue(array $payload): string
{
    $jobId = bin2hex(random_bytes(8));
    $nowMs = (int) round(microtime(true) * 1000);
    $meta = [
        'id' => $jobId,
        'payload' => json_encode($payload),
        'status' => 'pending',
        'attempts' => '0',
        'enqueued_at_ms' => (string) $nowMs,
        'claim_token' => '',
    ];

    $pipe = $this->redis->pipeline();
    $pipe->hset($this->metaKey($jobId), ...self::flattenFields($meta));
    $pipe->lpush($this->pendingKey, [$jobId]);
    $pipe->execute();

    $this->redis->hincrby($this->statsKey, 'enqueued_total', 1);
    return $jobId;
}
```

The payload is stored as JSON so the queue can carry arbitrary nested structures without forcing every field into a hash. The `flattenFields()` helper turns the associative `$meta` array into the variadic `field, value, field, value` argument list that Predis's `hset()` expects in Predis 3.x.

## Claiming jobs with BRPOPLPUSH

A worker blocks until a job is available, then atomically pops it from the pending list and pushes it onto the processing list. `BRPOPLPUSH` does both in a single Redis call:

```php
public function claim(int $timeoutMs = 1000): ?ClaimedJob
{
    $timeoutSec = max(1, (int) ceil($timeoutMs / 1000));
    $jobId = $this->redis->brpoplpush($this->pendingKey, $this->processingKey, $timeoutSec);
    if ($jobId === null || $jobId === false || $jobId === '') {
        return null;
    }

    $token = bin2hex(random_bytes(8));
    $nowMs = (int) round(microtime(true) * 1000);
    $metaKey = $this->metaKey($jobId);

    $pipe = $this->redis->pipeline();
    $pipe->hset($metaKey, ...self::flattenFields([
        'status' => 'processing',
        'claimed_at_ms' => (string) $nowMs,
        'claim_token' => $token,
    ]));
    $pipe->hincrby($metaKey, 'attempts', 1);
    $pipe->hgetall($metaKey);
    [$_h, $_a, $meta] = $pipe->execute();

    return new ClaimedJob(
        (string) $jobId,
        json_decode($meta['payload'] ?? '{}', true) ?: [],
        (int) ($meta['attempts'] ?? 1),
        $token
    );
}
```

The `claim_token` is the worker's proof of ownership for this attempt. Every subsequent state change (complete, fail) checks it before touching the processing list, so a worker that hung past the visibility timeout cannot interfere with the new claimant.

Predis exposes `BRPOPLPUSH` directly and accepts a whole-second timeout; sub-second blocking would need either a custom command or a non-blocking poll loop.

## Completing jobs

`complete()` runs a Lua script via `EVAL` so the processing-list removal, the metadata write, and the history push happen atomically:

```php
public function complete(ClaimedJob $job, array $result): bool
{
    $ok = $this->redis->eval(
        self::COMPLETE_SCRIPT,
        3,
        $this->metaPrefix,
        $this->processingKey,
        $this->completedKey,
        $job->id,
        $job->claimToken,
        'completed',
        (string) self::nowMs(),
        json_encode($result),
        (string) $this->completedTtl,
        (string) $this->completedHistory
    );
    if (!$ok) {
        return false;
    }
    $this->redis->publish($this->eventsChannel,
        json_encode(['id' => $job->id, 'status' => 'completed']));
    $this->redis->hincrby($this->statsKey, 'completed_total', 1);
    return true;
}
```

The Lua script checks the token first and returns `0` if the worker no longer owns the job (because the reclaimer moved it back to pending). The metadata hash also gets an `EXPIRE` so completed jobs are cleaned up automatically.

## Failing and retrying

`fail()` either retries the job (back to pending) or moves it to the failed list once retries are exhausted:

```php
public function fail(ClaimedJob $job, string $error): bool
{
    $retry = $job->attempts < $this->maxAttempts;
    $result = $this->redis->eval(
        self::FAIL_SCRIPT,
        4,
        $this->metaPrefix,
        $this->processingKey,
        $this->pendingKey,
        $this->failedKey,
        $job->id,
        $job->claimToken,
        $error,
        (string) self::nowMs(),
        (string) $this->completedTtl,
        (string) $this->completedHistory,
        $retry ? '1' : '0'
    );
    return (bool) $result;
}
```

The attempt counter is incremented on every `claim()`, so a job that fails three times is moved to the failed list with `attempts = 3` and the final `last_error` preserved.

## Reclaiming stuck jobs

If a worker dies mid-job — the process is killed, the host loses power, the network partitions — the job sits in the processing list with a `claimed_at_ms` that never advances. A periodic call to `reclaimStuck()` walks the processing list and moves any job past the visibility timeout back to pending:

```php
public function reclaimStuck(): array
{
    $reclaimed = $this->redis->eval(
        self::RECLAIM_SCRIPT,
        3,
        $this->pendingKey,
        $this->processingKey,
        $this->metaPrefix,
        (string) self::nowMs(),
        (string) $this->visibilityMs
    );
    return is_array($reclaimed) ? array_values(array_map('strval', $reclaimed)) : [];
}
```

The Lua script also handles a narrower race: a worker that crashed between `BRPOPLPUSH` and writing `claimed_at_ms`. Those jobs are reclaimed after `2 × visibility_ms` using `enqueued_at_ms` as a fallback timer, so they aren't stranded forever.

## Stats and history

`stats()` reports queue depth plus the cross-process counters:

```php
public function stats(): array
{
    $pipe = $this->redis->pipeline();
    $pipe->llen($this->pendingKey);
    $pipe->llen($this->processingKey);
    $pipe->llen($this->completedKey);
    $pipe->llen($this->failedKey);
    $pipe->hgetall($this->statsKey);
    [$pending, $processing, $completed, $failed, $statsHash] = $pipe->execute();

    return [
        'enqueued_total'   => (int) ($statsHash['enqueued_total']   ?? 0),
        'completed_total'  => (int) ($statsHash['completed_total']  ?? 0),
        'failed_total'     => (int) ($statsHash['failed_total']     ?? 0),
        'reclaimed_total'  => (int) ($statsHash['reclaimed_total']  ?? 0),
        'pending_depth'    => (int) $pending,
        'processing_depth' => (int) $processing,
        'completed_depth'  => (int) $completed,
        'failed_depth'     => (int) $failed,
        'visibility_ms'    => $this->visibilityMs,
    ];
}
```

The completed and failed lists are capped via `LTRIM` so they never grow unbounded; a real deployment would also write completion events to a separate Redis Stream or audit store if it needs longer history.

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work, since the helper uses commands that have existed since Redis 2.6.
* PHP 8.1 or later, with the `posix` and `pcntl` extensions enabled (both ship with the official PHP binary on macOS and most Linux distros).
* The Predis client (3.x). Install it with [Composer](https://getcomposer.org/):

  ```bash
  composer require "predis/predis:^3.0"
  ```

## Running the demo

### Get the source files

The demo consists of six files. Download them from the [`php` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/job-queue/php) on GitHub, or grab them with `curl`:

```bash
mkdir job-queue-demo && cd job-queue-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/job-queue/php
curl -O $BASE/JobQueue.php
curl -O $BASE/JobWorker.php
curl -O $BASE/WorkerSupervisor.php
curl -O $BASE/demo_server.php
curl -O $BASE/worker.php
curl -O $BASE/composer.json
```

Then install dependencies:

```bash
composer install
```

### Start the demo server

From that directory:

```bash
php -S 127.0.0.1:8796 demo_server.php
```

You should see:

```text
[...] PHP 8.4.6 Development Server (http://127.0.0.1:8796) started
```

Open [http://127.0.0.1:8796](http://127.0.0.1:8796) in a browser. You can:

* Enqueue jobs of different kinds (email, webhook, thumbnail, invoice) in batches.
* Start a pool of workers with configurable size, work latency, and *failure* / *hang* rates. A non-zero hang rate simulates worker crashes.
* Click **Run reclaim sweep** to move any timed-out processing jobs back to pending.
* Watch pending / processing / completed / failed lists update every 800 ms.

To point the demo at a different Redis instance, set `REDIS_HOST`, `REDIS_PORT`, and `VISIBILITY_MS` before launching the server:

```bash
REDIS_HOST=redis.local REDIS_PORT=6380 VISIBILITY_MS=10000 \
    php -S 127.0.0.1:8796 demo_server.php
```

## The worker process and supervisor

The demo uses two files that together stand in for whatever real background work your application would run:

* [`JobWorker.php`](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/php/JobWorker.php) — the `JobWorker` class. A worker calls `$queue->claim(500)`, sleeps `workLatencyMs` to simulate doing the work, then either completes the job, fails it, or *hangs* — returning without completing or failing the job so the reclaimer has to recover it.
* [`worker.php`](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/php/worker.php) — a CLI entry point that constructs a `JobQueue` and a `JobWorker` from command-line flags, then calls `$worker->run()` until SIGTERM. Run one manually like this:

  ```bash
  php worker.php --name worker-1 --work-latency-ms 200 --fail-rate 0 --hang-rate 0
  ```

When the UI's **Start / apply** button is clicked, the demo server spawns one `worker.php` process per worker through the `WorkerSupervisor` ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/php/WorkerSupervisor.php)). The supervisor:

* Builds the worker command line with the requested size, latency, and failure / hang rates.
* Launches each worker via `proc_open()` so it survives the `php -S` request that started it.
* Records each PID under `demo:workers:pids` in Redis. The next HTTP request — running in a fresh PHP process — reads that hash to learn which workers are alive.
* Sends `SIGTERM` via `posix_kill()` when the **Stop workers** button is clicked.

The `fail_rate` and `hang_rate` knobs let you watch the at-least-once delivery and reclaim behaviours from the UI without writing test code.

## Production usage

### Don't try to host workers inside the web server

PHP's traditional one-process-per-request model — the same one `php -S` uses for this demo — means worker threads or in-process pools die with the request that started them. In production, run workers as **separate long-lived processes**:

* A systemd unit (`Type=simple`, `Restart=always`) per worker.
* A container per worker scaled by Kubernetes, ECS, or Nomad.
* A supervisor like Supervisord or Horizon driving N copies of `worker.php`.

Whichever way you ship workers, they connect to Redis directly and never depend on the web tier being up.

### Choose a visibility timeout that matches your worst-case job latency

The visibility timeout has to exceed the longest real job time, with margin. If it's too short, a healthy worker that's running a slow job will get its work duplicated when the reclaimer fires. If it's too long, a real crash takes longer to detect. Most production deployments use a per-queue value tuned to the 99th-percentile job latency — for example, 2 minutes for email and 30 minutes for video transcoding.

### Run the reclaimer on a schedule

The demo only reclaims when you click the button. In production, run `$queue->reclaimStuck()` from a periodic task (every few seconds for fast queues, every minute for slow ones), or from each worker before it blocks on `claim()`. Both patterns work as long as *someone* runs the sweep. A small `php -r '... while (true) { $queue->reclaimStuck(); sleep(5); }'` loop run under systemd is enough for most deployments.

### Use a separate Redis database or key prefix per queue

The helper takes a `$queueName` argument so you can run multiple independent queues against one Redis instance — for example, one queue per priority level, or one per job kind. Keep queue keys under a clearly-namespaced prefix (here, `queue:jobs:*`) so they're easy to inspect and easy to clear without touching application data.

### Cap the completed and failed history

The demo keeps the last 50 completed and 50 failed job IDs via `LTRIM`. If you need longer history for audit purposes, write completion events to a separate Redis Stream (or to an external store) and keep the in-queue history short. Stream consumer groups give you the same fan-out semantics with a much richer history.

### Tune `maxAttempts` per job kind

A blanket `maxAttempts = 3` is a reasonable default for transient failures (network timeouts, rate limits). Jobs that talk to non-idempotent external systems — for example, posting a Stripe charge — need either application-level idempotency keys or a much lower retry count. The helper exposes `maxAttempts` so each queue can pick its own policy.

### Use a persistent Predis connection per worker

Predis opens a new TCP connection on first use and reuses it for the life of the `Client` object. Workers are long-lived, so this is already what you want. Don't construct a fresh `Predis\Client` inside the `run()` loop — let the worker own a single connection and reuse it across thousands of `claim()` calls.

### Inspect queue state directly in Redis

Because the queue is just lists and hashes, you can inspect it with `redis-cli`:

```bash
# How many pending jobs?
redis-cli LLEN queue:jobs:pending

# Look at the next 5 jobs to be picked up.
redis-cli LRANGE queue:jobs:pending -5 -1

# Read a job's metadata.
redis-cli HGETALL queue:jobs:job:9a4f0d1c

# How many jobs are currently being processed?
redis-cli LLEN queue:jobs:processing

# Read the demo counters (PHP-only — these live in Redis because each
# HTTP request is its own process).
redis-cli HGETALL demo:queue_stats:jobs

# Clear everything for this queue (be careful — this deletes work).
redis-cli --scan --pattern 'queue:jobs:*' | xargs redis-cli DEL
```

## Learn more

This example uses the following Redis commands:

* [`LPUSH`]({{< relref "/commands/lpush" >}}) to enqueue a job ID.
* [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}) to atomically claim a job into the processing list.
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a job from the processing list on complete or fail.
* [`LRANGE`]({{< relref "/commands/lrange" >}}) and [`LLEN`]({{< relref "/commands/llen" >}}) to read queue depth and list contents.
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history.
* [`HSET`]({{< relref "/commands/hset" >}}) and [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata.
* [`HINCRBY`]({{< relref "/commands/hincrby" >}}) for the attempt counter and the cross-request stats counters.
* [`EXPIRE`]({{< relref "/commands/expire" >}}) for automatic cleanup of completed and failed jobs.
* [`PUBLISH`]({{< relref "/commands/publish" >}}) for job-completion notifications.
* [`EVAL`]({{< relref "/commands/eval" >}}) for atomic complete, fail, and reclaim flows.

See the [Predis README](https://github.com/predis/predis) for full client reference.
