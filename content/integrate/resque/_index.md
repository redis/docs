---
LinkTitle: Resque
Title: Redis with Resque
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Run Ruby background jobs with Resque and Redis.
group: library
hideListLinks: false
stack: true
summary: Run Resque background jobs on Redis, see how failures are recorded, and learn how Resque treats a job whose worker is killed.
type: integration
weight: 17
---

[Resque](https://github.com/resque/resque) is a Ruby library for creating background jobs, placing them
on queues, and processing them later with workers. Redis is its only data store. See the [job queue use case](/content/develop/use-cases/job-queue/_index.md) for when to choose
this pattern.

## Requirements

The examples on this page were run with Resque 3.2 on Ruby 4.0 against Redis 7.2. Resque 3.2
uses the [redis-rb](/content/develop/clients/ruby/_index.md) client. Install the gem:

```bash
bundle add resque
```

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Define and enqueue a job

A Resque job is a Ruby class with a `perform` class method and a `@queue` instance variable
that names its queue. Set the Redis connection with `Resque.redis`:

```ruby
# jobs.rb
require "resque"

Resque.redis = "<your-redis-host>:6379"

class WelcomeEmail
  @queue = :default

  def self.perform(user_id, greeting)
    puts "Sending welcome to #{user_id}: #{greeting}"
  end
end
```

Call `Resque.enqueue` with the class and its arguments. Resque stores the arguments as JSON,
so use only simple types:

```ruby
Resque.enqueue(WelcomeEmail, 42, "hello")
```

## Run a worker

Resque workers run through a rake task. Add a `Rakefile` that loads your jobs and the Resque
tasks:

```ruby
# Rakefile
require_relative "jobs"
require "resque/tasks"
```

Then start a worker for the queue:

```bash
QUEUE=default INTERVAL=1 bundle exec rake resque:work
```

The `resque` command-line tool doesn't start workers. It lists them (`resque list`) and
removes or kills a registered worker.

## What Resque stores in Redis

| Key | Type | Contents |
|-----|------|----------|
| `resque:queue:<name>` | list | Waiting jobs, as JSON with the `class` and `args`. |
| `resque:queues` | set | The names of the queues. |
| `resque:workers` | set | The registered workers. |
| `resque:worker:<id>` | string | The job that the worker is processing now, while it works. |
| `resque:stat:processed` | string | A counter of processed jobs. |
| `resque:failed` | list | One JSON entry for each failed job. |

## Failed jobs

When a job raises an error, Resque doesn't retry it. It adds an entry to `resque:failed`
with the error, the `exception` class, the `backtrace`, the `failed_at` time, the `queue`,
the `worker`, and the original `payload`. In a test run, a job that raised `smtp down`
produced an entry with `payload` `FlakyJob` and the error message `smtp down`, and the job did
not run again.

## What happens to a job when a worker is killed

Resque forks a child process for each job. After a worker and its child were stopped with
`kill -9` partway through a job:

- The queue was empty and `resque:failed` stayed empty for the 30 seconds that the test ran,
  and the job did not run again. The dead worker remained registered.
- Resque finds dead workers by their heartbeat. A worker started afterward unregistered the
  dead one and moved its job to `resque:failed` as `Resque::DirtyExit` ("Job still being
  processed") once the dead worker's heartbeat was older than the prune interval.

The defaults are a heartbeat every 60 seconds and a prune interval of 300 seconds, so by
default a killed worker's job fails after about five minutes. With
`Resque.heartbeat_interval = 2` and `Resque.prune_interval = 6`, the job was in
`resque:failed` 5 seconds after the kill. Either way, Resque doesn't re-run the job for you,
so write jobs that are safe to run twice and decide what to do with entries in
`resque:failed`.

## More information

- [Resque on GitHub](https://github.com/resque/resque)
