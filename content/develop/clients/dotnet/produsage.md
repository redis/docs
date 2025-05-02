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
    {{< checklist-item "#server-maintenance-event-handling" >}}Server maintenance event handling{{< /checklist-item >}}
    {{< checklist-item "#exception-handling" >}}Exception handling{{< /checklist-item >}}
{{< /checklist >}}

## Recommendations

The sections below offer recommendations for your production environment. Some
of them may not apply to your particular use case.

### Server maintenance event handling

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
