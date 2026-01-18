---
aliases:
- /develop/interact/search-and-query/query/combined
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
description: Combine query expressions
linkTitle: Combined
title: Combined queries
weight: 9
---

A combined query is a combination of several query types, such as:

* [Exact match]({{< relref "/develop/ai/search-and-query/query/exact-match" >}})
* [Range]({{< relref "/develop/ai/search-and-query/query/range" >}})
* [Full-text]({{< relref "/develop/ai/search-and-query/query/full-text" >}})
* [Geospatial]({{< relref "/develop/ai/search-and-query/query/geo-spatial" >}})
* [Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})

You can use logical query operators to combine query expressions for numeric, tag, and text fields. For vector fields, you can combine a KNN query with a pre-filter.

{{% alert title="Note" color="warning" %}}
The operators are interpreted slightly differently depending on the query dialect used. The default dialect is `DIALECT 1`; see [this article]({{< relref "/develop/ai/search-and-query/administration/configuration#search-default-dialect" >}}) for information on how to change the dialect version. This article uses the second version of the query dialect, `DIALECT 2`, and uses additional brackets (`(...)`) to help clarify the examples. Further details can be found in the [query syntax documentation]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax" >}}). 
{{% /alert  %}}

The examples in this article use the following schema:

| Field name    | Field type   |
| -----------   | ----------   |
| `description` | `TEXT`       |
| `condition`   | `TAG`        |
| `price`       | `NUMERIC`    |
| `vector`      | `VECTOR`     |

## AND

The binary operator ` ` (space) is used to intersect the results of two or more expressions.

```
FT.SEARCH index "(expr1) (expr2)"
```

If you want to perform an intersection based on multiple values within a specific text field, then you should use the following simplified notion:

```
FT.SEARCH index "@text_field:( value1 value2 ... )"
```

The following example shows you a query that finds bicycles in new condition and in a price range from 500 USD to 1000 USD:

{{< clients-example set="query_combined" step="combined1" description="AND operator: Combine multiple query expressions using space to find documents matching all criteria when you need to narrow results with multiple filters" difficulty="beginner" >}}
FT.SEARCH idx:bicycle "@price:[500 1000] @condition:{new}"
{{< /clients-example >}}

You might also be interested in bicycles for kids. The query below shows you how to combine a full-text search with the criteria from the previous query:

{{< clients-example set="query_combined" step="combined2" description="AND with full-text: Combine full-text search with structured queries using AND when you need to find documents with specific text and matching field values" difficulty="beginner" >}}
FT.SEARCH idx:bicycle "kids (@price:[500 1000] @condition:{used})"
{{< /clients-example >}}

## OR

You can use the binary operator `|` (vertical bar) to perform a union.

```
FT.SEARCH index "(expr1) | (expr2)"
```

{{% alert title="Note" color="warning" %}}
The logical `AND` takes precedence over `OR` when using dialect version two. The expression `expr1 expr2 | expr3 expr4` means `(expr1 expr2) | (expr3 expr4)`. Version one of the query dialect behaves differently. Using parentheses in query strings is advised to ensure the order is clear.
 {{% /alert  %}}


If you want to perform the union based on multiple values within a single tag or text field, then you should use the following simplified notion:

```
FT.SEARCH index "@text_field:( value1 | value2 | ... )"
```

```
FT.SEARCH index "@tag_field:{ value1 | value2 | ... }"
```

The following query shows you how to find used bicycles that contain either the word 'kids' or 'small':

{{< clients-example set="query_combined" step="combined3" description="OR operator: Combine multiple expressions using the pipe operator to find documents matching any criteria when you need to broaden results with alternatives" difficulty="intermediate" >}}
FT.SEARCH idx:bicycle "(kids | small) @condition:{used}"
{{< /clients-example >}}

The previous query searches across all text fields. The following example shows you how to limit the search to the description field:

{{< clients-example set="query_combined" step="combined4" description="OR within a field: Use OR to search for multiple values within a single field when you need to match any of several options in one field" difficulty="intermediate" >}}
FT.SEARCH idx:bicycle "@description:(kids | small) @condition:{used}"
{{< /clients-example >}}

If you want to extend the search to new bicycles, then the below example shows you how to do that:

{{< clients-example set="query_combined" step="combined5" description="OR across multiple fields: Combine OR operators across different fields when you need to match alternatives in multiple field criteria" difficulty="intermediate" >}}
FT.SEARCH idx:bicycle "@description:(kids | small) @condition:{new | used}"
{{< /clients-example >}}

## NOT

A minus (`-`) in front of a query expression negates the expression.

```
FT.SEARCH index "-(expr)"
```

If you want to exclude new bicycles from the search within the previous price range, you can use this query:

{{< clients-example set="query_combined" step="combined6" description="NOT operator: Negate query expressions using minus to exclude documents matching criteria when you need to filter out unwanted results" difficulty="intermediate" >}}
FT.SEARCH idx:bicycle "@price:[500 1000] -@condition:{new}"
{{< /clients-example >}}

## Numeric filter

The [FT.SEARCH]({{< relref "commands/ft.search" >}}) command allows you to combine any query expression with a numeric filter.

```
FT.SEARCH index "expr" FILTER numeric_field start end
```

Please see the [range query article]({{< relref "/develop/ai/search-and-query/query/range" >}}) to learn more about numeric range queries and such filters.


## Pre-filter for a KNN  vector query

You can use a simple or more complex query expression with logical operators as a pre-filter in a KNN vector query. 

```
FT.SEARCH index "(filter_expr)=>[KNN num_neighbours @field $vector]" PARAMS 2 vector "binary_data" DIALECT 2
```

Here is an example:

{{< clients-example set="query_combined" step="combined7" description="Vector pre-filtering: Use structured queries as pre-filters before KNN vector search when you need to find similar items within a specific subset of data" difficulty="advanced" >}}
FT.SEARCH idx:bikes_vss "(@price:[500 1000] @condition:{new})=>[KNN 3 @vector $query_vector]" PARAMS 2 "query_vector" "Z\xf8\x15:\xf23\xa1\xbfZ\x1dI>\r\xca9..." DIALECT 2
{{< /clients-example >}}

The [vector search article]({{< relref "/develop/ai/search-and-query/query/vector-search" >}}) provides further details about vector queries in general.
