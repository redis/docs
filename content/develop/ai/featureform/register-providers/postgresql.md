---
title: Register a PostgreSQL provider
description: Register PostgreSQL storage and compute with Redis Feature Form.
linkTitle: PostgreSQL
weight: 30
---

Register a `postgres` provider when Redis Feature Form should discover PostgreSQL tables, run structured query language (SQL) transformations, or materialize training sets and feature-view data in PostgreSQL.

The provider fills the `offline-store` and `compute` roles. It doesn't provide online serving. A serving feature view also needs a supported `online-store` provider.

## Distinguish data from Feature Form state

A PostgreSQL data provider holds or computes customer feature data. It is separate from a PostgreSQL state backend that stores Feature Form's control-plane state. Use separate databases, credentials, and schemas for these purposes unless your deployment has another isolation policy.

## Before you begin

Make sure you have:

- A Feature Form [workspace]({{< relref "/develop/ai/featureform/manage-workspace" >}}).
- A PostgreSQL hostname and database reachable from the Feature Form server.
- A PostgreSQL username and password.
- A [secret provider]({{< relref "/develop/ai/featureform/register-providers#configure-secret-providers" >}}) for the password reference.
- Permission to read the required source tables and create managed outputs.

The Python example uses this workspace-scoped provider client:

```python
import featureform as ff

client = ff.Client.from_env()
providers = client.providers("<workspace-id>")
```

## Register PostgreSQL

{{< multitabs id="featureform-register-postgresql-provider"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import EnvSecretRef, PostgresConfig, ProviderType, SSLMode

providers.register(
    name="<postgres-provider-name>",
    provider_type=ProviderType.POSTGRES,
    config=PostgresConfig(
        host="<postgres-host>",
        port=5432,
        database="<database-name>",
        username="<username>",
        password_secret=EnvSecretRef(name="PG_PASSWORD"),
        ssl_mode=SSLMode.REQUIRE,
    ),
)
```

-tab-sep-

```bash
ff provider register <postgres-provider-name> \
  --workspace <workspace-id> \
  --type postgres \
  --pg-host <postgres-host> \
  --pg-port 5432 \
  --pg-database <database-name> \
  --pg-username <username> \
  --pg-password-secret env:PG_PASSWORD \
  --pg-ssl-mode require
```

{{< /multitabs >}}

The environment reference is resolved by the Feature Form server. Replace it with a reference to another registered secret backend when appropriate.

The current public provider supports password authentication. Don't assume that internal or database-specific identity authentication methods are available through `ff`.

## Choose connection security

The Python `ssl_mode` field and the `--pg-ssl-mode` CLI option accept:

- `disable`
- `allow`
- `prefer` (default)
- `require`
- `verify-ca`
- `verify-full`

The public registration contract doesn't accept explicit client-certificate or root-certificate fields. Configure the required trust material in the Feature Form deployment environment.

## Grant workload permissions

The registration health check connects to PostgreSQL and queries its version. It proves connectivity and authentication, but it doesn't prove that later workloads can read or write their tables.

| Workload | Required capability |
| --- | --- |
| Discover or read an existing table | Connect and `SELECT` on the referenced table |
| Run transformations | Read source tables and create managed schema and table objects |
| Replace managed outputs | Create, rename, update, insert into, and drop managed tables |
| Materialize training sets or feature views | Read inputs and create or update the corresponding managed outputs |

Feature Form-managed transformation tables use the `ff_transforms` schema through the documented gRPC registration path. The server creates the schema when required. This path doesn't expose a custom managed-schema value.

## Understand supported workloads

| Capability | Support |
| --- | --- |
| Existing PostgreSQL datasets | Supported |
| Full SQL transformations | Supported |
| Incremental SQL transformations | Supported |
| Training-set materialization | Supported |
| Feature-view batch computation | Supported with a separate online provider |
| Direct dataframe reads | Supported |
| Spark reads through Java Database Connectivity (JDBC) | Supported |
| Online serving | Not supported |

## Verify registration

```bash
ff provider get <postgres-provider-name> --workspace <workspace-id>
ff provider list --workspace <workspace-id>
```

In Python, use `providers.get("<postgres-provider-name>")` or `providers.list()`.

## Update safely

| Field | Update behavior |
| --- | --- |
| Database | Immutable |
| Host and port | Requires `force=True` or `--force` |
| Username, password reference, and `ssl_mode` | Mutable |

Before a forced update or deletion, review datasets, transformations, training sets, feature views, and other references to the provider. The usage check doesn't detect every indirect reference.

## Troubleshoot registration

| Symptom | What to check |
| --- | --- |
| Authentication is required | Supply both `username` and `password_secret` in Python, or both `--pg-username` and `--pg-password-secret` with the CLI |
| Password resolution fails | Confirm the secret provider, workspace, and canonical reference syntax |
| Connection is refused or times out | Check Domain Name System (DNS), routing, port, PostgreSQL host-based authentication, connection security, and credentials from the Feature Form server network |
| Registration succeeds but a transformation fails | Grant the required source-table and `ff_transforms` permissions |
| A dataset table isn't found | Check the provider database and the dataset's schema and table location |
| A custom schema setting has no effect | Use `ff_transforms`; the documented gRPC registration path doesn't expose a managed-schema option |
