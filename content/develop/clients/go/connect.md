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
description: Connect your Go application to a Redis database
linkTitle: Connect
title: Connect to the server
weight: 10
---

## Basic connection

The following example shows the simplest way to connect to a Redis server:

```go
import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
)

func main() {    
    client := redis.NewClient(&redis.Options{
        Addr:	  "localhost:6379",
        Password: "", // No password set
        DB:		  0,  // Use default DB
        Protocol: 2,  // Connection protocol
    })
}
```

You can also connect using a connection string:

```go
opt, err := redis.ParseURL("redis://<user>:<pass>@localhost:6379/<db>")
if err != nil {
	panic(err)
}

client := redis.NewClient(opt)
```

After connecting, you can test the connection by  storing and retrieving
a simple [string]({{< relref "/develop/data-types/strings" >}}):

```go
ctx := context.Background()

err := client.Set(ctx, "foo", "bar", 0).Err()
if err != nil {
    panic(err)
}

val, err := client.Get(ctx, "foo").Result()
if err != nil {
    panic(err)
}
fmt.Println("foo", val)
```

## Connect to a Redis cluster

To connect to a Redis cluster, use `NewClusterClient()`. You can specify
one or more cluster endpoints with the `Addrs` option:

```go
client := redis.NewClusterClient(&redis.ClusterOptions{
    Addrs: []string{":16379", ":16380", ":16381", ":16382", ":16383", ":16384"},

    // To route commands by latency or randomly, enable one of the following.
    //RouteByLatency: true,
    //RouteRandomly: true,
})
```

## Connect to your production Redis with TLS

When you deploy your application, use TLS and follow the
[Redis security]({{< relref "/operate/oss_and_stack/management/security/" >}}) guidelines.

Establish a secure connection with your Redis database:

```go
// Load client cert
cert, err := tls.LoadX509KeyPair("redis_user.crt", "redis_user_private.key")
if err != nil {
    log.Fatal(err)
}

// Load CA cert
caCert, err := os.ReadFile("redis_ca.pem")
if err != nil {
    log.Fatal(err)
}
caCertPool := x509.NewCertPool()
caCertPool.AppendCertsFromPEM(caCert)

client := redis.NewClient(&redis.Options{
    Addr:     "my-redis.cloud.redislabs.com:6379",
    Username: "default", // use your Redis user. More info https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/
    Password: "secret", // use your Redis password
    TLSConfig: &tls.Config{
        MinVersion:   tls.VersionTLS12,
        Certificates: []tls.Certificate{cert},
        RootCAs:      caCertPool,
    },
})

//send SET command
err = client.Set(ctx, "foo", "bar", 0).Err()
if err != nil {
    panic(err)
}

//send GET command and print the value
val, err := client.Get(ctx, "foo").Result()
if err != nil {
    panic(err)
}
fmt.Println("foo", val)
```

## Connect using Smart client handoffs (SCH)

*Smart client handoffs (SCH)* is a feature of Redis Cloud and
Redis Software servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.
See [Smart client handoffs]({{< relref "/develop/clients/sch" >}})
for more information about SCH.

{{< note >}}Using SCH with go-redis requires v9.16.0 or later for
basic connections, and v9.18.0 or later for
[OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}) connections.
{{< /note >}}

By default, `go-redis` always attempts to connect via SCH but falls back to
a non-SCH connection if the server doesn't support it. However, you can configure SCH
explicitly by passing a `MaintNotificationsConfig` object during the connection,
as shown in the following example:

```go
rdb := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    Protocol: 3, // RESP3 required
    MaintNotificationsConfig: &maintnotifications.Config{
            Mode:                       maintnotifications.ModeEnabled,
            EndpointType:               maintnotifications.EndpointTypeExternalIP,
            HandoffTimeout:             10 * time.Second,
            RelaxedTimeout:             10 * time.Second,
            PostHandoffRelaxedDuration: 10 * time.Second,
            MaxHandoffRetries:          5,
    },
})
```

{{< note >}}SCH requires the [RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol, so you must set `Protocol:3` explicitly when you connect.
{{< /note >}}

The `maintnotifications.Config` object accepts the following parameters:

| Name | Description |
|------ |------------- |
| `Mode` | Whether or not to enable SCH. The options are `ModeDisabled`, `ModeEnabled` (require SCH and abort the connection if not supported), and `ModeAuto` (require SCH and fall back to a non-SCH connection if not supported). The default is `ModeAuto`.   |
| `EndpointType` | The type of endpoint to use for the connection. The options are `EndpointTypeExternalIP`, `EndpointTypeInternalIP`, `EndpointTypeExternalFQDN`, `EndpointTypeInternalFQDN`, `EndpointTypeAuto` (auto-detect based on connection), and `EndpointTypeNone` (reconnect with current config). The default is `EndpointTypeAuto`. |
| `HandoffTimeout` | The timeout to connect to the replacement node. The default is 15 seconds. |
| `RelaxedTimeout` | The timeout to use for commands and connections while the server is performing maintenance. The default is 10 seconds. |
| `PostHandoffRelaxedDuration` | The duration to continue using relaxed timeouts after a successful handoff (this provides extra resilience during cluster transitions). The default is 20 seconds. |
| `MaxHandoffRetries` | The maximum number of times to retry connecting to the replacement node. The default is 3. |

{{< note >}} Redis Cloud supports relaxed timeouts *only* (and not pre-handoffs) for SCH if you are using
either [AWS PrivateLink]({{< relref "/operate/rc/security/aws-privatelink" >}}) or
[Google Cloud Private Service Connect]({{< relref "/operate/rc/security/private-service-connect" >}})
(see [Smart client handoffs]({{< relref "/develop/clients/sch#redis-cloud" >}}) for more information).
To use relaxed timeouts with these services, you should set `EndpointType: maintnotifications.EndpointTypeNone`
when you connect. All other configurations have full support for both relaxed timeouts and pre-handoffs.
{{< /note >}}

## Connect using client-side caching

Client-side caching is a technique to reduce network traffic between
the client and server, resulting in better performance. See
[Client-side caching introduction]({{< relref "/develop/clients/client-side-caching" >}})
for more information about how client-side caching works and how to use it effectively.

{{< note >}}This feature is not yet released and its API is subject to change.
It is being added in [go-redis PR #3851](https://github.com/redis/go-redis/pull/3851).

Client-side caching requires go-redis v9.<!-- DOC-6831: set on merge -->TBD or later.
To maximize compatibility with all Redis products, client-side caching
is supported by Redis v7.4 or later.

Client-side caching requires the [RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol, so you must set `Protocol: 3` explicitly when you connect. On a RESP2
connection, client-side caching silently does nothing. It also works on logical
database 0 only; on any other database it is disabled with a log warning.
{{< /note >}}

To enable client-side caching, pass a `ClientSideCacheConfig` object when you
connect on a `Protocol: 3` client. Passing an empty `ClientSideCacheConfig{}`
enables caching with the default settings:

```go
import (
    "context"
    "fmt"
    "github.com/redis/go-redis/v9"
)

func main() {
    ctx := context.Background()

    client := redis.NewClient(&redis.Options{
        Addr:                  "localhost:6379",
        Protocol:              3, // RESP3 required for client-side caching
        ClientSideCacheConfig: &redis.ClientSideCacheConfig{},
    })

    client.Set(ctx, "city", "New York", 0)
    client.Get(ctx, "city") // Retrieved from the server and cached
    client.Get(ctx, "city") // Retrieved from the cache
}
```

You can see the cache working if you connect to the same Redis database
with [`redis-cli`]({{< relref "/develop/tools/cli" >}}) and run the
[`MONITOR`]({{< relref "/commands/monitor" >}}) command. With caching enabled,
the server sees the first `Get("city")` call but not the second, which the
client satisfies from the cache.

### Caching strategies

go-redis supports three client-side caching strategies, selected with the
`ClientSideCacheStrategy` option. All three share the same cache interface,
the same cacheable-command allow-list, and the same RESP3 and database-0
requirements; they differ in how invalidation messages reach the cache.

| Strategy | Cache | Tracking | Best for |
| :-- | :-- | :-- | :-- |
| `CSCStrategySharedTracking` (default) | One shared, sharded cache | Every pool connection issues `CLIENT TRACKING ON`; a background drainer applies invalidations | General use. Works wherever RESP3 does (including managed or proxied environments) and needs no extra connection. |
| `CSCStrategyBroadcast` | One shared, sharded cache | A dedicated out-of-pool "sidecar" connection issues `CLIENT TRACKING ON BCAST` and owns all invalidation traffic | Highest throughput and lowest tail latency, where broadcasting mode is available. Uses one extra connection and receives invalidations for every write in the database. |
| `CSCStrategyPerConnection` | One private cache per pool connection | Every pool connection issues `CLIENT TRACKING ON` and owns its own cache | Small, long-lived pools (≲10 connections) that want hard isolation between connections. Cache memory multiplies by pool size, so avoid it at high concurrency. |

If you don't set `ClientSideCacheStrategy`, the zero value
`CSCStrategySharedTracking` is used. The example below opts into broadcasting
mode instead:

```go
client := redis.NewClient(&redis.Options{
    Addr:                    "localhost:6379",
    Protocol:                3,
    ClientSideCacheConfig:   &redis.ClientSideCacheConfig{},
    ClientSideCacheStrategy: redis.CSCStrategyBroadcast,
})
```

### Configuration options

The `ClientSideCacheConfig` object accepts the following options to tune the
cache:

| Name | Description |
| :-- | :-- |
| `MaxEntries` | The maximum number of entries the cache can hold. Zero or negative means unlimited. If both `MaxEntries` and `MaxMemoryBytes` are unlimited, `MaxEntries` defaults to 10,000 so the cache cannot grow without bound. |
| `MaxMemoryBytes` | An approximate memory limit for the cache. Zero means unlimited. |
| `DrainInterval` | (`CSCStrategySharedTracking` only) How often the background drainer scans idle connections and applies buffered invalidations to the shared cache. The default is 5ms and the minimum is 1ms. |
| `MaxStaleness` | The hard upper bound on how long a cached entry can be served after the underlying data has changed. Zero means no explicit bound (the drain interval still applies). |

### Monitoring the cache

Use the `CSCStats()` method to read the cumulative cache hit and miss counts
for a client:

```go
hits, misses := client.CSCStats()
fmt.Printf("Cache hits: %d, misses: %d\n", hits, misses)
```

Process-wide totals are also available via the package-level functions
`redis.CommandStats()` (served-command hits and misses),
`redis.CacheAdmissionRejects()` (entries rejected on admission), and
`redis.RESPInvalidationBytesRead()` (bytes of invalidation key names read).

{{< note >}}To supply your own cache implementation, set the `ClientSideCache`
option instead of `ClientSideCacheConfig`. An explicit `ClientSideCache` is
honoured by the `CSCStrategySharedTracking` and `CSCStrategyBroadcast`
strategies. `CSCStrategyPerConnection` always builds a private cache per
connection from `ClientSideCacheConfig` and ignores an explicit
`ClientSideCache` (with a log warning).
{{< /note >}}
