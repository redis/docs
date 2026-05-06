---
title: Concepts
description: Learn the core Feature Form concepts behind workspaces, providers, secrets, and serving.
linkTitle: Concepts
weight: 30
---

These pages explain the resource model and the boundaries that matter when you operate Feature Form.

## Resources and workspace graph

A Feature Form workspace owns one logical resource graph. When you run `ff apply`, Feature Form compares the submitted desired state with the current graph and commits a new version if the change is accepted.

### Resource types in the graph

- entities
- datasets
- transformations
- features
- labels
- training sets
- feature views

### Why the graph matters

- it powers lineage and dependency views
- it tracks `last_applied_version`
- it feeds serving metadata from committed state

### Useful commands

```bash
ff graph workspace overview --workspace demo-workspace
ff graph workspace stats --workspace demo-workspace
ff graph dataset get demo_transactions --workspace demo-workspace
ff graph feature-view get demo_customer_feature_view --workspace demo-workspace
```

## Providers and provider roles

A provider is a workspace-scoped connection to external infrastructure. Definitions files reference providers by name, but the provider itself must already be registered in the workspace.

### Provider roles

- `offline-store` for batch data and materialized datasets
- `online-store` for low-latency serving
- `compute` for transformations and materialization work
- `streaming` for streaming integrations

### Core providers documented here

- Postgres: `offline-store`, `compute`
- Redis: `online-store`
- S3: `offline-store`
- Spark: `compute`
- Iceberg catalog: `offline-store`

### Workflow mapping

- Datasets and training sets need an offline store.
- Feature views need an online store.
- SQL and Spark transformations need compute.
- One provider can fill more than one role.


## Secrets and secret references

Feature Form stores secret references in provider configuration instead of storing plaintext secret values itself. A provider config can contain a reference like `env:PG_PASSWORD`, which Feature Form resolves through a registered secret provider at runtime.

### Mental model

- A secret provider is a workspace-scoped backend such as `env`, Vault, Kubernetes, or AWS Secrets Manager
- A secret reference is the value stored in provider config
- Data providers use secret references but do not own secret storage

### Default path for a new workspace

Every new workspace creates a built-in `env` secret provider. That makes references such as `env:PG_PASSWORD` valid as long as the runtime environment actually exposes `PG_PASSWORD`.

The important detail is runtime scope: in deployed environments, the resolving process is usually the Featureform server, not your local CLI shell.

### What Featureform stores

- Secret provider metadata and configuration
- Secret references embedded in provider configuration

### What Featureform does not store

- Plaintext secret values from external backends

## Serving and feature views

A feature view is the serving interface for a set of features keyed by an entity. In the documented Redis-backed workflow, the feature view is what applications and model services read from at inference time.

### A feature view includes

- the feature-view name
- the logical entity and key columns
- the served feature schema
- the online provider
- serving version and key-prefix details

### Serving requires

- a registered online store such as Redis
- a committed graph version containing the feature view
- ready serving metadata for that workspace and view

### Main entry points

- gRPC: `ServingService.Serve`, `ServingService.GetServingMetadata`
- REST: `/api/v1/serve`
- Python client: `client.serve(...)`

Serving reads and serving-metadata reads are separate RBAC permissions.

