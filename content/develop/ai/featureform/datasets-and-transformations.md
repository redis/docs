---
title: Datasets and transformations in Featureform
description: Register datasets and define SQL or DataFrame transformations for Featureform features.
linkTitle: Datasets and transformations
weight: 40
---

Datasets and transformations are the bridge between your raw source data and your feature definitions.

- datasets point Featureform at existing tables or files
- transformations create reusable feature engineering logic on top of those datasets

## Register datasets

Register the source objects that Featureform should treat as named inputs.

### Warehouse tables

```python
transactions = snowflake.register_table(
    name="transactions",
    table="TRANSACTIONS",
    description="Raw transaction table",
)
```

For Snowflake providers, the provider-level `database`, `schema`, and `catalog` configuration determines where Featureform resolves the table unless you override those values during registration.

### Delta tables

```python
transactions = spark.register_delta_table(
    name="transactions",
    database="my_catalog.my_schema",
    table="transactions",
)
```

Use `catalog.schema` in the `database` parameter when you are working with Unity Catalog.

### Apache Iceberg tables

If your provider is configured with an Iceberg-compatible catalog, register the table against that provider and then use it like any other dataset:

```python
orders = snowflake.register_table(
    name="orders_iceberg",
    table="ORDERS_ICEBERG",
    description="Apache Iceberg table registered through the configured catalog",
)
```

You can then reference the Iceberg-backed dataset in transformations:

```python
@snowflake.sql_transformation(inputs=[orders])
def recent_orders(orders):
    return """
    SELECT
        order_id,
        customer_id,
        order_total,
        order_timestamp
    FROM {{ orders }}
    WHERE order_timestamp >= DATEADD(day, -30, CURRENT_TIMESTAMP())
    """
```

### File-based datasets

```python
events = spark.register_file(
    name="events",
    file_path="s3://my-bucket/events/transactions.parquet",
    description="Event data stored in parquet",
)
```

Spark providers also support JSON-backed primary sources:

```python
events = spark.register_json(
    name="raw_events",
    file_path="s3://my-bucket/events.jsonl",
)
```

Flatten JSON-backed sources in a transformation before you use them for features or labels.

Choose dataset types that match your source-of-truth platform. The goal is to create stable named inputs that other definitions can depend on.

## SQL transformations

Use SQL transformations when your provider is SQL-native and the logic is easiest to express in SQL:

```python
@snowflake.sql_transformation(inputs=[transactions])
def user_spend(transactions):
    return """
        SELECT
            user_id,
            AVG(amount) AS avg_transaction_amount,
            MAX(timestamp) AS latest_transaction
        FROM {{ transactions }}
        GROUP BY user_id
    """
```

For Snowflake providers configured with an Iceberg catalog, you can also create dynamic-table-backed transformations:

```python
from featureform import SnowflakeDynamicTableConfig, RefreshMode, Initialize

@snowflake.sql_transformation(
    inputs=[transactions],
    resource_snowflake_config=SnowflakeDynamicTableConfig(
        refresh_mode=RefreshMode.INCREMENTAL,
        initialize=Initialize.ON_CREATE,
        target_lag="30 minutes",
    )
)
def incremental_user_features(transactions):
    return """
    SELECT
        user_id,
        AVG(amount) AS avg_amount,
        COUNT(*) AS tx_count,
        MAX(timestamp) AS last_tx
    FROM {{ transactions }}
    GROUP BY user_id
    """
```

## DataFrame transformations

Use DataFrame transformations when you need programmatic control or Spark-native operations:

```python
@spark.df_transformation(inputs=[transactions])
def user_transaction_features(transactions_df):
    from pyspark.sql import functions as F

    return transactions_df.groupBy("user_id").agg(
        F.avg("amount").alias("avg_transaction_amount"),
        F.count("*").alias("transaction_count"),
        F.max("timestamp").alias("latest_transaction"),
    )
```

## Chaining transformations

You can build transformations on top of other transformations. This keeps feature engineering logic modular and easier to review:

```python
@spark.df_transformation(inputs=[user_transaction_features])
def high_value_users(features_df):
    return features_df.filter("avg_transaction_amount > 100")
```

## Accessing transformation data

For development and validation, Featureform can retrieve the output of registered datasets or transformations as data frames:

```python
df = client.dataframe(user_transaction_features)
```

Use this sparingly in production workflows. Its main value is validation and iteration.

## Apply registrations

Once datasets and transformations are defined, register them with Featureform:

```python
client.apply()
```

This step records the metadata and dependency graph so later resources, such as features and training sets, can reference them.

## Best practices

- Register stable business-level datasets, not every transient table.
- Keep transformation names descriptive and reusable.
- Push provider-specific parsing, casting, and joins into transformations before defining features.
- Include timestamps where temporal correctness matters later in training or serving.

## What to read next

- [Define features and labels]({{< relref "/develop/ai/featureform/features-and-labels" >}})
- [Work with training sets and feature views]({{< relref "/develop/ai/featureform/training-sets-and-feature-views" >}})
