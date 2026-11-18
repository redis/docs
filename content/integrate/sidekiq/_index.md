---
LinkTitle: Sidekiq
Title: Redis with Sidekiq
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Run Ruby background jobs with Sidekiq and Redis.
group: library
hideListLinks: false
stack: true
summary: Run Sidekiq background jobs on Redis, with scheduled jobs, automatic retries, and a clear picture of what happens to in-flight jobs on shutdown.
type: integration
weight: 13
---

[Sidekiq](https://sidekiq.org/) runs background jobs in Ruby, using threads to process
many jobs at once. Redis is Sidekiq's only data store: queues, schedules, retries, and
statistics all live there. See the
[job queue use case](/content/develop/use-cases/job-queue/_index.md) for when to
choose this pattern.

## Requirements

| Dependency | Supported versions |
|------------|--------------------|
| Sidekiq | 8.x (the examples were run with 8.1.7) |
| Redis | 7.0 or later (Sidekiq checks this at startup and refuses to run on an older server) |
| Ruby | 3.2 or later (the examples were run with Ruby 4.0.6) |

Install the gem:

```bash
bundle add sidekiq
```

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Define a job

Include `Sidekiq::Job` in a class and write a `perform` method. Point both the server
(worker) and the client (the code that enqueues jobs) at your Redis server:

```ruby
require "sidekiq"

Sidekiq.configure_server { |config| config.redis = { url: "redis://<your-redis-host>:6379/0" } }
Sidekiq.configure_client { |config| config.redis = { url: "redis://<your-redis-host>:6379/0" } }

class WelcomeEmailJob
  include Sidekiq::Job
  sidekiq_options queue: "default", retry: 3

  def perform(user_id, greeting)
    puts "Sending welcome to #{user_id}: #{greeting}"
  end
end
```

Arguments must be simple JSON types, because Sidekiq stores the job as JSON in Redis.

## Enqueue and run jobs

Call `perform_async` to run a job as soon as a worker is free, and `perform_in` to run it
later:

```ruby
WelcomeEmailJob.perform_async(42, "hello")
WelcomeEmailJob.perform_in(60, 43, "a minute later")
```

Start the worker process in a separate terminal. The `-r` option loads the file that
defines your jobs, and `-c` sets the number of threads:

```bash
bundle exec sidekiq -r ./worker.rb -c 3
```

> [!NOTE]
> Sidekiq checks for scheduled jobs with a poller that runs about every 5 seconds on average.
> On a freshly started worker, a job scheduled 2 seconds ahead ran 8 to 10 seconds after it was
> enqueued. Don't rely on `perform_in` for sub-second or few-second accuracy.

## What Sidekiq stores in Redis

| Key | Type | Contents |
|-----|------|----------|
| `queue:<name>` | list | Jobs waiting to run, as JSON. |
| `schedule` | sorted set | Jobs scheduled with `perform_in`, scored by run time. |
| `retry` | sorted set | Jobs that failed and will be retried, scored by the next attempt time. |
| `dead` | sorted set | Jobs that failed all their retries. |
| `queues` and `processes` | set | The queue names and the running worker processes. |

A job that raises an error moves to the `retry` set with a `retry_count` and the error
message. In the examples, a job that always raises `smtp down` appeared in the retry set
after its first failure, with `retry_count` 0 and the next attempt about 11 seconds
away. Use `Sidekiq::RetrySet` and the other classes in `sidekiq/api` to inspect these sets
from Ruby.

## What happens to a job when a worker stops

Sidekiq removes a job from its queue with [`BRPOP`](/content/commands/brpop.md) when a
worker takes it. The job then exists only in the worker's memory, so the result depends on
how the worker stops:

- **Graceful shutdown** (`TERM`): Sidekiq waits for running jobs up to the shutdown timeout
  (`-t`), then pushes any that are still running back to Redis. With `-t 2` and a 30-second
  job, the log shows `Pushed 1 jobs back to Redis`, and the job is back in `queue:default`.
- **Hard kill** (`kill -9`, or a crash): the running job is gone. After a `kill -9` of a worker
  that was running a 30-second job, the queue, `retry`, and `dead` were all empty.

Write jobs so that running one twice is safe, and give your process manager a stop timeout
longer than your Sidekiq shutdown timeout.

## More information

- [Sidekiq documentation](https://github.com/sidekiq/sidekiq/wiki)
- [Sidekiq on GitHub](https://github.com/sidekiq/sidekiq)
