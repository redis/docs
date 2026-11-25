---
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
description: Get your `go-redis` app ready for production
linkTitle: Production usage
title: Production usage
weight: 60
---

This guide offers recommendations to get the best reliability and
performance in your production environment.

## Checklist

Each item in the checklist below links to the section
for a recommendation. Use the checklist icons to record your
progress in implementing the recommendations.

```checklist {id="goprodlist"}
- [ ] [Health checks](#health-checks)
- [ ] [Error handling](#error-handling)
- [ ] [Monitor performance and errors](#monitor-performance-and-errors)
- [ ] [Retries](#retries)
- [ ] [Timeouts](#timeouts)
- [ ] [Connection pooling](#connection-pooling)
- [ ] [Smart client handoffs](#smart-client-handoffs)
```

## Recommendations

The sections below offer recommendations for your production environment. Some
of them may not apply to your particular use case.

### Health checks

If your code doesn't access the Redis server continuously then it
might be useful to make a "health check" periodically (perhaps once
every few seconds). You can do this using a simple
[`PING`](/content/commands/ping.md) command:

```go
err := rdb.Ping(ctx).Err()

if err != nil {
  // Report failed health check.
}
```

Health checks help to detect problems as soon as possible without
waiting for a user to report them.

### Error handling

The `Result()` method of a command returns both the command result
and an error value. Although you are mainly interested in the result,
you should also always check that the error value is `nil` before
proceeding. Errors can be returned for failed connections, network
problems, and invalid command parameters, among other things.

See [Error handling](/content/develop/clients/go/error-handling.md) for a
more detailed discussion of error handling approaches in `go-redis`.

### Monitor performance and errors

`go-redis` supports [OpenTelemetry](https://opentelemetry.io/). This lets
you trace command execution and monitor your server's performance.
You can use this information to detect problems before they are reported
by users. See [Observability](/content/develop/clients/go/observability.md)
for more information.

To find the keys that use the most CPU time and network bandwidth on the
server, use the [`HOTKEYS`](/content/commands/hotkeys.md) command.

### Retries

`go-redis` will automatically retry failed connections and commands. By
default, the number of attempts is set to three, but you can change this
using the `MaxRetries` field of `Options` when you connect. The retry
strategy starts with a short delay between the first and second attempts,
and increases the delay with each attempt. The initial delay is set
with the `MinRetryBackoff` option (defaulting to 8 milliseconds) and the
maximum delay is set with the `MaxRetryBackoff` option (defaulting to
512 milliseconds):

```go
client := redis.NewClient(&redis.Options{
    MinRetryBackoff: 10 * time.Millisecond,
    MaxRetryBackoff: 100 * time.Millisecond,
    MaxRetries: 5,
})
```

A failed connection attempt has its own, separate retry settings. The
`DialerRetries` field sets the number of dial attempts, including the first
(defaulting to 5), and `DialerRetryTimeout` sets the delay between attempts
(defaulting to 100 milliseconds). With the default settings, a refused
connection is reported after about 0.4 seconds. `DialTimeout` still limits
each attempt, so a dial that hangs for the whole timeout is bounded by
`DialTimeout` multiplied by `DialerRetries`.

In `go-redis` v9.24.0 or later, `MaxRetries` doesn't start a new sequence of
dial attempts on an endpoint where one has already failed. Before that
release, the default settings reported a refused connection after about
1.7 seconds. On a cluster or a ring, a command skips an endpoint that has
failed and uses its remaining retries on the other nodes or shards. A custom
`Dialer` keeps the earlier behavior.

You can use the observability features of `go-redis` to monitor the
number of retries and the time taken for each attempt, as noted in the
[Monitor performance and errors](#monitor-performance-and-errors) section
above. Use this data to help you decide on the best retry settings
for your application.

### Timeouts

`go-redis` supports timeouts for connections and commands to avoid
stalling your app if the server does not respond within a reasonable time.
The `DialTimeout` field of `Options` sets the timeout for connections,
and the `ReadTimeout` and `WriteTimeout` fields set the timeouts for
reading and writing data, respectively. The default timeout is five seconds
for connections and three seconds for reading and writing data, but you can
set your own timeouts when you connect:

```go
client := redis.NewClient(&redis.Options{
    DialTimeout:  10 * time.Second,
    ReadTimeout:  5 * time.Second,
    WriteTimeout: 5 * time.Second,
})
```

You can use the observability features of `go-redis` to monitor the
frequency of timeouts, as noted in the
[Monitor performance and errors](#monitor-performance-and-errors) section
above. Use this data to help you decide on the best timeout settings
for your application. If timeouts are set too short, then `go-redis`
might retry commands that would have succeeded if given more time. However,
if they are too long, your app might hang unnecessarily while waiting for a
response that will never arrive.

### Connection pooling

`go-redis` manages connections for you with a
[connection pool](/content/develop/clients/pools-and-muxing.md), so your
app doesn't have to cache and reuse open connections itself. The `PoolSize`
field of `Options` sets the number of
connections the main pool keeps (with a default of ten times the value of `GOMAXPROCS`). `MinIdleConns` sets how many
connections to open before your app asks for them, `MaxActiveConns` caps the
total number of connections, and `PoolTimeout` sets how long a command waits
for a free connection. By default, no connections are opened in advance, the
total is uncapped, and a command waits one second longer than `ReadTimeout`.

In `go-redis` v9.24.0 or later, `MaxActiveConns` counts every connection
registered with the pool, including the dedicated connections that
`EphemeralConn()` and `NewConn()` create, plus any dial in progress. If your
app uses these methods with a `MaxActiveConns` limit, a command can fail with
`ErrPoolExhausted` while those connections are open.

By default, `go-redis` closes an idle connection that has outlived
`ConnMaxIdleTime` (30 minutes by default) or `ConnMaxLifetime` (unlimited by
default) only when a command next needs a connection. To close them in
the background instead, so that expired connections never slow down a command,
set `ConnMaxLifetimeReapInterval`:

```go
client := redis.NewClient(&redis.Options{
    ConnMaxIdleTime:             5 * time.Minute,
    ConnMaxLifetimeReapInterval: time.Minute,
})
```

Every interval, a background goroutine closes the idle connections that are
past either limit and refills the pool towards `MinIdleConns`. This also
shrinks the pool after a burst of traffic. The reaper never touches a
connection that is in use. It does nothing unless `ConnMaxIdleTime` or
`ConnMaxLifetime` is greater than zero, and it is off by default.
Use `conn_max_lifetime_reap_interval` to set it in a connection URL.

By default, pipelines don't use the main pool. In go-redis v9.23.0 or later,
every client also creates a separate *pipeline pool* that
[pipelines and transactions](/content/develop/clients/go/transpipe.md) and
[automatic pipelining](/content/develop/clients/go/autopipeline.md) use
for each batch they run. This prevents a burst of batches from competing with your
ordinary commands for the same connections.

Use the following fields of `Options` to size the pipeline pool:

| Field | Description |
| :---- | :---------- |
| `PipelinePoolSize` | Number of connections the pipeline pool keeps. Defaults to 10. Set it to `0` to use the default number of connections, or to `-1` to disable the separate pipeline pool (which means connections are allocated to pipelines from the main pool). A [full-duplex autopipeliner](/content/develop/clients/go/autopipeline.md#full-duplex-mode) needs at least as many connections as it has pipes. |
| `PipelineMinIdleConns` | Minimum number of idle connections that the pipeline pool keeps, like `MinIdleConns` for the main pool. Defaults to 0, so an idle pipeline pool holds no connections. The connections are dialed in advance, but `go-redis` runs the connection handshake only on first use. A [full-duplex autopipeliner](/content/develop/clients/go/autopipeline.md#full-duplex-mode) raises it to 1 unless you set a negative value. Available in v9.24.0 or later. |
| `PipelineReadBufferSize` | Size of the read buffer for each pipeline connection. Defaults to the larger of `ReadBufferSize` and 128 KiB, because a batch of commands can return many replies in a single round trip. If the value is set smaller than the minimum required by the [RESP3](/content/develop/reference/protocol-spec.md#resp-versions) protocol for push messages then that minimum is used instead. |
| `PipelineWriteBufferSize` | Size of the write buffer for each pipeline connection. Defaults to the larger of `WriteBufferSize` and 128 KiB. |

The pipeline pool costs you nothing while you are not using pipelining. It doesn't
inherit `MinIdleConns`, so by default an idle pipeline pool holds no connections at
all (use `PipelineMinIdleConns` to change this). Also, it doesn't use
`MaxActiveConns` as its upper limit (which would double the number of connections your client can
open). The limit is instead the value of `MaxActiveConns` plus `PipelinePoolSize`.
`ClusterClient` and `Ring` create a pipeline pool for each node, so this limit
applies for each node rather than for each client.

If every pipeline connection is busy, a batch runs on the main pool straight away
rather than waiting for a pipeline connection. A burst of batches wider than
`PipelinePoolSize` therefore opens extra connections in the main pool, which
still applies the `MaxActiveConns` limit. A `Limiter` counts such a batch once
rather than twice.

You can find out the current size of the pipeline pool using the `PipelineStats`
field from the client's pool statistics:

```go
stats := client.PoolStats()
fmt.Printf("Main pool connections: %d, hits: %d, misses: %d\n",
    stats.TotalConns, stats.Hits, stats.Misses)
if ps := stats.PipelineStats; ps != nil {
    fmt.Printf("Pipeline pool connections: %d, hits: %d, misses: %d\n",
        ps.TotalConns, ps.Hits, ps.Misses)
}
```

No field counts the batches that run on the main pool, and they don't appear
as timeouts. If `PipelineStats.TotalConns` stays at `PipelinePoolSize` while the
main pool's `TotalConns` grows during bursts of batches, increase
`PipelinePoolSize`. Note that `PipelineStats` is `nil` when you disable the
pipeline pool (by setting `PipelinePoolSize` to `-1`). It also combines
the figures from every node for `ClusterClient` and `Ring` into the same count.

### Smart client handoffs

*Smart client handoffs (SCH)* is a feature of Redis Cloud and
Redis Software servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.

See [Smart client handoffs](/content/develop/clients/sch.md)
for more information about SCH and
[Connect using Smart client handoffs](/content/develop/clients/go/connect.md#connect-using-smart-client-handoffs-sch)
for example code.
