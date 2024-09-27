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
linkTitle: Go
title: Go guide
weight: 5
---

[`go-redis`](https://github.com/redis/go-redis) is the [Go](https://go.dev/) client for Redis.
The sections below explain how to install `go-redis` and connect your application to a Redis database.

`go-redis` requires a running Redis or
[Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) server.
See [Getting started]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis installation
instructions.

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

res1, err := rdb.HSet(ctx, "bike:1", hashFields).Result()

if err != nil {
    panic(err)
}

fmt.Println(res1) // >>> 4

res2, err := rdb.HGet(ctx, "bike:1", "model").Result()

if err != nil {
    panic(err)
}

fmt.Println(res2) // >>> Deimos

res3, err := rdb.HGet(ctx, "bike:1", "price").Result()

if err != nil {
    panic(err)
}

fmt.Println(res3) // >>> 4972

res4, err := rdb.HGetAll(ctx, "bike:1").Result()

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
err = rdb.HGetAll(ctx, "bike:1").Scan(&res4a)

if err != nil {
    panic(err)
}

fmt.Printf("Model: %v, Brand: %v, Type: %v, Price: $%v\n",
    res4a.Model, res4a.Brand, res4a.Type, res4a.Price)
// >>> Model: Deimos, Brand: Ergonom, Type: Enduro bikes, Price: $4972
 ```

### Connect to a Redis cluster

To connect to a Redis cluster, use `NewClusterClient()`. 

```go
client := redis.NewClusterClient(&redis.ClusterOptions{
    Addrs: []string{":16379", ":16380", ":16381", ":16382", ":16383", ":16384"},

    // To route commands by latency or randomly, enable one of the following.
    //RouteByLatency: true,
    //RouteRandomly: true,
})
```

### Connect to your production Redis with TLS

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

## Example: Index and search JSON documents

Start by connecting to the Redis server:

```go
import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
		Protocol: 2,
	})

    // ...
}
```

Add some `map` objects to store in JSON format in the database:

```go
user1 := map[string]interface{}{
    "name":  "Paul John",
    "email": "paul.john@example.com",
    "age":   42,
    "city":  "London",
}

user2 := map[string]interface{}{
    "name":  "Eden Zamir",
    "email": "eden.zamir@example.com",
    "age":   29,
    "city":  "Tel Aviv",
}

user3 := map[string]interface{}{
    "name":  "Paul Zamir",
    "email": "paul.zamir@example.com",
    "age":   35,
    "city":  "Tel Aviv",
}
```

Use the code below to create a search index. The `FTCreateOptions` parameter enables
indexing only for JSON objects where the key has a `user:` prefix.
The
[schema]({{< relref "/develop/interact/search-and-query/indexing" >}})
for the index has three fields for the user's name, age, and city.
The `FieldName` field of the `FieldSchema` struct specifies a
[JSON path]({{< relref "/develop/data-types/json/path" >}})
that identifies which data field to index. Use the `As` struct field
to provide an alias for the JSON path expression. You can use
the alias in queries as a short and intuitive way to refer to the
expression, instead of typing it in full:

```go
_, err := rdb.FTCreate(
    ctx,
    "idx:users",
    // Options:
    &redis.FTCreateOptions{
        OnJSON: true,
        Prefix: []interface{}{"user:"},
    },
    // Index schema fields:
    &redis.FieldSchema{
        FieldName: "$.name",
        As:        "name",
        FieldType: redis.SearchFieldTypeText,
    },
    &redis.FieldSchema{
        FieldName: "$.city",
        As:        "city",
        FieldType: redis.SearchFieldTypeTag,
    },
    &redis.FieldSchema{
        FieldName: "$.age",
        As:        "age",
        FieldType: redis.SearchFieldTypeNumeric,
    },
).Result()

if err != nil {
    panic(err)
}
```

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

```go
_, err = rdb.JSONSet(ctx, "user:1", "$", user1).Result()

if err != nil {
    panic(err)
}

_, err = rdb.JSONSet(ctx, "user:2", "$", user2).Result()

if err != nil {
    panic(err)
}

_, err = rdb.JSONSet(ctx, "user:3", "$", user3).Result()

if err != nil {
    panic(err)
}
```

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/interact/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

```go
searchResult, err := rdb.FTSearch(
    ctx,
    "idx:users",
    "Paul @age:[30 40]",
).Result()

if err != nil {
    panic(err)
}

fmt.Println(searchResult)
// >>> {1 [{user:3 <nil> <nil> <nil> map[$:{"age":35,"city":"Tel Aviv"...
```

## Example: Index and search hash documents

Start by connecting to the Redis server as before:

```go
import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
		Protocol: 2,
	})

    // ...
}
```

In this example, the user objects will be stored as hashes in the database. Use a `string`
array in the form of name->value pairs to supply the data for the
hash fields:

```go
user1 := []string{
    "name", "Paul John",
    "email", "paul.john@example.com",
    "age", "42",
    "city", "London",
}

user2 := []string{
    "name", "Eden Zamir",
    "email", "eden.zamir@example.com",
    "age", "29",
    "city", "Tel Aviv",
}

user3 := []string{
    "name", "Paul Zamir",
    "email", "paul.zamir@example.com",
    "age", "35",
    "city", "Tel Aviv",
}
```

It is slightly simpler to create the index for hash objects than
for JSON objects. Use the `FTCreateOptions` parameter to enable
indexing only for hash objects, but specify the same `user:` prefix
as before. You don't need the `As:` field in the schema parameters
here because hash fields have simple identifiers. They have no
JSON path expression and don't require an alias:

```go
_, err := rdb.FTCreate(
    ctx,
    "idx:users",
    // Options:
    &redis.FTCreateOptions{
        OnHash: true,
        Prefix: []interface{}{"user:"},
    },
    // Index schema fields:
    &redis.FieldSchema{
        FieldName: "name",
        FieldType: redis.SearchFieldTypeText,
    },
    &redis.FieldSchema{
        FieldName: "city",
        FieldType: redis.SearchFieldTypeTag,
    },
    &redis.FieldSchema{
        FieldName: "age",
        FieldType: redis.SearchFieldTypeNumeric,
    },
).Result()

if err != nil {
    panic(err)
}
```

Add the user data arrays to the database as hash objects. Redis will
index the hashes automatically because their keys have the
`user:` prefix:

```go
_, err = rdb.HSet(ctx, "user:1", user1).Result()

if err != nil {
    panic(err)
}

_, err = rdb.HSet(ctx, "user:2", user2).Result()

if err != nil {
    panic(err)
}

_, err = rdb.HSet(ctx, "user:2", user3).Result()

if err != nil {
    panic(err)
}
```

The hashes have a structure very much like the JSON objects
from the previous example, so you can search the database with the
same query as before:

```go
searchResult, err := rdb.FTSearch(
    ctx,
    "idx:users",
    "Paul @age:[30 40]",
).Result()

if err != nil {
    panic(err)
}

fmt.Println(searchResult)
// >>> {1 [{user:2 <nil> <nil> <nil> map[age:35 city:Tel Aviv...
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

rdb := redis.NewClient(&redis.Options{...})

// Enable tracing instrumentation.
if err := redisotel.InstrumentTracing(rdb); err != nil {
	panic(err)
}

// Enable metrics instrumentation.
if err := redisotel.InstrumentMetrics(rdb); err != nil {
	panic(err)
}
```

See the `go-redis` [GitHub repo](https://github.com/redis/go-redis/blob/master/example/otel/README.md).
for more OpenTelemetry examples.

### Learn more

* [Documentation](https://redis.uptrace.dev/guide/)
* [GitHub](https://github.com/redis/go-redis)
 
