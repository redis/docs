---
title: Inspect materialized locations
description: Use the Featureform catalog to see which provider and physical location back a logical resource.
linkTitle: Inspect locations
weight: 10
---

The Featureform catalog records where Featureform-managed resources physically landed after apply and materialization. It is distinct from systems such as Unity Catalog, Glue, or an Iceberg catalog.

## List catalog entries

```bash
ff catalog list --workspace <workspace-id>
```

## Inspect one resource

```bash
ff catalog get demo_transactions --workspace <workspace-id>
```

## The catalog shows

- logical resource name
- owning provider
- status
- physical table, path, or namespace
- update timestamps

Use the catalog together with graph views: graph explains why a resource exists; catalog shows where it landed.
