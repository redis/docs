---
title: Providers and workspaces
description: Build stream-backed features with Kafka, streaming transformations, and Redis serving.
linkTitle: Providers and workspaces
weight: 70
---

Redis Feature Form supports multiple providers, secrets provider management, and workspaces.

## Register providers

Registering a provider binds one workspace to an external system used for storage, compute, serving, or catalog-backed access. Definitions files refer to providers by name, so provider registration comes first.

### Register a Postgres provider

```bash
ff provider register demo_postgres \
  --workspace <workspace-id> \
  --type postgres \
  --pg-host <release-name>-featureform-provider-postgres \
  --pg-port 5432 \
  --pg-database featureform_test \
  --pg-user testuser \
  --pg-password-secret env:PG_PASSWORD \
  --pg-ssl-mode disable
```

### Register a Redis provider

```bash
ff provider register demo_redis \
  --workspace <workspace-id> \
  --type redis \
  --redis-host <release-name>-featureform-redis \
  --redis-port 6379
```

If your deployment uses bundled provider addons, the default service names typically include the Helm release name. Otherwise, use the reachable hostnames for your external systems.

### Verify registration

```bash
ff provider list --workspace <workspace-id>
ff provider get demo_postgres --workspace <workspace-id>
```

Provider registration performs health validation by default. Fix connectivity or secret-resolution failures instead of treating `--skip-health-check` as the standard path.

## Postgres provider setup

```json metadata
{
  "title": "Postgres provider setup",
  "description": "Register a Postgres provider for offline storage and SQL execution in Featureform.",
  "categories": null,
  "tableOfContents": {"sections":[{"id":"registration","title":"Registration"},{"id":"provider-role","title":"Provider role"}]}

,
  "codeExamples": []
}
```
Use Postgres when the workspace needs an offline store and Postgres-backed SQL execution in the same path.

### Registration

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

### Provider role

`offline-store`, `compute`

The password reference is resolved through the workspace secret provider at runtime.

## Redis provider setup

```json metadata
{
  "title": "Redis provider setup",
  "description": "Register Redis as the online store used by Featureform feature-view serving.",
  "categories": null,
  "tableOfContents": {"sections":[{"id":"registration","title":"Registration"},{"id":"provider-role","title":"Provider role"}]}

,
  "codeExamples": []
}
```
Use Redis when the workspace needs an online store for low-latency feature serving.

### Registration

```bash
ff provider register demo_redis \
  --workspace demo-workspace \
  --type redis \
  --redis-host <release-name>-featureform-redis \
  --redis-port 6379
```

### Provider role

`online-store`

In the quickstart definitions file, the feature view references this provider with `inference_store="demo_redis"`.

## S3 provider setup

```json metadata
{
  "title": "S3 provider setup",
  "description": "Register an S3 provider for Featureform offline-store-backed object locations.",
  "categories": null,
  "tableOfContents": {"sections":[{"id":"registration","title":"Registration"},{"id":"provider-role","title":"Provider role"}]}

,
  "codeExamples": []
}
```
Use S3 when Featureform needs an object-storage-backed offline location.

### Registration

```bash
ff provider register data-lake \
  --workspace demo-workspace \
  --type s3 \
  --s3-bucket featureform-data \
  --s3-region us-west-2 \
  --s3-access-key-id-secret env:AWS_ACCESS_KEY_ID \
  --s3-secret-access-key-secret env:AWS_SECRET_ACCESS_KEY
```

### Provider role

`offline-store`

Use `--s3-endpoint` for MinIO or LocalStack-style endpoints when needed.

## Spark provider setup

```json metadata
{
  "title": "Spark provider setup",
  "description": "Register a Spark compute provider for Featureform transformation and materialization workloads.",
  "categories": null,
  "tableOfContents": {"sections":[{"id":"minimal-registration","title":"Minimal registration"},{"id":"provider-role","title":"Provider role"}]}

,
  "codeExamples": []
}
```
Use Spark when the workspace needs a compute provider for transformation or materialization workloads.

### Minimal registration

```bash
ff provider register spark-main \
  --workspace demo-workspace \
  --type spark \
  --spark-master spark://spark-master:7077
```

### Provider role

`compute`

Keep Spark registration separate from dataset authoring and from Iceberg catalog registration.

## Iceberg provider setup

```json metadata
{
  "title": "Iceberg provider setup",
  "description": "Register an Iceberg catalog provider for Featureform offline-store workflows.",
  "categories": null,
  "tableOfContents": {"sections":[{"id":"registration","title":"Registration"},{"id":"provider-role","title":"Provider role"}]}

,
  "codeExamples": []
}
```
Use an Iceberg catalog provider when the workspace needs catalog-backed offline storage.

### Registration

```bash
ff provider register iceberg-main \
  --workspace demo-workspace \
  --type iceberg_catalog \
  --iceberg-warehouse s3://featureform-data/warehouse \
  --iceberg-catalog-name featureform \
  --iceberg-rest-uri https://iceberg.example.com
```

### Provider role

`offline-store`

The exact required fields depend on the catalog backend you choose.

## Configure secret providers

Use this section to confirm which secret backend a workspace will use and to register additional backends when `env` is not enough.

### Check the built-in `env` provider

```bash
ff secret-provider list --workspace demo-workspace
ff secret-provider get env --workspace demo-workspace
```

### Register another secret provider

Environment provider:

```bash
ff secret-provider register local-env \
  --workspace demo-workspace \
  --type env \
  --env-prefix FF_
```

Vault:

```bash
ff secret-provider register vault-main \
  --workspace demo-workspace \
  --type vault \
  --vault-address https://vault.example.com \
  --vault-token-path /var/run/secrets/vault-token
```

Kubernetes:

```bash
ff secret-provider register k8s-main \
  --workspace demo-workspace \
  --type k8s \
  --k8s-namespace featureform \
  --k8s-secret-name provider-secrets
```

AWS Secrets Manager:

```bash
ff secret-provider register aws-main \
  --workspace demo-workspace \
  --type aws \
  --aws-region us-west-2
```

### Update or delete

```bash
ff secret-provider update local-env \
  --workspace demo-workspace \
  --env-prefix PROD_

ff secret-provider delete local-env \
  --workspace demo-workspace \
  --yes
```

## Manage workspaces

Use these commands when you need to inspect or change a workspace directly.

### Core commands

```bash
ff workspace list
ff workspace get --name demo-workspace
ff workspace update <workspace-id> \
  --name demo-workspace \
  --description "Updated description"
ff workspace delete <workspace-id> --force
```

### Workspace state to remember

- workspaces have unique names and descriptions
- each workspace tracks `last_applied_version`
- providers, secret providers, graph state, catalog entries, and serving metadata are workspace-scoped

Deleting a workspace removes its associated workspace-scoped data.


