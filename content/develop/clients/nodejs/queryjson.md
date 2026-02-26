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
description: Learn how to use the Redis Query Engine with JSON and hash documents.
linkTitle: Index and query documents
title: Index and query documents
scope: example
relatedPages:
- /develop/clients/nodejs/vecsearch
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

{{< note >}}From [v5.0.0](https://github.com/redis/node-redis/releases/tag/redis%405.0.0)
onwards, `node-redis` uses query dialect 2 by default.
Redis query engine methods such as [`ft.search()`]({{< relref "/commands/ft.search" >}})
will explicitly request this dialect, overriding the default set for the server.
See
[Query dialects]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}})
for more information.
{{< /note >}}

## Initialize

Make sure that you have [Redis Open Source]({{< relref "/operate/oss_and_stack/" >}})
or another Redis server available. Also install the
[`node-redis`]({{< relref "/develop/clients/nodejs" >}}) client library if you
haven't already done so.

Add the following dependencies:

{{< clients-example set="js_home_query" step="import" lang_filter="Node.js" description="Foundational: Import required modules for Redis client and query operations" difficulty="beginner" >}}
{{< /clients-example >}}

## Create data

Create some test data to add to your database. The example data shown
below is compatible with both JSON and hash objects.

{{< clients-example set="js_home_query" step="create_data" lang_filter="Node.js" description="Foundational: Define sample data structures for indexing and querying examples" difficulty="beginner" >}}
{{< /clients-example >}}

## Add the index

Connect to your Redis database. The code below shows the most
basic connection but see
[Connect to the server]({{< relref "/develop/clients/nodejs/connect" >}})
to learn more about the available connection options.

{{< clients-example set="js_home_query" step="connect" lang_filter="Node.js" description="Foundational: Establish a connection to Redis for query operations" difficulty="beginner" >}}
{{< /clients-example >}}

Create an index. In this example, only JSON documents with the key prefix `user:` are indexed. For more information, see [Query syntax]({{< relref "/develop/ai/search-and-query/query/" >}}).

First, drop any existing index to avoid a collision. (The callback is required
to avoid an error if the index doesn't already exist.)

{{< clients-example set="js_home_query" step="cleanup_json" lang_filter="Node.js" description="Foundational: Drop an existing search index safely using error handling to avoid collisions" difficulty="intermediate" >}}
{{< /clients-example >}}

Then create the index:

{{< clients-example set="js_home_query" step="create_index" lang_filter="Node.js" description="Foundational: Create a search index for JSON documents with field definitions and aliases" difficulty="intermediate" >}}
{{< /clients-example >}}

## Add the data

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them. Note that placing
the commands in a `Promise.all()` call is an easy way to create a
[pipeline]({{< relref "/develop/clients/nodejs/transpipe" >}}),
which is more efficient than sending the commands individually.

{{< clients-example set="js_home_query" step="add_data" lang_filter="Node.js" description="Foundational: Add JSON documents with indexed key prefixes using Promise.all() for efficient pipelining" difficulty="intermediate" >}}
{{< /clients-example >}}

## Query the data

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/ai/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

{{< clients-example set="js_home_query" step="query1" lang_filter="Node.js" description="Query data: Execute a full-text search combined with numeric range filtering on indexed JSON documents" difficulty="intermediate" >}}
{{< /clients-example >}}

Specify query options to return only the `city` field:

{{< clients-example set="js_home_query" step="query2" lang_filter="Node.js" description="Restrict query results: Project specific fields in query results to reduce data transfer and improve performance" difficulty="intermediate" >}}
{{< /clients-example >}}

Use an
[aggregation query]({{< relref "/develop/ai/search-and-query/query/aggregation" >}})
to count all users in each city.

{{< clients-example set="js_home_query" step="query3" lang_filter="Node.js" description="Aggregate query results: Use aggregation queries to group and count results by field values for analytics" difficulty="advanced" >}}
{{< /clients-example >}}

## Differences with hash documents

Indexing for hash documents is very similar to JSON indexing but you
need to specify some slightly different options.

When you create the schema for a hash index, you don't need to
add aliases for the fields, since you use the basic names to access
the fields anyway. Also, you must use `HASH` for the `ON` option
when you create the index. The code below shows these changes with
a new index called `hash-idx:users`, which is otherwise the same as
the `idx:users` index used for JSON documents in the previous examples.

First, drop any existing index to avoid a collision.

{{< clients-example set="js_home_query" step="cleanup_hash" lang_filter="Node.js" description="Foundational: Drop an existing search index safely using error handling to avoid collisions" difficulty="intermediate" >}}
{{< /clients-example >}}

Then create the new index:

{{< clients-example set="js_home_query" step="create_hash_index" lang_filter="Node.js" description="Foundational: Create a search index for hash documents with HASH type specification" difficulty="intermediate" >}}
{{< /clients-example >}}

You use [`hSet()`]({{< relref "/commands/hset" >}}) to add the hash
documents instead of [`json.set()`]({{< relref "/commands/json.set" >}}),
but the same flat `userX` objects work equally well with either
hash or JSON:

{{< clients-example set="js_home_query" step="add_hash_data" lang_filter="Node.js" description="Foundational: Add hash documents with indexed key prefixes using hSet() for automatic indexing" difficulty="intermediate" >}}
{{< /clients-example >}}

The query commands work the same here for hash as they do for JSON (but
the name of the hash index is different). The format of the result is
also the same:

{{< clients-example set="js_home_query" step="query1_hash" lang_filter="Node.js" description="Query data: Execute the same full-text query pattern on hash documents as on JSON documents" difficulty="intermediate" >}}
{{< /clients-example >}}

## More information

See the [Redis Query Engine]({{< relref "/develop/ai/search-and-query" >}}) docs
for a full description of all query features with examples.
