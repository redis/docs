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
weight: 30
---

This example shows how to create a
[search index]({{< relref "/develop/interact/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) documents and
run queries against the index. It then goes on to show the slight differences
in the equivalent code for [hash]({{< relref "/develop/data-types/hashes" >}})
documents.

## Initialize

Make sure that you have [Redis Open Source]({{< relref "/operate/oss_and_stack" >}})
or another Redis server available. Also install the
[`NRedisStack`]({{< relref "/develop/clients/dotnet" >}}) client library if you
haven't already done so. 

Add the following dependencies:

{{< clients-example cs_home_json import >}}
{{< /clients-example >}}

## Create data

Create some test data to add to the database:

{{< clients-example cs_home_json create_data >}}
{{< /clients-example >}}

## Add the index

Connect to your Redis database. The code below shows the most
basic connection but see
[Connect to the server]({{< relref "/develop/clients/dotnet/connect" >}})
to learn more about the available connection options.

{{< clients-example cs_home_json connect >}}
{{< /clients-example >}}

Create an index. In this example, only JSON documents with the key prefix `user:` are indexed. For more information, see [Query syntax]({{< relref "/develop/interact/search-and-query/query/" >}}).

{{< clients-example cs_home_json make_index >}}
{{< /clients-example >}}

## Add the data

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

{{< clients-example cs_home_json add_data >}}
{{< /clients-example >}}

## Query the data

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/interact/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

{{< clients-example cs_home_json query1 >}}
{{< /clients-example >}}

Specify query options to return only the `city` field:

{{< clients-example cs_home_json query2 >}}
{{< /clients-example >}}

Use an
[aggregation query]({{< relref "/develop/interact/search-and-query/query/aggregation" >}})
to count all users in each city.

{{< clients-example cs_home_json query3 >}}
{{< /clients-example >}}

## Differences with hash documents

Indexing for hash documents is very similar to JSON indexing but you
need to specify some slightly different options.

When you create the schema for a hash index, you don't need to
add aliases for the fields, since you use the basic names to access
the fields anyway. Also, you must set the `On` option to `IndexDataType.HASH`
in the `FTCreateParams` object when you create the index. The code below shows
these changes with a new index called `hash-idx:users`, which is otherwise the
same as the `idx:users` index used for JSON documents in the previous examples.

{{< clients-example cs_home_json make_hash_index >}}
{{< /clients-example >}}

You use [`HashSet()`]({{< relref "/commands/hset" >}}) to add the hash
documents instead of [`JSON.Set()`]({{< relref "/commands/json.set" >}}).
Also, you must add the fields as key-value pairs instead of combining them
into a single object.

{{< clients-example cs_home_json add_hash_data >}}
{{< /clients-example >}}

The query commands work the same here for hash as they do for JSON (but
the name of the hash index is different). The format of the result is
almost the same except that the fields are returned directly in the
`Document` object of the result (for JSON, the fields are all enclosed
in a string under the key `json`):

{{< clients-example cs_home_json query1_hash >}}
{{< /clients-example >}}

## More information

See the [Redis query engine]({{< relref "/develop/interact/search-and-query" >}}) docs
for a full description of all query features with examples.
