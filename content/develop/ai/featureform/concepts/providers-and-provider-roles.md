---
title: Providers and provider roles
description: Understand how Featureform maps registered providers to offline, online, compute, and streaming roles.
linkTitle: Providers
weight: 20
---

A provider is a workspace-scoped connection to external infrastructure. Definitions files reference providers by name, but the provider itself must already be registered in the workspace.

## Provider roles

- `offline-store` for batch data and materialized datasets
- `online-store` for low-latency serving
- `compute` for transformations and materialization work
- `streaming` for streaming integrations

## Core providers documented here

- Postgres: `offline-store`, `compute`
- Redis: `online-store`
- S3: `offline-store`
- Spark: `compute`
- Iceberg catalog: `offline-store`

## Workflow mapping

- Datasets and training sets need an offline store.
- Feature views need an online store.
- SQL and Spark transformations need compute.
- One provider can fill more than one role.

## Read next

- [Register providers]({{< relref "/develop/ai/featureform/how-to/providers/register-providers" >}})
- [Provider-specific setup]({{< relref "/develop/ai/featureform/how-to/providers/provider-specific-setup" >}})
