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

## Connect using Seamless client experience (SCE)

*Seamless client experience (SCE)* is a feature of Redis Cloud and
Redis Enterprise servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.
See [Seamless client experience]({{< relref "/develop/clients/sce" >}})
for more information about SCE.

To enable SCE on the client, add the `HitlessUpgrades` option during the
connection, as shown in the following example:

```go
rdb := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    Protocol: 3, // RESP3 required
    HitlessUpgrades: &hitless.Config{
        Mode:               hitless.MaintNotificationsEnabled,
        RelaxedTimeout:     10 * time.Second,
    },
})
```

{{< note >}}SCE requires the [RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol, so you must set `Protocol:3` explicitly when you connect.
{{< /note >}}

The `hitless.Config` object accepts the following parameters:

| Name | Description |
|------ |------------- |
| `Mode` | Whether or not to enable SCE. The options are `hitless.MaintNotificationsDisabled`, `hitless.MaintNotificationsEnabled` (require SCE and abort the connection if not supported), and `hitless.MaintNotificationsAuto` (require SCE and fall back to a non-SCE connection if not supported). The default is `hitless.MaintNotificationsAuto`.   |
| `RelaxedTimeout` | The timeout to use for commands and connections while the server is performing maintenance. The default is 10 seconds. |
| `HandoffTimeout` | The timeout to connect to the replacement node. The default is 15 seconds. |
| `MaxHandoffRetries` | The maximum number of times to retry connecting to the replacement node. The default is 3. |
