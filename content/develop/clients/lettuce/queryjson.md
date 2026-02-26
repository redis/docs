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
scope: example
relatedPages:
- /develop/clients/lettuce/vecsearch
- /develop/ai/search-and-query
topics:
- Redis Query Engine
- JSON
- hash
weight: 2
---

This example shows how to create a
[search index]({{< relref "/develop/ai/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) documents and
run queries against the index. It then goes on to show the slight differences
in the equivalent code for [hash]({{< relref "/develop/data-types/hashes" >}})
documents.

## Initialize

Make sure that you have [Redis Open Source]({{< relref "/operate/oss_and_stack/" >}})
or another Redis server available. Also install the
[Lettuce]({{< relref "/develop/clients/lettuce" >}}) client library if you
haven't already done so.

Add the following dependencies. All of them are applicable to both JSON and hash,
except for the `JsonParser`, `JsonPath`, and `JsonObject` classes.

{{< clients-example set="lettuce_home_json" step="import" description="Foundational: Import required Lettuce and JSON libraries for querying JSON documents" difficulty="beginner" >}}
{{< /clients-example >}}

## Create data

Create some test data to add to the database:

{{< clients-example set="lettuce_home_json" step="create_data" description="Foundational: Define sample JSON data structures for users with fields like name, age, and city" difficulty="beginner" >}}
{{< /clients-example >}}

## Add the index

Connect to your Redis database. The code below shows the most
basic connection but see
[Connect to the server]({{< relref "/develop/clients/lettuce/connect" >}})
to learn more about the available connection options.

{{< clients-example set="lettuce_home_json" step="connect" description="Foundational: Establish a connection to Redis for executing search and query operations" difficulty="beginner" >}}
{{< /clients-example >}}

Create an index. In this example, only JSON documents with the key prefix `user:` are indexed. For more information, see [Query syntax]({{< relref "/develop/ai/search-and-query/query/" >}}).

{{< clients-example set="lettuce_home_json" step="make_index" description="Foundational: Create a search index on JSON documents with field mappings and aliases for efficient querying" difficulty="intermediate" >}}
{{< /clients-example >}}

## Add the data

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

{{< clients-example set="lettuce_home_json" step="add_data" description="Foundational: Store JSON documents in Redis using the JSON.SET command with keys matching the index prefix" difficulty="beginner" >}}
{{< /clients-example >}}

## Query the data

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/ai/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

{{< clients-example set="lettuce_home_json" step="query1" description="Query data: Execute a full-text search combined with numeric range filtering to find matching documents" difficulty="intermediate" >}}
{{< /clients-example >}}

Specify query options to return only the `city` field:

{{< clients-example set="lettuce_home_json" step="query2" description="Restrict query results: Use query options to project specific fields from search results, reducing data transfer" difficulty="intermediate" >}}
{{< /clients-example >}}

Use an
[aggregation query]({{< relref "/develop/ai/search-and-query/query/aggregation" >}})
to count all users in each city.

{{< clients-example set="lettuce_home_json" step="query3" description="Aggregation: Use aggregation queries to group and count results, performing server-side data analysis" difficulty="advanced" >}}
{{< /clients-example >}}

## Differences with hash documents

Indexing for hash documents is very similar to JSON indexing but you
need to specify some slightly different options.

When you create the schema for a hash index, you don't need to
add aliases for the fields, since you use the basic names to access
the fields. Also, you must use `CreateArgs.TargetType.HASH` for the `On()`
option of `CreateArgs` when you create the index. The code below shows these
changes with a new index called `hash-idx:users`, which is otherwise the same as
the `idx:users` index used for JSON documents in the previous examples.

{{< clients-example set="lettuce_home_json" step="make_hash_index" description="Foundational: Create a search index on hash documents with TargetType.HASH configuration" difficulty="intermediate" >}}
{{< /clients-example >}}

Use [`hset()`]({{< relref "/commands/hset" >}}) to add the hash
documents instead of [`jsonSet()`]({{< relref "/commands/json.set" >}}).

{{< clients-example set="lettuce_home_json" step="add_hash_data" description="Foundational: Store hash documents in Redis using HSET command with keys matching the index prefix" difficulty="beginner" >}}
{{< /clients-example >}}

The query commands work the same here for hash as they do for JSON (but
the name of the hash index is different). The results are returned in
a `List` of `SearchReply.SearchResult<String, String>` objects, as with JSON:

{{< clients-example set="lettuce_home_json" step="query1_hash" description="Query data: Execute the same search query on hash documents as you would on JSON documents" difficulty="intermediate" >}}
{{< /clients-example >}}

## More information

See the [Redis query engine]({{< relref "/develop/ai/search-and-query" >}}) docs
for a full description of all query features with examples.
