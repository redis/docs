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
description: Order of operations for the FT.AGGREGATE command
linkTitle: Aggregation syntax
title: FT.AGGREGATE order of operations
weight: 2
---

## Overview

[`FT.AGGREGATE`]({{< relref "/commands/ft.aggregate" >}}) is a powerful Redis Query Engine (RQE) command for performing advanced data aggregation, filtering, sorting, and transformations on indexed hash or JSON documents. This reference page provides a structured breakdown of syntax, ordering rules, and best practices.

The [main aggregations page]({{< relref "/develop/interact/search-and-query/advanced-concepts/aggregations" >}}) has a simple diagram showing how `FT.AGGREGATE` pipelines are constructed, but it doesn't tell the whole story. For example, it's possible to create more complex aggregation pipelines by applying multiple `REDUCE` functions under a single `GROUPBY` clause, or you can chain groupings and mix in additional mapping steps:

`GROUPBY` ... `REDUCE` ... `APPLY` ... `GROUPBY` ... `REDUCE`

{{< note >}}
The examples on this page are based on a hypothetical "products" data set, which you can [download here](./data/products.txt).
{{< /note >}}

## Syntax and expression ordering

The `FT.AGGREGATE` command processes multiple expressions in a pipeline. Below is the recommended order:

1. `index` – the name of your index, which must be the first argument.
1. `query` – your query, which must be the second argument.
1. `FILTER` – filters raw documents before transformations or aggregation.
1. `LOAD` – loads additional document attributes.
1. `APPLY` – applies transformations on fields.
1. `GROUPBY` – groups results by specific fields.
1. `REDUCE` – performs aggregations. For example, `SUM`, `COUNT`, and `AVG`.
1. `SORTBY` – orders the results based on specified fields.
1. `LIMIT` – restricts the number of results returned.
1. `DIALECT 2` - provides for more comprehensive syntax, for example using parameters in `FILTER` expressions.

Other keywords will be discussed toward the end of this page.

## When to use `@`

Fields must be preceded by `@` in the following circumstances:

- When referencing fields loaded from documents. In the following example, `price` is a document field and must be prefixed wit `@`.

```sh
FT.AGGREGATE products "*"
  LOAD 1 @price
  APPLY "@price * 1.1" AS adjusted_price
  SORTBY 2 @adjusted_price DESC
  LIMIT 0 10
```

- When referencing fields inside a `FILTER` clause that were loaded from documents.

```sh
FT.AGGREGATE products "*"
  LOAD 1 @rating
  FILTER "@rating >= 4.5"
  LIMIT 0 10
```

- When referencing fields inside `GROUPBY` or `REDUCE` clauses.

```sh
FT.AGGREGATE products "*"
  GROUPBY 1 @category
  REDUCE SUM 1 @price AS total_price
  LIMIT 0 10
```

- When referencing fields created by `REDUCE` in an `APPLY` or `FILTER` clauses.

```sh
FT.AGGREGATE products "*"
  GROUPBY 1 @category
  REDUCE SUM 1 @price AS total_price
  APPLY "@total_price * 1.2" AS boosted_price
  FILTER "@total_price > 1000"
  LIMIT 0 10
```

- When referencing fields created by `APPLY` in another `APPLY` or `FILTER` clause.

```sh
FT.AGGREGATE products "*"
  LOAD 2 @price @discount
  APPLY "@price - @discount" AS net_price
  APPLY "@net_price * 1.1" AS marked_up
  FILTER "@net_price > 200"
  LIMIT 0 10
```

- When referencing fields created by `APPLY` in a `SORTBY` clause.

```sh
FT.AGGREGATE products "*"
  LOAD 2 @price @discount
  APPLY "@price - @discount" AS net_price
  SORTBY 2 @net_price DESC
  LIMIT 0 10
```

## GROUPBY with multiple REDUCE operations

`GROUPBY` can be followed by multiple `REDUCE` operations for different aggregations.

```sh
FT.AGGREGATE products "*"
  GROUPBY 1 @category
  REDUCE COUNT 0 AS product_count
  REDUCE SUM 1 @price AS total_price
  REDUCE AVG 1 @rating AS avg_rating
  SORTBY 2 @total_price DESC
  LIMIT 0 10
```

## Multiple APPLY operations followed by GROUPBY and REDUCE

`APPLY` can be used in various ways before and after `GROUPBY` and `REDUCE`.

```sh
FT.AGGREGATE products "*"
  LOAD 3 @price @discount @quantity
  APPLY "@price - @discount" AS final_price
  APPLY "@final_price * @quantity" AS total_revenue
  GROUPBY 1 @category
  REDUCE SUM 1 @total_revenue AS total_category_revenue
  SORTBY 2 @total_category_revenue DESC
  LIMIT 0 10
```

## FILTER and PARAMS

`FILTER` is used to remove unwanted records, while `PARAMS` allows parameterized queries.

```sh
FT.AGGREGATE products "*"
  LOAD 3 @price @rating @quantity
  FILTER "@price >= 500"
  FILTER "@rating >= 4.0"
  APPLY "@price * @quantity" AS total_value
  SORTBY 2 @total_value DESC
  LIMIT 0 10
  DIALECT 2
```

## Placement of FILTER before and after GROUPBY/APPLY

- **Before GROUPBY:** Removes records before aggregation.
- **After GROUPBY:** Filters based on aggregated results.
- **Before APPLY:** Ensures calculations are applied only to certain records.
- **After APPLY:** Filters computed values.

## LOAD after GROUPBY/REDUCE

This is not allowed and you'll get a syntax error.

## Placement rules for specific parameters

| Parameter    | Placement                             |
|-----         |-----                                  |
| `TIMEOUT`    | Can be placed anywhere.               |
| `LIMIT`      | Must be at the end, before `DIALECT`. |
| `WITHCURSOR` | Must be at the end, before `DIALECT`. |
| `SCORER`     | Can be placed anywhere.               |
| `ADDSCORES`  | Must be before sorting.               |
| `DIALECT`    | Must be at the end.                   |

## LIMIT and WITHCURSOR used together

In practical terms, `LIMIT` and `WITHCURSOR` are mutually exclusive. However, they can be used together.
`LIMIT` returns immediate results, while `WITHCURSOR` retrieves results incrementally using the [cursor API]({{< relref "/develop/interact/search-and-query/advanced-concepts/aggregations/#cursor-api" >}}).

```sh
FT.AGGREGATE products "*"
  GROUPBY 1 @category
  REDUCE COUNT 0 AS product_count
  LIMIT 0 100
  WITHCURSOR COUNT 3
```

See the following resources for more information:

- [`FT.AGGREGATE` command page](https://redis.io/docs/latest/commands/ft.aggregate/)
- [RQE source code](https://github.com/RediSearch/RediSearch/tree/master/src/aggregate)
