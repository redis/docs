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
description: Learn how to use Redis Search with JSON and hash documents.
linkTitle: Index and query documents
title: Index and query documents
scope: example
relatedPages:
- /develop/clients/redis-py/vecsearch
- /develop/ai/search-and-query
topics:
- Redis Search
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

{{< note >}}From [v6.0.0](https://github.com/redis/redis-py/releases/tag/v6.0.0) onwards,
`redis-py` uses query dialect 2 by default.
Redis Search methods such as [`ft().search()`]({{< relref "/commands/ft.search" >}})
will explicitly request this dialect, overriding the default set for the server.
See
[Query dialects]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}})
for more information.
{{< /note >}}

## Initialize

Make sure that you have [Redis Open Source]({{< relref "/operate/oss_and_stack/" >}})
or another Redis server available. Also install the
[`redis-py`]({{< relref "/develop/clients/redis-py" >}}) client library if you
haven't already done so.

Add the following dependencies. All of them are applicable to both JSON and hash,
except for the `Path` class, which is specific to JSON (see
[Path]({{< relref "/develop/data-types/json/path" >}}) for a description of the
JSON path syntax).

{{< jupyter-example set="py_home_json" lang_filter="Python" step="import" description="Foundational: Import required libraries for Redis Search, JSON operations, and search functionality" difficulty="beginner" />}}

## Create data

Create some test data to add to your database. The example data shown
below is compatible with both JSON and hash objects.

{{< jupyter-example set="py_home_json" lang_filter="Python" step="create_data" depends="import" description="Foundational: Define sample user data structures for indexing and querying" difficulty="beginner" />}}

## Add the index

Connect to your Redis database. The code below shows the most
basic connection but see
[Connect to the server]({{< relref "/develop/clients/redis-py/connect" >}})
to learn more about the available connection options.

{{< jupyter-example set="py_home_json" lang_filter="Python" step="connect" depends="import" description="Foundational: Establish a connection to a Redis server for query operations" difficulty="beginner" />}}

The example uses an index called `idx:users` for JSON documents and adds
some JSON documents with the `user:` key prefix. To avoid errors, first
delete any existing index or documents whose names that might
conflict with the example:

{{< jupyter-example set="py_home_json" lang_filter="Python" step="cleanup_json" depends="import" description="Foundational: Clean up existing indexes and documents to prepare for fresh example data" difficulty="beginner" />}}

Create an index for the JSON data. The code below specifies that only JSON documents with
the key prefix `user:` are indexed. For more information, see
[Query syntax]({{< relref "/develop/ai/search-and-query/query/" >}}).

{{< jupyter-example set="py_home_json" lang_filter="Python" step="make_index" depends="import" description="Foundational: Create a search index for JSON documents with field definitions and key prefix filtering" difficulty="intermediate" />}}

## Add the data

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

{{< jupyter-example set="py_home_json" lang_filter="Python" step="add_data" depends="import" description="Foundational: Store JSON documents in Redis with automatic indexing based on key prefix" difficulty="beginner" />}}

## Query the data

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/ai/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

{{< jupyter-example set="py_home_json" lang_filter="Python" step="query1" depends="import" description="Query with filters: Search JSON documents using text matching and numeric range filters to find specific records" difficulty="intermediate" />}}


Specify query options to return only the `city` field:

{{< jupyter-example set="py_home_json" lang_filter="Python" step="query2" depends="import" description="Query with field projection: Retrieve only specific fields from search results to reduce data transfer" difficulty="intermediate" />}}


Use an
[aggregation query]({{< relref "/develop/ai/search-and-query/query/aggregation" >}})
to count all users in each city.

{{< jupyter-example set="py_home_json" lang_filter="Python" step="query3" depends="import" description="Aggregation queries: Use GROUP BY and COUNT operations to summarize and analyze indexed data" difficulty="advanced" />}}

## Differences with hash documents

Indexing for hash documents is very similar to JSON indexing but you
need to specify some slightly different options.

When you create the schema for a hash index, you don't need to
add aliases for the fields, since you use the basic names to access
the fields anyway. Also, you must use `HASH` for the `IndexType`
when you create the index.

First delete any existing index or documents
whose names might conflict with the hash example:

{{< jupyter-example set="py_home_json" lang_filter="Python" step="cleanup_hash" depends="import" description="Foundational: Clean up existing hash indexes and documents to prepare for fresh example data" difficulty="beginner" />}}


Create a new index called `hash-idx:users`, which is otherwise the same as
the `idx:users` index used for JSON documents in the previous examples:

{{< jupyter-example set="py_home_json" lang_filter="Python" step="make_hash_index" depends="import" description="Foundational: Create a search index for hash documents with HASH index type and field definitions" difficulty="intermediate" />}}


You use [`hset()`]({{< relref "/commands/hset" >}}) to add the hash
documents instead of [`json().set()`]({{< relref "/commands/json.set" >}}),
but the same flat `userX` dictionaries work equally well with either
hash or JSON:

{{< jupyter-example set="py_home_json" lang_filter="Python" step="add_hash_data" depends="import" description="Foundational: Store hash documents in Redis with automatic indexing based on key prefix" difficulty="beginner" />}}

The query commands work the same here for hash as they do for JSON (but
the name of the hash index is different). The format of the result is
almost the same except that the fields are returned directly in the
result `Document` object instead of in an enclosing `json` dictionary:

{{< jupyter-example set="py_home_json" lang_filter="Python" step="query1_hash" depends="import" description="Query with filters: Search hash documents using text matching and numeric range filters (same as JSON queries)" difficulty="intermediate" />}}

## More information

See the [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) docs
for a full description of all query features with examples.
