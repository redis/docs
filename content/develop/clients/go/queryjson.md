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

Make sure that you have Redis Stack and `go-redis` installed. 

Start by importing dependencies:

{{< clients-example go_home_json import >}}
{{< /clients-example >}}

Connect to the database:

{{< clients-example go_home_json connect >}}
{{< /clients-example >}}

Create some test data to add to the database:

{{< clients-example go_home_json create_data >}}
{{< /clients-example >}}

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

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

{{< clients-example go_home_json add_data >}}
{{< /clients-example >}}

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/interact/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

{{< clients-example go_home_json query1 >}}
{{< /clients-example >}}

Specify query options to return only the `city` field:

{{< clients-example go_home_json query2 >}}
{{< /clients-example >}}

Use an
[aggregation query]({{< relref "/develop/interact/search-and-query/query/aggregation" >}})
to count all users in each city.

{{< clients-example go_home_json query3 >}}
{{< /clients-example >}}

See the [Redis query engine]({{< relref "/develop/interact/search-and-query" >}}) docs
for a full description of all query features with examples.