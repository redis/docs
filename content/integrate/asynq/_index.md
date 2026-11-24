---
LinkTitle: Asynq
Title: Redis with Asynq
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Run Go background tasks with Asynq and Redis.
group: library
hideListLinks: false
stack: true
summary: Run Asynq tasks on Redis from Go, with retries, scheduled tasks, and automatic recovery of tasks from a server that is killed.
type: integration
weight: 18
---

[Asynq](https://github.com/hibiken/asynq) is a Go library for queueing tasks and
processing them asynchronously with workers. It stores everything in Redis through the
[go-redis](/content/develop/clients/go/_index.md) client. See the [job queue use case](/content/develop/use-cases/job-queue/_index.md) for when to choose
this pattern.

## Requirements

The examples on this page were run with Asynq 0.26 and Go 1.27 against Redis 7.2. Add the module to
your project:

```bash
go get github.com/hibiken/asynq
```

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Enqueue tasks

Create a client with your Redis address, build a task with a type name and a payload, and
enqueue it. Options such as `MaxRetry` and `ProcessIn` control how it runs:

```go
import (
    "encoding/json"
    "time"

    "github.com/hibiken/asynq"
)

redisOpt := asynq.RedisClientOpt{Addr: "<your-redis-host>:6379"}

client := asynq.NewClient(redisOpt)
defer client.Close()

payload, _ := json.Marshal(map[string]any{"UserID": 42, "Greeting": "hello"})

// Run as soon as a worker is free.
info, err := client.Enqueue(asynq.NewTask("email:welcome", payload))

// Retry up to 3 times if the handler returns an error.
client.Enqueue(asynq.NewTask("email:flaky", nil), asynq.MaxRetry(3))

// Run no sooner than 3 seconds from now.
client.Enqueue(asynq.NewTask("email:welcome", payload), asynq.ProcessIn(3*time.Second))
```

## Process tasks

Create a server, register a handler for each task type on a mux, and run it. A handler that
returns an error causes a retry. `asynq.GetRetryCount` tells the handler which attempt this is:

```go
func handleWelcome(ctx context.Context, t *asynq.Task) error {
    var p struct {
        UserID   int
        Greeting string
    }
    if err := json.Unmarshal(t.Payload(), &p); err != nil {
        return err
    }
    fmt.Printf("Sending welcome to %d: %s\n", p.UserID, p.Greeting)
    return nil
}

srv := asynq.NewServer(redisOpt, asynq.Config{Concurrency: 2})
mux := asynq.NewServeMux()
mux.HandleFunc("email:welcome", handleWelcome)
if err := srv.Run(mux); err != nil {
    log.Fatal(err)
}
```

> [!NOTE]
> Asynq moves scheduled and retried tasks to the queue with a poller that runs about every
> 5 seconds. In a test, a task scheduled 3 seconds ahead ran after 4.8 seconds, and retries
> with a 1-second delay ran 4.2 to 4.6 seconds apart. Don't rely on `ProcessIn` or on the
> retry delay for sub-5-second accuracy.

## What Asynq stores in Redis

Asynq keys include the queue name in braces:

| Key | Type | Contents |
|-----|------|----------|
| `asynq:{default}:pending` | list | Tasks that are ready to run. |
| `asynq:{default}:scheduled` | sorted set | Tasks enqueued with `ProcessIn`, scored by run time. |
| `asynq:{default}:retry` | sorted set | Tasks whose handler returned an error and that will be retried. |
| `asynq:{default}:active` | list | Tasks that a worker is processing now. |
| `asynq:{default}:lease` | sorted set | The lease expiry time of each active task. |
| `asynq:{default}:t:<task-id>` | hash | The task: `msg`, `state`, and `pending_since`. |
| `asynq:queues` | set | The names of the queues. |

## What happens to a task when a server is killed

A server holds a lease on each active task and renews it while it works. After a server
running a 60-second task was stopped with `kill -9`, the task stayed in the `active` state
for about a minute, because its lease had to expire. Then it moved to `retry`, then to
`pending`, and a new server ran it again about 73 seconds after the kill. The task went
through the `retry` state, so Asynq treats the lost run as a failed attempt.

Asynq therefore re-runs a task whose server dies, but only after a delay and at least once.
Write handlers so that running one twice is safe.

## More information

- [Asynq on GitHub](https://github.com/hibiken/asynq)
