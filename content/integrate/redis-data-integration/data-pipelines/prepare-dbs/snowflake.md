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

RDI uses the [RIOTX](https://redis.github.io/riotx/) collector to stream data from Snowflake to Redis. 
During the [snapshot]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}}) phase, RDI reads the current state of the database using the JDBC driver. In the 
[Change data capture (CDC)]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}})
phase, RDI uses [Snowflake Streams](https://docs.snowflake.com/en/user-guide/streams) to 
capture changes related to the monitored tables. Note that RIOTX will automatically create and manage 
the required streams.

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

The RDI user requires the following permissions to connect and capture data from Snowflake:

- `SELECT` on source tables
- `CREATE STREAM` permission (RIOTX automatically creates and manages Snowflake Streams for CDC)
- `USAGE` permission on the warehouse for query execution

Grant the required permissions to your RDI user:

```sql
-- Grant usage on the warehouse
GRANT USAGE ON WAREHOUSE COMPUTE_WH TO ROLE rdi_role;

-- Grant usage on the database and schema
GRANT USAGE ON DATABASE MYDB TO ROLE rdi_role;
GRANT USAGE ON SCHEMA MYDB.PUBLIC TO ROLE rdi_role;

-- Grant SELECT on tables to capture
GRANT SELECT ON TABLE MYDB.PUBLIC.customers TO ROLE rdi_role;
GRANT SELECT ON TABLE MYDB.PUBLIC.orders TO ROLE rdi_role;

-- Grant CREATE STREAM permission for CDC
GRANT CREATE STREAM ON SCHEMA MYDB.PUBLIC TO ROLE rdi_role;

-- Assign the role to your RDI user
GRANT ROLE rdi_role TO USER rdi_user;
```

## 2. Configure authentication

RDI supports two authentication methods for Snowflake. You must configure one of these methods.

### Password authentication

Use standard username and password credentials. Store these securely using Kubernetes secrets (see step 3).

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
      username: "${SOURCE_DB_USERNAME}"
      password: "${SOURCE_DB_PASSWORD}"  # Omit for key-pair auth
      database: "MYDB"
      schema: "PUBLIC"
      warehouse: "COMPUTE_WH"
      # role: "RDI_ROLE"                 # Optional: Snowflake role
      # cdcDatabase: "CDC_DB"            # Optional: Separate database for CDC streams
      # cdcSchema: "CDC_SCHEMA"          # Optional: Separate schema for CDC streams
    tables:
      customers: {}
      orders: {}
    advanced:
      riotx:
        poll: "30s"
        snapshot: "INITIAL"              # Or "NEVER" to skip initial snapshot
        # streamLimit: 100000            # Optional: Max stream length
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
The Snowflake connector supports connecting to exactly one database and schema. All table names in the `tables` section are assumed to be in the configured database and schema.
{{< /note >}}

### Snowflake connection properties

| Property      | Type   | Required | Description                                                    |
|---------------|--------|----------|----------------------------------------------------------------|
| `type`        | string | Yes      | Must be `"snowflake"`                                          |
| `url`         | string | Yes      | JDBC URL: `jdbc:snowflake://<account>.snowflakecomputing.com/` |
| `username`    | string | Yes      | Snowflake username                                             |
| `password`    | string | No*      | Snowflake password                                             |
| `database`    | string | Yes      | Snowflake database name                                        |
| `schema`      | string | Yes      | Snowflake schema name                                          |
| `warehouse`   | string | Yes      | Snowflake warehouse name                                       |
| `role`        | string | No       | Snowflake role name                                            |
| `cdcDatabase` | string | No       | Database for CDC streams (if different from source)            |
| `cdcSchema`   | string | No       | Schema for CDC streams (if different from source)              |

* Either `password` or private key authentication is required. See [Configure authentication](#2-configure-authentication) for details.

### Advanced RIOTX options

Configure under `sources.<name>.advanced.riotx`:

| Property      | Type    | Default     | Description                            |
|---------------|---------|-------------|----------------------------------------|
| `poll`        | string  | `"30s"`     | Polling interval for stream changes    |
| `snapshot`    | string  | `"INITIAL"` | Snapshot mode: `INITIAL` or `NEVER`    |
| `streamLimit` | integer | -           | Maximum stream length (XTRIM MAXLEN)   |
| `keyColumns`  | array   | -           | Columns to use as message keys         |
| `clearOffset` | boolean | `false`     | Clear existing offset on start         |
| `count`       | integer | `0`         | Limit records per poll (0 = unlimited) |

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

1. Verify Snowflake Streams exist for target tables:

    ```sql
    SHOW STREAMS IN SCHEMA my_database.my_schema;
    ```

1. Check the polling interval configuration
1. Verify Redis connection is working
1. Check RIOTX collector logs:

    ```bash
    kubectl logs -n rdi -l app=riotx-collector-source
    ```

**Stale or missing changes**

- Snowflake Streams have a retention period (default 14 days)
- If the collector was offline longer than retention, changes may be lost
- Consider using `clearOffset: true` to restart from current state

### Performance tuning

**High Snowflake API usage**

- Increase `poll` interval (e.g., `"60s"` or `"120s"`)
- Use a dedicated warehouse for CDC operations

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
kubectl logs -n rdi -l app=riotx-collector-source -f
```

## 5. Configuration is complete

Once you have followed the steps above, your Snowflake database is ready for RDI to use.

## See also

- [Snowflake Streams Documentation](https://docs.snowflake.com/en/user-guide/streams)
- [Snowflake Key Pair Authentication](https://docs.snowflake.com/en/user-guide/key-pair-auth)
- [RDI Deployment Guide]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy" >}})

