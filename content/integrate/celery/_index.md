---
LinkTitle: Celery
Title: Redis with Celery
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Use Redis as the message broker and result backend for Celery task queues.
group: library
hideListLinks: false
stack: true
summary: Run Celery background tasks with Redis as the broker and the result backend, with retries, delayed tasks, and late acknowledgment.
type: integration
weight: 12
---

[Celery](https://docs.celeryq.dev/) is a distributed task queue for Python. Your
application sends tasks to a *broker*, and a pool of *workers* runs them. Redis can act as
the broker, which holds the queued tasks, and as the *result backend*, which stores
task results. See the [job queue use case](/content/develop/use-cases/job-queue/_index.md)
for when to choose this pattern.

## Requirements

The examples on this page were run with Celery 5.7 and Kombu 5.7 (the messaging library
that Celery's Redis transport uses) against Redis 7.2. Install Celery with its Redis
dependencies:

```bash
pip install "celery[redis]"
```

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Configure Redis as the broker and result backend

Create a Celery application and point `broker` and `backend` at your Redis server. Use
different [logical databases](/content/commands/select.md) if you want to keep queued
tasks and results apart:

```python
from celery import Celery

app = Celery(
    "tasks",
    broker="redis://<your-redis-host>:6379/0",
    backend="redis://<your-redis-host>:6379/1",
)
app.conf.result_expires = 3600  # seconds
```

## Define and call tasks

Decorate a function with `@app.task` to make it a task. Call `delay()` to queue it,
or `apply_async()` to set options such as a delay. The returned result object lets you
wait for the value:

```python
@app.task
def add(x, y):
    return x + y

@app.task(bind=True, max_retries=3, default_retry_delay=1)
def flaky(self):
    if self.request.retries < 2:
        raise self.retry(exc=RuntimeError("smtp down"))
    return f"ok after {self.request.retries} retries"
```

```python
result = add.delay(2, 3)
print(result.get(timeout=10))                 # 5

late = add.apply_async((10, 5), countdown=2)  # run in about 2 seconds
print(late.get(timeout=10))                   # 15
```

Start a worker in a separate terminal:

```bash
celery -A tasks worker --loglevel=INFO --concurrency=2
```

In this example, calling `flaky.delay()` fails twice and succeeds on the third attempt, so
the result is `ok after 2 retries`.

## What Celery stores in Redis

With the configuration above, Redis holds the following:

| Key | Type | Contents |
|-----|------|----------|
| `celery` | list | Messages for tasks that are waiting for a worker (the default queue). The key exists only while the queue isn't empty. |
| `_kombu.binding.celery` and similar | set | Routing information that Kombu keeps for each queue. |
| `celery-task-meta-<task-id>` | string | The task result as JSON, with a time to live (TTL) equal to `result_expires`. |

With `result_expires = 3600`, a result key has a TTL of about 3600 seconds.

## Keep in-flight tasks safe

By default, a worker acknowledges a task before it runs it, so a worker that crashes
mid-task loses that task. Set `task_acks_late` so the worker acknowledges the task after
it finishes:

```python
app.conf.task_acks_late = True
```

With late acknowledgment, Kombu holds each running task in a hash named `unacked`, with a
sorted set named `unacked_index` that tracks when to give up on it. Both are empty again
when the task completes. Your tasks must be
[idempotent](/content/develop/data-types/streams/idempotency.md), because a task can run more
than once if a worker dies before acknowledging it.

For Redis, Celery redelivers a task that stays unacknowledged for longer than the
*visibility timeout*. Set it with `broker_transport_options`, and make it longer than your
longest task or the longest `countdown` or `eta` you use. See the
[Celery Redis documentation](https://docs.celeryq.dev/en/stable/getting-started/backends-and-brokers/redis.html)
for details and caveats:

```python
app.conf.broker_transport_options = {"visibility_timeout": 3600}  # seconds
```

## More information

- [Celery documentation](https://docs.celeryq.dev/)
- [Using Redis with Celery](https://docs.celeryq.dev/en/stable/getting-started/backends-and-brokers/redis.html)
