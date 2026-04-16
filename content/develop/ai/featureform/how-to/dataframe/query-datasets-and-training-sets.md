---
title: Query datasets and training sets
description: Use ff dataframe query to read datasets, training sets, or feature views through the Flight endpoint.
linkTitle: Query data
weight: 10
---

Use this command when the target dataset, training set, or feature view already exists and you want to inspect rows directly.

## Query a dataset

```bash
ff dataframe query demo_transactions \
  --workspace demo-workspace \
  --server localhost:9090 \
  --kind dataset \
  --limit 10 \
  --insecure
```

## Supported kinds

- `dataset`
- `training_set`
- `feature_view`

## Useful flags

- `--columns`
- `--filter`
- `--limit`
- `--output table|json|csv`

The dataframe command talks to the Flight endpoint on the gRPC side, so transport and endpoint mismatches are common troubleshooting points.
