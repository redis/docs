---
Title: Prepare Snowflake for RDI
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare Snowflake databases to work with RDI
group: di
linkTitle: Prepare Snowflake
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 20
---

This guide describes the steps required to prepare a Snowflake database as a source for Redis Data Integration (RDI) pipelines.

During both the [snapshot]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}}) and
[Change data capture (CDC)]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}})
phases, RDI uses [Snowflake Streams](https://docs.snowflake.com/en/user-guide/streams) to read data from the monitored
tables. For the initial snapshot, RDI creates the stream with `SHOW_INITIAL_ROWS = TRUE` so it can read the current
table contents before continuing with ongoing CDC. RDI automatically creates and manages the required streams.

## Setup

The following checklist shows the steps to prepare a Snowflake database for RDI,
with links to the sections that explain the steps in full detail.
You may find it helpful to track your progress with the checklist as you
complete each step.

{{< note >}}
Snowflake is only supported with RDI deployed on Kubernetes/Helm. RDI VM mode does not support Snowflake as a source database.
{{< /note >}}

```checklist {id="snowflakelist"}
- [ ] [Set up Snowflake permissions](#1-set-up-snowflake-permissions)
- [ ] [Configure authentication](#2-configure-authentication)
- [ ] [Set up secrets for Kubernetes deployment](#3-set-up-secrets-for-kubernetes-deployment)
- [ ] [Configure RDI for Snowflake](#4-configure-rdi-for-snowflake)
```

## 1. Set up Snowflake permissions

The following are the minimum runtime permissions for the RDI role to read the source tables and create the Snowflake
objects RDI uses for CDC:

- `USAGE`, `OPERATE` on the warehouse used for RDI reads
- `USAGE` on the source database and source schema
- `SELECT` on the source tables
- `USAGE` on the CDC schema used by RDI
- `CREATE STREAM`, `CREATE TABLE` on the CDC schema used by RDI

If you configure `cdcDatabase` and `cdcSchema`, grant the CDC permissions there. Otherwise, grant them in the source
schema. If your Snowflake setup requires it, also grant any additional cross-database privileges needed for the CDC
schema to reference the source tables.

{{< note >}}
Before RDI can create the initial stream for a source table, Snowflake change tracking must already be enabled on that
table, or the role creating the initial stream must own the table. If the source tables are not owned by the RDI role,
ask a Snowflake administrator or table owner to enable change tracking first:

```sql
ALTER TABLE MYDB.PUBLIC.customers SET CHANGE_TRACKING = TRUE;
ALTER TABLE MYDB.PUBLIC.orders SET CHANGE_TRACKING = TRUE;
```
{{< /note >}}

Grant the required permissions to your RDI user:

```sql
-- Grant usage on the warehouse
GRANT USAGE, OPERATE ON WAREHOUSE COMPUTE_WH TO ROLE rdi_role;

-- Grant usage on the source database and schema
GRANT USAGE ON DATABASE MYDB TO ROLE rdi_role;
GRANT USAGE ON SCHEMA MYDB.PUBLIC TO ROLE rdi_role;

-- Grant SELECT on tables to capture
GRANT SELECT ON TABLE MYDB.PUBLIC.customers TO ROLE rdi_role;
GRANT SELECT ON TABLE MYDB.PUBLIC.orders TO ROLE rdi_role;

-- Grant permissions on the schema RDI uses for CDC objects
GRANT USAGE ON SCHEMA MYDB.RDI_CDC TO ROLE rdi_role;
GRANT CREATE STREAM, CREATE TABLE ON SCHEMA MYDB.RDI_CDC TO ROLE rdi_role;

-- Assign the role to your RDI user
GRANT ROLE rdi_role TO USER rdi_user;
```

If you use centralized grant management, you can also add future grants in the CDC schema so newly created tables and
streams automatically receive the desired privileges. These grants are optional and are not part of the minimum runtime
permissions:

```sql
GRANT SELECT ON FUTURE TABLES IN SCHEMA MYDB.RDI_CDC TO ROLE rdi_role;
GRANT SELECT ON FUTURE STREAMS IN SCHEMA MYDB.RDI_CDC TO ROLE rdi_role;
```

## 2. Configure authentication

RDI supports two authentication methods for Snowflake. You must configure one of these methods.

### Password authentication

Use standard username and password credentials. Store these securely using Kubernetes secrets (see step 3).

{{< note >}}
Many Snowflake accounts require MFA for password-based sign-ins. If you want to use password authentication for RDI,
configure the Snowflake user as a service user that is allowed to authenticate non-interactively. Otherwise, use
private key authentication instead. For more information, see the Snowflake
[MFA rollout documentation](https://docs.snowflake.com/en/user-guide/security-mfa-rollout).
{{< /note >}}

### Private key authentication

For enhanced security, use key-pair authentication:

1. Generate a private key:

    ```bash
    openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out rsa_key.p8 -nocrypt
    ```

1. Generate the public key:

    ```bash
    openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub
    ```

1. Register the public key with your Snowflake user:

    ```sql
    ALTER USER rdi_user SET RSA_PUBLIC_KEY='<public_key_content>';
    ```

## 3. Set up secrets for Kubernetes deployment

Before deploying the RDI pipeline, configure the necessary secrets.

### Password authentication

```bash
kubectl create secret generic source-db \
  --namespace=rdi \
  --from-literal=SOURCE_DB_USERNAME=your_username \
  --from-literal=SOURCE_DB_PASSWORD=your_password
```

### Private key authentication

Create a secret with the private key file:

```bash
kubectl create secret generic source-db-ssl \
  --namespace=rdi \
  --from-file=client.key=/path/to/rsa_key.p8
```

Also create the source-db secret with the username:

```bash
kubectl create secret generic source-db \
  --namespace=rdi \
  --from-literal=SOURCE_DB_USERNAME=your_username
```

## 4. Configure RDI for Snowflake

Use the following example configuration in your `config.yaml` file:

```yaml
sources:
  snowflake:
    type: riotx
    connection:
      type: snowflake
      url: "jdbc:snowflake://myaccount.snowflakecomputing.com/"
      user: "${SOURCE_DB_USERNAME}"
      password: "${SOURCE_DB_PASSWORD}"  # Omit for key-pair auth
      database: "MYDB"
      warehouse: "COMPUTE_WH"
      # role: "RDI_ROLE"                 # Optional: Snowflake role
      # cdcDatabase: "CDC_DB"            # Optional: Separate database for CDC streams
      # cdcSchema: "CDC_SCHEMA"          # Optional: Separate schema for CDC streams
    schemas:
      - PUBLIC
    tables:
      PUBLIC.customers: {}
      PUBLIC.orders: {}
    advanced:
      riotx:
        poll: "30s"
        snapshot: "INITIAL"              # Or "NEVER" to skip initial snapshot
        # streamPrefix: "data:"          # Optional: Redis stream prefix
        # streamLimit: 100000            # Optional: Max stream length
        # keyColumns:                    # Recommended: stable key columns
        #   - "id"
        # clearOffset: false             # Optional: Clear offset on start

targets:
  target:
    connection:
      type: redis
      host: ${TARGET_DB_HOST}
      port: ${TARGET_DB_PORT}
      user: ${TARGET_DB_USERNAME}
      password: ${TARGET_DB_PASSWORD}

processors:
  target_data_type: json
```

{{< note >}}
Snowflake uses one configured `database` and one or more source-level `schemas`. In the `tables` section, specify each
table as `SCHEMA.table`. Even when you configure only one schema, explicit `SCHEMA.table` names are recommended for
clarity.
{{< /note >}}

### Snowflake connection properties

| Property      | Type   | Required | Description                                                    |
|---------------|--------|----------|----------------------------------------------------------------|
| `type`        | string | Yes      | Must be `"snowflake"`                                          |
| `url`         | string | Yes      | JDBC URL: `jdbc:snowflake://<account>.snowflakecomputing.com/` |
| `user`        | string | Yes      | Snowflake user                                                 |
| `password`    | string | No*      | Snowflake password                                             |
| `database`    | string | Yes      | Snowflake database name                                        |
| `warehouse`   | string | Yes      | Snowflake warehouse name                                       |
| `role`        | string | No       | Snowflake role name                                            |
| `cdcDatabase` | string | No       | Database for CDC streams (if different from source)            |
| `cdcSchema`   | string | No       | Schema for CDC streams (if different from source)              |

* Either `password` or private key authentication is required. See [Configure authentication](#2-configure-authentication) for details.

### Snowflake source properties

| Property   | Type   | Required | Description                                                      |
|------------|--------|----------|------------------------------------------------------------------|
| `schemas`  | array  | Yes      | Schema names to capture from                                     |
| `tables`   | object | Yes      | Tables to capture, keyed as `SCHEMA.table`                       |

### Advanced configuration options

Configure under `sources.<name>.advanced.riotx`:

| Property       | Type    | Default     | Description                                  |
|----------------|---------|-------------|----------------------------------------------|
| `poll`         | string  | `"30s"`     | Polling interval for stream changes          |
| `snapshot`     | string  | `"INITIAL"` | Snapshot mode: `INITIAL` or `NEVER`          |
| `streamPrefix` | string  | `"data:"`   | Prefix for the Redis stream written by RDI   |
| `streamLimit`  | integer | -           | Maximum stream length (XTRIM MAXLEN)         |
| `keyColumns`   | array   | -           | Stable source columns to use as message keys |
| `clearOffset`  | boolean | `false`     | Clear existing offset on start               |
| `count`        | integer | `0`         | Limit records per poll (0 = unlimited)       |

For reliable update and delete handling, define `keyColumns` with a stable business key or surrogate key when possible.

## Troubleshooting

### Connection issues

**Error: "Failed to connect to Snowflake"**

- Verify the account URL is correct (format: `<account>.snowflakecomputing.com`)
- Check network connectivity to Snowflake
- Verify the warehouse is running and accessible
- Check firewall rules allow outbound HTTPS (port 443)

**Error: "Authentication failed"**

- For password auth: verify username and password are correct
- For key-pair auth: verify the private key matches the public key registered in Snowflake
- Ensure the user has appropriate permissions

**Error: "Warehouse not found"**

- Verify the warehouse name is correct
- Ensure the user has USAGE permission on the warehouse

### CDC issues

**No data appearing in Redis**

1. Verify Snowflake Streams exist in the CDC schema:

    ```sql
    SHOW STREAMS IN SCHEMA my_cdc_database.my_cdc_schema;
    ```

1. Check the polling interval configuration
1. Verify Redis connection is working
1. Check the collector logs:

    ```bash
    kubectl get deployments -n rdi | grep riotx-collector
    kubectl logs -n rdi deployment/<riotx-collector-deployment>
    ```

**Stale or missing changes**

- Snowflake Streams depend on Snowflake change tracking and retention settings
- If the collector was offline longer than the available retention window, changes may be lost
- Consider using `clearOffset: true` to restart from current state

### Performance tuning

**High Snowflake warehouse usage**

- Increase `poll` interval (e.g., `"60s"` or `"120s"`)
- Use a dedicated warehouse for CDC operations
- Each poll first calls Snowflake's `SYSTEM$STREAM_HAS_DATA` function to check whether the stream has new data. This
  check does not start the warehouse; warehouse compute starts only when RDI reads rows from the stream.

**Redis memory concerns**

- Set `streamLimit` to cap stream length
- Use `count` to limit records per poll batch

**Initial snapshot too slow**

- Use `snapshot: "NEVER"` to skip initial snapshot
- Pre-load data using other methods if needed

### Enable debug logging

Enable debug logging in the source configuration:

```yaml
sources:
  snowflake:
    type: riotx
    logging:
      level: debug
    # ... rest of configuration
```

View collector logs:

```bash
kubectl get deployments -n rdi | grep riotx-collector
kubectl logs -n rdi deployment/<riotx-collector-deployment> -f
```

## 5. Configuration is complete

Once you have followed the steps above, your Snowflake database is ready for RDI to use.

## See also

- [Snowflake Streams Documentation](https://docs.snowflake.com/en/user-guide/streams)
- [Snowflake Key Pair Authentication](https://docs.snowflake.com/en/user-guide/key-pair-auth)
- [Snowflake MFA rollout documentation](https://docs.snowflake.com/en/user-guide/security-mfa-rollout)
- [RDI Deployment Guide]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy" >}})
