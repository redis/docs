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

[`FT.AGGREGATE`]({{< relref "/commands/ft.aggregate" >}}) is a powerful command in RQE module for performing advanced data aggregation, filtering, sorting, and transformations on indexed documents. This reference page provides a structured breakdown of syntax, ordering rules, and best practices.

## Syntax and expression ordering

The `FT.AGGREGATE` command processes multiple expressions in a pipeline. Below is the recommended order:

1. `FILTER` – filters raw documents before transformations or aggregation.
1. `LOAD` – loads additional document attributes.
1. `APPLY` – applies transformations on fields.
1. `GROUPBY` – groups results by specific fields.
1. `REDUCE` – performs aggregations. For example, `SUM`, `COUNT`, and `AVG`.
1. `SORTBY` – orders the results based on specified fields.
1. `LIMIT` – restricts the number of results returned.

## Using GROUPBY with multiple REDUCE

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

## Using multiple APPLY, GROUPBY, and REDUCE

`APPLY` can be used in various ways before and after `GROUPBY` and `REDUCE`.
```sh
FT.AGGREGATE products "*"
  APPLY "@price - @discount AS final_price"
  APPLY "@final_price * @quantity AS total_revenue"
  GROUPBY 1 @category
  REDUCE SUM 1 total_revenue AS total_category_revenue
  SORTBY 2 total_category_revenue DESC
  LIMIT 0 10
```

## Using FILTER and PARAMS

`FILTER` is used to remove unwanted records, while `PARAMS` allows parameterized queries.
```sh
FT.AGGREGATE products "*"
  PARAMS 2 "min_price" 500 "min_rating" 4.0
  FILTER "@price >= $min_price"
  FILTER "@rating >= $min_rating"
  APPLY "@price * @quantity AS total_value"
  SORTBY 2 total_value DESC
  LIMIT 0 10
```

## Placement of FILTER before and after GROUPBY/APPLY

- **Before GROUPBY:** Removes records before aggregation.
- **After GROUPBY:** Filters based on aggregated results.
- **Before APPLY:** Ensures calculations are applied only to certain records.
- **After APPLY:** Filters computed values.

## Using LOAD after GROUPBY/REDUCE

`LOAD` is generally used **before** `GROUPBY`, but in some cases, it can be used afterward to retrieve document metadata.
```sh
FT.AGGREGATE products "*"
  GROUPBY 1 @category
  REDUCE COUNT 0 AS product_count
  REDUCE SUM 1 @price AS total_price
  WITHCURSOR COUNT 5
```

## Placement rules for specific parameters

| Parameter | Placement |
|-----------|----------------|
| `TIMEOUT` | Can be placed anywhere |
| `LIMIT` | Must be at the end |
| `WITHCURSOR` | Must be at the end |
| `SCORER` | Can be placed anywhere |
| `ADDSCORES` | Must be before sorting |
| `DIALECT` | Must be at the end |

## LIMIT and WITHCURSOR are mutually exclusive

`LIMIT` returns immediate results, while `WITHCURSOR` retrieves results incrementally.
```sh
FT.AGGREGATE products "*"
  GROUPBY 1 @category
  REDUCE COUNT 0 AS product_count
  WITHCURSOR COUNT 5
```

## Summary

- `GROUPBY` allows multiple `REDUCE` functions.
- `APPLY` can be positioned before or after grouping.
- `FILTER` placement affects results significantly.
- `LOAD` after `GROUPBY` is only useful in specific cases.
- `LIMIT` and `WITHCURSOR` **cannot** be used together.

For further reference:
- [`FT.AGGREGATE` command page](https://redis.io/docs/latest/commands/ft.aggregate/)
- [RQE source code](https://github.com/RediSearch/RediSearch/tree/master/src/aggregate)

