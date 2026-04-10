---
Title: Redis Feature Form
alwaysopen: false
categories:
- docs
- develop
- ai
description: Build feature engineering workflows with Redis Feature Form.
linkTitle: Redis Feature Form
hideListLinks: true
weight: 60
bannerText: Redis Feature Form is currently in preview and subject to change. To request access to the Feature Form Docker image, contact your Redis account team.
bannerChildren: true
---

Redis Feature Form helps data teams define, materialize, and serve machine learning features by using a declarative Python SDK on top of existing data systems.

Feature Form works with offline systems such as Snowflake, BigQuery, and Databricks or Spark, then uses Redis as the low-latency online store for feature serving.

## Get started

- [Overview]({{< relref "/develop/ai/featureform/overview" >}})
- [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}})
- [Connect providers]({{< relref "/develop/ai/featureform/providers" >}})
- [Define datasets and transformations]({{< relref "/develop/ai/featureform/datasets-and-transformations" >}})
- [Define features and labels]({{< relref "/develop/ai/featureform/features-and-labels" >}})
- [Work with training sets and feature views]({{< relref "/develop/ai/featureform/training-sets-and-feature-views" >}})

## Latest updates

The latest release adds enterprise-oriented capabilities:

- **Unified batch and streaming pipelines**: Support for tiling, backfills, and incremental updates reduces custom pipeline work.
- **Workspaces for multi-tenancy**: Isolate providers, data, authentication, and observability at the workspace level.
- **Fine-grained job control**: Planning, impact analysis, split materializations, and queue-based job management provide visibility into changes before they affect production systems.
- **Atomic DAG updates**: Manage graph-level changes atomically instead of versioning individual resources, which simplifies rollback and change history.
- **Enhanced RBAC and security**: Workspace-scoped access controls, API key pairs, a granular role model, audit logs, secret-provider improvements, mTLS, and encrypted internal transport.
- **Two-service deployment model**: A simplified deployment architecture that reduces operational complexity.
- **Redesigned dashboard**: Configure workspaces and providers directly from the UI.

## Next steps

- [Streaming features]({{< relref "/develop/ai/featureform/streaming" >}})

## What this section covers

- The Python SDK workflow for registering providers, datasets, transformations, entities, features, labels, training sets, and feature views
- The distinction between metadata registration and materialization in the current API
- Point-in-time correct feature definitions for both batch and streaming workflows
