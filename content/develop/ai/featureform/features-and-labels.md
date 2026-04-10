---
title: Features and labels in Redis Feature Form
description: Define entities, features, labels, and aggregate windows in Feature Form.
linkTitle: Features and labels
weight: 50
---

Features and labels are the core semantic objects in Feature Form. They describe what you want to predict, how feature values are keyed, and how those values should be computed over time.

## Entities

An entity represents the business object that features belong to, such as a user, merchant, account, device, or product.

```python
@ff.entity
class User:
    pass
```

Attach features and labels to the entity class so Feature Form can reason about keys and lineage.

## Define features

Use the builder-style API to define features from registered datasets or transformations:

```python
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
```

## Aggregate features

Aggregate features create time-windowed feature values from event data:

```python
from datetime import timedelta

@ff.entity
class User:
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

Access a specific window by indexing the feature with the matching `timedelta`:

```python
count_7d = User.transaction_count[timedelta(days=7)]
```

## Define labels

Labels represent the target you want to predict:

```python
@ff.entity
class User:
    is_fraud = (
        ff.Label()
        .from_dataset(transactions)
        .value("is_fraud")
        .timestamp("timestamp")
        .entity("user", "user_id")
        .description("Binary fraud classification label")
    )
```

## Point-in-time correctness

Timestamps are central to correct ML training and serving workflows. When you include the relevant event timestamp in your feature and label definitions, Feature Form can align historical examples correctly instead of leaking future information into the training data.

Use timestamps consistently when:

- defining event-derived features
- defining labels with historical outcomes
- creating aggregate windows
- building training sets from time-varying data

## Best practices

- Model entities after real business keys that your applications already use.
- Prefer the builder-style feature API for new work.
- Add timestamps wherever feature values change over time.
- Keep feature names stable and descriptive so they can be reused across training sets and feature views.

## What to read next

- [Work with training sets and feature views]({{< relref "/develop/ai/featureform/training-sets-and-feature-views" >}})
- [Streaming features]({{< relref "/develop/ai/featureform/streaming" >}})
