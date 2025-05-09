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
description: Get your NRedisStack app ready for production
linkTitle: Production usage
title: Production usage
weight: 70
---

This guide offers recommendations to get the best reliability and
performance in your production environment.

## Checklist

Each item in the checklist below links to the section
for a recommendation. Use the checklist icons to record your
progress in implementing the recommendations.

{{< checklist "dotnetprodlist" >}}
    {{< checklist-item "#event-handling" >}}Event handling{{< /checklist-item >}}
    {{< checklist-item "#timeouts" >}}Timeouts{{< /checklist-item >}}
    {{< checklist-item "#exception-handling" >}}Exception handling{{< /checklist-item >}}
{{< /checklist >}}

## Recommendations

The sections below offer recommendations for your production environment. Some
of them may not apply to your particular use case.

### Event handling

The `ConnectionMultiplexer` class publishes several different types of
[events](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/events/)
for situations such as configuration changes and connection failures.
Use these events to record server activity in a log, which you can then use
to monitor performance and diagnose problems when they occur.
See
the StackExchange.Redis
[Events](https://stackexchange.github.io/StackExchange.Redis/Events)
page for the full list of events.

#### Server notification events

Some servers (such as Azure Cache for Redis) send notification events shortly
before scheduled maintenance is due to happen. You can use code like the
following to respond to these events (see the 
[StackExchange.Redis](https://stackexchange.github.io/StackExchange.Redis/ServerMaintenanceEvent)
docs for the full list of supported events). For example, you could
inform users who try to connect that service is temporarily unavailable
rather than letting them run into errors.

```cs
using NRedisStack;
using StackExchange.Redis;

ConnectionMultiplexer muxer = ConnectionMultiplexer.Connect("localhost:6379");

muxer.ServerMaintenanceEvent += (object sender, ServerMaintenanceEvent e) => {
    // Identify the event and respond to it here.
    Console.WriteLine($"Maintenance event: {e.RawMessage}");
};
```

### Timeouts

If a network or server error occurs while your code is opening a
connection or issuing a command, it can end up hanging indefinitely.
To prevent this, `NRedisStack` sets timeouts for socket
reads and writes and for opening connections.

By default, the timeout is five seconds for all operations, but
you can set the time (in milliseconds) separately for connections
and commands using the `ConnectTimeout`, `SyncTimeout`, and
`AsyncTimeout` configuration options:

```cs
var muxer = ConnectionMultiplexer.Connect(new ConfigurationOptions {
    ConnectTimeout = 1000,  // 1 second timeout for connections.
    SyncTimeout = 2000,     // 2 seconds for synchronous commands.
    AsyncTimeout = 3000     // 3 seconds for asynchronous commands.
        .
        .
});

var db = muxer.GetDatabase();
```

The default timeouts are a good starting point, but you may be able
to improve performance by adjusting the values to suit your use case.

### Exception handling

Redis handles many errors using return values from commands, but there
are also situations where exceptions can be thrown. In production code,
you should handle exceptions as they occur. The list below describes some
the most common Redis exceptions:

- `RedisConnectionException`: Thrown when a connection attempt fails.
- `RedisTimeoutException`: Thrown when a command times out.
- `RedisCommandException`: Thrown when you issue an invalid command.
- `RedisServerException`: Thrown when you attempt an invalid operation
  (for example, trying to access a
  [stream entry]({{< relref "/develop/data-types/streams#entry-ids" >}})
  using an invalid ID).
