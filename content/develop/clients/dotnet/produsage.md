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
description: Get your `StackExchange.Redis` app ready for production
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

```checklist {id="dotnetprodlist"}
- [ ] [Event handling](#event-handling)
- [ ] [Timeouts](#timeouts)
- [ ] [Exception handling](#exception-handling)
- [ ] [Retries](#retries)
```

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
To prevent this, `StackExchange.Redis` sets timeouts for socket
reads and writes and for opening connections.

By default, the timeout is five seconds for `ConnectTimeout` and `SyncTimeout`,
and `AsyncTimeout` uses the same value as `SyncTimeout`. You can set the time
(in milliseconds) separately for connections and commands using these
configuration options:

```cs
var muxer = ConnectionMultiplexer.Connect(new ConfigurationOptions {
    ConnectTimeout = 10000,  // 10 seconds for connections.
    SyncTimeout = 10000,     // 10 seconds for synchronous commands.
    AsyncTimeout = 10000     // 10 seconds for asynchronous commands.
        .
        .
});

var db = muxer.GetDatabase();
```

The default timeouts are a good starting point, but cloud applications may need
longer timeouts to handle transient network or server delays. Shorter timeouts
do not make commands run faster; they only fail sooner. Tune these values to
improve reliability and resilience for your workload.

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

See [Error handling]({{< relref "/develop/clients/dotnet/error-handling" >}})
for more information on handling exceptions.

### Retries

During the initial `ConnectionMultiplexer.Connect()` call, `StackExchange.Redis`
will repeat failed connection attempts. By default, it will make three attempts,
but you can configure the number of retries using the `ConnectRetry`
configuration option.

You should also consider the `AbortOnConnectFail` option. If this is `true`,
`Connect()` fails when it can't connect after the configured number of attempts. If it is
`false`, `Connect()` can return a disconnected multiplexer and keep trying to
connect in the background, which is helpful in cloud environments where
dependencies may come online out of sequence. The default is `true`, except for
Azure endpoints, where it defaults to `false`.

```cs
var muxer = ConnectionMultiplexer.Connect(new ConfigurationOptions {
    ConnectRetry = 5,  // Retry up to five times.
    AbortOnConnectFail = false,
        .
        .
});
```

After the initial `Connect()` call is successful, `StackExchange.Redis` will
automatically attempt to reconnect if the connection is lost. You can
specify a reconnection strategy with the `ReconnectRetryPolicy` configuration
option. `StackExchange.Redis` provides two built-in classes that implement
reconnection strategies:

- `ExponentialRetry`: (Default) Uses an
    [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
    strategy, where you specify an increment to the delay between successive
    attempts and, optionally, a maximum delay, both in milliseconds.
-   `LinearRetry`: Uses a linear backoff strategy with a fixed delay between
    attempts, in milliseconds.

The example below shows how to use the `ExponentialRetry` class:

```cs
var muxer = ConnectionMultiplexer.Connect(new ConfigurationOptions {
    // 500ms increment per attempt, max 2000ms.
    ReconnectRetryPolicy = new ExponentialRetry(500, 2000),  
        .
        .
});
```

You can also implement your own custom reconnect policy by creating a class
that implements the `IReconnectRetryPolicy` interface.

`StackExchange.Redis` doesn't provide an automated retry mechanism for commands.
For command retries, use a bounded retry strategy in your application code and
retry only transient failures such as `RedisConnectionException` and
`RedisTimeoutException`. Many .NET apps use a resilience library such as
[Polly](https://www.pollydocs.org/strategies/retry.html) to manage retry delays,
backoff, jitter, and retry limits instead of writing retry loops by hand.
