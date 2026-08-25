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
description: Improve reliability using the failover features of StackExchange.Redis.
linkTitle: Geographic failover
title: Client-side geographic failover
topics:
- failover
- failback
- resilience
- health checks
- retries
relatedPages:
- /develop/clients/failover
scope: [client-specific, implementation]
weight: 55
---

StackExchange.Redis supports [Client-side geographic failover](https://en.wikipedia.org/wiki/Failover)
to improve the availability of connections to Redis databases. This page explains
how to configure StackExchange.Redis for failover. For an overview of the concepts,
see the main [Client-side geographic failover]({{< relref "/develop/clients/failover" >}}) page.

## Failover configuration

Failover support is available in StackExchange.Redis v3.1.0 and later. The failover
types live in the `StackExchange.Redis.Availability` namespace, so you should add the following
`using` directives to your source file:

```csharp
using StackExchange.Redis;
using StackExchange.Redis.Availability;
```

{{< note >}}The failover feature is fully supported and intended for production use.
However, because it is a large, new API surface, the types in the
`StackExchange.Redis.Availability` namespace are marked with the `[Experimental]`
attribute so that the library can reserve the right to adjust them without the usual
backwards-compatibility guarantees. (This marker is expected to be removed in a later
3.1.x release.) As a result, the compiler reports the `SER007` diagnostic when you use
these types. Suppressing this diagnostic is the normal way to use the feature. To do so,
either add the following to your `.csproj` file:

```xml
<NoWarn>$(NoWarn);SER007</NoWarn>
```

or suppress it locally in your source file:

```csharp
#pragma warning disable SER007
```
{{< /note >}}

The example below shows a simple case with a list of two servers,
`redis-east` and `redis-west`, where `redis-east` is the preferred
target. If `redis-east` fails, StackExchange.Redis should fail over to
`redis-west`.

A failover-capable connection is a *group* of endpoints, each of which could serve
your workload. Create the group using `ConnectionMultiplexer.ConnectGroupAsync()`, passing
an array of `ConnectionGroupMember` instances instead of a single connection string,
as shown in the example below:

```csharp
// Define your Redis endpoints, with the highest weight being tried first.
ConnectionGroupMember[] members = [
    new("redis-east.example.com:6379", name: "US East") { Weight = 1.0 },
    new("redis-west.example.com:6379", name: "US West") { Weight = 0.5 }
];

// Connect to all members.
await using var conn = await ConnectionMultiplexer.ConnectGroupAsync(members);

// Use the connection exactly as you would a normal multiplexer.
IDatabase db = conn.GetDatabase();
await db.StringSetAsync("mykey", "myvalue");
RedisValue value = await db.StringGetAsync("mykey");
```

`ConnectGroupAsync()` returns a connection that you use
just like a standard multiplexer, but it also handles the connection management and
failover transparently. The [`IDatabase`]({{< relref "/develop/clients/dotnet/connect" >}})
and `ISubscriber` instances obtained from the multiplexer also work with a group
as they do with an individual endpoint.

### Endpoint configuration

Each endpoint is represented by a `ConnectionGroupMember`, which you can create from a
connection string or from a
[`ConfigurationOptions`]({{< relref "/develop/clients/dotnet/connect" >}}) instance.
Use `ConfigurationOptions` when you need to provide credentials, TLS settings, or other
options for each endpoint individually:

```csharp
var eastConfig = new ConfigurationOptions
{
    EndPoints = { "redis-east-1.example.com:6379", "redis-east-2.example.com:6379" },
    Password = "east-password",
    Ssl = true,
};

var westConfig = new ConfigurationOptions
{
    EndPoints = { "redis-west-1.example.com:6379", "redis-west-2.example.com:6379" },
    Password = "west-password",
    Ssl = true,
};

ConnectionGroupMember[] members = [
    new(eastConfig, name: "US East"),
    new(westConfig, name: "US West")
];

await using var conn = await ConnectionMultiplexer.ConnectGroupAsync(members);
```

The `ConnectionGroupMember` class provides the following properties to configure each
endpoint:

| Property | Default | Description |
| :-- | :-- | :-- |
| `Weight` | `0` | Priority of the endpoint, with higher values being tried first (see [Selecting a failover target]({{< relref "/develop/clients/failover#selecting-a-failover-target" >}}) for a full description of how the weighted list is used). |
| `HealthCheck` | Group default | Per-member [health check](#health-check-configuration) override. |
| `CircuitBreaker` | Group default | Per-member [circuit breaker](#circuit-breaker-configuration) override. |
| `FailbackDelay` | Group default | Per-member [failback delay](#failback-configuration) override. |
| `SkipInitialHealthCheck` | `false` | If `true`, skip the health check performed when the member is first added to the group. |

Note that you can also adjust weights at runtime, for example in response to changing conditions:

```csharp
members[0].Weight = 1;   // Reduce preference for the local DC
members[1].Weight = 10;  // Increase preference for the remote DC
```

### Group configuration

Health checks, circuit breakers, and retries are each configured using
immutable *policy types* (`HealthCheck`, `CircuitBreaker`, and `RetryPolicy`).
Each of the three policy types follows the same basic pattern:

1. The policy type is immutable and safe to share between members.
2. Each policy has a nested `Builder` that carries the mutable settings. A new
   `Builder` starts from the default values, so you only set what you want to change.
   A `Builder` converts implicitly to its policy type, so you can assign or pass it inline.
   Alternatively, you can call the `Create()` method explicitly to create the policy.
   `Create()` also validates the values, throwing
   `ArgumentOutOfRangeException` or `ArgumentException` at the point of configuration if
   a value is invalid.
3. `MultiGroupOptions` (itself immutable, with its own `Builder`) holds the group-wide
   defaults. `ConnectionGroupMember` contains the same properties as `MultiGroupOptions`
   but allows you to override these shared values for each member.

Supply the group-wide defaults by passing a `MultiGroupOptions` instance as the second
argument to `ConnectGroupAsync()`:

```csharp
HealthCheck healthCheck = new HealthCheck.Builder { ProbeCount = 5 };
CircuitBreaker breaker = new CircuitBreaker.Builder { FailureRateThreshold = 25 };
RetryPolicy retry = new RetryPolicy.Builder { MaxAttempts = 5 };

MultiGroupOptions options = new MultiGroupOptions.Builder
{
    HealthCheck = healthCheck,
    CircuitBreaker = breaker,
    RetryPolicy = retry,
    HealthCheckInterval = TimeSpan.FromSeconds(2),
};

await using var conn = await ConnectionMultiplexer.ConnectGroupAsync(members, options);
```

### Circuit breaker configuration

A circuit breaker passively monitors the traffic already flowing over a connection and
closes the connection when it detects that the connection has become unstable
(see [Detecting connection problems]({{< relref "/develop/clients/failover#detecting-connection-problems" >}}) for more information on how the
circuit breaker works). Configure the circuit breaker for the whole group using the
`CircuitBreaker` option of `MultiGroupOptions`:

```csharp
MultiGroupOptions options = new MultiGroupOptions.Builder
{
    CircuitBreaker = new CircuitBreaker.Builder
    {
        FailureRateThreshold = 25,                   // Trip above 25% failures.
        MinimumNumberOfFailures = 100,               // ...but only after 100 failures in the window.
        MetricsWindowSize = TimeSpan.FromSeconds(5), // Rolling window to measure over.
    }
};

await using var conn = await ConnectionMultiplexer.ConnectGroupAsync(members, options);
```

The `CircuitBreaker.Builder` class provides the following properties:

| Property | Default | Description |
| :-- | :-- | :-- |
| `FailureRateThreshold` | `10` | Percentage of failures within the window that trips the breaker. |
| `MinimumNumberOfFailures` | `1000` | Minimum number of tracked failures in the window before the breaker can trip (this avoids acting on tiny samples). |
| `MetricsWindowSize` | `2` | Length of rolling time window (in seconds) over which successes and failures are counted. |

The circuit breaker counts transient and connection-level errors (including timeouts) as
failures, but counts
application-level errors (such as a `WRONGTYPE` for a bad command) as successes
because they don't indicate an unhealthy connection.

You can also configure a circuit breaker for a single connection (outside a group) using
the `ConfigurationOptions.CircuitBreaker` option. Use `CircuitBreaker.None` to disable
the circuit breaker.

### Retry configuration

You can configure an `IDatabaseAsync` instance to retry commands that fail due
to transient errors (such as temporary network delays) using the `WithRetry()` method:

```csharp
await using var conn = await ConnectionMultiplexer.ConnectGroupAsync(members);

// Wrap the database once, then reuse the wrapper like any other IDatabaseAsync.
// The parameterless overload uses the policy configured on the connection.
IDatabaseAsync db = conn.GetDatabase().WithRetry();

// A transient fault is retried automatically. If the group fails over in the
// meantime, the retry lands on the new active member.
RedisValue value = await db.StringGetAsync("mykey");
```

Note that you can enable retries only for `IDatabaseAsync`, not for the
synchronous equivalent `IDatabase`.

If you call `WithRetry()` without parameters, it will use the default retry
policy (see [Group configuration](#group-configuration) for details). However,
you can also pass a policy explicitly to override the defaults for an individual
database:

```csharp
RetryPolicy policy = new RetryPolicy.Builder
{
    MaxAttempts = 5,
    RetryDelay = TimeSpan.FromMilliseconds(200),
    JitterMax = TimeSpan.FromMilliseconds(100),
};
IDatabaseAsync db = conn.GetDatabase().WithRetry(policy);
```

The `RetryPolicy.Builder` class provides the following properties:

| Property | Default | Description |
| :-- | :-- | :-- |
| `MaxAttempts` | `3` | Maximum number of attempts (including the first) before giving up. |
| `MaxAttemptsBeforeFailover` | `1` | Maximum number of attempts against the current member before a retry is allowed to move to a failover member (group connections only). |
| `RetryDelay` | `1` | Delay (in seconds) between retries on the same server. |
| `JitterMax` | `0.5` | Upper bound of the random delay (in seconds) added to each retry, to avoid stampedes. |
| `FailoverDelay` | `5` | Maximum time (in seconds) to wait when a retry is expecting a failover. |
| `MaxCommandRetryCategory` | `CommandRetryWriteLastWins` | The most "dangerous" command category that will be retried (see [Which operations are safe to retry?](#which-operations-are-safe-to-retry)) |
| `MaxAttemptsOnWatchConflict` | `3` | Maximum number of attempts allowed for a watched transaction that keeps failing (see [Watch keys for changes]({{< relref "/develop/clients/dotnet/transpipe#watch-keys-for-changes" >}}) for more information). |

The retry mechanism classifies errors in the same way as the circuit breaker
(see [Circuit breaker configuration](#circuit-breaker-configuration)). Only transient
errors are retried.

#### Which operations are safe to retry?

Commands are generally safe to retry if they are *idempotent* (that is to say, multiple invocations
of the same command have the same result as a single invocation). This excludes
commands like [`INCR`]({{< relref "/commands/incr" >}}) that modify whatever value
is currently stored in the database.

Each command belongs to a *retry category* that describes how "dangerous" it is
from the perspective of retrying. Categories are ordered from least to most dangerous,
and each has its own `CommandFlags` value as described in the table below:

| `CommandFlags` value | Meaning |
|----------------------|---------|
| `CommandRetryAlways` | Always safe to retry, regardless of connection/server state |
| `CommandRetryConnection` | Connection-level or safe metadata (e.g. `CLIENT SETNAME`, `CONFIG GET`) |
| `CommandRetryReadOnly` | Pure reads (e.g. `GET`) |
| `CommandRetryWriteChecked` | Conditional writes (e.g. `SETNX`, `SET ... IFEQ`) |
| `CommandRetryWriteLastWins` | Unconditional overwrite — last-writer-wins (e.g. `SET`) |
| `CommandRetryWriteAccumulating` | Cumulative writes where a retry can double-apply (e.g. `INCR`, `LPUSH`) |
| `CommandRetryServerAdmin` | Server administration (e.g. `CONFIG SET`) |
| `CommandRetryNever` | Never retry |

A policy only retries
commands at or below its `MaxCommandRetryCategory` level. For the built-in typed methods
(such as `StringGet`, `StringSet`, and `HashSet`) `StackExchange.Redis` assigns the appropriate
category automatically.

Arbitrary commands issued using `Execute()`/`ExecuteAsync()`, and Lua scripts run using
`ScriptEvaluate()`/`ScriptEvaluateAsync()`, have side-effects that the library cannot
infer, so they are not retried by default. However, you can pass your own choice of
retry category using the `flags` parameter:

```csharp
// a Lua script that only reads: opt into retries
var value = await db.ScriptEvaluateAsync(
    "return redis.call('GET', KEYS[1])",
    keys: [key],
    flags: CommandFlags.CommandRetryReadOnly
);
```

### Failback configuration

Each member tracks two independent pieces of state:

- `IsConnected`: the last observed connectivity status of the underlying connection.
- `IsUnhealthy`: whether the member has been disabled by a failed health check
  or a tripped circuit breaker.

A member can be selected as active only when it is both connected and
healthy.

`MultiGroupOptions.FailbackDelay` is the minimum interval over which a member must remain healthy
(measured from its most recent failure) before it is automatically returned to rotation.
This helps to protect against *flapping*, where a member is only intermittently available
between repeated failures.

```csharp
MultiGroupOptions options = new MultiGroupOptions.Builder
{
    FailbackDelay = TimeSpan.FromMinutes(2), // Must be healthy for 2 minutes after its last failure.
};
```

`FailbackDelay` defaults to a value of `TimeSpan.Zero`, which means the member comes back into
rotation as soon as it passes a health check. If you use a value of `TimeSpan.MaxValue` then
automatic failback is effectively disabled. However, you can use the `ResetIsUnhealthy()` or
`TryFailoverTo()` methods to enable a member manually (see [Manual failover](#manual-failover)
for more information).

## Health check configuration

Each health check consists of one or more separate *probes*, each of which is a simple
test (such as a [`PING`]({{< relref "/commands/ping" >}}) command) to determine if the
member is available. The results of the separate probes are combined using a configurable
policy to determine whether the member is healthy. When a member fails its health check,
it is flagged as unhealthy and traffic is routed to other healthy members instead. When
an unhealthy member recovers, traffic can be routed to it again, after the
[failback delay](#failback-configuration) has elapsed.

Configure health checks for the whole group using the `HealthCheck` option of
`MultiGroupOptions`:

```csharp
HealthCheck healthCheck = new HealthCheck.Builder
{
    ProbeCount = 3,                                 // Maximum probe attempts per check.
    ProbeTimeout = TimeSpan.FromSeconds(3),         // Timeout for each probe attempt.
    ProbeInterval = TimeSpan.FromMilliseconds(500), // Delay between failed probes.
    Probe = HealthCheckProbe.Ping,                  // Which probe type to use.
    ProbePolicy = HealthCheckProbePolicy.AllSuccess // How to evaluate the probe results.
};

MultiGroupOptions options = new MultiGroupOptions.Builder
{
    HealthCheck = healthCheck,
    HealthCheckInterval = TimeSpan.FromSeconds(5),  // How often checks run (a group-level concern).
};

await using var conn = await ConnectionMultiplexer.ConnectGroupAsync(members, options);
```

Use the `MultiGroupOptions.HealthCheckInterval` option to set the interval between health
checks for all members of the group. Set this to `TimeSpan.MaxValue` if you want to
disable periodic health checking.

The `HealthCheck.Builder` class provides the following properties to configure each probe:

| Property | Default | Description |
| :-- | :-- | :-- |
| `ProbeCount` | `3` | Number of probe operations to perform per health check. |
| `ProbeTimeout` | `3` | Maximum time allowed (in seconds) for an individual probe to complete. |
| `ProbeInterval` | `500` | Delay (in milliseconds) between consecutive failed probes. |
| `Probe` | `Ping` | The probe operation to execute (see [Probe types](#probe-types) below). |
| `ProbePolicy` | `AllSuccess` | Policy for evaluating multiple probe results (see [Probe policies](#probe-policies) below). |

### Probe types

StackExchange.Redis provides the following built-in probe types:

| Probe | Description |
| :-- | :-- |
| `HealthCheckProbe.Ping` (default) | Sends a [`PING`]({{< relref "/commands/ping" >}}) command. Lightweight, and recommended for most scenarios. |
| `HealthCheckProbe.IsConnected` | Checks the socket connection status without sending any command. Even more lightweight than `Ping`, but only verifies the connection, not that Redis is responsive. |
| `HealthCheckProbe.StringSet` | Writes a random value and reads it back to verify read/write capability. More comprehensive, but higher overhead than `Ping`. This probe automatically skips replica servers. |

### Probe policies

When `ProbeCount` is greater than 1, the probe policy determines how the individual
probe results are combined to give an overall verdict. The available policies are:

| Policy | Description |
| :-- | :-- |
| `HealthCheckProbePolicy.AnySuccess` | Healthy if *any* probe succeeds (most lenient). |
| `HealthCheckProbePolicy.AllSuccess` (default) | Healthy only if *all* probes succeed (strictest). |
| `HealthCheckProbePolicy.MajoritySuccess` | Healthy if a *majority* of probes succeed. |

### Custom health check probes

You can supply your own health check probe by deriving a new class from
`HealthCheckProbe`, or from `HealthCheckProbePolicy` for a custom evaluation policy. For
example, you might use this to integrate with external monitoring tools or to implement
checks that are specific to your application. See the
[StackExchange.Redis failover documentation](https://stackexchange.github.io/StackExchange.Redis/Failover#advanced-customization)
for details and examples.

## Managing members at runtime

Although you will typically configure all members during the initial connection, you can
also modify the group at runtime by casting the connection to `IConnectionGroup`. For
example, you can add a new datacenter before decommissioning an old one for a
zero-downtime migration:

```csharp
var group = (IConnectionGroup)conn;

// Add a new member at runtime.
var newMember = new ConnectionGroupMember("new-dc.example.com:6379", name: "New Datacenter") { Weight = 5 };
await group.AddAsync(newMember);

// Remove a member.
group.Remove(newMember);
```

Each `ConnectionGroupMember` also exposes its current status, which you can inspect at
any time using the `GetMembers()` method of the connection:

```csharp
foreach (ConnectionGroupMember member in conn.GetMembers())
{
    Console.WriteLine($"{member.Name}: Connected={member.IsConnected}, " +
                      $"Unhealthy={member.IsUnhealthy}, Weight={member.Weight}, Latency={member.Latency}");
}
```

### Manual failover

By default, the group selects the active member automatically based on weight and
latency. However, you can also use the `TryFailoverTo()` method to select which member to
use manually, for example to route traffic away from a region during maintenance:

```csharp
// Get the members and find the one you want to fail over to.
ConnectionGroupMember target = conn.GetMembers().First(m => m.Name == "US West");

// Attempt to fail over to the specified member.
if (conn.TryFailoverTo(target))
{
    Console.WriteLine($"Successfully failed over to {target.Name}");
}

// Later, pass null to remove the explicit failover and restore automatic selection.
conn.TryFailoverTo(null);
```

`TryFailoverTo()` returns `false` if the target member is not connected or is not part of
the group. While an explicit failover is active, the chosen member is preferred for all
traffic and weight and latency are ignored. However, if the chosen member becomes
unavailable, the group still falls back automatically to other connected members. Explicit
failovers are not persisted across application restarts.

## Monitoring failover events

You may want to take some custom action when a failover occurs. For example, you could log
a warning, increment a metric, or externally persist the connection state. Use the
`ConnectionChanged` event to react when the active member changes:

```csharp
conn.ConnectionChanged += (sender, args) =>
{
    if (args.Type == GroupConnectionChangedEventArgs.ChangeType.ActiveChanged)
    {
        Console.WriteLine($"Active member changed from {args.PreviousGroup?.Name ?? "none"} to {args.Group.Name}");
    }
};
```

## Pub/Sub and re-subscription

A connection group supports [Pub/Sub]({{< relref "/develop/pubsub" >}}) messaging with
automatic re-subscription to channels during failover, so you don't have to detect
failovers and re-subscribe manually. When you subscribe to a channel, the subscription is
established against *all* members (for immediate pickup during a failover), and the library
filters received messages so that you only observe messages from the active member.
Publishing occurs only to the active member.

Create an `ISubscriber` from the connection in the usual way using the `GetSubscriber()`
method, then subscribe to one or more channels:

```csharp
ISubscriber subscriber = conn.GetSubscriber();

// If a failover happens, the subscription is automatically re-established
// on the new active member.
await subscriber.SubscribeAsync(RedisChannel.Literal("notifications"), (channel, message) =>
{
    Console.WriteLine($"Received: {message}");
});

await subscriber.PublishAsync(RedisChannel.Literal("notifications"), "Hello, World!");
```
