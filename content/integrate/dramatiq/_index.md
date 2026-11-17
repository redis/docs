---
LinkTitle: Dramatiq
Title: Redis with Dramatiq
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Run Python background tasks with Dramatiq and Redis.
group: library
hideListLinks: false
stack: true
summary: Run Dramatiq actors on Redis with retries, delayed messages, and stored results, and learn how recovery of a killed worker's messages works.
type: integration
weight: 16
---

[Dramatiq](https://dramatiq.io/) is a Python library for background task processing. You
define *actors*, which are functions that run in worker processes, and send them messages.
Dramatiq supports Redis and RabbitMQ as brokers. See the
[job queue use case](/content/develop/use-cases/job-queue/_index.md) for when to choose
this pattern.

## Requirements

The examples on this page were run with Dramatiq 2.2 and redis-py against Redis 7.2.
Dramatiq 2.2 requires Python 3.10 or later. Install it with its Redis dependencies:

```bash
pip install "dramatiq[redis]"
```

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Configure the Redis broker

Create a `RedisBroker` and register it with Dramatiq. To store the return values of
actors, add the `Results` middleware with a Redis backend. This example puts results in a
different [logical database](/content/commands/select.md) from the queues:

```python
# tasks.py
import dramatiq
from dramatiq.brokers.redis import RedisBroker
from dramatiq.results import Results
from dramatiq.results.backends import RedisBackend

broker = RedisBroker(url="redis://<your-redis-host>:6379/0")
broker.add_middleware(Results(backend=RedisBackend(url="redis://<your-redis-host>:6379/1")))
dramatiq.set_broker(broker)
```

## Define actors and send messages

Decorate a function with `@dramatiq.actor`. Set `store_results=True` to keep its return
value, and `max_retries` with a backoff range in milliseconds to retry failures:

```python
@dramatiq.actor(store_results=True)
def add(x, y):
    return x + y

@dramatiq.actor(max_retries=3, min_backoff=500, max_backoff=2000)
def send_email():
    ...  # raise an exception to trigger a retry
```

Call `send()` to queue a message, and `send_with_options()` to set a delay in
milliseconds. A message object lets you wait for the stored result:

```python
message = add.send(2, 3)
print(message.get_result(block=True, timeout=10000))  # 5

late = add.send_with_options(args=(10, 5), delay=2000)
print(late.get_result(block=True, timeout=15000))     # 15, after about 3 seconds
```

Start a worker in a separate terminal, in the directory that contains `tasks.py`:

```bash
dramatiq tasks --processes 1 --threads 2
```

In a test run, an actor that raised an error twice logged `Retrying message` for each
failure and succeeded on the third attempt.

## What Dramatiq stores in Redis

| Key | Type | Contents |
|-----|------|----------|
| `dramatiq:default` | list | Internal IDs of the messages that are waiting for a worker (`default` is the queue name). |
| `dramatiq:default.msgs` | hash | The message payloads, keyed by those internal IDs. |
| `dramatiq:__heartbeats__` | sorted set | The last heartbeat time of each worker process. |
| `dramatiq:__acks__.<worker-id>.default` | set | The internal IDs of messages that a worker has taken but not yet acknowledged. |

Results go to the database that you gave the results backend, one key for each message,
with a time to live (TTL) of about 600 seconds by default.

## What happens to a message when a worker is killed

A worker takes a message, runs the actor, and acknowledges the message only afterward, so
a message that a worker was running when it died stays in that worker's `__acks__` set.
Another worker puts it back on the queue when two conditions hold. The dead worker's
heartbeat must be older than the broker's `heartbeat_timeout` (60 seconds by default), and
a worker must run the broker's maintenance, which Dramatiq triggers for a small
random fraction of the broker's Redis commands (`maintenance_chance`, 1,000 in a million by
default).

The test results show how much those defaults matter. After a worker running a
100-second job was stopped with `kill -9`:

- With the defaults, a new worker did not run the job again in 204 seconds.
- With `RedisBroker(..., heartbeat_timeout=5000, maintenance_chance=1000000)`, a new worker
  started the job 6 seconds after the kill.

Plan for this delay and for double execution: write actors so that running one twice is
safe, and set `heartbeat_timeout` to a value that suits how quickly you need recovery.

## More information

- [Dramatiq documentation](https://dramatiq.io/)
- [Dramatiq on GitHub](https://github.com/Bogdanp/dramatiq)
