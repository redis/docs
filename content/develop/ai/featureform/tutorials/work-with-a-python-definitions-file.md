---
title: Work with a Python definitions file
description: Understand how a Featureform definitions entrypoint maps to workspace graph resources and how ff apply loads it.
linkTitle: Definitions file
weight: 10
---

Featureform treats a Python definitions file as the source of a desired resource graph. The quickstart example in this repo is intentionally small so you can see how the pieces fit together.

## Quickstart definitions file

This is the complete definitions file used by the published quickstart workflow and first-workflow tutorial.

If you are working from a checkout of the docs repository, the source file also exists at `examples/featureform/docs/resources.py`.

```python
"""Quickstart Featureform definitions for the published documentation set."""

from datetime import timedelta

import featureform as ff
from featureform.types.resource import FeatureView, MaterializationEngine, TrainingSetType

postgres = ff.get_postgres("demo_postgres")

customer = ff.Entity(
    name="demo_customer",
    description="Customer entity for the seeded transactions quickstart",
)

transactions = postgres.dataset(
    name="demo_transactions",
    description="Seeded transaction events loaded into the quickstart Postgres table",
    schema="public",
    table="demo_transactions",
    timestamp_column="event_ts",
)


@postgres.sql_transformation(
    name="customer_daily_rollups",
    description="Daily transaction rollups per customer for aggregate feature computation",
    inputs=[transactions],
)
def customer_daily_rollups() -> str:
    return """
        SELECT
            customer_id,
            date_trunc('day', event_ts) AS event_day,
            COUNT(*) AS transaction_count,
            SUM(transaction_amount) AS total_amount,
            AVG(transaction_amount) AS avg_amount,
            SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) AS fraud_count
        FROM {{demo_transactions}}
        GROUP BY 1, 2
    """


@postgres.sql_transformation(
    name="customer_profile_snapshot",
    description="Latest profile snapshot per customer from the transaction feed",
    inputs=[transactions],
)
def customer_profile_snapshot() -> str:
    return """
        SELECT DISTINCT ON (customer_id)
            customer_id,
            event_ts AS profile_ts,
            COALESCE(cust_account_balance, 0) AS current_balance,
            COALESCE(customer_location, 'UNKNOWN') AS current_location
        FROM {{demo_transactions}}
        ORDER BY customer_id, event_ts DESC
    """


latest_account_balance = (
    ff.Feature(name="demo_latest_account_balance")
    .from_dataset(
        transactions,
        entity="demo_customer",
        entity_column="customer_id",
        value="cust_account_balance",
        timestamp="event_ts",
    )
    .with_provider("demo_postgres")
    .attribute()
)


transaction_amount_sum_30d = (
    ff.Feature(name="demo_transaction_amount_sum_30d")
    .from_dataset(
        transactions,
        entity="demo_customer",
        entity_column="customer_id",
        value="transaction_amount",
        timestamp="event_ts",
    )
    .with_provider("demo_postgres")
    .aggregate(function=ff.AggregateFunction.SUM, window=timedelta(days=30))
)


transaction_count_7d = (
    ff.Feature(name="demo_transaction_count_7d")
    .from_dataset(
        transactions,
        entity="demo_customer",
        entity_column="customer_id",
        value="transaction_amount",
        timestamp="event_ts",
    )
    .with_provider("demo_postgres")
    .aggregate(function=ff.AggregateFunction.COUNT, window=timedelta(days=7))
)


fraud_label = (
    ff.Label()
    .from_dataset(transactions)
    .value("is_fraud")
    .timestamp("event_ts")
    .entity("demo_customer", column="customer_id")
    .with_description("Whether the transaction row was marked as fraud")
    .build()
)


fraud_training_set = ff.TrainingSet(
    name="demo_fraud_training_set",
    description="Training set over the seeded transactions quickstart data",
    provider="demo_postgres",
    features=[
        latest_account_balance,
        transaction_amount_sum_30d,
        transaction_count_7d,
    ],
    label=fraud_label,
    type=TrainingSetType.STATIC,
)


customer_feature_view = FeatureView(
    name="demo_customer_feature_view",
    description="Online feature view backed by Redis for the quickstart",
    entity="demo_customer",
    features=[
        latest_account_balance.name,
        transaction_amount_sum_30d.name,
        transaction_count_7d.name,
    ],
    inference_store="demo_redis",
    materialization_engine=MaterializationEngine.K8S,
)


resources = [
    customer,
    transactions,
    customer_daily_rollups,
    customer_profile_snapshot,
    latest_account_balance,
    transaction_amount_sum_30d,
    transaction_count_7d,
    fraud_label,
    fraud_training_set,
    customer_feature_view,
]
```

## Typical file structure

- import `featureform as ff`
- define entities and datasets
- define transformations
- define features and labels
- define a training set and feature view
- export a `resources = [...]` list

## Supported loading patterns

`ff apply` loads resources from Python in this order:

1. an explicit `resources = [...]` list
2. the auto-registration registry, if no explicit list is present

The explicit list is the clearer onboarding pattern and is what the published quickstart uses.

## The file should reference

- registered provider names such as `demo_postgres` and `demo_redis`
- secret references such as `env:PG_PASSWORD`
- stable resource names that make sense across re-apply cycles

## The file should not do

- replace provider registration
- assume providers exist before the workspace registers them
- mix infrastructure provisioning into the definitions entrypoint

## Read next

[Apply a definitions file]({{< relref "/develop/ai/featureform/how-to/apply/apply-a-definitions-file" >}})
