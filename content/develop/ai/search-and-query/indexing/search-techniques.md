---
aliases:
- /develop/interact/search-and-query/indexing/search-techniques
- /develop/ai/search-and-query/indexing/search-techniques
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
description: Advanced search techniques including field projection, highlighting, and aggregation
linkTitle: Search techniques
title: Search techniques
weight: 45
---

This page covers advanced search techniques you can use with indexed JSON documents, including field projection, highlighting search terms, and aggregation queries.

## Field projection

[`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) returns the entire JSON document by default. If you want to limit the returned search results to specific attributes, you can use field projection.

### Return specific attributes

When you run a search query, you can use the `RETURN` keyword to specify which attributes you want to include in the search results. You also need to specify the number of fields to return.

For example, this query only returns the `name` and `price` of each set of headphones:

```sql
127.0.0.1:6379> FT.SEARCH itemIdx '@description:(headphones)' RETURN 2 name price
1) "2"
2) "item:1"
3) 1) "name"
   2) "Noise-cancelling Bluetooth headphones"
   3) "price"
   4) "99.98"
4) "item:2"
5) 1) "name"
   2) "Wireless earbuds"
   3) "price"
   4) "64.99"
```

### Project with JSONPath

You can use [JSONPath]({{< relref "/develop/data-types/json/path" >}}) expressions in a `RETURN` statement to extract any part of the JSON document, even fields that were not defined in the index `SCHEMA`.

For example, the following query uses the JSONPath expression `$.stock` to return each item's stock in addition to the name and price attributes.

```sql
127.0.0.1:6379> FT.SEARCH itemIdx '@description:(headphones)' RETURN 3 name price $.stock
1) "2"
2) "item:1"
3) 1) "name"
   2) "Noise-cancelling Bluetooth headphones"
   3) "price"
   4) "99.98"
   5) "$.stock"
   6) "25"
4) "item:2"
5) 1) "name"
   2) "Wireless earbuds"
   3) "price"
   4) "64.99"
   5) "$.stock"
   6) "17"
```

Note that the returned property name is the JSONPath expression itself: `"$.stock"`.

You can use the `AS` option to specify an alias for the returned property:

```sql
127.0.0.1:6379> FT.SEARCH itemIdx '@description:(headphones)' RETURN 5 name price $.stock AS stock
1) "2"
2) "item:1"
3) 1) "name"
   2) "Noise-cancelling Bluetooth headphones"
   3) "price"
   4) "99.98"
   5) "stock"
   6) "25"
4) "item:2"
5) 1) "name"
   2) "Wireless earbuds"
   3) "price"
   4) "64.99"
   5) "stock"
   6) "17"
```

This query returns the field as the alias `"stock"` instead of the JSONPath expression `"$.stock"`.

## Highlight search terms

You can [highlight]({{< relref "/develop/ai/search-and-query/advanced-concepts/highlight" >}}) relevant search terms in any indexed `TEXT` attribute.

For [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}), you have to explicitly set which attributes you want highlighted after the `RETURN` and `HIGHLIGHT` parameters.

Use the optional `TAGS` keyword to specify the strings that will surround (or highlight) the matching search terms.

For example, highlight the word "bluetooth" with bold HTML tags in item names and descriptions:

```sql
127.0.0.1:6379> FT.SEARCH itemIdx '(@name:(bluetooth))|(@description:(bluetooth))' RETURN 3 name description price HIGHLIGHT FIELDS 2 name description TAGS '<b>' '</b>'
1) "2"
2) "item:1"
3) 1) "name"
   2) "Noise-cancelling <b>Bluetooth</b> headphones"
   3) "description"
   4) "Wireless <b>Bluetooth</b> headphones with noise-cancelling technology"
   5) "price"
   6) "99.98"
4) "item:2"
5) 1) "name"
   2) "Wireless earbuds"
   3) "description"
   4) "Wireless <b>Bluetooth</b> in-ear headphones"
   5) "price"
   6) "64.99"
```

## Aggregate with JSONPath

You can use [aggregation]({{< relref "/develop/ai/search-and-query/advanced-concepts/aggregations" >}}) to generate statistics or build facet queries.

The `LOAD` option accepts [JSONPath]({{< relref "/develop/data-types/json/path" >}}) expressions. You can use any value in the pipeline, even if the value is not indexed.

This example uses aggregation to calculate a 10% price discount for each item and sorts the items from least expensive to most expensive:

```sql
127.0.0.1:6379> FT.AGGREGATE itemIdx '*' LOAD 4 name $.price AS originalPrice APPLY '@originalPrice - (@originalPrice * 0.10)' AS salePrice SORTBY 2 @salePrice ASC
1) "2"
2) 1) "name"
   2) "Wireless earbuds"
   3) "originalPrice"
   4) "64.99"
   5) "salePrice"
   6) "58.491"
3) 1) "name"
   2) "Noise-cancelling Bluetooth headphones"
   3) "originalPrice"
   4) "99.98"
   5) "salePrice"
   6) "89.982"
```

{{% alert title="Note" color="info" %}}
[`FT.AGGREGATE`]({{< relref "commands/ft.aggregate/" >}}) queries require `attribute` modifiers. Don't use JSONPath expressions in queries, except with the `LOAD` option, because the query parser doesn't fully support them.
{{% /alert %}}

## Next steps

- Learn more about [aggregation syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/aggregations" >}})
- Explore [highlighting options]({{< relref "/develop/ai/search-and-query/advanced-concepts/highlight" >}})
- See [query syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax" >}}) for advanced search patterns
