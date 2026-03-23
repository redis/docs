---
title: Featureform quickstart
description: Register providers, define a feature, materialize it to Redis, and serve it.
linkTitle: Quickstart
weight: 20
---

This quickstart helps you register a simple Featureform workflow and serve feature values from Redis.

You'll do the following:

1. Connect to Featureform.
2. Register an offline provider and a Redis online store.
3. Register a dataset and define a transformation.
4. Define an entity and features.
5. Register metadata.
6. Materialize a feature view to Redis.
7. Serve feature values.

At the end, you'll have a Featureform feature view backed by Redis and a working `serve_feature_view(...)` call.

## Before you begin

Before you start, make sure you have:

- a running Featureform deployment
- access to an offline system, such as Databricks or Spark
- access to a Redis deployment for online serving
- credentials for the systems you register in this guide

For platform setup, see [Deploy and operate Featureform]({{< relref "/operate/featureform/" >}}).

## Connect to Featureform

```python
import featureform as ff

client = ff.Client(host="your-featureform-host:443")
```

For local development, you might use an insecure endpoint:

```python
client = ff.Client(host="localhost:7878", insecure=True)
```

## Register providers

This example uses Databricks as the offline provider and Redis as the online store.

```python
import featureform as ff

aws_creds = ff.AWSStaticCredentials(
    access_key="your_aws_access_key",
    secret_key="your_aws_secret_key",
)

s3 = client.register_s3(
    name="s3-store",
    credentials=aws_creds,
    bucket_name="my-featureform-bucket",
    bucket_region="us-east-1",
)

databricks = ff.DatabricksCredentials(
    host="https://your-workspace.cloud.databricks.com",
    token="your_databricks_token",
    cluster_id="your_cluster_id",
)

spark = client.register_spark(
    name="databricks-prod",
    executor=databricks,
    filestore=s3,
)

redis = client.register_redis(
    name="redis-prod",
    host="redis.example.com",
    port=6379,
    password="redis_password",
)
```

## Register a dataset and transformation

Next, register a dataset from the offline system and define a transformation that computes feature values.

```python
transactions = spark.register_delta_table(
    name="transactions",
    database="my_catalog.my_schema",
    table="transactions",
    description="Raw transaction data",
)

@spark.df_transformation(inputs=[transactions])
def user_transaction_features(transactions_df):
    from pyspark.sql import functions as F

    return transactions_df.groupBy("user_id").agg(
        F.avg("amount").alias("avg_transaction_amount"),
        F.count("*").alias("transaction_count"),
        F.max("timestamp").alias("latest_transaction"),
    )
```

## Define an entity and features

Define an entity class, then attach features to it.

```python
from datetime import timedelta

@ff.entity
class User:
    avg_transaction_amount = (
        ff.Feature()
        .from_dataset(
            user_transaction_features,
            entity="user_id",
            values="avg_transaction_amount",
            timestamp="latest_transaction",
        )
    )

    transaction_count = (
        ff.Feature()
        .from_dataset(
            transactions,
            entity="user_id",
            values="amount",
            timestamp="timestamp",
        )
        .aggregate(
            function=ff.AggregateFunction.COUNT,
            windows=[timedelta(days=7), timedelta(days=30)],
        )
    )
```

## Register metadata, then materialize

`client.apply()` registers providers, datasets, transformations, and feature definitions. In the current workflow, it does not create the online serving surface by itself.

```python
client.apply()

client.materialize_feature_view(
    view_name="user_features_view",
    inference_store=redis,
    features=[
        User.avg_transaction_amount,
        User.transaction_count[timedelta(days=7)],
        User.transaction_count[timedelta(days=30)],
    ],
)
```

## Serve features

After the feature view is materialized, retrieve feature values by entity ID:

```python
features = client.serve_feature_view(
    view="user_features_view",
    entity_ids=["user_123", "user_456"],
)
```

## What to read next

- [Connect providers]({{< relref "/develop/ai/featureform/providers" >}})
- [Define datasets and transformations]({{< relref "/develop/ai/featureform/datasets-and-transformations" >}})
- [Define features and labels]({{< relref "/develop/ai/featureform/features-and-labels" >}})
- [Deploy and operate Featureform]({{< relref "/operate/featureform/" >}})
