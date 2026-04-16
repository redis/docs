---
title: Spark provider setup
description: Register a Spark compute provider for Featureform transformation and materialization workloads.
linkTitle: Spark
weight: 40
---

Use Spark when the workspace needs a compute provider for transformation or materialization workloads.

## Minimal registration

```bash
ff provider register spark-main \
  --workspace demo-workspace \
  --type spark \
  --spark-master spark://spark-master:7077
```

## Provider role

`compute`

Keep Spark registration separate from dataset authoring and from Iceberg catalog registration.
