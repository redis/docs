---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis job queue in Ruby with redis-rb
linkTitle: redis-rb example (Ruby)
title: Redis job queue with redis-rb
weight: 8
---

This guide shows you how to implement a Redis-backed job queue in Ruby with [`redis-rb`]({{< relref "/develop/clients/ruby" >}}). It includes a small local web server built with `webrick` from the Ruby standard library so you can enqueue jobs, watch a pool of workers drain them, and see the reclaimer recover jobs from a simulated worker crash.

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

1. The application calls `queue.enqueue(payload)`.
2. The helper writes the job metadata hash and `LPUSH`es the job ID onto the pending list.
3. A worker calls `queue.claim(timeout_ms: ...)`.
4. The helper runs `BRPOPLPUSH` to atomically move the next pending ID into the processing list and writes a per-claim `claim_token` plus `claimed_at_ms` on the hash.
5. The worker runs the job and calls `queue.complete(job, result)` or `queue.fail(job, error)`.
6. `complete` removes the job from the processing list, writes the result, and `LPUSH`es the ID onto the completed history (with `LTRIM` and an `EXPIRE` on the hash for cleanup).
7. `fail` either retries the job (back to pending) or moves it to the failed list once retries are exhausted.

If a worker dies before completing a job, the job sits in the processing list with a `claimed_at_ms` older than the visibility timeout. A periodic call to `queue.reclaim_stuck` finds those jobs and moves them back to pending so another worker can pick them up.

Every state change holds the token: a worker that has been reclaimed cannot later complete or fail a job another worker has already claimed.

## The job queue helper

The `RedisJobQueue` class wraps the queue operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/ruby/job_queue.rb)):

```ruby
require 'redis'
require_relative 'job_queue'

redis = Redis.new(host: 'localhost', port: 6379)
queue = RedisJobQueue.new(redis: redis, visibility_ms: 5000)

job_id = queue.enqueue(kind: 'email', recipient: 'alice@example.com')

# In a worker process:
job = queue.claim(timeout_ms: 1000)
if job
  begin
    # ... run the job ...
    queue.complete(job, sent_at: '2026-05-11T15:00:00Z')
  rescue StandardError => e
    queue.fail(job, e.message)
  end
end

# In a periodic sweeper:
reclaimed = queue.reclaim_stuck
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
queue:jobs:stats            (hash)   cross-process counter totals
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

The implementation uses:

* [`LPUSH`]({{< relref "/commands/lpush" >}}) to add new job IDs to the pending list.
* [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}) to atomically claim a job into the processing list.
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a claimed job from the processing list on complete or fail.
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history lists.
* [`HSET`]({{< relref "/commands/hset" >}}) / [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata.
* [`EXPIRE`]({{< relref "/commands/expire" >}}) on completed and failed hashes for automatic cleanup.
* [`HINCRBY`]({{< relref "/commands/hincrby" >}}) for the attempt counter and the shared totals hash so the demo's multiple worker threads (each with its own Redis connection) report a single consistent count.
* [`PUBLISH`]({{< relref "/commands/publish" >}}) on `queue:jobs:events` for completion signalling.
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) ([`EVALSHA`]({{< relref "/commands/evalsha" >}})) for the complete, fail, and reclaim flows so each runs atomically against the processing list and metadata hash.

## Enqueueing jobs

`enqueue` writes the metadata hash and pushes the job ID onto the pending list in one pipeline:

```ruby
def enqueue(payload)
  job_id = SecureRandom.hex(8)
  now_ms = self.class.now_ms
  meta = {
    'id' => job_id,
    'payload' => JSON.generate(payload),
    'status' => 'pending',
    'attempts' => 0,
    'enqueued_at_ms' => now_ms,
    'claim_token' => '',
  }
  @redis.pipelined do |pipe|
    pipe.hset(meta_key(job_id), meta)
    pipe.lpush(@pending_key, job_id)
    pipe.hincrby(@stats_key, 'enqueued_total', 1)
  end
  job_id
end
```

The payload is stored as JSON so the queue can carry arbitrary nested structures without forcing every field into a hash.

## Claiming jobs with BRPOPLPUSH

A worker blocks until a job is available, then atomically pops it from the pending list and pushes it onto the processing list. `BRPOPLPUSH` does both in a single Redis call:

```ruby
def claim(timeout_ms: 1000)
  timeout_s = [timeout_ms / 1000.0, 0.1].max
  job_id = @redis.brpoplpush(@pending_key, @processing_key, timeout: timeout_s)
  return nil if job_id.nil?

  token = SecureRandom.hex(8)
  now_ms = self.class.now_ms
  mkey = meta_key(job_id)
  results = @redis.pipelined do |pipe|
    pipe.hset(mkey,
              'status', 'processing',
              'claimed_at_ms', now_ms,
              'claim_token', token)
    pipe.hincrby(mkey, 'attempts', 1)
    pipe.hgetall(mkey)
  end
  meta = results.last || {}
  payload = JSON.parse(meta['payload'] || '{}') rescue {}
  ClaimedJob.new(job_id, payload, (meta['attempts'] || '1').to_i, token)
end
```

The `claim_token` is the worker's proof of ownership for this attempt. Every subsequent state change (complete, fail) checks it before touching the processing list, so a worker that hung past the visibility timeout cannot interfere with the new claimant.

## Completing jobs

`complete` runs a Lua script so the processing-list removal, the metadata write, and the history push happen atomically:

```ruby
def complete(job, result)
  ok = @redis.evalsha(
    @complete_sha,
    keys: [@meta_prefix, @processing_key, @completed_key],
    argv: [
      job.id,
      job.claim_token,
      'completed',
      self.class.now_ms,
      JSON.generate(result),
      @completed_ttl,
      @completed_history,
    ],
  )
  return false if ok.nil? || ok.to_i.zero?

  @redis.publish(@events_channel, JSON.generate(id: job.id, status: 'completed'))
  @redis.hincrby(@stats_key, 'completed_total', 1)
  true
end
```

The Lua script checks the token first and returns `0` if the worker no longer owns the job (because the reclaimer moved it back to pending). The metadata hash also gets an `EXPIRE` so completed jobs are cleaned up automatically.

## Failing and retrying

`fail` either retries the job (back to pending) or moves it to the failed list once retries are exhausted:

```ruby
def fail(job, error)
  retry_flag = job.attempts < @max_attempts
  result = @redis.evalsha(
    @fail_sha,
    keys: [@meta_prefix, @processing_key, @pending_key, @failed_key],
    argv: [
      job.id,
      job.claim_token,
      error,
      self.class.now_ms,
      @completed_ttl,
      @completed_history,
      retry_flag ? '1' : '0',
    ],
  )
  return false if result.nil? || result.to_i.zero?
  @redis.publish(@events_channel,
                 JSON.generate(id: job.id, status: retry_flag ? 'retry' : 'failed'))
  @redis.hincrby(@stats_key, 'failed_total', 1) unless retry_flag
  true
end
```

The attempt counter is incremented on every `claim`, so a job that fails three times is moved to the failed list with `attempts = 3` and the final `last_error` preserved.

## Reclaiming stuck jobs

If a worker dies mid-job — the process is killed, the host loses power, the network partitions — the job sits in the processing list with a `claimed_at_ms` that never advances. A periodic call to `reclaim_stuck` walks the processing list and moves any job past the visibility timeout back to pending:

```ruby
def reclaim_stuck
  reclaimed = @redis.evalsha(
    @reclaim_sha,
    keys: [@pending_key, @processing_key, @meta_prefix],
    argv: [self.class.now_ms, @visibility_ms],
  ) || []
  @redis.hincrby(@stats_key, 'reclaimed_total', reclaimed.length) if reclaimed.any?
  reclaimed
end
```

The Lua script also handles a narrower race: a worker that crashed between `BRPOPLPUSH` and writing `claimed_at_ms`. Those jobs are reclaimed after `2 × visibility_ms` using `enqueued_at_ms` as a fallback timer, so they aren't stranded forever.

## Stats and history

`stats` reports queue depth plus shared counter totals:

```ruby
def stats
  pending, processing, completed, failed, counters = @redis.pipelined do |pipe|
    pipe.llen(@pending_key)
    pipe.llen(@processing_key)
    pipe.llen(@completed_key)
    pipe.llen(@failed_key)
    pipe.hgetall(@stats_key)
  end
  {
    'enqueued_total'  => (counters['enqueued_total']  || 0).to_i,
    'completed_total' => (counters['completed_total'] || 0).to_i,
    'failed_total'    => (counters['failed_total']    || 0).to_i,
    'reclaimed_total' => (counters['reclaimed_total'] || 0).to_i,
    'pending_depth'    => pending,
    'processing_depth' => processing,
    'completed_depth'  => completed,
    'failed_depth'     => failed,
    'visibility_ms'    => @visibility_ms,
  }
end
```

Totals live in a Redis hash so each worker thread — which holds its own Redis connection — increments them atomically with `HINCRBY` and the orchestrator sees a single consistent view. The completed and failed lists are capped via `LTRIM` so they never grow unbounded; a real deployment would also write completion events to a separate Stream if you need a longer audit history.

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work, since the helper uses commands that have existed since Redis 2.6.
* Ruby 3.0 or later.
* The `redis-rb` client (5.x) and the `webrick` gem (a stdlib gem in Ruby 3 — install it explicitly with `gem install webrick` if it isn't already on your load path):

  ```bash
  gem install redis webrick
  ```

## Running the demo

### Get the source files

The demo consists of three Ruby files. Download them from the [`ruby` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/job-queue/ruby) on GitHub, or grab them with `curl`:

```bash
mkdir job-queue-demo && cd job-queue-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/job-queue/ruby
curl -O $BASE/job_queue.rb
curl -O $BASE/worker.rb
curl -O $BASE/demo_server.rb
```

### Start the demo server

From that directory:

```bash
ruby demo_server.rb
```

You should see:

```text
Redis job-queue demo server listening on http://127.0.0.1:8797
Using Redis at localhost:6379
Visibility timeout: 5000 ms
```

Open [http://127.0.0.1:8797](http://127.0.0.1:8797) in a browser. You can:

* Enqueue jobs of different kinds (email, webhook, thumbnail, invoice) in batches.
* Start a pool of workers with configurable size, work latency, and *failure* / *hang* rates. A non-zero hang rate simulates worker crashes.
* Click **Run reclaim sweep** to move any timed-out processing jobs back to pending.
* Watch pending / processing / completed / failed lists update every 800 ms.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`. You can also tune the visibility timeout with `--visibility-ms` and pick a different queue name with `--queue-name` if you want to share a Redis instance with other demos.

## The mock worker pool

The demo includes a small `Worker` and `WorkerPool` ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/ruby/worker.rb)) that stands in for whatever real background work your application would run. Each worker:

* Blocks on `queue.claim` for new jobs.
* Sleeps `work_latency_ms` to simulate doing the work.
* Either completes successfully, fails (calling `queue.fail`), or *hangs* — returning without completing or failing the job so the reclaimer has to recover it.

The `fail_rate` and `hang_rate` knobs let you watch the at-least-once delivery and reclaim behaviours from the UI without writing test code.

Each `Worker` runs in its own `Thread` and holds its **own** `RedisJobQueue` instance backed by a dedicated Redis connection. A blocking `BRPOPLPUSH` reserves the underlying connection until it returns, so giving each worker its own connection keeps the HTTP server's stats and jobs endpoints responsive even while every worker is parked on a claim call. The `WorkerPool` is constructed with a `queue_factory` lambda so it can mint one fresh helper per worker.

## Production usage

### Choose a visibility timeout that matches your worst-case job latency

The visibility timeout has to exceed the longest real job time, with margin. If it's too short, a healthy worker that's running a slow job will get its work duplicated when the reclaimer fires. If it's too long, a real crash takes longer to detect. Most production deployments use a per-queue value tuned to the 99th-percentile job latency — for example, 2 minutes for email and 30 minutes for video transcoding.

### Run the reclaimer on a schedule

The demo only reclaims when you click the button. In production, run `reclaim_stuck` from a periodic task (every few seconds for fast queues, every minute for slow ones), or from each worker before it blocks on `claim`. Both patterns work as long as *someone* runs the sweep.

### Use a separate Redis database or key prefix per queue

The helper takes a `queue_name` argument so you can run multiple independent queues against one Redis instance — for example, one queue per priority level, or one per job kind. Keep queue keys under a clearly-namespaced prefix (here, `queue:jobs:*`) so they're easy to inspect and easy to clear without touching application data.

### Cap the completed and failed history

The demo keeps the last 50 completed and 50 failed job IDs via `LTRIM`. If you need longer history for audit purposes, write completion events to a separate Redis Stream (or to an external store) and keep the in-queue history short. Stream consumer groups give you the same fan-out semantics with a much richer history.

### Tune `max_attempts` per job kind

A blanket `max_attempts = 3` is a reasonable default for transient failures (network timeouts, rate limits). Jobs that talk to non-idempotent external systems — for example, posting a Stripe charge — need either application-level idempotency keys or a much lower retry count. The helper exposes `max_attempts` so each queue can pick its own policy.

### Give each blocking worker its own connection

`redis-rb` 5.x is thread-safe — every call through a `Redis` instance is serialised on an internal mutex — but a `BRPOPLPUSH` parks the connection until the call returns. If multiple Ruby threads share a single `Redis` instance and one is blocked on a claim, the others wait behind it. In the demo, the `WorkerPool` builds a fresh `Redis` (and a fresh `RedisJobQueue`) per worker. In production, use a connection pool (such as the `connection_pool` gem) and check out a dedicated connection for blocking commands.

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

# Read the shared counter totals.
redis-cli HGETALL queue:jobs:stats

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
* [`HINCRBY`]({{< relref "/commands/hincrby" >}}) for the attempt counter and the shared totals hash.
* [`EXPIRE`]({{< relref "/commands/expire" >}}) for automatic cleanup of completed and failed jobs.
* [`PUBLISH`]({{< relref "/commands/publish" >}}) for job-completion notifications.
* [`EVALSHA`]({{< relref "/commands/evalsha" >}}) for atomic complete, fail, and reclaim flows.

See the [`redis-rb` documentation]({{< relref "/develop/clients/ruby" >}}) for full client reference.
