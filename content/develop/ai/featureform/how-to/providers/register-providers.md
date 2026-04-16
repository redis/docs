---
title: Register providers
description: Register the Postgres, Redis, and supporting providers a Featureform workspace will use.
linkTitle: Register providers
weight: 10
---

Registering a provider binds one workspace to an external system used for storage, compute, serving, or catalog-backed access. Definitions files refer to providers by name, so provider registration comes first.

## Register a Postgres provider

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

## Register a Redis provider

```bash
ff provider register demo_redis \
  --workspace <workspace-id> \
  --type redis \
  --redis-host <release-name>-featureform-redis \
  --redis-port 6379
```

If your deployment uses bundled provider addons, the default service names typically include the Helm release name. Otherwise, use the reachable hostnames for your external systems.

## Verify registration

```bash
ff provider list --workspace <workspace-id>
ff provider get demo_postgres --workspace <workspace-id>
```

Provider registration performs health validation by default. Fix connectivity or secret-resolution failures instead of treating `--skip-health-check` as the standard path.

## Read next

- [Provider-specific setup]({{< relref "/develop/ai/featureform/how-to/providers/provider-specific-setup" >}})
- [Configure secret providers]({{< relref "/develop/ai/featureform/how-to/secrets/configure-secret-providers" >}})
