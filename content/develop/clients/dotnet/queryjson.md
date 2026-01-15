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
- /develop/clients/dotnet/vecsearch
- /develop/ai/search-and-query
topics:
- Redis Query Engine
- JSON
- hash
weight: 30
---

This example shows how to create a
[search index]({{< relref "/develop/ai/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) documents and
run queries against the index. It then goes on to show the slight differences
in the equivalent code for [hash]({{< relref "/develop/data-types/hashes" >}})
documents.

{{< note >}}From [v1.0.0](https://github.com/redis/NRedisStack/releases/tag/v1.0.0)
onwards, `NRedisStack` uses query dialect 2 by default.
Redis query engine methods such as [`FT().Search()`]({{< relref "/commands/ft.search" >}})
will explicitly request this dialect, overriding the default set for the server.
See
[Query dialects]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}})
for more information.
{{< /note >}}

## Initialize

Make sure that you have [Redis Open Source]({{< relref "/operate/oss_and_stack" >}})
or another Redis server available. Also install the
[`NRedisStack`]({{< relref "/develop/clients/dotnet" >}}) client library if you
haven't already done so. 

Add the following dependencies:

{{< clients-example set="cs_home_json" step="import" description="Foundational: Import required libraries for Redis query engine, JSON operations, and search functionality" difficulty="beginner" >}}
{{< /clients-example >}}

## Create data

Create some test data to add to the database:

{{< clients-example set="cs_home_json" step="create_data" description="Foundational: Define sample user data structures for indexing and querying" difficulty="beginner" >}}
{{< /clients-example >}}

## Add the index

Connect to your Redis database. The code below shows the most
basic connection but see
[Connect to the server]({{< relref "/develop/clients/dotnet/connect" >}})
to learn more about the available connection options.

{{< clients-example set="cs_home_json" step="connect" description="Foundational: Establish a connection to a Redis server for query operations" difficulty="beginner" >}}
{{< /clients-example >}}

Delete any existing index called `idx:users` and any keys that start with `user:`.

{{< clients-example set="cs_home_json" step="cleanup_json" description="Foundational: Clean up existing indexes and documents to prepare for fresh example data" difficulty="beginner" >}}
{{< /clients-example >}}

Create an index. In this example, only JSON documents with the key prefix `user:` are indexed. For more information, see [Query syntax]({{< relref "/develop/ai/search-and-query/query/" >}}).

{{< clients-example set="cs_home_json" step="make_index" description="Foundational: Create a search index for JSON documents with field definitions and key prefix filtering" difficulty="intermediate" >}}
{{< /clients-example >}}

## Add the data

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

{{< clients-example set="cs_home_json" step="add_data" description="Foundational: Store JSON documents in Redis with automatic indexing based on key prefix" difficulty="beginner" >}}
{{< /clients-example >}}

## Query the data

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/ai/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

{{< clients-example set="cs_home_json" step="query1" description="Query with filters: Search JSON documents using text matching and numeric range filters to find specific records" difficulty="intermediate" >}}
{{< /clients-example >}}

Specify query options to return only the `city` field:

{{< clients-example set="cs_home_json" step="query2" description="Query with field projection: Retrieve only specific fields from search results to reduce data transfer" difficulty="intermediate" >}}
{{< /clients-example >}}

Use an
[aggregation query]({{< relref "/develop/ai/search-and-query/query/aggregation" >}})
to count all users in each city.

{{< clients-example set="cs_home_json" step="query3" description="Aggregation queries: Use GROUP BY and COUNT operations to summarize and analyze indexed data" difficulty="advanced" >}}
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

First, delete any existing index called `hash-idx:users` and any keys that start with `huser:`.

{{< clients-example set="cs_home_json" step="cleanup_hash" description="Foundational: Clean up existing hash indexes and documents to prepare for fresh example data" difficulty="beginner" >}}
{{< /clients-example >}}

Now create the new index:

{{< clients-example set="cs_home_json" step="make_hash_index" description="Foundational: Create a search index for hash documents with HASH index type and field definitions" difficulty="intermediate" >}}
{{< /clients-example >}}

You use [`HashSet()`]({{< relref "/commands/hset" >}}) to add the hash
documents instead of [`JSON.Set()`]({{< relref "/commands/json.set" >}}).
Also, you must add the fields as key-value pairs instead of combining them
into a single object.

{{< clients-example set="cs_home_json" step="add_hash_data" description="Foundational: Store hash documents in Redis with automatic indexing based on key prefix" difficulty="beginner" >}}
{{< /clients-example >}}

The query commands work the same here for hash as they do for JSON (but
the name of the hash index is different). The format of the result is
almost the same except that the fields are returned directly in the
`Document` object of the result (for JSON, the fields are all enclosed
in a string under the key `json`):

{{< clients-example set="cs_home_json" step="query1_hash" description="Query with filters: Search hash documents using text matching and numeric range filters (same as JSON queries)" difficulty="intermediate" >}}
{{< /clients-example >}}

## More information

See the [Redis query engine]({{< relref "/develop/ai/search-and-query" >}}) docs
for a full description of all query features with examples.
