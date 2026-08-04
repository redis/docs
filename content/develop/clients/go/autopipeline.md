---
bannerText: Automatic pipelining is an experimental feature and may be subject to change.
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

[Pipelining]({{< relref "/develop/using-commands/pipelining" >}}) sends a batch
of commands to the server in a single communication, which avoids the network
and processing overhead of sending each command separately. Normally you build
a pipeline by hand (see [Pipelines and transactions]({{< relref "/develop/clients/go/transpipe" >}})),
but this means you must know in advance which commands you want to batch.

*Automatic pipelining* removes that requirement. When many goroutines issue
commands concurrently, `go-redis` coalesces them into deep pipelines for you,
without any pipeline code in your application. This is useful in high-throughput or
high-concurrency scenarios. At low concurrency, a plain client is
simpler and just as fast, and a hand-written pipeline is generally faster than
an auto-generated one.

Automatic pipelining requires
`github.com/redis/go-redis/v9` v9.22.0 or later.

## Blocking and asynchronous pipelining

Automatic pipelining has two methods that share the same underlying engine:

-   **Blocking** (`AutoPipeline()`) is a drop-in replacement for a normal
    client. Each command call blocks until it executes and returns its own
    value and error, exactly like a plain client, so existing code keeps
    working unchanged. Under concurrency, the engine batches commands from all
    goroutines into back-to-back pipelines behind the scenes. Per-goroutine
    ordering is preserved.
-   **Asynchronous** (`AsyncAutoPipeline()`) offers the highest throughput.
    Command calls return immediately; reading a result with
    `Val()`, `Result()`, or `Err()` blocks until the batch executes. Submit a
    sequence of commands and then read the results afterwards to keep each
    pipeline as deep as possible.

Both methods are available on `Client`, `ClusterClient`, and `Ring`.

## Blocking usage

Call `AutoPipeline()` to get an `AutoPipeliner`, then call command methods on it
just as you would on a normal client. Each call blocks until it executes, but
concurrent callers' commands are batched together automatically:

```go
rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
defer rdb.Close()
ctx := context.Background()

// Blocking: a drop-in for a normal client, batched under the hood.
ap, err := rdb.AutoPipeline()
if err != nil { // only returned for invalid AutoPipelineOptions
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

## Asynchronous usage

For maximum throughput, use the asynchronous method. Command calls return
immediately, so you can submit a sequence of commands and read their results
afterwards:

```go
ctx := context.Background()

ap, err := rdb.AsyncAutoPipeline() // ordered by default
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

`AutoPipeline()` and `AsyncAutoPipeline()` take no arguments. They use the
`AutoPipelineOptions` set on the client's options, if any, and otherwise the
built-in default for the method you called. To pass options for a single
autopipeliner, use `AutoPipelineWithOptions()` or
`AsyncAutoPipelineWithOptions()` instead:

```go
// On the client, used by both methods.
rdb := redis.NewClient(&redis.Options{
    Addr:                "localhost:6379",
    AutoPipelineOptions: &redis.AutoPipelineOptions{MaxFlushDelay: 100 * time.Microsecond},
})

// Or for a single autopipeliner.
ap, err := rdb.AsyncAutoPipelineWithOptions(&redis.AutoPipelineOptions{
    MaxConcurrentBatches: 80,
    Unordered:            true,
})
```

All four methods return `(*AutoPipeliner, error)`. The error is non-nil only
when the options are invalid (for example, setting `MaxConcurrentBatches`
greater than 1 without also setting `Unordered`); invalid options are never a
panic, and no instance is cached.

The configuration options are:

| Field | Description |
| :---- | :---------- |
| `MaxBatchSize` | Target number of commands the engine coalesces into a single pipeline before flushing. This is a soft threshold rather than a hard cap, so a busy queue can flush a larger batch. Defaults to 200, or 300 when `AutoPipeline()` falls back to its built-in default. |
| `MaxBatchBytes` | Approximate limit on the argument bytes in a batch, so that large values flush as several bounded writes instead of one very large one. Also a soft threshold. Defaults to 0, meaning no byte limit. |
| `MaxFlushDelay` | Maximum time the engine waits to accumulate more commands before flushing a batch. Larger values build deeper pipelines at the cost of latency. Defaults to 0, which adds no accumulation wait. |
| `AdaptiveDelay` | Scales `MaxFlushDelay` down as the queue fills, so a busy queue flushes sooner. Requires `MaxFlushDelay` greater than 0. Defaults to `false`. |
| `MaxConcurrentBatches` | Number of batches that may execute at once. Defaults to 1, which gives a single ordered stream. Values greater than 1 require `Unordered` because concurrent batches do not preserve a single ordered stream. |
| `Unordered` | Allows commands to execute without preserving a single ordered stream, which enables higher concurrency. |
| `NumShards` | Number of independent command queues, or shards, that the engine flushes separately. Defaults to 0, meaning a single shard, which funnels every caller into one queue so batches stay deep. Cluster clients default to several slot-routed shards instead. With `AsyncAutoPipeline()`, more than one shard requires `Unordered`. |

Connection and buffer tuning is not part of `AutoPipelineOptions`. Batches use
the client's pipeline connections, which you size with the
`PipelineReadBufferSize`, `PipelineWriteBufferSize`, and `PipelinePoolSize`
fields of the client's options.

The blocking and asynchronous autopipeliners are cached separately, and each is
shared by all of its callers: the first call's options win and later calls
return the same instance. `Close()` stops that instance for every caller, and a
later call then builds a fresh one. Closing the client stops it permanently,
after which the methods return `ErrClosed`.

## Cluster usage

`AutoPipeline()` and `AsyncAutoPipeline()` also work on `ClusterClient`.
Commands are routed to the correct shard by key, so the client installs
slot-based shard routing to keep each shard's batch on a single master node
(rather than splitting every batch across all nodes at flush time). This is why
cluster clients default to several shards instead of one. A single batch may
span many slots. Ordering is per key: same-key commands stay in order, while
sub-pipelines on different nodes run concurrently.

Commands that must reach every node or shard, such as
[`FLUSHALL`]({{< relref "/commands/flushall" >}}), cannot ride a pipeline, so
the cluster client rejects them with an error rather than let them spoil a
batch shared with other callers. Run them on the plain client instead.

## Caveats and limitations

-   A command's context is not honored once it is queued, because batches
    execute on the autopipeliner's own context. Use a plain client if you need
    per-command deadlines.
-   Blocking commands such as [`BLPOP`]({{< relref "/commands/blpop" >}}) and
    [`WAIT`]({{< relref "/commands/wait" >}}) are never batched and run directly
    on your context.
-   The generic `Do`, `DoRaw`, and `DoRawWriteTo` methods run outside the
    pipeline, on a normal connection, because an arbitrary command name can
    carry connection state or block the connection. Prefer the typed methods
    (`ap.Set()`, `ap.Get()`, and so on), which are always batched.
-   On a dropped connection, a batch is retried as a whole, up to the client's
    `MaxRetries`, so non-idempotent commands may execute twice. Set
    `MaxRetries: -1`, or use a plain client, for commands that must never be
    retransmitted.

## More information

See the [`go-redis`](https://github.com/redis/go-redis) repository for the
`example/autopipeline` usage tour and further API details.
