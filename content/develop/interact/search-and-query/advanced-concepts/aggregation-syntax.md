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

The [main aggregations page]({{< relref "/develop/interact/search-and-query/advanced-concepts/aggregations" >}}) has a simple diagram showing how `FT.AGGREGATE` pipelines are constructed, but it doesn't tell the whole story. For example, you can create more complex aggregation pipelines by applying multiple `REDUCE` functions under a single `GROUPBY` clause, or you can chain groupings and mix in additional mapping steps:

`GROUPBY` ... `REDUCE` ... `APPLY` ... `GROUPBY` ... `REDUCE`

{{< note >}}
The examples on this page are based on a hypothetical "products" data set, which you can [download here](./data/products.txt).
{{< /note >}}

## Syntax and expression ordering

The `FT.AGGREGATE` command processes multiple expressions in a pipeline. Below is the recommended order:

1. `index` – the name of your index, which must be the first argument.
1. `query` – your query, which must be the second argument.
1. `FILTER` – filters raw documents before transformations or aggregation.
1. `LOAD` – loads document fields.
1. `APPLY` – applies transformations on fields.
1. `GROUPBY` – groups results by specific fields.
1. `REDUCE` – performs aggregations. For example, `SUM`, `COUNT`, and `AVG`.
1. `SORTBY` – orders the results based on specified fields.
1. `LIMIT` – restricts the number of results returned.
1. `DIALECT 2` - provides for more comprehensive query syntax, for example using parameters in `FILTER` expressions.

Other keywords will be discussed toward the end of this page.

## When to use `@`

You must add `@` at the start of a field name in the following circumstances:

- When referencing fields loaded from documents. In the following example, `price` is a document field and must be prefixed with `@`.

```sh
FT.AGGREGATE products "*"
  LOAD 1 @price
  APPLY "@price * 1.1" AS adjusted_price
  SORTBY 2 @adjusted_price DESC
  LIMIT 0 10

 1) (integer) 200
 2) 1) "price"
    2) "623"
    3) "adjusted_price"
    4) "685.3"
 3) 1) "price"
    2) "619.75"
    3) "adjusted_price"
    4) "681.725"
  .
  .
  .
```

- When referencing fields inside a `FILTER` clause that were loaded from documents.

```sh
FT.AGGREGATE products "*"
  LOAD 1 @rating
  FILTER "@rating >= 4.5"
  LIMIT 0 10

 1) (integer) 5
 2) 1) "rating"
    2) "4.5"
 3) 1) "rating"
    2) "4.8"
 4) 1) "rating"
    2) "4.5"
  .
  .
  .
```

- When referencing fields inside `GROUPBY` or `REDUCE` clauses.

```sh
FT.AGGREGATE products "*"
  GROUPBY 1 @category
  REDUCE SUM 1 @price AS total_price
  LIMIT 0 10

1) (integer) 6
2) 1) "category"
   2) "Toys"
   3) "total_price"
   4) "9799.25"
3) 1) "category"
   2) "Electronics"
   3) "total_price"
   4) "10683.5"
4) 1) "category"
   2) "Apparel"
   3) "total_price"
   4) "10273.5"
  .
  .
  .
```

- When referencing fields created by `REDUCE` in `APPLY` or `FILTER` clauses.

```sh
FT.AGGREGATE products "*"
  GROUPBY 1 @category
  REDUCE SUM 1 @price AS total_price
  APPLY "@total_price * 1.2" AS boosted_price
  FILTER "@total_price > 1000"
  LIMIT 0 10

1) (integer) 6
2) 1) "category"
   2) "Toys"
   3) "total_price"
   4) "9799.25"
   5) "boosted_price"
   6) "11759.1"
3) 1) "category"
   2) "Electronics"
   3) "total_price"
   4) "10683.5"
   5) "boosted_price"
   6) "12820.2"
  .
  .
  .
```

- When referencing fields created by `APPLY` in another `APPLY` or `FILTER` clause.

```sh
FT.AGGREGATE products "*"
  LOAD 2 @price @discount
  APPLY "@price - @discount" AS net_price
  APPLY "@net_price * 1.1" AS marked_up
  FILTER "@net_price > 200"
  LIMIT 0 10

1) (integer) 60
2) 1) "price"
   2) "220"
   3) "discount"
   4) "0"
   5) "net_price"
   6) "220"
   7) "marked_up"
   8) "242"
3) 1) "price"
   2) "223.25"
   3) "discount"
   4) "1.5"
   5) "net_price"
   6) "221.75"
   7) "marked_up"
   8) "243.925"
  .
  .
  .
```

- When referencing fields created by `APPLY` in a `SORTBY` clause.

```sh
FT.AGGREGATE products "*"
  LOAD 2 @price @discount
  APPLY "@price - @discount" AS net_price
  SORTBY 2 @net_price DESC
  LIMIT 0 10

 1) (integer) 200
 2) 1) "price"
    2) "623"
    3) "discount"
    4) "6"
    5) "net_price"
    6) "617"
 3) 1) "price"
    2) "619.75"
    3) "discount"
    4) "4.5"
    5) "net_price"
    6) "615.25"
  .
  .
  .
```

## GROUPBY with multiple REDUCE operations

You can use multiple `REDUCE` operations after `GROUPBY` for different aggregations.

```sh
FT.AGGREGATE products "*"
  GROUPBY 1 @category
  REDUCE COUNT 0 AS product_count
  REDUCE SUM 1 @price AS total_price
  REDUCE AVG 1 @rating AS avg_rating
  SORTBY 2 @total_price DESC
  LIMIT 0 10

1) (integer) 6
2) 1) "category"
   2) "Groceries"
   3) "product_count"
   4) "44"
   5) "total_price"
   6) "13495.25"
   7) "avg_rating"
   8) "3.94090909091"
3) 1) "category"
   2) "Home"
   3) "product_count"
   4) "40"
   5) "total_price"
   6) "11026.75"
   7) "avg_rating"
   8) "3.78"
  .
  .
  .
```

## Multiple APPLY operations followed by GROUPBY and REDUCE

You can use `APPLY` in various ways before and after `GROUPBY` and `REDUCE`.

```sh
FT.AGGREGATE products "*"
  LOAD 3 @price @discount @quantity
  APPLY "@price - @discount" AS final_price
  APPLY "@final_price * @quantity" AS total_revenue
  GROUPBY 1 @category
  REDUCE SUM 1 @total_revenue AS total_category_revenue
  SORTBY 2 @total_category_revenue DESC
  LIMIT 0 10

1) (integer) 6
2) 1) "category"
   2) "Groceries"
   3) "total_category_revenue"
   4) "81373"
3) 1) "category"
   2) "Home"
   3) "total_category_revenue"
   4) "55797.5"
  .
  .
  .
```

## FILTER and PARAMS

Use `FILTER` to remove unwanted records, and `PARAMS` to pass values to parameterized queries.

```sh
FT.AGGREGATE products "*"
  LOAD 3 @price @rating @quantity
  FILTER "@price >= 500"
  FILTER "@rating >= 4.0"
  APPLY "@price * @quantity" AS total_value
  SORTBY 2 @total_value DESC
  LIMIT 0 10
  DIALECT 2

1) (integer) 200
 2) 1) "price"
    2) "606.75"
    3) "rating"
    4) "4.2"
    5) "quantity"
    6) "10"
    7) "total_value"
    8) "6067.5"
 3) 1) "price"
    2) "541.75"
    3) "rating"
    4) "4.5"
    5) "quantity"
    6) "10"
    7) "total_value"
    8) "5417.5"
  .
  .
  .
```

## Placement of FILTER before and after GROUPBY/APPLY

- **Before GROUPBY:** Removes records before aggregation.
- **After GROUPBY:** Filters based on aggregated results.

## LOAD after GROUPBY/REDUCE

This is not allowed and you'll get a syntax error.

## Placement rules for specific parameters

| Parameter    | Placement                                                 |
|-----         |-----                                                      |
| `TIMEOUT`    | Can be placed anywhere.                                   |
| `LIMIT`      | Must be at the end, before `DIALECT`.                     |
| `WITHCURSOR` | Must be at the end, before `DIALECT`.                     |
| `SCORER`     | Must be placed between the query and pipeline operations. |
| `ADDSCORES`  | Must be placed between the query and pipeline operations. |
| `DIALECT`    | Must be at the end.                                       |

## LIMIT and WITHCURSOR used together

While you wouldn't ordinarily use `LIMIT` and `WITHCURSOR` together in the same query, you can do so if necessary.
`LIMIT`, as the name suggests, will limit the total number of results returned for the given query. `WITHCURSOR` will paginate the results in chunks of size `COUNT`. You can use the [cursor API]({{< relref "/develop/interact/search-and-query/advanced-concepts/aggregations/#cursor-api" >}}) to retrieve more results, as shown below.

```sh
FT.AGGREGATE products "*"
  GROUPBY 1 @category
  REDUCE COUNT 0 AS product_count
  LIMIT 0 100
  WITHCURSOR COUNT 3

1) 1) (integer) 6
   2) 1) "category"
      2) "Toys"
      3) "product_count"
      4) "28"
   3) 1) "category"
      2) "Electronics"
      3) "product_count"
      4) "31"
   4) 1) "category"
      2) "Apparel"
      3) "product_count"
      4) "36"
2) (integer) 89400486
127.0.0.1:6379> FT.CURSOR READ products 89400486 COUNT 3
1) 1) (integer) 0
   2) 1) "category"
      2) "Home"
      3) "product_count"
      4) "40"
   3) 1) "category"
      2) "Groceries"
      3) "product_count"
      4) "44"
   4) 1) "category"
      2) "Books"
      3) "product_count"
      4) "21"
2) (integer) 89400486
  .
  .
  .
```

See the following resources for more information:

- [Aggregations]({{< relref "/develop/interact/search-and-query/advanced-concepts/aggregations" >}}) discussion page.
- [`FT.AGGREGATE` command page](https://redis.io/docs/latest/commands/ft.aggregate/)
- [RQE source code](https://github.com/RediSearch/RediSearch/tree/master/src/aggregate)
