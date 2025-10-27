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
[search index]({{< relref "/develop/ai/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) documents and
run queries against the index. It then goes on to show the slight differences
in the equivalent code for [hash]({{< relref "/develop/data-types/hashes" >}})
documents.

{{< note >}}From [v6.0.0](https://github.com/redis/redis-py/releases/tag/v6.0.0) onwards,
`redis-py` uses query dialect 2 by default.
Redis query engine methods such as [`ft().search()`]({{< relref "/commands/ft.search" >}})
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

{{< clients-example py_home_json import >}}
{{< /clients-example >}}

## Create data

Create some test data to add to your database. The example data shown
below is compatible with both JSON and hash objects.

{{< clients-example py_home_json create_data >}}
{{< /clients-example >}}

## Add the index

Connect to your Redis database. The code below shows the most
basic connection but see
[Connect to the server]({{< relref "/develop/clients/redis-py/connect" >}})
to learn more about the available connection options.

{{< clients-example py_home_json connect >}}
{{< /clients-example >}}

The example uses an index called `idx:users` for JSON documents and adds
some JSON documents with the `user:` key prefix. To avoid errors, first
delete any existing index or documents whose names that might
conflict with the example:

{{< clients-example py_home_json cleanup_json >}}
{{< /clients-example >}}

Create an index for the JSON data. The code below specifies that only JSON documents with
the key prefix `user:` are indexed. For more information, see
[Query syntax]({{< relref "/develop/ai/search-and-query/query/" >}}).

{{< clients-example py_home_json make_index >}}
{{< /clients-example >}}

## Add the data

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

{{< clients-example py_home_json add_data >}}
{{< /clients-example >}}

## Query the data

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/ai/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

{{< clients-example py_home_json query1 >}}
{{< /clients-example >}}

Specify query options to return only the `city` field:

{{< clients-example py_home_json query2 >}}
{{< /clients-example >}}

Use an
[aggregation query]({{< relref "/develop/ai/search-and-query/query/aggregation" >}})
to count all users in each city.

{{< clients-example py_home_json query3 >}}
{{< /clients-example >}}

## Differences with hash documents

Indexing for hash documents is very similar to JSON indexing but you
need to specify some slightly different options.

When you create the schema for a hash index, you don't need to
add aliases for the fields, since you use the basic names to access
the fields anyway. Also, you must use `HASH` for the `IndexType`
when you create the index.

First delete any existing index or documents
whose names might conflict with the hash example:

{{< clients-example py_home_json cleanup_hash >}}
{{< /clients-example >}}

Create a new index called `hash-idx:users`, which is otherwise the same as
the `idx:users` index used for JSON documents in the previous examples:

{{< clients-example py_home_json make_hash_index >}}
{{< /clients-example >}}

You use [`hset()`]({{< relref "/commands/hset" >}}) to add the hash
documents instead of [`json().set()`]({{< relref "/commands/json.set" >}}),
but the same flat `userX` dictionaries work equally well with either
hash or JSON:

{{< clients-example py_home_json add_hash_data >}}
{{< /clients-example >}}

The query commands work the same here for hash as they do for JSON (but
the name of the hash index is different). The format of the result is
almost the same except that the fields are returned directly in the
result `Document` object instead of in an enclosing `json` dictionary:

{{< clients-example py_home_json query1_hash >}}
{{< /clients-example >}}

## More information

See the [Redis query engine]({{< relref "/develop/ai/search-and-query" >}}) docs
for a full description of all query features with examples.
