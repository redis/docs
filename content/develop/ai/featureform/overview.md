---
title: Redis Feature Form overview
description: Learn what Redis Feature Form is, who it is for, and how it fits into Redis-based ML workflows.
linkTitle: Overview
weight: 10
---

Redis Feature Form is a feature engineering and feature serving workflow built for teams that want to define machine learning features in code while keeping their existing data platforms. It gives application teams a declarative Python SDK for working with providers, datasets, transformations, entities, features, labels, training sets, and online feature serving.

In a typical deployment, Feature Form reads or computes feature data in an offline system such as Snowflake, BigQuery, or Databricks and materializes selected features to Redis for low-latency inference.

## Core workflow

The Feature Form workflow follows a consistent progression:

1. Register providers for your offline systems and your Redis online store.
2. Register datasets that represent raw inputs or curated tables.
3. Define SQL or DataFrame transformations for feature engineering logic.
4. Define entities, features, and labels in the Python SDK.
5. Register metadata with `client.apply()`.
6. Materialize feature views to Redis for serving.
7. Retrieve online values at inference time or create training sets for model development.

## Where Redis fits

Redis is the online inference store in the Feature Form workflow. After you materialize a feature view, applications can retrieve feature values with low latency for prediction requests, personalization, fraud detection, recommendation systems, and similar ML use cases.

## Main interfaces

The main user-facing interface is the Python SDK:

- `ff.Client(...)` to connect to Feature Form
- provider registration methods such as `register_snowflake`, `register_spark`, and `register_redis`
- decorators and builder APIs for transformations, features, and labels
- materialization and serving methods such as `materialize_feature_view(...)` and `serve_feature_view(...)`

Feature Form also includes a dashboard for viewing registered resources and tasks, but the Python SDK is the primary authoring interface.

## Latest updates

The latest release adds enterprise-oriented capabilities:

- **Unified batch and streaming pipelines**: Support for tiling, backfills, and incremental updates reduces custom pipeline work.
- **Workspaces for multi-tenancy**: Isolate providers, data, authentication, and observability at the workspace level.
- **Fine-grained job control**: Planning, impact analysis, split materializations, and queue-based job management provide visibility into changes before they affect production systems.
- **Atomic DAG updates**: Manage graph-level changes atomically instead of versioning individual resources, which simplifies rollback and change history.
- **Enhanced RBAC and security**: Workspace-scoped access controls, API key pairs, a granular role model, audit logs, secret-provider improvements, mTLS, and encrypted internal transport.
- **Two-service deployment model**: A simplified deployment architecture that reduces operational complexity.
- **Redesigned dashboard**: Configure workspaces and providers directly from the UI.

## What to read next

- [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}})
- [Connect providers]({{< relref "/develop/ai/featureform/providers" >}})
