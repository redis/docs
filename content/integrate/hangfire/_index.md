---
LinkTitle: Hangfire
Title: Redis with Hangfire
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Run .NET background jobs with Hangfire and the community Redis storage package.
group: library
hideListLinks: false
stack: true
summary: Run Hangfire background jobs on Redis in .NET with the community Hangfire.Redis.StackExchange package, and learn how it handles retries, scheduling, and a killed server.
type: integration
weight: 19
---

[Hangfire](https://www.hangfire.io/) runs background jobs in .NET applications. It stores
jobs in a pluggable storage, and its default is SQL Server. See the [job queue use case](/content/develop/use-cases/job-queue/_index.md) for when to choose
this pattern.

## Choose a Redis storage package

Hangfire's core package doesn't include Redis storage. You can get it in two ways:

- **`Hangfire.Redis.StackExchange`** is a community package, listed on Hangfire's
  [extensions page](https://www.hangfire.io/extensions.html). It is licensed under the
  LGPL v3 and built on the [StackExchange.Redis](/content/develop/clients/dotnet/_index.md)
  client. Hangfire OÜ doesn't provide official support for community extensions. This page
  uses this package.
- **`Hangfire.Pro.Redis`** is part of Hangfire Pro, which is distributed through a private
  NuGet feed under paid subscriptions. See the
  [Hangfire Pro documentation](https://docs.hangfire.io/en/latest/configuration/using-redis.html).

The two have different configuration APIs, so the code on this page is for the community
package.

## Requirements

The examples on this page were run with Hangfire.Core 1.8.25 and
Hangfire.Redis.StackExchange 1.12.0 on .NET 9 against Redis 7.2. Add the packages to your
project:

```bash
dotnet add package Hangfire.Core
dotnet add package Hangfire.Redis.StackExchange
```

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Configure the storage and enqueue jobs

Call `UseRedisStorage` with a connection string, then use `BackgroundJob` to create jobs:

```csharp
using Hangfire;
using Hangfire.Redis.StackExchange;

GlobalConfiguration.Configuration
    .UseRedisStorage("<your-redis-host>:6379");

// Run as soon as a worker is free.
BackgroundJob.Enqueue<Jobs>(j => j.Welcome(42, "hello"));

// Run no sooner than 3 seconds from now.
BackgroundJob.Schedule<Jobs>(j => j.Welcome(43, "later"), TimeSpan.FromSeconds(3));
```

A job is a method on a class. Use `AutomaticRetry` to control retries:

```csharp
public class Jobs
{
    public void Welcome(int userId, string greeting) =>
        Console.WriteLine($"Sending welcome to {userId}: {greeting}");

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 1 })]
    public void Flaky()
    {
        // Throw an exception here to trigger a retry.
    }
}
```

## Run a server

A `BackgroundJobServer` fetches and runs jobs. You can host it in any .NET process:

```csharp
using var server = new BackgroundJobServer(new BackgroundJobServerOptions { WorkerCount = 2 });
await Task.Delay(Timeout.Infinite);
```

> [!NOTE]
> Hangfire's scheduler moves delayed and retried jobs to the queue on a polling cycle. In
> these runs the cycle was about 15 seconds. In a test, a job scheduled 3 seconds ahead ran about 12 seconds after it
> was created, and a retry with a 1-second delay ran 12 and then 15 seconds later. Don't rely
> on `Schedule` or the retry delay for second-level accuracy.

## What Hangfire stores in Redis

Hangfire's keys start with the prefix `{hangfire}:`. You can change it with the `Prefix`
option.

| Key | Type | Contents |
|-----|------|----------|
| `{hangfire}:queue:<name>` | list | The IDs of jobs that are ready to run. |
| `{hangfire}:queues` | set | The names of the queues. |
| `{hangfire}:schedule` | sorted set | Delayed jobs, scored by run time. |
| `{hangfire}:job:<id>` | hash | The job: `Type`, `Method`, `Arguments`, `ParameterTypes`, `State`, `CreatedAt`, and so on. |
| `{hangfire}:queue:<name>:dequeued` | list | The IDs of jobs that a server has fetched and is running. |

A succeeded job's hash expires after about 24 hours by default.

## What happens to a job when a server is killed

A server moves a job to the `dequeued` list when it fetches it, and removes it when the
job finishes. If the server dies, the job stays there until it passes the
`InvisibilityTimeout` of the storage options, and then another server fetches it again.
The default is 30 minutes. In a test with `InvisibilityTimeout` set to 10 seconds, a new
server ran the job 62 seconds after the first server was stopped with `kill -9`, so
recovery is not instant even with a short timeout.

Set the option to longer than your longest job, or a healthy job will be fetched twice:

```csharp
GlobalConfiguration.Configuration.UseRedisStorage("<your-redis-host>:6379",
    new RedisStorageOptions { InvisibilityTimeout = TimeSpan.FromMinutes(30) });
```

Write jobs so that running one twice is safe.

## More information

- [Hangfire documentation](https://docs.hangfire.io/)
- [Hangfire.Redis.StackExchange on GitHub](https://github.com/marcoCasamento/Hangfire.Redis.StackExchange)
