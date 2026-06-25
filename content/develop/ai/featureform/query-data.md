---
title: Query data
description: Inspect the Redis Feature Form catalog and query datasets, training sets, and feature views with the ff CLI.
linkTitle: Query data
weight: 70
---

After you apply resources, two commands help you inspect the result: `ff catalog` reports where each resource was materialized, and `ff dataframe query` reads sampled rows from datasets, training sets, and feature views.

## Inspect materialized locations

The Feature Form catalog records where each resource is physically materialized. It is distinct from systems such as Unity Catalog, Glue, or an Iceberg catalog. Each catalog entry shows the logical resource name, owning provider, status, physical table/path/namespace, and update timestamps.

### List catalog entries

```bash
ff catalog list --workspace <workspace-id>
```

### Inspect one resource

```bash
ff catalog get demo_transactions --workspace <workspace-id>
```

Use the catalog together with graph views: graph explains why a resource exists; catalog shows where it's materialized.

## Query datasets, training sets, and feature views

Use `ff dataframe query` to inspect rows from a dataset, training set, or feature view after it's been applied.

### Query a dataset

```bash
ff dataframe query demo_transactions \
  --workspace <workspace-id> \
  --server localhost:9090 \
  --kind dataset \
  --limit 10 \
  --insecure
```

### Supported kinds

- `dataset`
- `training_set`
- `feature_view`

### Useful flags

- `--columns`
- `--filter`
- `--limit`
- `--output table|json|csv`

The dataframe command uses the gRPC Flight endpoint. Connection failures usually indicate transport or endpoint mismatches with the Feature Form server.
