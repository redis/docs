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

{{< checklist "goprodlist" >}}
    {{< checklist-item "#health-checks" >}}Health checks{{< /checklist-item >}}
    {{< checklist-item "#error-handling" >}}Error handling{{< /checklist-item >}}
    {{< checklist-item "#monitor-performance-and-errors">}}Monitor performance and errors{{< /checklist-item >}}
    {{< checklist-item "#retries" >}}Retries{{< /checklist-item >}}
    {{< checklist-item "#timeouts" >}}Timeouts{{< /checklist-item >}}
{{< /checklist >}}

## Recommendations

The sections below offer recommendations for your production environment. Some
of them may not apply to your particular use case.

### Health checks

If your code doesn't access the Redis server continuously then it
might be useful to make a "health check" periodically (perhaps once
every few seconds). You can do this using a simple
[`PING`]({{< relref "/commands/ping" >}}) command:

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

### Monitor performance and errors

`go-redis` supports [OpenTelemetry](https://opentelemetry.io/). This lets
you trace command execution and monitor your server's performance.
You can use this information to detect problems before they are reported
by users. See [Observability]({{< relref "/develop/clients/go#observability" >}})
for more information.

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
