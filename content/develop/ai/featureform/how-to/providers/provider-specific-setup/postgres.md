---
title: Postgres provider setup
description: Register a Postgres provider for offline storage and SQL execution in Featureform.
linkTitle: Postgres
weight: 10
---

Use Postgres when the workspace needs an offline store and Postgres-backed SQL execution in the same path.

## Registration

```bash
ff provider register demo_postgres \
  --workspace demo-workspace \
  --type postgres \
  --pg-host <release-name>-featureform-provider-postgres \
  --pg-port 5432 \
  --pg-database featureform_test \
  --pg-user testuser \
  --pg-password-secret env:PG_PASSWORD \
  --pg-ssl-mode disable
```

## Provider role

`offline-store`, `compute`

The password reference is resolved through the workspace secret provider at runtime.
