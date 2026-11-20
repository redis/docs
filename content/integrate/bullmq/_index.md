---
LinkTitle: BullMQ
Title: Redis with BullMQ
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Run Node.js background jobs with BullMQ and Redis.
group: library
hideListLinks: false
stack: true
summary: Run BullMQ queues and workers on Redis from Node.js, with retries, delayed and repeating jobs, and a choice of ioredis or node-redis.
type: integration
weight: 14
---

[BullMQ](https://docs.bullmq.io/) is a job queue for Node.js (and other languages) that
stores its queues in Redis. A `Queue` adds jobs, a `Worker` processes them, and
`QueueEvents` reports what happened. See the
[job queue use case](/content/develop/use-cases/job-queue/_index.md) for when to
choose this pattern.

## Requirements

The examples on this page were run with BullMQ 6.7 and Node.js 23 against Redis 7.2.
BullMQ checks the server version at startup. It requires Redis 5.0 or later and recommends
6.2 or later.

BullMQ 6 doesn't install a Redis client for you. Install it with
[ioredis](/content/develop/clients/ioredis/_index.md), or with
[node-redis](/content/develop/clients/nodejs/_index.md) as described
[below](#use-node-redis):

```bash
npm install bullmq ioredis
```

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Add and process jobs

Create a `Queue` and add jobs to it. Create a `Worker` with the same queue name and a
function that processes each job. Both take a `connection` that points at Redis:

```js
import { Queue, Worker, QueueEvents } from 'bullmq';

const connection = { host: '<your-redis-host>', port: 6379 };

const queue = new Queue('emails', { connection });

const worker = new Worker('emails', async (job) => {
  return { sent: job.data.to };
}, { connection, concurrency: 5 });

const events = new QueueEvents('emails', { connection });
events.on('completed', ({ jobId, returnvalue }) => {
  console.log(`completed ${jobId}`, returnvalue);
});

await queue.add('welcome', { to: 'a@example.com' });
```

## Retry, delay, and repeat jobs

Pass options when you add a job. This example retries a job up to 3 times with exponential
backoff, delays another by one second, and gives a third a high priority. A job
scheduler adds a job on a repeating schedule:

```js
await queue.add('flaky', { to: 'b@example.com' },
  { attempts: 3, backoff: { type: 'exponential', delay: 200 } });

await queue.add('later', { to: 'c@example.com' }, { delay: 1000 });

await queue.add('urgent', { to: 'd@example.com' }, { priority: 1 });

await queue.upsertJobScheduler('digest', { every: 700 },
  { name: 'digest', data: { to: 'all' } });
```

In a test run, a job that threw an error on its first two attempts completed on the third,
and the `digest` scheduler produced a new job about every 700 milliseconds.

## What BullMQ stores in Redis

BullMQ stores everything under the prefix `bull:<queue-name>:`:

| Key | Type | Contents |
|-----|------|----------|
| `bull:emails:<job-id>` | hash | The job: `name`, `data`, `opts`, `timestamp`, and `returnvalue` and `finishedOn` once it finishes. |
| `bull:emails:completed` | sorted set | The IDs of completed jobs. |
| `bull:emails:delayed` | sorted set | The IDs of delayed jobs, scored by the time they become ready. |
| `bull:emails:id` | string | The counter that assigns job IDs. |
| `bull:emails:repeat:<scheduler-id>` | | The state for each job scheduler. |

Waiting jobs are stored in a list, `bull:emails:wait`, which exists only while it holds
jobs. Completed jobs stay in Redis until you remove them, so set `removeOnComplete` and
`removeOnFail` on your jobs or workers to stop them accumulating.

## Use node-redis

BullMQ uses ioredis by default. BullMQ 6 can use the
[node-redis](/content/develop/clients/nodejs/_index.md) client instead, through a factory
that you set once, before you create any queues or workers. Install node-redis 5 or later
(`npm install bullmq redis`) and register the factory:

```js
import { RedisConnection, createNodeRedisClient } from 'bullmq';
import { createClient } from 'redis';

RedisConnection.clientFactory = (opts) => {
  const raw = createClient({ url: `redis://${opts.host ?? '127.0.0.1'}:${opts.port ?? 6379}` });
  return createNodeRedisClient(raw);
};
```

A queue and worker created after this call completed a job in a test run. The factory is
a static setting, so it applies to every BullMQ connection in the process.

## More information

- [BullMQ documentation](https://docs.bullmq.io/)
- [BullMQ on GitHub](https://github.com/taskforcesh/bullmq)
