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

[Pipelining](/content/develop/using-commands/pipelining.md) sends a batch
of commands to the server in a single communication, which avoids the network
and processing overhead of sending each command separately. Normally you build
a pipeline by hand (see [Pipelines and transactions](/content/develop/clients/go/transpipe.md)),
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

For maximum throughput, use asynchronous execution. Command calls return
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
`AutoPipelineOptions` set on the client's options, if any, and otherwise use
reasonable default values. To pass options for a single
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
greater than one without also setting `Unordered`). Invalid options never cause a
panic.

The configuration options are:

| Field | Description |
| :---- | :---------- |
| `MaxBatchSize` | Target number of commands the engine coalesces into a single pipeline before flushing. This is a soft threshold rather than a hard cap, so a busy queue can flush a larger batch. Defaults to 200. |
| `MaxBatchBytes` | Soft limit on the total size of arguments (in bytes) for a batch, so that large values flush as several bounded writes instead of one very large one. Defaults to 128 KiB in v9.23.0 or later. In v9.22.0, the default is 0, meaning no byte limit. |
| `MaxFlushDelay` | Maximum time the engine waits to accumulate more commands before flushing a batch. Larger values build deeper pipelines at the cost of latency. Defaults to 0, which adds no accumulation wait. |
| `AdaptiveDelay` | Scales `MaxFlushDelay` down as the queue fills, so a busy queue flushes sooner. Requires `MaxFlushDelay` to be greater than 0. Defaults to `false`. |
| `MaxConcurrentBatches` | Number of batches that may execute at once. Defaults to 1, which gives a single ordered stream. Values greater than 1 require `Unordered` set to `true` because concurrent batches do not preserve a single ordered stream. |
| `Unordered` | Allows commands to execute without preserving a single ordered stream, which enables higher concurrency. |
| `NumShards` | Number of independent command queues, or shards, that the engine flushes separately. Defaults to 0, meaning a single shard, which funnels every caller into one queue so batches stay deep. Cluster clients default to several slot-routed shards instead. With `AsyncAutoPipeline()`, values greater than 1 require `Unordered` to be set to `true`. In [full-duplex mode](#full-duplex-mode), `NumShards` is the older spelling of `FullDuplexPipes` and doesn't require `Unordered`. |
| `MaxQueuedCommands` | Maximum number of commands the autopipeliner has accepted but not yet completed. A command submitted at the limit fails immediately with `ErrAutoPipelineQueueFull` instead of being queued, which bounds client memory when the server is slower than your goroutines. Because each command is rejected separately, a later command can succeed after an earlier one failed, so check the error of any command that a later one depends on. Defaults to 0, meaning no limit. Requires v9.23.0 or later. |

The [full-duplex](#full-duplex-mode) options are described in their own section.

`MaxBatchSize` is the one default that differs between the two methods. If you
set no options at all, `AutoPipeline()` uses a built-in preset that targets 300
commands instead of 200. As soon as you supply `AutoPipelineOptions`, either on
the client or to `AutoPipelineWithOptions()`, that preset no longer applies, and
a `MaxBatchSize` you leave unset means 200.

Connection and buffer tuning is not part of `AutoPipelineOptions`. Batches run
on the client's separate pipeline connection pool, which you size with the
fields described in
[Connection pooling](/content/develop/clients/go/produsage.md#connection-pooling).

Each client holds at most two autopipeliners: one for the blocking method and
one for the asynchronous method. Each of them is a
[*singleton*](https://en.wikipedia.org/wiki/Singleton_pattern) that the client
creates on first use and then shares with every later caller.

Options therefore only take effect on the call that creates the singleton. If a
blocking autopipeliner already exists, a later `AutoPipelineWithOptions()` call
returns that same instance and ignores the options you passed, because
`AutoPipeline()` and `AutoPipelineWithOptions()` share one singleton between
them. `Close()` stops the singleton for every caller and the next call creates a
fresh one, so closing is also how you apply different options. Closing the
client is permanent: both methods then return `ErrClosed`.

## Cluster usage

`AutoPipeline()` and `AsyncAutoPipeline()` also work on `ClusterClient`.
Commands are routed to the correct shard by key, so the client installs
slot-based shard routing to keep each shard's batch on a single master node
(rather than splitting every batch across all nodes at flush time). This is why
cluster clients default to several shards instead of one. A single batch may
span many slots. Ordering is per key: same-key commands stay in order, while
sub-pipelines on different nodes run concurrently.

Commands that must reach every node or shard, such as
[`FLUSHALL`](/content/commands/flushall.md), cannot be added to a pipeline, so
the cluster client rejects them with an error rather than let them spoil a
batch shared with other callers. Run them on the plain client instead.

## Full-duplex mode

Full-duplex mode helps when many goroutines issue commands over a
high-latency link, such as a cross-region connection. By default, the engine
sends one batch per round trip. In full-duplex mode, the engine holds a
connection from the
[pipeline pool](/content/develop/clients/go/produsage.md#connection-pooling)
and runs a writer goroutine and a reader goroutine on it. The writer streams
commands while the reader collects replies, so each command completes in about
one round-trip time (RTT) without waiting for a batch to finish. Each of these
held connections is a *pipe*.

On a low-latency link, such as loopback, there is no RTT to overlap, so the
default mode is usually faster. A single blocking caller gains nothing either,
because it has only one command in flight. Full-duplex mode requires v9.23.0
or later.

Set `FullDuplex` to enable it. It works with both `AutoPipeline()` and
`AsyncAutoPipeline()`, and it requires the default ordered stream, so it can't
be combined with `Unordered` or `MaxConcurrentBatches` greater than 1:

```go
rdb := redis.NewClient(&redis.Options{
    Addr: "localhost:6379",
    AutoPipelineOptions: &redis.AutoPipelineOptions{
        FullDuplex:      true,
        FullDuplexPipes: 4, // Optional; requires v9.24.0 or later.
    },
})
```

The full-duplex options are:

| Field | Description |
| :---- | :---------- |
| `FullDuplex` | Enables full-duplex mode. Defaults to `false`. |
| `FullDuplexPipes` | Number of pipes on a standalone client. Defaults to 0, which means one pipe. More pipes raise the throughput ceiling, but they pay off only with many concurrent callers, and they are slower than one pipe with few callers. Raise it only when one pipe is saturated. Requires v9.24.0 or later. |
| `FullDuplexWindow` | Maximum number of commands that a pipe can write without receiving acknowledgement. When a pipe reaches the limit, it stops writing until replies arrive. Set it above the number of commands in flight at your RTT and target rate, or it limits throughput. The limit applies to each pipe separately. Defaults to 65536. |
| `FullDuplexIdleTimeout` | How long an idle pipe keeps its connection before it returns the connection to the pool. Defaults to 1 second. |
| `FullDuplexMaxHold` | Longest time a pipe keeps its connection under continuous load before it returns the connection to the pool. The pool then runs its per-connection work, such as re-authentication. Defaults to 5 seconds. |
| `NumShards` | The older name for `FullDuplexPipes`, kept for backward compatibility. If you set both to different values, the options are invalid. |

### Ordering

The client routes each command to a pipe by a hash of its first key. The ordering
holds only between commands that share a first key. Commands on other keys, such
as the second key of [`RENAME`](/content/commands/rename.md), and commands
without keys aren't ordered against the rest. Ensure you pass a key as the same Go type
every time, because the client hashes it in its string form, which means that equivalent values like `true` and
`"1"` can land on different pipes.

If a command depends on an earlier one, wait for the earlier command's result
before you submit the later one. Alternatively, keep `FullDuplexPipes` at 1, which keeps
the whole submit order.

### Pool size and the idle spare

The pipeline pool must hold at least `FullDuplexPipes` connections. If you use
both `AutoPipeline()` and `AsyncAutoPipeline()` then each will hold its own pipes, so
size the pool for both. `AutoPipeline()` returns an error that names both
numbers if the pool is too small. Raise `PipelinePoolSize` to fix it.

A full-duplex autopipeliner also raises `PipelineMinIdleConns` to 1, so the
pool keeps one dialed spare connection. This means that if a pipe's connection fails, the
replacement doesn't need to wait for a new TCP or TLS connection. The spare adds one
idle connection per client, or per node on a cluster, and it is added only when
the pool has room for it next to the pipes. Set `PipelineMinIdleConns` to a
negative value to opt out. This requires v9.24.0 or later.

### Cluster and MultiDB clients

On a `ClusterClient`, full-duplex mode keeps one pipe for each master node and
ignores `FullDuplexPipes`. It sends each command to the pipe of the node that
owns its slot. If a pipe's session drops, the unacknowledged commands go
through the cluster router, so they reach the new owner of the slot. Before
v9.24.0, they were retried only on the same node. If you set `ReadOnly`,
`RouteByLatency`, or `RouteRandomly`, the client doesn't use full-duplex mode
and falls back to the default mode.

A [`MultiDBClient`](/content/develop/clients/go/failover.md) keeps one pipe for
each member and also ignores `FullDuplexPipes`.

## Caveats and limitations

-   A command's context is not honored once it is queued, because batches
    execute on the autopipeliner's own context. Use a plain client if you need
    per-command deadlines.
-   Blocking commands such as [`BLPOP`](/content/commands/blpop.md) and
    [`WAIT`](/content/commands/wait.md) are never batched and run directly
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
