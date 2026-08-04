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

{{< note >}}Client-side caching is an experimental feature of go-redis and its
API may change in a minor release.

Client-side caching requires go-redis v9.22.0 or later.
To maximize compatibility with all Redis products, client-side caching
is supported by Redis v7.4 or later.

Client-side caching requires the [RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol, so you must set `Protocol: 3` explicitly when you connect. On a RESP2
connection, client-side caching silently does nothing. It is also limited to
standalone clients and to logical database 0; on any other database it is
disabled with a log warning.
{{< /note >}}

To enable client-side caching, pass a `ClientSideCacheConfig` object when you
connect on a `Protocol: 3` client. Passing an empty `ClientSideCacheConfig{}`
enables caching with the default settings:

```go
import (
    "context"
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

### How invalidation works

Redis tracks the keys each connection reads and sends an invalidation message
when one of them changes. go-redis keeps a single cache shared by every
connection in the client's pool: each connection enables tracking on the
server, and go-redis applies the invalidation messages in the background.

Because invalidation is asynchronous, an entry is evicted shortly after the
data changes rather than at the instant of the write. Use `DrainInterval` to
control how often invalidations are applied, and `MaxStaleness` to put a hard
time limit on how long any entry can be served (see
[Configuration options](#configuration-options) for more information).

### Configuration options

The `ClientSideCacheConfig` object accepts the following options to tune the
cache:

| Name | Description |
| :-- | :-- |
| `MaxEntries` | The maximum number of entries the cache can hold. Zero or negative means unlimited. If both `MaxEntries` and `MaxMemoryBytes` are unlimited, `MaxEntries` defaults to 10,000 so the cache cannot grow without bound. |
| `MaxMemoryBytes` | An approximate memory limit for the cache. Zero or negative means unlimited. The cache is divided into 16 shards that each enforce a 16th of this limit, so set it to at least 16 times the size of your largest cached reply. |
| `MaxStaleness` | The longest time an entry can be served after it was cached, regardless of invalidation. This is a safety net for a missed invalidation rather than the main way entries are kept fresh, so set it well above the time an invalidation takes to arrive. Zero, the default, disables it. |
| `DrainInterval` | How often go-redis checks idle connections for invalidation messages and applies them. The default is 5ms and the minimum is 1ms. |

### Monitoring the cache

Use the `CSCStats()` method to read the cache statistics for a client:

```go
stats := client.CSCStats()
fmt.Printf("Cache hits: %d, misses: %d\n", stats.Hits, stats.Misses)
fmt.Printf("Entries: %d, memory: %d bytes\n", stats.Entries, stats.MemoryUsageBytes)
```

### Supplying your own cache

Set the `ClientSideCache` option to use your own cache instead of the built-in
one. It accepts any value that implements the
[`Cache`](https://pkg.go.dev/github.com/redis/go-redis/v9#Cache) interface and
takes precedence over `ClientSideCacheConfig`. You can also use it to share a
single cache between several clients, but only when those clients connect to the
same server and database.

The simplest approach is to wrap the built-in cache, which `NewLocalCache()`
returns, and override only the methods you want to change. The example below
counts lookups and passes everything else through:

```go
type countingCache struct {
    *redis.LocalCache
    lookups atomic.Int64
}

func (c *countingCache) Get(ctx context.Context, cacheKey string) ([]byte, bool) {
    c.lookups.Add(1)
    return c.LocalCache.Get(ctx, cacheKey)
}

cache := &countingCache{
    LocalCache: redis.NewLocalCache(redis.ClientSideCacheConfig{MaxEntries: 1000}),
}

client := redis.NewClient(&redis.Options{
    Addr:            "localhost:6379",
    Protocol:        3,
    ClientSideCache: cache,
})
```

{{< note >}}Embed the concrete `*redis.LocalCache` type, as shown above, rather
than the `Cache` interface. Cache statistics come from an optional `Stats()`
method that the `Cache` interface doesn't declare, so a wrapper that embeds the
interface still compiles but makes `CSCStats()` report zeros.
{{< /note >}}

To write a cache from scratch, you should implement all eight `Cache` methods: `Get()` for
lookups, `Reserve()`, `FulfillOwned()`, and `Cancel()` to ensure that only one
caller fetches a missing key, and `DeleteByRedisKey()`, `DeleteByCacheKey()`,
`EvictByConn()`, and `Flush()` to remove entries when invalidation arrives.
go-redis calls these methods from several goroutines at once, so your
implementation must be thread-safe, and must treat cache keys and Redis keys as
opaque strings and preserve them exactly. It must also stop waiting for an
in-progress reservation when the context is canceled. You should also implement
`Stats() redis.CSCStats` if you want to use the `CSCStats()` function with your cache.

If you only want to change how the cache estimates the memory used by an entry, you
don't need a full cache implementation. Instead, set the `Sizer` field of
`ClientSideCacheConfig` to a function that returns a size in bytes. The
built-in cache will then use it in place of its own approximation.
