---
title: Python client and DSL reference
description: Review the main Featureform Python client APIs, resource types, helpers, and common authoring patterns.
linkTitle: Python client and DSL
weight: 10
---

This page indexes the main public Python surface exported from `featureform`.

## Client APIs

- `ff.Client`
- `ff.WorkspaceClient`
- `ff.ProviderClient`
- `ff.SecretProviderClient`
- `ff.ApplyResult`
- `ff.ApplyWaitResult`

## Common error types

- `ff.FeatureformError`
- `ff.ConnectionError`
- `ff.InvalidArgumentError`
- `ff.NotFoundError`
- `ff.TimeoutError`
- `ff.ValidationError`

## Secret-provider and provider helpers

- `ff.EnvSecretProvider`
- `ff.VaultSecretProvider`
- `ff.K8sSecretProvider`
- `ff.PostgresProvider`
- `ff.RedisProvider`
- `ff.S3Provider`
- `ff.SparkProvider`
- `ff.get_postgres(name)`
- `ff.get_provider(name)`

## Core resource types

- `ff.Entity`
- `ff.Dataset`
- `ff.Feature`
- `ff.Label`
- `ff.TrainingSet`
- `ff.FeatureView`

## Common pattern

```python
postgres = ff.get_postgres("demo_postgres")
transactions = postgres.dataset(name="transactions")
```

The onboarding quickstart in this repo uses an explicit `resources = [...]` list because it is easier to reason about during apply.
