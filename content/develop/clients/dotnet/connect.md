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
description: Connect your .NET application to a Redis database
linkTitle: Connect
title: Connect to the server
weight: 20
aliases:
- /develop/connect/clients/dotnet/connect/
---

## Basic connection

You can connect to the server simply by passing a string of the
form "hostname:port" to the `Connect()` method (for example,
"localhost:6379"). However, you can also connect using a
`ConfigurationOptions` parameter. Use this to specify a
username, password, and many other options:

```csharp
using StackExchange.Redis;

ConfigurationOptions conf = new ConfigurationOptions {
    EndPoints = { "localhost:6379" },
    User = "yourUsername",
    Password = "yourPassword"
};

ConnectionMultiplexer redis = ConnectionMultiplexer.Connect(conf);
IDatabase db = redis.GetDatabase();

db.StringSet("foo", "bar");
Console.WriteLine(db.StringGet("foo")); // prints bar
```

> [!NOTE]
> Unlike other clients, StackExchange.Redis doesn't support
> [Connection URLs](/content/develop/clients/connection-urls.md#stackexchangeredis-and-nredisstack-net)
> but it does support its own similar configuration string format.
> See [Connection URLs](/content/develop/clients/connection-urls.md#stackexchangeredis-and-nredisstack-net)
> to learn how to convert a standard URL to a configuration string.

## Connect to a Redis cluster

The basic connection will use the
[Cluster API](/content/operate/rs/clusters/optimize/oss-cluster-api.md)
if it is available without any special configuration. However, if you know
the addresses and ports of several cluster nodes, you can specify them all
during connection in the `Endpoints` parameter:

```csharp
ConfigurationOptions options = new ConfigurationOptions
{
    //list of available nodes of the cluster along with the endpoint port.
    EndPoints = {
        { "localhost", 16379 },
        { "localhost", 16380 },
        // ...
    },            
};

ConnectionMultiplexer cluster = ConnectionMultiplexer.Connect(options);
IDatabase db = cluster.GetDatabase();

db.StringSet("foo", "bar");
Console.WriteLine(db.StringGet("foo")); // prints bar
```

## Connect to Redis Sentinel

To connect through [Redis Sentinel](/content/operate/oss_and_stack/management/sentinel.md),
list the Sentinels in `EndPoints` and set `ServiceName` to the name of the primary that
the Sentinels monitor. The client asks the Sentinels for the current primary.

```csharp
using StackExchange.Redis;

ConfigurationOptions conf = new ConfigurationOptions {
    EndPoints = { "localhost:26379", "localhost:26380", "localhost:26381" },
    ServiceName = "mymaster"
};

ConnectionMultiplexer redis = ConnectionMultiplexer.Connect(conf);
IDatabase db = redis.GetDatabase();

db.StringSet("foo", "bar");
Console.WriteLine(db.StringGet("foo")); // prints bar
```

You can also use a configuration string, such as
`"localhost:26379,localhost:26380,localhost:26381,serviceName=mymaster"`.

If the Sentinels and the data nodes have different credentials, connect to the Sentinels
first with `SentinelConnect()`, using the Sentinel credentials. Then call
`GetSentinelMasterConnection()` with the credentials for the primary and replicas:

```csharp
using StackExchange.Redis;

// Connect to the Sentinels with the Sentinel credentials.
ConfigurationOptions sentinelConf = new ConfigurationOptions {
    EndPoints = { "localhost:26379", "localhost:26380", "localhost:26381" },
    User = "yourSentinelUsername",
    Password = "yourSentinelPassword"
};
ConnectionMultiplexer sentinel = ConnectionMultiplexer.SentinelConnect(sentinelConf);

// Connect to the primary with the Redis credentials.
ConfigurationOptions conf = new ConfigurationOptions {
    ServiceName = "mymaster",
    User = "yourUsername",
    Password = "yourPassword"
};
ConnectionMultiplexer redis = sentinel.GetSentinelMasterConnection(conf);
IDatabase db = redis.GetDatabase();
```

The connection also includes the replicas that the Sentinels report. To read from a
replica, pass `CommandFlags.PreferReplica` (or `CommandFlags.DemandReplica`) to a read-only
command. Replication is asynchronous, so a replica can return stale data.

```csharp
// Read from a replica if one is available, otherwise from the primary.
Console.WriteLine(db.StringGet("foo", CommandFlags.PreferReplica)); // prints bar
```

## Connect to your production Redis with TLS

When you deploy your application, use TLS and follow the [Redis security](/content/operate/oss_and_stack/management/security/_index.md) guidelines.

Before connecting your application to the TLS-enabled Redis server, ensure that your certificates and private keys are in the correct format.

To convert user certificate and private key from the PEM format to `pfx`, use this command:

```bash
openssl pkcs12 -inkey redis_user_private.key -in redis_user.crt -export -out redis.pfx
```

Enter password to protect your `pfx` file.

Establish a secure connection with your Redis database using this snippet.

```csharp
ConfigurationOptions options = new ConfigurationOptions
{
    EndPoints = { { "my-redis.cloud.redislabs.com", 6379 } },
    User = "default",  // use your Redis user. More info https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/
    Password = "secret", // use your Redis password
    Ssl = true,
    SslProtocols = System.Security.Authentication.SslProtocols.Tls12                
};

options.CertificateSelection += delegate
{
    return X509CertificateLoader.LoadPkcs12FromFile("redis.pfx", "secret"); // use the password you specified for pfx file
};
options.CertificateValidation += ValidateServerCertificate;

bool ValidateServerCertificate(
        object sender,
        X509Certificate? certificate,
        X509Chain? chain,
        SslPolicyErrors sslPolicyErrors)
{
    if (certificate == null) {
        return false;       
    }

    var ca = X509CertificateLoader.LoadCertificateFromFile("redis_ca.pem");
    bool verdict = (certificate.Issuer == ca.Subject);
    if (verdict) {
        return true;
    }
    Console.WriteLine("Certificate error: {0}", sslPolicyErrors);
    return false;
}

ConnectionMultiplexer muxer = ConnectionMultiplexer.Connect(options);   
            
//Creation of the connection to the DB
IDatabase conn = muxer.GetDatabase();

//send SET command
conn.StringSet("foo", "bar");

//send GET command and print the value
Console.WriteLine(conn.StringGet("foo"));   
```

### SNI hostname selection for cluster connections

> [!NOTE]
> The SNI precedence scheme described in this section
> requires `StackExchange.Redis` v3.3.1 or later.

When you connect with TLS to a cluster that `StackExchange.Redis` discovers through
`CLUSTER SLOTS`, each discovered node needs its own
[SNI hostname](https://en.wikipedia.org/wiki/Server_Name_Indication). This allows a shared load
balancer or proxy to route the TLS handshake to the right backend. `StackExchange.Redis`
resolves the SNI hostname for a connection in this order:

1. An explicitly configured `ConfigurationOptions.SslHost` always wins.
2. Otherwise, a `DnsEndPoint` uses its own host.
3. Otherwise, the client falls back to the default SNI provider.
4. If none of these is available, the client uses the endpoint address.

Because of this order, `ConfigurationOptions.SslHost` only reports a value if you set one
explicitly; it doesn't report a host that the client inferred for you.

## Connect using Smart client handoffs (SCH)

*Smart client handoffs (SCH)* is a feature of Redis Cloud and
Redis Software servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.
See [Smart client handoffs](/content/develop/clients/sch.md)
for more information about SCH.

> [!NOTE]
> SCH support in `StackExchange.Redis` requires v3.3.0 or later. The feature
> is functional and tested against real Redis Enterprise deployments, but
> because it is a large, new API, the types and members involved are
> marked with the `[Experimental]` attribute. This is so the developers can reserve
> the right to adjust the API without the usual backwards-compatibility
> guarantees. As a result, the compiler reports the `SER010` diagnostic when
> you use them. You can suppress this diagnostic by adding the following to
> your `.csproj` file:
>
> ```xml
> <NoWarn>$(NoWarn);SER010</NoWarn>
> ```
>
> Alternatively, you can suppress it locally in your source file:
>
> ```csharp
> #pragma warning disable SER010
> ```

SCH is disabled by default. Enable it with the `MaintenanceNotifications`
configuration option, either in code or using the `maintNotifications` key
in a configuration string:

```csharp
var options = ConfigurationOptions.Parse("host:6379,maintNotifications=Auto,maintRelaxedTimeout=15");

// or, in code:
var options = new ConfigurationOptions {
    EndPoints = { "host:6379" },
    MaintenanceNotifications = MaintenanceNotificationMode.Auto,
    MaintenanceRelaxedTimeout = TimeSpan.FromSeconds(15),
};

var muxer = await ConnectionMultiplexer.ConnectAsync(options);
```

> [!NOTE]
> `ConfigurationOptions` also has a `Defaults` property that accepts named
> provider profiles (`amr`, `rediscloud`, `enterprise`) using the `defaults`
> configuration key. As of v3.3.0, none of these profiles override
> `MaintenanceNotifications`, so it stays `Disabled` under every profile.
> Set `maintNotifications` explicitly, regardless of which server product
> you connect to.

The `ConfigurationOptions` object accepts the following SCH-related parameters:

| Name | Description |
| :-- | :-- |
| `MaintenanceNotifications` | Whether to request SCH. The options are `Disabled` (the default), `Enabled` (require SCH and reject the connection, including a fallback to RESP2, if the server can't deliver it), and `Auto` (request SCH and tolerate a server that doesn't support it). |
| `MaintenanceMovingEndpointType` | The endpoint type to request for a replacement node during a handoff. The options are `ServerDefault` (no preference), `Auto` (the default; derived from the connection's scheme and encryption), `InternalIp`, `InternalFqdn`, `ExternalIp`, `ExternalFqdn`, and `None`. |
| `MaintenanceRelaxedTimeout` | The timeout to use for commands and connections while the server has announced maintenance. The default is 10 seconds. |
| `MaintenanceRelaxedWindowMax` | The maximum time to keep using the relaxed timeout if no notification arrives to close the window. The default is three times `MaintenanceRelaxedTimeout`. |
| `MaintenancePostEventRelaxedDuration` | How long to keep using the relaxed timeout after a closing notification, to cover trailing effects of the maintenance. |

Subscribe to the `ConnectionMultiplexer.ServerMaintenanceEvent` event to
observe SCH notifications. This is the same event that some servers (such as
Azure Cache for Redis) already use for their own maintenance notifications
(see [Production usage](/content/develop/clients/dotnet/produsage.md#server-notification-events)),
so check the runtime type of the event arguments to tell the two apart:

```csharp
muxer.ServerMaintenanceEvent += (object sender, ServerMaintenanceEvent e) => {
    if (e is PushMaintenanceEvent pme) {
        // A server-native SCH notification.
        Console.WriteLine($"SCH notification: {pme.NotificationType} at {pme.EndPoint}");
    } else {
        // An older, provider-specific notification (for example, from Azure Cache for Redis).
        Console.WriteLine($"Maintenance event: {e.RawMessage}");
    }
};
```

`RedisConnectionException` and `RedisTimeoutException` both expose a
`MaintenanceType` property, so you can tell whether a failure happened
because of ongoing maintenance.

## Connect using client-side caching

Client-side caching is a technique to reduce network traffic between
the client and server, resulting in better performance. See
[Client-side caching introduction](/content/develop/clients/client-side-caching.md)
for more information about how client-side caching works and how to use it effectively.

<!-- TODO: replace the alpha version with the first 4.x release when the PR is unparked. -->
> [!NOTE]
> Client-side caching requires StackExchange.Redis v4.0, which is currently
> available as the `4.0.127-alpha` pre-release, so its API may change before
> the final release.
> To maximize compatibility with all Redis products, client-side caching
> is supported by Redis v7.4 or later.
>
> Client-side caching requires version 3 of the
> [Redis serialization protocol (RESP3)](/content/develop/reference/protocol-spec.md#resp-versions)
> and a server that allows the [`CLIENT TRACKING`](/content/commands/client-tracking.md)
> command. If either is missing, the connection fails with an error rather
> than running without cache invalidation.

Client-side caching is disabled by default. To enable it, set `Protocol` to
`RedisProtocol.Resp3` and pass a `CacheOptions` object in the `ClientCache`
property of `ConfigurationOptions`. You can only configure the cache in code,
not with a configuration string. The cache works below the API, so it applies
to all of the `IDatabase` methods, both synchronous and asynchronous:

```csharp
using StackExchange.Redis;
using StackExchange.Redis.Caching;

var options = ConfigurationOptions.Parse("localhost:6379");
options.Protocol = RedisProtocol.Resp3; // RESP3 required for client-side caching
options.ClientCache = new CacheOptions {
    Prefixes = ["city:"],
    MaxBytes = 64 * 1024 * 1024,
};

ConnectionMultiplexer muxer = ConnectionMultiplexer.Connect(options);
IDatabase db = muxer.GetDatabase();

db.StringSet("city:1", "New York");
db.StringGet("city:1"); // Retrieved from the server
db.StringGet("city:1"); // Retrieved from the server and cached
db.StringGet("city:1"); // Retrieved from the cache
```

By default, StackExchange.Redis caches a reply the second time you read it,
not the first, so values you read only once never take up space in the cache.
You can see this if you connect to the same Redis database
with [`redis-cli`](/content/develop/tools/cli.md) and run the
[`MONITOR`](/content/commands/monitor.md) command. With caching enabled,
the server sees the first two `StringGet("city:1")` calls but not the third,
which the client satisfies from the cache. Set `Admission` to
`CacheAdmission.OnFirstMiss` to cache every reply the first time you read it.

There is one cache for each `ConnectionMultiplexer`, shared by all of
its databases.

### Tracking modes

The `TrackingMode` option sets how the server decides which changes to announce:

-   `CacheTrackingMode.Broadcast` (the default): the server announces every
    change to keys that match the `Prefixes` you set, and doesn't record which
    keys you read. This is cheap for the server, but the client receives
    invalidations for keys it never cached. Without `Prefixes`, the client
    receives an invalidation for every write to every key, which is a lot of
    traffic on a busy server. Keys outside the prefixes are not cached.
    Prefixes must not overlap (for example, `"app:"` and `"app:user:"` together
    are rejected), and they are compared with the key as it is sent, so include
    any key prefix that you add with `WithKeyPrefix()`.
-   `CacheTrackingMode.PerKey`: the server records which keys this client read
    and announces changes only to those keys. This is more precise, but uses
    server memory for each client. You can't use `Prefixes` in this mode.

### Configuration options

The `CacheOptions` object accepts the following options:

| Name | Description |
| :-- | :-- |
| `Enabled` | Whether the cache is enabled. The default is `true`. Use this to keep your options in place but switch the cache off. |
| `TrackingMode` | The tracking mode (see [Tracking modes](#tracking-modes)). The default is `CacheTrackingMode.Default`, which is currently `Broadcast`. |
| `Prefixes` | The key prefixes to track and cache in `Broadcast` mode. By default, all keys are tracked. |
| `MaxBytes` | A memory limit for cached replies. When the cache exceeds it, the client evicts the oldest entries. By default, there is no limit. |
| `MaxEntries` | The maximum number of entries the cache can hold. By default, there is no limit. Use this with `MaxBytes` when your replies are small and numerous. |
| `MaxPayloadBytes` | The largest single reply that can be cached. The default is 1 MiB. |
| `EvictionSampleSize` | The number of entries that eviction considers each time it chooses one to remove. The default is 8. Larger values make better choices but cost more. |
| `SweepInterval` | How often the client reclaims memory held by invalidated or expired entries. The default is 10 seconds. |
| `DefaultPolicy` | A `CachePolicy` object that sets how entries behave as they age (see the next table). The default is `CachePolicy.Default`. |
| `Admission` | When a reply is added to the cache. The default is `CacheAdmission.Default`, which is currently `OnRepeatedMiss` (cache a reply the second time it's read). Use `OnFirstMiss` to cache every reply the first time it's read. |

The `CachePolicy` object accepts the following options:

| Name | Description |
| :-- | :-- |
| `TimeToLive` | The longest time the client serves an entry, whether or not it was invalidated. The default is 1 minute. |
| `RefreshAfter` | The age at which the client starts refreshing an entry in the background, while it continues to serve the cached value. Off by default. |
| `InvalidationGracePeriod` | How long the client continues to serve an entry after another client's change invalidates it, while a background refresh runs. This deliberately serves values that are out of date, so keep it short. It never applies to your own writes. Off by default. |

`RefreshAfter` and `InvalidationGracePeriod` stop every reader of a frequently
read key from going to the server at the same moment when its entry expires
or is invalidated. The example below sets both:

```csharp
options.ClientCache = new CacheOptions {
    Prefixes = ["catalog:"],
    DefaultPolicy = new CachePolicy {
        TimeToLive = TimeSpan.FromMinutes(1),
        RefreshAfter = TimeSpan.FromSeconds(45),
        InvalidationGracePeriod = TimeSpan.FromMilliseconds(250),
    },
};
```

### Bypassing the cache

Pass `CommandFlags.NoClientCache` to stop a single command from reading from
or writing to the cache:

```csharp
RedisValue exact = db.StringGet("city:1", CommandFlags.NoClientCache);
```

You can also create a *context* that limits how the cache is used for all the
commands you send through it. Contexts are part of the command group API that
StackExchange.Redis v4.0 introduces, so the examples below use the command
group methods rather than the `IDatabase` methods:

```csharp
// Accept cached replies only if they are less than one second old.
var fresh = db.Context.WithMaxCacheAge(TimeSpan.FromSeconds(1));
RedisValue recent = await fresh.Strings.GetAsync("city:1");

// Bypass the cache completely.
var uncached = db.Context.WithoutCache();
RedisValue latest = await uncached.Strings.GetAsync("city:1");
```

### Which commands use the cache

StackExchange.Redis caches the replies from read commands on keys, including
`HSCAN`, `SSCAN`, and `ZSCAN` pages, nil replies for missing keys, and the
read-only script commands
([`EVAL_RO`](/content/commands/eval_ro.md) and [`EVALSHA_RO`](/content/commands/evalsha_ro.md)).
It never caches the following:

-   Write commands.
-   Commands that don't name a key, such as [`SCAN`](/content/commands/scan.md)
    and [`INFO`](/content/commands/info.md).
-   Random reads, such as [`SRANDMEMBER`](/content/commands/srandmember.md) and
    [`HRANDFIELD`](/content/commands/hrandfield.md).
-   Commands that report time or access, such as [`TTL`](/content/commands/ttl.md)
    and [`OBJECT FREQ`](/content/commands/object-freq.md).
-   Reads inside a transaction, and commands sent with `CommandFlags.FireAndForget`.
-   Error replies and replies larger than `MaxPayloadBytes`.

A read-only script is invalidated only when a key in its `KEYS` array changes.
If a script reads a key that it doesn't declare, its cached result can be out
of date until `TimeToLive` expires, so declare every key or use
`CommandFlags.NoClientCache` for that script.

### Consistency

StackExchange.Redis guarantees the following:

-   You always read your own writes. A write through the multiplexer
    invalidates the keys it names before it is sent to the server.
-   You see writes from other clients shortly after they happen, when the
    server's invalidation message arrives.
-   If a connection fails, the client empties the whole cache. The
    [`FLUSHDB`](/content/commands/flushdb.md) and
    [`FLUSHALL`](/content/commands/flushall.md) commands also empty it.

The server doesn't send an invalidation message when a key expires, so a
cached value can outlive its key until `TimeToLive` expires. If your app relies
on keys disappearing on time, use a short `TimeToLive` or use
`CommandFlags.NoClientCache` for those reads.

### Monitoring the cache

StackExchange.Redis doesn't provide statistics for the cache. Instead, check
the server:

-   Run [`CLIENT TRACKINGINFO`](/content/commands/client-trackinginfo.md) to
    confirm that tracking is enabled.
-   Compare the `total_commands_processed` field from
    [`INFO stats`](/content/commands/info.md) before and after a workload. The
    server never sees commands that the cache satisfies.
-   Use `INFO commandstats` to see the same count for each command.

## Multiplexing

Although example code typically works with a single connection,
real-world code often uses multiple connections at the same time.
Opening and closing connections repeatedly is inefficient, so it is best
to manage open connections carefully to avoid this.

Several other
Redis client libraries use *connection pools* to reuse a set of open
connections efficiently. StackExchange.Redis uses a different approach called
*multiplexing*, which sends all client commands and responses over a
single connection. StackExchange.Redis manages multiplexing for you automatically.
This gives high performance without requiring any extra coding.
See
[Connection pools and multiplexing](/content/develop/clients/pools-and-muxing.md)
for more information.
