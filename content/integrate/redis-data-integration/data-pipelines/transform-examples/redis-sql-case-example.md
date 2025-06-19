---
Title: Using SQL CASE
aliases: /integrate/redis-data-integration/ingest/data-pipelines/transform-examples/redis-sql-case-example/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Using SQL CASE
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 30
---

The [`CASE`](https://www.w3schools.com/sql/sql_case.asp) statement allows you to specify conditions and return different values based on those conditions. You can use it both to create new fields or filter existing data.

## Using SQL CASE to create a new field
The example below demonstrates how to use the `CASE` statement to create a new field called `Market` based on the value of the `BillingCountry` field in the `Invoice` table. The new field categorizes countries into regions such as "North America" and "Europe".

```yaml
source:
  table: Invoice

transform:
  - uses: add_field
    with:
      field: "Market"
      language: sql
      expression: |
        CASE
          WHEN BillingCountry = 'USA' THEN 'North America'
          WHEN BillingCountry = 'Canada' THEN 'North America'
          WHEN BillingCountry = 'UK' THEN 'Europe'
          WHEN BillingCountry = 'France' THEN 'Europe'
          ELSE 'Other'
        END
```

## Using SQL CASE to filter data

You can also use the `CASE` statement to filter data based on specific conditions. The example below demonstrates how to filter the `Invoice` table to include only invoices from the USA and Canada that have a `Total` value above their country-specific threshold.

Due to the `Total` field being a Decimal in the source table, it represented as string in Debezium and needs to be cast to `REAL` type for comparison in the `CASE` statement.
Not casting it will result in an incorrect comparison results and incorrect filtering.

```yaml
source:
  table: Invoice

transform:
  - uses: filter
    with:
      language: sql
      expression: |
        CASE
          WHEN BillingCountry = 'USA' AND CAST(Total AS REAL) > 11.99 THEN True
          WHEN BillingCountry = 'Canada' AND CAST(Total AS REAL) > 9.99 THEN True
          ELSE False
        END
```
