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
linkTitle: Index and query JSON
title: Example - Index and query JSON documents
weight: 2
---

This example shows how to create a
[search index]({{< relref "/develop/interact/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) data and
run queries against the index.

Make sure that you have Redis Community Edition and `Jedis` installed. 

Start by importing dependencies:

{{< clients-example java_home_json import >}}
{{< /clients-example >}}

Connect to the database:

{{< clients-example java_home_json connect >}}
{{< /clients-example >}}

Create some test data to add to the database:

{{< clients-example java_home_json create_data >}}
{{< /clients-example >}}

Create an index. In this example, only JSON documents with the key prefix `user:` are indexed. For more information, see [Query syntax]({{< relref "/develop/interact/search-and-query/query/" >}}).

{{< clients-example java_home_json make_index >}}
{{< /clients-example >}}

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

{{< clients-example java_home_json add_data >}}
{{< /clients-example >}}

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/interact/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

{{< clients-example java_home_json query1 >}}
{{< /clients-example >}}

Specify query options to return only the `city` field:

{{< clients-example java_home_json query2 >}}
{{< /clients-example >}}

Use an
[aggregation query]({{< relref "/develop/interact/search-and-query/query/aggregation" >}})
to count all users in each city.

{{< clients-example java_home_json query3 >}}
{{< /clients-example >}}

See the [Redis query engine]({{< relref "/develop/interact/search-and-query" >}}) docs
for a full description of all query features with examples.
