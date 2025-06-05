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
weight: 6
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
