---
aliases: /develop/connect/clients/go
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
linkTitle: go-redis (Go)
title: go-redis guide (Go)
weight: 7
---

[`go-redis`](https://github.com/redis/go-redis) is the [Go](https://go.dev/) client for Redis.
The sections below explain how to install `go-redis` and connect your application to a Redis database.

`go-redis` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

## Install

`go-redis` supports the last two Go versions. You can only use it from within
a Go module, so you must initialize a Go module before you start, or add your code to
an existing module:

```
go mod init github.com/my/repo
```

Use the `go get` command to install `go-redis/v9`:

```
go get github.com/redis/go-redis/v9
```

## Connect

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

You can also easily store and retrieve a [hash]({{< relref "/develop/data-types/hashes" >}}):

```go
hashFields := []string{
    "model", "Deimos",
    "brand", "Ergonom",
    "type", "Enduro bikes",
    "price", "4972",
}

res1, err := client.HSet(ctx, "bike:1", hashFields).Result()

if err != nil {
    panic(err)
}

fmt.Println(res1) // >>> 4

res2, err := client.HGet(ctx, "bike:1", "model").Result()

if err != nil {
    panic(err)
}

fmt.Println(res2) // >>> Deimos

res3, err := client.HGet(ctx, "bike:1", "price").Result()

if err != nil {
    panic(err)
}

fmt.Println(res3) // >>> 4972

res4, err := client.HGetAll(ctx, "bike:1").Result()

if err != nil {
    panic(err)
}

fmt.Println(res4)
// >>> map[brand:Ergonom model:Deimos price:4972 type:Enduro bikes]
 ```

 Use
 [struct tags](https://stackoverflow.com/questions/10858787/what-are-the-uses-for-struct-tags-in-go)
 of the form `redis:"<field-name>"` with the `Scan()` method to parse fields from
 a hash directly into corresponding struct fields:

 ```go
type BikeInfo struct {
    Model string `redis:"model"`
    Brand string `redis:"brand"`
    Type  string `redis:"type"`
    Price int    `redis:"price"`
}

var res4a BikeInfo
err = client.HGetAll(ctx, "bike:1").Scan(&res4a)

if err != nil {
    panic(err)
}

fmt.Printf("Model: %v, Brand: %v, Type: %v, Price: $%v\n",
    res4a.Model, res4a.Brand, res4a.Type, res4a.Price)
// >>> Model: Deimos, Brand: Ergonom, Type: Enduro bikes, Price: $4972
 ```

## Observability

`go-redis` supports [OpenTelemetry](https://opentelemetry.io/) instrumentation.
to monitor performance and trace the execution of Redis commands.
For example, the following code instruments Redis commands to collect traces, logs, and metrics:

```go
import (
    "github.com/redis/go-redis/v9"
    "github.com/redis/go-redis/extra/redisotel/v9"
)

client := redis.NewClient(&redis.Options{...})

// Enable tracing instrumentation.
if err := redisotel.InstrumentTracing(client); err != nil {
	panic(err)
}

// Enable metrics instrumentation.
if err := redisotel.InstrumentMetrics(client); err != nil {
	panic(err)
}
```

See the `go-redis` [GitHub repo](https://github.com/redis/go-redis/blob/master/example/otel/README.md).
for more OpenTelemetry examples.

## More information

See the other pages in this section for more information and examples.
Further examples are available at the [`go-redis`](https://redis.uptrace.dev/guide/) website
and the [GitHub repository](https://github.com/redis/go-redis).
