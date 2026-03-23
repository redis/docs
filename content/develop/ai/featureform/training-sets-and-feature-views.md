---
title: Training sets and feature views in Featureform
description: Build training sets and materialize feature views to Redis with Featureform.
linkTitle: Training sets and feature views
weight: 60
---

Training sets and feature views are where Featureform turns definitions into outputs that model builders and applications can use.

- training sets support model development
- feature views support online inference

## Register metadata first

In the current workflow, `client.apply()` registers metadata for providers, datasets, transformations, entities, features, and labels:

```python
client.apply()
```

This is a separate step from creating the Redis-backed serving surface.

## Training sets

Register a training set by combining a label with the features you want to train on:

```python
fraud_training_set = client.register_training_set(
    name="fraud_training_set",
    label=User.is_fraud,
    features=[
        User.avg_transaction_amount,
        User.transaction_count[timedelta(days=7)],
    ],
)
```

After registration, iterate over the training set or convert it to a data frame for analysis:

```python
training_df = client.dataframe(fraud_training_set)
```

## Feature views

Materialize a feature view to Redis when you need online serving:

```python
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

Use feature views to group the online features that an application or model needs at inference time.

## Serve feature values

```python
result = client.serve_feature_view(
    view="user_features_view",
    entity_ids=["user_1", "user_2"],
)
```

The result contains the latest materialized values stored in Redis for those entity IDs.

## Common point of confusion

Keep these two steps separate in your mental model:

- `client.apply()` registers definitions and lineage
- `client.materialize_feature_view(...)` creates the serving surface in Redis

That distinction matters when you troubleshoot missing online data. A successful metadata registration does not, by itself, mean the feature view is ready for serving.

## Best practices

- Use training sets for repeatable model development workflows.
- Keep online feature views focused on the features needed by one serving surface.
- Treat Redis as the online system of record for materialized feature views, not the source of offline feature computation.

## What to read next

- [Streaming features]({{< relref "/develop/ai/featureform/streaming" >}})
- [Deploy and operate Featureform]({{< relref "/operate/featureform/" >}})
