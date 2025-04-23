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
description: Learn how to use the Redis query engine with JSON and hash documents.
linkTitle: Index and query documents
title: Index and query documents
weight: 2
---

This example shows how to create a
[search index]({{< relref "/develop/interact/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) documents and
run queries against the index. It then goes on to show the slight differences
in the equivalent code for [hash]({{< relref "/develop/data-types/hashes" >}})
documents.

## Initialize

Make sure that you have [Redis Community Edition]({{< relref "/operate/rc" >}})
or another Redis server available. Also install the
[`go-redis`]({{< relref "/develop/clients/go" >}}) client library if you
haven't already done so.

Add the following dependencies:

{{< clients-example go_home_json import >}}
{{< /clients-example >}}

## Create data

Create some test data to add to your database. The example data shown
below is compatible with both JSON and hash objects.

{{< clients-example go_home_json create_data >}}
{{< /clients-example >}}

## Add the index

Connect to your Redis database. The code below shows the most
basic connection but see
[Connect to the server]({{< relref "/develop/clients/go/connect" >}})
to learn more about the available connection options.

{{< clients-example go_home_json connect >}}
{{< /clients-example >}}

{{< note >}}The connection options in the example specify
[RESP2]({{< relref "/develop/reference/protocol-spec" >}}) in the `Protocol`
field. We recommend that you use RESP2 for Redis query engine operations in `go-redis`
because some of the response structures for the default RESP3 are currently
incomplete and so you must handle the "raw" responses in your own code.

If you do want to use RESP3, you should set the `UnstableResp3` option when
you connect:

```go
rdb := redis.NewClient(&redis.Options{
    UnstableResp3: true,
    // Other options...
})
```

You must also access command results using the `RawResult()` and `RawVal()` methods
rather than the usual `Result()` and `Val()`:

```go
res1, err := client.FTSearchWithArgs(
    ctx, "txt", "foo bar", &redis.FTSearchOptions{},
).RawResult()
val1 := client.FTSearchWithArgs(
    ctx, "txt", "foo bar", &redis.FTSearchOptions{},
).RawVal()
```
{{< /note >}}

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

{{< clients-example go_home_json make_index >}}
{{< /clients-example >}}

## Add the data

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

{{< clients-example go_home_json add_data >}}
{{< /clients-example >}}

## Query the data

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/interact/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

{{< clients-example go_home_json query1 >}}
{{< /clients-example >}}

Specify query options to return only the `city` field:

{{< clients-example go_home_json query2 >}}
{{< /clients-example >}}

You can also use the same query with the `CountOnly` option
enabled to get the number of documents found without
returning the documents themselves.

{{< clients-example go_home_json query2count_only >}}
{{< /clients-example >}}

Use an
[aggregation query]({{< relref "/develop/interact/search-and-query/query/aggregation" >}})
to count all users in each city.

{{< clients-example go_home_json query3 >}}
{{< /clients-example >}}

## Differences with hash documents

Indexing for hash documents is very similar to JSON indexing but you
need to specify some slightly different options.

When you create the schema for a hash index, you don't need to
add aliases for the fields, since you use the basic names to access
the fields anyway. Also, you must set `OnHash` to `true` in the `FTCreateOptions`
object when you create the index. The code below shows these changes with
a new index called `hash-idx:users`, which is otherwise the same as
the `idx:users` index used for JSON documents in the previous examples.

{{< clients-example go_home_json make_hash_index >}}
{{< /clients-example >}}

You use [`HSet()`]({{< relref "/commands/hset" >}}) to add the hash
documents instead of [`JSONSet()`]({{< relref "/commands/json.set" >}}),
but the same flat `userX` maps work equally well with either
hash or JSON:

{{< clients-example go_home_json add_hash_data >}}
{{< /clients-example >}}

The query commands work the same here for hash as they do for JSON (but
the name of the hash index is different). The format of the result is
also almost the same except that the fields are returned directly in the
`Document` object map of the result (for JSON, the fields are all enclosed
in a string under the key "$"):

{{< clients-example go_home_json query1_hash >}}
{{< /clients-example >}}

## More information

See the [Redis query engine]({{< relref "/develop/interact/search-and-query" >}}) docs
for a full description of all query features with examples.
