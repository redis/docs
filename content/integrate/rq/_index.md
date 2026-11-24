---
LinkTitle: RQ
Title: Redis with RQ
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Run Python background jobs with RQ (Redis Queue).
group: library
hideListLinks: false
stack: true
summary: Run RQ background jobs on Redis with retries, scheduled jobs, and result storage, and learn what happens to a running job when a worker is killed.
type: integration
weight: 15
---

[RQ](https://python-rq.org/) (Redis Queue) is a Python library for queueing jobs and
processing them in the background with workers. Redis is its only data store. RQ jobs are
ordinary Python functions, so there is no task decorator to add. See the
[job queue use case](/content/develop/use-cases/job-queue/_index.md) for when to choose
this pattern.

## Requirements

The examples on this page were run with RQ 3.0 and redis-py against Redis 7.2. RQ 3.0
requires Python 3.10 or later and redis-py 5.0.1 or later. Install it with pip:

```bash
pip install rq
```

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Enqueue and run jobs

Put the function that does the work in a module that both the code that enqueues the job
and the worker can import. This example uses a `tasks.py` module:

```python
# tasks.py
def add(x, y):
    return x + y
```

Create a `Queue` with a redis-py connection and enqueue the function with its arguments:

```python
from redis import Redis
from rq import Queue

from tasks import add

queue = Queue("default", connection=Redis(host="<your-redis-host>", port=6379))

job = queue.enqueue(add, 2, 3)
print(job.get_status())  # JobStatus.QUEUED
```

Start a worker in a separate terminal, in the directory that contains `tasks.py`:

```bash
rq worker --url redis://<your-redis-host>:6379 --with-scheduler
```

After the worker runs the job, `job.return_value()` returns `5`. The `--with-scheduler`
option starts the scheduler that the next two sections need.

## Retry and schedule jobs

Pass a `Retry` object to retry a job that raises an error, with the wait in seconds before
each attempt. In a test run, a job that failed twice and succeeded on the third attempt
finished with its return value:

```python
from rq import Retry

queue.enqueue(flaky, retry=Retry(max=3, interval=[1, 1]))
```

Use `enqueue_in` to run a job after a delay:

```python
from datetime import timedelta

queue.enqueue_in(timedelta(seconds=2), add, 10, 5)
```

A scheduled job runs only while a worker started with `--with-scheduler` is running.

## What RQ stores in Redis

| Key | Type | Contents |
|-----|------|----------|
| `rq:queue:<name>` | list | The IDs of jobs that are waiting to run. |
| `rq:scheduled:<name>` | sorted set | The jobs scheduled with `enqueue_in`, scored by run time. |
| `rq:job:<job-id>` | hash | The job: `data`, `status`, `enqueued_at`, `started_at`, `ended_at`, `worker_name`, and so on. |
| `rq:results:<job-id>` | stream | The job's results. |
| `rq:finished:<name>` | sorted set | The IDs of finished jobs. |
| `rq:queues` | set | The names of known queues. |
| `rq:workers` and `rq:worker:<id>` | set, hash | The registered workers and their state. |

A job's hash expires after its result time to live (TTL). The default is about 500
seconds, so finished jobs disappear on their own. Set `result_ttl` when you enqueue a job
to keep them longer.

## What happens to a job when a worker is killed

RQ doesn't remove a running job from Redis. It records the job in a *started* registry,
the sorted set `rq:wip:<name>`, and the job's status stays `STARTED`. After a worker and
its work-horse process were stopped with `kill -9` partway through a job with a
6-second timeout:

- The queue was empty and the started registry held the job, so the job was not lost, but
  it also did not run again. A new worker started right afterward left it in the started
  registry for the 24 seconds that the test ran.
- After the registry entry's expiry passed, RQ's registry cleanup (`StartedJobRegistry.cleanup()`)
  moved the job to the failed registry with an `AbandonedJobError`.

In these runs RQ did not re-run an abandoned job. It ends up in the failed registry, and
your code decides whether to requeue it. Write jobs so that running one twice is safe.

## More information

- [RQ documentation](https://python-rq.org/)
- [RQ on GitHub](https://github.com/rq/rq)
