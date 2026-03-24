---
title: Featureform overview
description: Learn what Featureform is, who it is for, and how it fits into Redis-based ML workflows.
linkTitle: Overview
weight: 10
---

Featureform is a feature engineering and feature serving workflow built for teams that want to define machine learning features in code while keeping their existing data platforms. It gives application teams a declarative Python SDK for working with providers, datasets, transformations, entities, features, labels, training sets, and online feature serving.

In a typical deployment, Featureform reads or computes feature data in an offline system such as Snowflake, BigQuery, or Databricks and materializes selected features to Redis for low-latency inference.

## Core workflow

The Featureform workflow follows a consistent progression:

1. Register providers for your offline systems and your Redis online store.
2. Register datasets that represent raw inputs or curated tables.
3. Define SQL or DataFrame transformations for feature engineering logic.
4. Define entities, features, and labels in the Python SDK.
5. Register metadata with `client.apply()`.
6. Materialize feature views to Redis for serving.
7. Retrieve online values at inference time or create training sets for model development.

## Where Redis fits

Redis is the online inference store in the Featureform workflow. After you materialize a feature view, applications can retrieve feature values with low latency for prediction requests, personalization, fraud detection, recommendation systems, and similar ML use cases.

## Main interfaces

The main user-facing interface is the Python SDK:

- `ff.Client(...)` to connect to Featureform
- provider registration methods such as `register_snowflake`, `register_spark`, and `register_redis`
- decorators and builder APIs for transformations, features, and labels
- materialization and serving methods such as `materialize_feature_view(...)` and `serve_feature_view(...)`

Featureform also includes a dashboard for viewing registered resources and tasks, but the Python SDK is the primary authoring interface.

## What to read next

- [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}})
- [Connect providers]({{< relref "/develop/ai/featureform/providers" >}})
