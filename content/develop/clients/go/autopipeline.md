---
bannerText: Automatic pipelining is an experimental feature that is not yet released and may be subject to change.
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Batch concurrent go-redis commands into pipelines automatically for high-throughput workloads.
linkTitle: Automatic pipelining
title: Automatic pipelining
weight: 42
---

{{< note >}}
Automatic pipelining is an **experimental** feature and its API may still
change. It requires `github.com/redis/go-redis/v9` v9.XX.0 or later.
{{< /note >}}
&nbsp;

[Pipelining]({{< relref "/develop/using-commands/pipelining" >}}) sends a batch
of commands to the server in a single communication, which avoids the network
and processing overhead of sending each command separately. Normally you build
a pipeline by hand (see [Pipelines and transactions]({{< relref "/develop/clients/go/transpipe" >}})),
but this means you must know in advance which commands you want to batch.

*Automatic pipelining* removes that requirement. When many goroutines issue
commands concurrently, `go-redis` coalesces them into deep pipelines for you,
without any pipeline code in your application. Reach for it in high-throughput,
high-concurrency, or scale scenarios. At low concurrency, a plain client is
simpler and just as fast, and a hand-written pipeline is still fastest when you
can batch by hand.

## The two faces

Automatic pipelining has two forms that share the same underlying engine:

-   **Blocking** (`AutoPipeline()`) is a drop-in replacement for a normal
    client. Each command call blocks until it executes and returns its own
    value and error, exactly like a plain client, so existing code keeps
    working unchanged. Under concurrency, the engine batches commands from all
    goroutines into back-to-back pipelines behind the scenes. Per-goroutine
    ordering is preserved.
-   **Async** (`AsyncAutoPipeline()`) is deferred and offers the highest
    throughput. Command calls return immediately; reading a result with
    `Val()`, `Result()`, or `Err()` blocks until the batch executes. Submit a
    window of commands and then drain the results to keep each pipeline as deep
    as possible.

Both methods are available on `Client` and `ClusterClient`.

## Blocking usage

Call `AutoPipeline()` to get an `AutoPipeliner`, then call command methods on it
just as you would on a normal client. Each call blocks until it executes, but
concurrent callers' commands are batched together automatically:

```go
rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
defer rdb.Close()
ctx := context.Background()

// Blocking face: a drop-in for a normal client, batched under the hood.
ap, err := rdb.AutoPipeline(nil)
if err != nil { // only returned for an invalid AutoPipelineConfig
    log.Fatal(err)
}
defer ap.Close()

var wg sync.WaitGroup
for i := 0; i < 1000; i++ {
    wg.Add(1)
    go func(i int) {
        defer wg.Done()
        key := fmt.Sprintf("key:%d", i)
        if err := ap.Set(ctx, key, i, 0).Err(); err != nil { // blocks until executed
            log.Printf("set %s: %v", key, err)
        }
    }(i)
}
wg.Wait()
```

## Windowed usage

For maximum throughput, use the async face. Command calls return immediately, so
you can submit a window of commands and read their results afterwards:

```go
ctx := context.Background()

ap, err := rdb.AsyncAutoPipeline(nil) // ordered by default
if err != nil {
    log.Fatal(err)
}
defer ap.Close()

cmds := make([]*redis.StatusCmd, 0, 200)
for i := 0; i < 200; i++ {
    // Returns immediately without executing.
    cmds = append(cmds, ap.Set(ctx, fmt.Sprintf("key:%d", i), i, 0))
}
for _, cmd := range cmds {
    if err := cmd.Err(); err != nil { // blocks until the batch executes
        log.Printf("set: %v", err)
    }
}
```

## Configuration

Both `AutoPipeline()` and `AsyncAutoPipeline()` take an optional
`*AutoPipelineConfig` and return `(*AutoPipeliner, error)`. Pass `nil` to use
the defaults. The error is non-nil only when the configuration is invalid (for
example, setting `MaxConcurrentBatches` greater than 1 without also setting
`Unordered`); an invalid config is never a panic.

```go
ap, err := rdb.AsyncAutoPipeline(&redis.AutoPipelineConfig{
    MaxConcurrentBatches: 80,
    Unordered:            true,
})
```

The main configuration options are:

| Field | Description |
| :---- | :---------- |
| `MaxBatchSize` | Maximum number of commands the engine coalesces into a single pipeline before flushing. |
| `MaxFlushDelay` | Maximum time the engine waits to accumulate more commands before flushing a batch. Larger values build deeper pipelines at the cost of latency. |
| `MaxConcurrentBatches` | Number of batches that may be in flight at once. Values greater than 1 require `Unordered` because concurrent batches do not preserve a single ordered stream. |
| `NumShards` | Number of independent queue-and-flusher shards. The default funnels every caller into one queue so batches stay deep. |
| `PipelinePoolSize` | Number of pooled pipeline connections shared across batches. Because batches share these connections, automatic pipelining needs far fewer connections than a plain client at the same concurrency. |
| `Unordered` | Allows commands to execute without preserving a single ordered stream, which enables higher concurrency. |
| `MaxRetries` | Number of times a whole batch is retried if its connection drops. |

The `AutoPipeliner` instance is cached and shared per client: the first call's
configuration wins, and `Close()` stops the instance for all callers.

## Cluster usage

`AutoPipeline()` and `AsyncAutoPipeline()` also work on `ClusterClient`.
Commands are routed to the correct shard by key, so the client installs
slot-based shard routing to keep each shard's batch on a single master node
(rather than splitting every batch across all nodes at flush time). A single
batch may span many slots. Ordering is per key: same-key commands stay in
order, while sub-pipelines on different nodes run concurrently.

## Caveats and limitations

-   A command's context is not honored once it is queued, because batches
    execute on the autopipeliner's own context. Use a plain client if you need
    per-command deadlines.
-   Blocking commands such as [`BLPOP`]({{< relref "/commands/blpop" >}}) and
    [`WAIT`]({{< relref "/commands/wait" >}}) are never batched and run directly
    on your context.
-   The generic `Do` method bypasses batching and behaves like `Client.Do`.
    Prefer the typed methods (`ap.Set()`, `ap.Get()`, and so on).
-   On a dropped connection, a batch is retried as a whole (up to
    `MaxRetries`), so non-idempotent commands may execute twice.

## More information

See the [`go-redis`](https://github.com/redis/go-redis) repository for the
`example/autopipeline` usage tour and further API details.
