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
description: Learn how to use the Redis query engine with JSON
linkTitle: JSON query example
title: Example - Index and query JSON documents
weight: 2
---
This example shows how to create a
[search index]({{< relref "/develop/interact/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) data and
run queries against the index.

Make sure that you have Redis Stack and `NRedisStack` installed. 

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