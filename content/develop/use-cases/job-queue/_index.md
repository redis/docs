---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Run a reliable background job queue with Redis.
hideListLinks: true
linkTitle: Job queue
title: Redis job queue
weight: 4
---

## When to use a job queue

Use a Redis job queue when you need to offload background work — sending email, processing payments, image processing, ML inference, webhooks — from user-facing request paths and distribute it reliably across a pool of workers.

## Why the problem is hard

Synchronous processing of background work blocks user requests and degrades latency under load.
A single user action often triggers multiple downstream tasks (send email, update analytics,
notify billing) and without a shared queue each service needs point-to-point integration that
becomes brittle at scale. Some of the obvious workarounds have real drawbacks:

-   **Simple in-process queues** lose jobs on crash and can't distribute work across multiple
    workers or services.
-   **Polling a database for pending rows** generates constant load on the primary database and
    introduces handoff races between workers competing for the same row.
-   **Adding a dedicated message broker** (RabbitMQ, Kafka, SQS) means another piece of
    infrastructure to deploy, monitor, and pay for — often just to move jobs a few hops.

A workable job queue needs at-least-once delivery, an atomic handoff from queue to worker, and
a way to reclaim jobs from workers that crashed mid-processing. You also need to track per-job
status, retry counts, and completion results without those records leaking forever.

## What you can expect from a Redis solution

You can:

-   Decouple APIs and services from workers so user-facing latency stays low under bursty load.
-   Distribute jobs across many workers with at-least-once delivery and automatic retry of
    failed or timed-out jobs.
-   Run FIFO, LIFO, priority, and delayed-execution queues on core Redis data structures.
-   Reclaim jobs from crashed workers using a visibility timeout, so no job is lost when a
    worker dies mid-processing.
-   Fan out a single user action to multiple downstream services through streams and consumer
    groups.
-   Use established libraries — Sidekiq, Celery, Bull/BullMQ, RQ — that implement reliable
    queue patterns on Redis out of the box.

## How Redis supports the solution

In practice, a Redis job queue stores pending job IDs in a list and moves each claimed job
atomically to a *processing* list so a crashed worker's job can be reclaimed later. Job
metadata (payload, status, attempts, result) lives in a hash, and completed jobs are cleaned
up automatically with a TTL.

Redis provides the following features that make it a good fit for background jobs:

-   [`LPUSH`]({{< relref "/commands/lpush" >}}) and [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}})
    (or [`BLMOVE`]({{< relref "/commands/blmove" >}})) for atomic enqueue and blocking claim,
    so a worker dequeues a job and registers it in the processing list in a single round trip.
-   [Lists]({{< relref "/develop/data-types/lists" >}}) for the *processing list* visibility-timeout
    pattern — jobs move atomically from pending to processing, and a reclaimer scans for
    timed-out jobs and moves them back.
-   [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}})
    ([`ZADD`]({{< relref "/commands/zadd" >}}),
    [`ZRANGEBYSCORE`]({{< relref "/commands/zrangebyscore" >}})) for delayed execution and
    priority queues, scored by run-at timestamp or priority.
-   [Streams]({{< relref "/develop/data-types/streams" >}}) with
    [consumer groups]({{< relref "/develop/data-types/streams#consumer-groups" >}}) for fan-out
    across multiple worker pools with independent progress tracking.
-   [Hashes]({{< relref "/develop/data-types/hashes" >}}) for job metadata with
    [`EXPIRE`]({{< relref "/commands/expire" >}}) so completed jobs are cleaned up automatically.
-   [Pub/Sub]({{< relref "/develop/interact/pubsub" >}})
    ([`PUBLISH`]({{< relref "/commands/publish" >}}),
    [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}})) for job completion signalling so the
    submitter is notified without polling.
-   Sub-millisecond latency on enqueue and dequeue, which keeps the producer side cheap.

## Ecosystem

The following libraries implement reliable job-queue patterns on Redis:

-   **Python**: [Celery](https://docs.celeryq.dev/),
    [RQ](https://python-rq.org/),
    [Dramatiq](https://dramatiq.io/)
-   **Ruby**: [Sidekiq](https://sidekiq.org/),
    [Resque](https://github.com/resque/resque)
-   **Node.js**: [Bull](https://github.com/OptimalBits/bull),
    [BullMQ](https://docs.bullmq.io/)
-   **Go**: [Asynq](https://github.com/hibiken/asynq)
-   **Java**: [Redisson](https://redisson.org/),
    [Spring Batch](https://spring.io/projects/spring-batch) (Redis job repository)
-   **.NET**: [Hangfire](https://www.hangfire.io/) (Redis storage)

## Code examples to build your own Redis job queue

The following guides show how to build a simple Redis-backed job queue.
Each guide includes a runnable interactive demo for each of the following client libraries:

* [redis-py (Python)]({{< relref "/develop/use-cases/job-queue/redis-py" >}})
* [node-redis (Node.js)]({{< relref "/develop/use-cases/job-queue/nodejs" >}})
* [go-redis (Go)]({{< relref "/develop/use-cases/job-queue/go" >}})
* [Jedis (Java)]({{< relref "/develop/use-cases/job-queue/java-jedis" >}})
* [Lettuce (Java)]({{< relref "/develop/use-cases/job-queue/java-lettuce" >}})
* [StackExchange.Redis (C#)]({{< relref "/develop/use-cases/job-queue/dotnet" >}})
* [Predis (PHP)]({{< relref "/develop/use-cases/job-queue/php" >}})
* [redis-rb (Ruby)]({{< relref "/develop/use-cases/job-queue/ruby" >}})
* [redis-rs (Rust)]({{< relref "/develop/use-cases/job-queue/rust" >}})
