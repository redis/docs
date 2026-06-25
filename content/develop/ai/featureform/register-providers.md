---
title: Register providers
description: Register storage, compute, and catalog providers in a Redis Feature Form workspace, and configure secret backends.
linkTitle: Register providers
weight: 30
aliases:
- /develop/ai/featureform/streaming/
---

Register the providers and secret backends Redis Feature Form needs before you author features or transformations. Providers connect the workspace to external systems for storage, compute, serving, or catalog-backed access, and definitions files reference them by name.

## Prerequisites

Before you register providers, make sure you have:

- A workspace. See [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}) for the workspace lifecycle commands.
- The `ff` CLI installed and able to reach the Feature Form server.
  - The CLI connects to `localhost:9090` by default; override with `--server <host:port>` or by setting `ServerAddress` in `~/.featureform/config.yaml`.
- A secret provider registered to back any credentials your provider commands reference. Each workspace ships with a default `env` secret provider that reads from Feature Form server's process environment. To use Vault, Kubernetes secrets, or AWS Secrets Manager instead, register that backend before you register providers that reference it. See [Configure secret providers](#configure-secret-providers).

The examples on this page use placeholder names like `demo-workspace`, `demo_postgres`, and `spark-main`. Substitute the names you want to use in your own deployment.

{{< note >}}
**Best practice:** keep the default health check on. Registration surfaces connectivity and secret-resolution problems at the point you can fix them, rather than as silent failures during materialization or serving. Reserve `--skip-health-check` for cases where you've already validated the provider through another channel.
{{< /note >}}

## Configure secret providers

Each workspace starts with a default `env` secret provider that resolves references such as `env:PG_PASSWORD` from Feature Form server's process environment. Production deployments typically move off `env` because it mixes secrets with general configuration, offers no rotation or audit, and surfaces values in process listings. Vault, Kubernetes secrets, and AWS Secrets Manager each address those gaps.

### Check the built-in `env` secret provider

```bash
ff secret-provider list --workspace demo-workspace
ff secret-provider get env --workspace demo-workspace
```

### Register another secret provider

Each backend has different preconditions on the Feature Form server. Pick the one that matches how your server is deployed.

**Environment secret provider** — best for local development and bootstrap. The server reads variables from its own process environment. Use a prefix (`--env-prefix FF_`) to avoid collisions with other system variables.

```bash
ff secret-provider register local-env \
  --workspace demo-workspace \
  --type env \
  --env-prefix FF_
```

**Vault** — best for shared deployments that need rotation and audit. The server must be able to authenticate to Vault: export `VAULT_TOKEN` for token auth, or configure Kubernetes auth (when the server runs in-cluster) or AppRole. The backend uses the KV v2 secrets engine.

```bash
ff secret-provider register vault-main \
  --workspace demo-workspace \
  --type vault \
  --vault-address https://vault.example.com \
  --vault-token-path /var/run/secrets/vault-token
```

**Kubernetes secrets** — best when the server runs inside a Kubernetes cluster and provider credentials are already managed as `Secret` resources. The server's service account needs `get` and `list` permissions on `secrets` in the target namespace.

```bash
ff secret-provider register k8s-main \
  --workspace demo-workspace \
  --type k8s \
  --k8s-namespace featureform \
  --k8s-secret-name provider-secrets
```

**AWS Secrets Manager** — best when provider credentials already live in AWS. The server authenticates using the standard AWS credentials chain (IAM role on the host, instance profile, or `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in the server environment).

```bash
ff secret-provider register aws-main \
  --workspace demo-workspace \
  --type aws \
  --aws-region us-west-2
```

### Update or delete a secret provider

```bash
ff secret-provider update local-env \
  --workspace demo-workspace \
  --env-prefix PROD_

ff secret-provider delete local-env \
  --workspace demo-workspace \
  --yes
```

## Register Postgres as an offline store and compute provider

Register Postgres when your analytical data lives in Postgres and you want Feature Form to manage feature engineering against it. As an `offline-store`, Postgres holds dataset candidates for feature engineering and the Feature Form-managed datasets that result, such as transformed datasets, training sets, and feature views. As a `compute` provider, Postgres runs the workloads Feature Form orchestrates, such as SQL transformations on primary datasets.

Point `--pg-host` at the Postgres instance you want Feature Form to use — typically a managed instance such as Amazon RDS or Aurora in production. To use the Postgres service bundled with the Helm chart for local or non-production work, set `--pg-host` to `<release-name>-featureform-provider-postgres`, where `<release-name>` is your Helm release name.

```bash
ff provider register demo_postgres \
  --workspace demo-workspace \
  --type postgres \
  --pg-host featureform-prod.cluster-abc123.us-west-2.rds.amazonaws.com \
  --pg-port 5432 \
  --pg-database featureform_test \
  --pg-user testuser \
  --pg-password-secret env:PG_PASSWORD \
  --pg-ssl-mode require
```

See the [PostgreSQL documentation](https://www.postgresql.org/docs/) for connection and SSL options.

## Register Redis as an online store

Register Redis when Redis is your low-latency inference database for serving features. As an `online-store`, Redis holds the latest materialized feature values and serves them to applications at inference time.

Point `--redis-host` at the Redis deployment you want Feature Form to use — typically a managed deployment such as Redis Cloud in production. To use the Redis service bundled with the Helm chart for local or non-production work, set `--redis-host` to `<release-name>-featureform-redis`, where `<release-name>` is your Helm release name.

```bash
ff provider register demo_redis \
  --workspace demo-workspace \
  --type redis \
  --redis-host redis-12345.c1.us-west-2-2.ec2.cloud.redislabs.com \
  --redis-port 12345
```

In the quickstart definitions file, the feature view references this provider with `inference_store="demo_redis"`. See the [Redis documentation](https://redis.io/docs/latest/) for deployment options.

## Register S3 as an offline store

Register S3 when Feature Form needs an object-storage-backed offline location. As an `offline-store`, S3 holds historical feature values as files (typically Parquet) that training sets read from. Choose S3 when dataset size or retention exceeds what a relational store fits.

```bash
ff provider register data-lake \
  --workspace demo-workspace \
  --type s3 \
  --s3-bucket featureform-data \
  --s3-region us-west-2 \
  --s3-access-key-id-secret env:AWS_ACCESS_KEY_ID \
  --s3-secret-access-key-secret env:AWS_SECRET_ACCESS_KEY
```

Use `--s3-endpoint` for MinIO or LocalStack-style endpoints when needed. See the [Amazon S3 documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/) for bucket and IAM setup.

## Register Spark as a compute provider

Register Spark when you need a compute provider for transformation or materialization workloads at scale. As a `compute` provider, Spark runs the transformation and materialization jobs that produce feature values. Choose Spark when dataset size exceeds what a single SQL engine can handle.

```bash
ff provider register spark-main \
  --workspace demo-workspace \
  --type spark \
  --spark-master spark://spark-master:7077
```

See the [Apache Spark documentation](https://spark.apache.org/docs/latest/) for cluster and master configuration.

## Register an Iceberg catalog

Register an Iceberg catalog provider when you need catalog-backed offline storage. As an `offline-store`, the catalog tracks versioned table snapshots over object storage. The workspace reads historical feature values from those tables, with schema evolution and time-travel queries.

```bash
ff provider register iceberg-main \
  --workspace demo-workspace \
  --type iceberg_catalog \
  --iceberg-warehouse s3://featureform-data/warehouse \
  --iceberg-catalog-name featureform \
  --iceberg-rest-uri https://iceberg.example.com
```

This example uses the REST catalog backend; the exact required fields depend on which backend (REST, Hive, Glue, and so on) you choose. See the [Apache Iceberg documentation](https://iceberg.apache.org/docs/latest/) for catalog backend options.

## Verify registration

```bash
ff provider list --workspace demo-workspace
ff provider get demo_postgres --workspace demo-workspace
```

A successful list returns one row per registered provider:

```text
NAME           TYPE      WORKSPACE        CREATED               UPDATED
demo_postgres  postgres  demo-workspace   2026-05-12T10:14:02Z  2026-05-12T10:14:02Z
demo_redis     redis     demo-workspace   2026-05-12T10:14:18Z  2026-05-12T10:14:18Z
```

Pass `--output json` or `--output yaml` for machine-readable output. If the list is empty or `get` returns an error, the register command did not complete. Rerun `ff provider register` to see its health-check output, and confirm the provider name and workspace match the ones you registered.

## Update or delete a provider

```bash
ff provider update demo_postgres \
  --workspace demo-workspace \
  --pg-port 5433

ff provider delete demo_postgres --workspace demo-workspace
```

Use `--force` on `update` when changing values that may break running workloads, such as host, port, or broker addresses.

## Next steps

With providers registered, the workspace is ready to receive feature definitions. See [Define and deploy features]({{< relref "/develop/ai/featureform/define-and-deploy-features" >}}) for authoring a definitions file and running `ff apply`.
