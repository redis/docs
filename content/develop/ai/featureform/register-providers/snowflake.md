---
title: Register a Snowflake provider
description: Register Snowflake storage and compute with Redis Feature Form.
linkTitle: Snowflake
weight: 20
---

Register a `snowflake` provider when Redis Feature Form should discover Snowflake tables, run structured query language (SQL) transformations, or materialize training sets and feature-view data in Snowflake.

The provider fills the `offline-store` and `compute` roles for one account, warehouse, database, and schema. It doesn't provide online serving. A serving feature view also needs a supported `online-store` provider.

## Before you begin

Make sure you have:

- A Feature Form [workspace]({{< relref "/develop/ai/featureform/manage-workspace" >}}).
- A Snowflake account identifier, warehouse, database, and schema.
- A Snowflake username with password or key-pair authentication.
- A [secret provider]({{< relref "/develop/ai/featureform/register-providers#configure-secret-providers" >}}) for each password, private key, or passphrase reference.
- Network access from the Feature Form server and workers to Snowflake.

Set `host` on `SnowflakeConfig`, or use `--snowflake-host` with the CLI, for a PrivateLink or custom hostname. Without it, Feature Form derives the standard hostname from the account identifier.

The Python examples use this workspace-scoped provider client:

```python
import featureform as ff

client = ff.Client.from_env()
providers = client.providers("<workspace-id>")
```

## Choose authentication

| Authentication | Required values | Support |
| --- | --- | --- |
| `password` | Username and password secret reference | Supported |
| `key-pair` | Username and private-key secret reference; passphrase reference for an encrypted key | Supported |
| `oauth` | OAuth client and token fields | Not supported by the current Snowflake connector |

Don't use `skip_health_check=True` or `--skip-health-check` to register OAuth. Skipping the check postpones the unsupported-authentication error until the provider is used.

## Register with a password

{{< multitabs id="featureform-register-snowflake-password"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import EnvSecretRef, ProviderType, SnowflakeConfig

providers.register(
    name="<snowflake-provider-name>",
    provider_type=ProviderType.SNOWFLAKE,
    config=SnowflakeConfig(
        account="<snowflake-account>",
        warehouse="<warehouse-name>",
        database="<database-name>",
        schema="<schema-name>",
        role="<role-name>",
        auth_type="password",
        username="<username>",
        password_secret=EnvSecretRef(name="SNOWFLAKE_PASSWORD"),
    ),
)
```

-tab-sep-

```bash
ff provider register <snowflake-provider-name> \
  --workspace <workspace-id> \
  --type snowflake \
  --snowflake-account <snowflake-account> \
  --snowflake-warehouse <warehouse-name> \
  --snowflake-database <database-name> \
  --snowflake-schema <schema-name> \
  --snowflake-role <role-name> \
  --snowflake-auth-type password \
  --snowflake-username <username> \
  --snowflake-password-secret env:SNOWFLAKE_PASSWORD
```

{{< /multitabs >}}

The environment reference is resolved by the Feature Form server. Replace it with a reference to another registered secret backend when appropriate.

## Register with a key pair

{{< multitabs id="featureform-register-snowflake-key-pair"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import K8sSecretRef, ProviderType, SnowflakeConfig

providers.register(
    name="<snowflake-provider-name>",
    provider_type=ProviderType.SNOWFLAKE,
    config=SnowflakeConfig(
        account="<snowflake-account>",
        warehouse="<warehouse-name>",
        database="<database-name>",
        schema="<schema-name>",
        role="<role-name>",
        auth_type="key-pair",
        username="<username>",
        private_key_secret=K8sSecretRef(
            provider_name="<secret-provider-name>",
            name="<secret-name>",
            key="private-key",
        ),
        passphrase_secret=K8sSecretRef(
            provider_name="<secret-provider-name>",
            name="<secret-name>",
            key="private-key-passphrase",
        ),
    ),
)
```

-tab-sep-

```bash
ff provider register <snowflake-provider-name> \
  --workspace <workspace-id> \
  --type snowflake \
  --snowflake-account <snowflake-account> \
  --snowflake-warehouse <warehouse-name> \
  --snowflake-database <database-name> \
  --snowflake-schema <schema-name> \
  --snowflake-role <role-name> \
  --snowflake-auth-type key-pair \
  --snowflake-username <username> \
  --snowflake-private-key-secret k8s@<secret-provider-name>:<secret-name>#private-key \
  --snowflake-passphrase-secret k8s@<secret-provider-name>:<secret-name>#private-key-passphrase
```

{{< /multitabs >}}

Omit `--snowflake-passphrase-secret` when the private key isn't encrypted. The resolved value must be a Rivest-Shamir-Adleman (RSA) private key.

## Configure sessions

In Python, set `login_timeout`, `request_timeout`, or `session_params` on `SnowflakeConfig`. With the CLI, use these optional flags:

```text
--snowflake-login-timeout <seconds>
--snowflake-request-timeout <seconds>
--snowflake-session-param <key>=<value>
```

Repeat `--snowflake-session-param` for multiple values. Keys and values must be nonempty.

## Grant health-check permissions

The default registration health check:

1. Opens a Snowflake session.
2. Selects the configured warehouse.
3. Creates a health-check table in the configured database and schema.
4. Drops the table.

The Snowflake role therefore needs `USAGE` on the warehouse, database, and schema, plus permission to create and drop a table in that schema. Read-only credentials can't pass the default check.

Workloads can require additional permissions:

| Workload | Required capability |
| --- | --- |
| Discover or read an existing table | `SELECT` on that table |
| Materialize transformations, training sets, or feature views | Read inputs and create, replace, rename, update, and drop managed tables as needed |
| Delete a managed output | Drop the managed table |

A successful registration check doesn't test every source table, access policy, masking policy, or warehouse quota.

## Understand supported workloads

| Capability | Support |
| --- | --- |
| Existing Snowflake datasets | Supported |
| Full SQL transformations | Supported |
| Incremental transformed datasets | Not supported |
| Static training-set materialization | Supported |
| Incremental static training sets | Supported |
| Feature-view batch computation | Supported with a separate online provider |
| Direct dataframe reads | Supported |
| Online serving | Not supported |

Key-pair authentication works for direct Snowflake dataframe reads. A Spark-based Snowflake Java Database Connectivity (JDBC) plan currently requires password authentication.

## Verify registration

```bash
ff provider get <snowflake-provider-name> --workspace <workspace-id>
ff provider list --workspace <workspace-id>
```

In Python, use `providers.get("<snowflake-provider-name>")` or `providers.list()`.

## Update safely

| Field | Update behavior |
| --- | --- |
| Database and schema | Immutable |
| Account and custom host | Requires `force=True` or `--force` |
| Warehouse, role, authentication, timeouts, and session parameters | Mutable |

Before a forced update or deletion, review datasets, transformations, training sets, feature views, and other references to the provider. The usage check doesn't detect every indirect reference.

## Troubleshoot registration

| Symptom | What to check |
| --- | --- |
| Secret resolution fails | Confirm the secret-provider name, workspace, and canonical reference syntax |
| `USE WAREHOUSE` fails | Grant warehouse `USAGE`, or correct the warehouse and role |
| Health-check table creation fails | Grant create and drop permissions in the configured schema |
| Key-pair authentication fails | Check that the resolved value is an RSA private key and that an encrypted key has the matching passphrase |
| Incremental transformation fails | Use a full Snowflake SQL transformation; incremental transformed datasets aren't supported |
| Direct reads work but a Spark read fails | Use password authentication for the Spark JDBC path |
| A workload fails after registration | Check grants and policies for the specific table and operation; the health check tests only the configured schema |
