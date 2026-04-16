---
title: Iceberg provider setup
description: Register an Iceberg catalog provider for Featureform offline-store workflows.
linkTitle: Iceberg
weight: 50
---

Use an Iceberg catalog provider when the workspace needs catalog-backed offline storage.

## Registration

```bash
ff provider register iceberg-main \
  --workspace demo-workspace \
  --type iceberg_catalog \
  --iceberg-warehouse s3://featureform-data/warehouse \
  --iceberg-catalog-name featureform \
  --iceberg-rest-uri https://iceberg.example.com
```

## Provider role

`offline-store`

The exact required fields depend on the catalog backend you choose.
