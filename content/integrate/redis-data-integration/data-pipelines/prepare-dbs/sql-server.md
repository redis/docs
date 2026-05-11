---
Title: Prepare SQL Server for RDI
aliases: /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/sql-server/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare SQL Server databases to work with RDI
group: di
linkTitle: Prepare SQL Server
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 2
---

To prepare your SQL Server database for Debezium, you must first create a dedicated Debezium user,
run a script to enable CDC globally, and then separately enable CDC for each table you want to
capture. You need administrator privileges to do this.

Once you enable CDC, it captures all of the INSERT, UPDATE, and DELETE operations
on your chosen tables. The Debezium connector can then emit these events to RDI.
RDI only reads from the source database; it captures changes through the CDC tables
and never modifies the source data.

The following checklist summarizes the steps to prepare a SQL Server
database for RDI, with links to the sections that explain the steps in
full detail. You may find it helpful to track your progress with the
checklist as you complete each step.

```checklist {id="sqlserverlist"}
- [ ] [Create a Debezium user](#1-create-a-debezium-user)
- [ ] [Enable CDC on the database](#2-enable-cdc-on-the-database)
- [ ] [Enable CDC for the tables you want to capture](#3-enable-cdc-for-the-tables-you-want-to-capture)
- [ ] [Check that you have access to the CDC table](#4-check-that-you-have-access-to-the-cdc-table)
```

## 1. Create a Debezium user

It is strongly recommended to create a dedicated Debezium user for the connection between RDI
and the source database. When using an existing user, ensure that the required 
permissions are granted and that the user is added to the CDC role.

```checklist {id="sqlserver-create-debezium-user" nointeractive="true" }
- [ ] [Create the Debezium user](#create-the-debezium-user)
- [ ] [Grant the user the necessary permissions](#grant-the-user-the-necessary-permissions)
```

1. <a id="create-the-debezium-user"></a>
  Create the Debezium user with the Transact-SQL below:

    ```sql
    USE master
    GO
    CREATE LOGIN MyUser WITH PASSWORD = 'My_Password'
    GO
    USE MyDB
    GO
    CREATE USER MyUser FOR LOGIN MyUser
    GO
    ```

    Replace `MyUser`, `My_Password` and `MyDB` with your chosen values.

1. <a id="grant-the-user-the-necessary-permissions"></a>
  Grant the user the necessary permissions:

    ```sql
    USE master
    GO
    GRANT VIEW SERVER STATE TO MyUser
    GO
    USE MyDB
    GO
    EXEC sp_addrolemember N'db_datareader', N'MyUser'
    GO
    ```

## 2. Enable CDC on the database

There are two system stored procedures to enable CDC (you need
administrator privileges to run these). Use `sys.sp_cdc_enable_db`
to enable CDC for the whole database and then `sys.sp_cdc_enable_table` to enable CDC for individual tables. 

Before running the procedures, ensure that:

- You are a member of the `sysadmin` fixed server role for the SQL Server.
- You are a `db_owner` of the database.
- The SQL Server Agent is running.

Then, assuming your database is called `MyDB`, run the script below to enable CDC:

```sql
USE MyDB
GO
EXEC sys.sp_cdc_enable_db
GO
```

{{< note >}}For SQL Server on AWS RDS, you must use a different stored procedure:
```sql
EXEC msdb.dbo.rds_cdc_enable_db 'Chinook'
GO
```
{{< /note >}}

When you enable CDC for the database, it creates a schema called `cdc` and also
a CDC user, metadata tables, and other system objects. 

## 3. Enable CDC for the tables you want to capture

```checklist {id="sqlserver-enable-cdc-tables" nointeractive="true" }
- [ ] [Enable CDC on the tables you want to capture](#enable-cdc-on-the-tables-you-want-to-capture)
- [ ] [Add the Debezium user to the CDC role](#add-the-debezium-user-to-the-cdc-role)
```

1. <a id="enable-cdc-on-the-tables-you-want-to-capture"></a>
    You must also enable CDC on the tables you want Debezium to capture using the
    following commands (again, you need administrator privileges for this):

    ```sql
    USE MyDB
    GO

    EXEC sys.sp_cdc_enable_table
    @source_schema = N'dbo',
    @source_name   = N'MyTable', 
    @role_name     = N'MyRole',  
    @supports_net_changes = 0
    GO
    ```

    Repeat this for every table you want to capture.

    {{< note >}}The value for `@role_name` can’t be a fixed database role, such as `db_datareader`. 
    Specifying a new name will create a corresponding database role that has full access to the
    captured change data.
    {{< /note >}}
  
1. <a id="add-the-debezium-user-to-the-cdc-role"></a>
    Add the Debezium user to the CDC role:

    ```sql
    USE MyDB
    GO
    EXEC sp_addrolemember N'MyRole', N'MyUser'
    GO
    ```

## 4. Check that you have access to the CDC table

You can use another stored procedure `sys.sp_cdc_help_change_data_capture`
to query the CDC information for the database and check you have enabled
it correctly. To do this, connect as the Debezium user you created previously (`MyUser`).

```checklist {id="sqlserver-check-cdc-table" nointeractive="true" }
- [ ] [Run the stored procedure to query the CDC configuration](#run-the-stored-procedure-to-query-the-cdc-configuration)
- [ ] [Check the results](#check-the-results)
```

1. <a id="run-the-stored-procedure-to-query-the-cdc-configuration"></a>
  Run the `sys.sp_cdc_help_change_data_capture` stored procedure to query
    the CDC configuration. For example, if your database was called `MyDB` then you would
    run the following:

    ```sql
    USE MyDB;
    GO
    EXEC sys.sp_cdc_help_change_data_capture
    GO
    ```

1. <a id="check-the-results"></a>
    The query returns configuration information for each table in the database that
    has CDC enabled and that contains change data that you are authorized to
    access. If the result is empty then you should check that you have privileges
    to access both the capture instance and the CDC tables.

### Troubleshooting

If no CDC is happening then it might mean that SQL Server Agent is down. You can check for this using the SQL query shown below:

```sql
IF EXISTS (SELECT 1 
           FROM master.dbo.sysprocesses 
           WHERE program_name = N'SQLAgent - Generic Refresher')
BEGIN
  SELECT @@SERVERNAME AS 'InstanceName', 1 AS 'SQLServerAgentRunning'
END
ELSE 
BEGIN
  SELECT @@SERVERNAME AS 'InstanceName', 0 AS 'SQLServerAgentRunning'
END
```

If the query returns a result of 0, you need to need to start SQL Server Agent using the following commands:

```sql
EXEC xp_servicecontrol N'START',N'SQLServerAGENT';
GO
```

## SQL Server capture job agent configuration parameters

In SQL Server, the parameters that control the behavior of the capture job agent
are defined in the SQL Server table `msdb.dbo.cdc_jobs`. If you experience performance
problems while running the capture job agent then you can adjust the capture jobs
settings to reduce CPU load. To do this, run the `sys.sp_cdc_change_job` stored procedure
with your new parameter values.

{{< note >}}A full guide to configuring the SQL Server capture job agent parameters
is outside the scope of the Redis documentation.{{< /note >}}

The following parameters are the most important ones for modifying the capture agent behavior
of the Debezium SQL Server connector:

* `pollinginterval`: This specifies the number of seconds that the capture agent
  waits between log scan cycles. A higher value reduces the load on the database
  host, but increases latency.  A value of 0 specifies no wait between scans.
  The default value is 5.
* `maxtrans`: This specifies the maximum number of transactions to process during
  each log scan cycle. After the capture job processes the specified number of
  transactions, it pauses for the length of time that `pollinginterval` specifies
  before the next scan begins. A lower value reduces the load on the database host,
  but increases latency. The default value is 500.
* `maxscans`: This specifies a limit on the number of scan cycles that the capture
  job can attempt when capturing the full contents of the database transaction log.
  If the continuous parameter is set to 1, the job pauses for the length of time
  that the `pollinginterval` specifies before it resumes scanning. A lower values
  reduces the load on the database host, but increases latency. The default value is 10.

See the SQL Server documentation for more information about capture agent parameters.

## SQL Server on Azure

RDI can capture changes from Microsoft SQL Server hosted on Azure. The preparation
steps are similar to the on-premises instructions above, but Azure adds extra
requirements for authentication, networking, and (for Azure SQL Database) the
database service tier. Use the checklist below to track the additional steps.

```checklist {id="sqlserverazurelist"}
- [ ] [Confirm your Azure SQL product and service tier](#supported-azure-sql-products)
- [ ] [Configure network access](#configure-network-access)
- [ ] [Enable CDC on the database](#enable-cdc-on-the-database-azure)
- [ ] [Create a database user for Debezium](#create-a-database-user-for-debezium)
- [ ] [Configure the RDI source for Azure SQL](#configure-the-rdi-source-for-azure-sql)
- [ ] [Verify the connection](#verify-the-connection)
```

### Supported Azure SQL products

| Product | Supported | Notes |
| --- | --- | --- |
| Azure SQL Database (single database or elastic pool) | Yes | Supported on any service tier in the vCore-based purchasing model. In the DTU-based purchasing model, CDC requires the S3 tier or higher — it is not supported on Basic, S0, S1, or S2. |
| Azure SQL Managed Instance | Yes | Behaves like on-premises SQL Server. The SQL Server Agent is available and the on-premises CDC procedures apply unchanged. |
| SQL Server on an Azure VM | Yes | Treat as on-premises — follow the [main SQL Server instructions](#1-create-a-debezium-user). The Azure-specific guidance below does not apply. |
| Azure Synapse Analytics, Microsoft Fabric SQL database | No | These products do not support the SQL Server CDC features that Debezium relies on. |

### Configure network access

The RDI connector must be able to reach the Azure SQL endpoint on TCP port 1433.

- **Public endpoint**: add a server-level or database-level firewall rule that allows
  the public outbound IP address of the host running the RDI connector. See Microsoft's
  [Azure SQL firewall configuration](https://learn.microsoft.com/en-us/azure/azure-sql/database/firewall-configure)
  documentation for details.
- **Private endpoint or VNet integration** (recommended for production): expose the
  Azure SQL server through a
  [private endpoint](https://learn.microsoft.com/en-us/azure/azure-sql/database/private-endpoint-overview)
  on the same VNet as the RDI connector — for example, when RDI runs on Azure
  Kubernetes Service.

Azure SQL rejects unencrypted connections, so the RDI connection must always use TLS.
This is enforced by the [connector source settings](#configure-the-rdi-source-for-azure-sql)
described below.

### Enable CDC on the database {#enable-cdc-on-the-database-azure}

The procedure depends on which Azure SQL product you are using.

#### Azure SQL Database

You must be a member of the `db_owner` role on the database — Azure SQL Database has
no `sysadmin` server role.

{{< warning >}}The identity used to enable CDC must match the type of identity that
created the database. If the database was created by a Microsoft Entra user, CDC must
be enabled (and later disabled) by a Microsoft Entra user; SQL logins cannot manage
CDC on it. The same restriction applies in reverse for databases created by SQL
logins.{{< /warning >}}

Connect to the user database and run:

```sql
EXEC sys.sp_cdc_enable_db
GO
```

This creates the `cdc` schema, the `cdc` database user, the CDC metadata tables, and
other system objects in your database. Do not modify or drop these objects manually.
Then enable CDC on each table you want to capture, using the same
`sys.sp_cdc_enable_table` procedure described in the
[on-premises instructions](#3-enable-cdc-for-the-tables-you-want-to-capture).

CDC service-tier requirements differ between purchasing models:

- **vCore-based purchasing model**: CDC is supported on any service tier, including
  General Purpose.
- **DTU-based purchasing model**: CDC requires the S3 tier or higher. It is not
  supported on Basic, S0, S1, or S2.

If `sys.sp_cdc_enable_db` returns an error such as `Change data capture is not supported for this edition of SQL Server`,
scale the database up before retrying.

{{< note >}}Capture and cleanup run automatically on Azure SQL Database — there is no
SQL Server Agent. The internal scheduler runs the capture process every 20 seconds and
the cleanup process every hour, with a default change-data retention period of three
days. The capture cadence — the `pollinginterval` parameter described in the
[SQL Server capture job agent configuration parameters](#sql-server-capture-job-agent-configuration-parameters)
section — is fixed on Azure SQL Database and cannot be tuned. The `maxtrans` and
`maxscans` parameters from that section can still be adjusted via `sp_cdc_change_job`.{{< /note >}}

Enabling CDC increases transaction log usage on Azure SQL Database because it disables
the aggressive log truncation behavior of Accelerated Database Recovery. You may need
to scale the database to a higher service tier to provide enough transaction log
throughput for your workload combined with CDC. After a local or geo-replication
failover, CDC continues to operate automatically on the new primary; no manual
reconfiguration is required.

For more information about CDC on Azure SQL Database, see Microsoft's
[Change Data Capture with Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/change-data-capture-overview?view=azuresql)
guide.

#### Azure SQL Managed Instance

Follow the on-premises instructions for
[enabling CDC on the database](#2-enable-cdc-on-the-database) and
[enabling CDC on the tables you want to capture](#3-enable-cdc-for-the-tables-you-want-to-capture).
The procedures are identical on Managed Instance.

### Create a database user for Debezium

RDI only reads from the source database, so the Debezium user only needs read access.
Do not grant `db_datawriter` or any other write permissions.

You can authenticate to Azure SQL using either SQL authentication or Microsoft Entra ID.
Microsoft Entra authentication with a service principal is the validated path for RDI;
use it for production deployments. SQL authentication is supported and is the simplest
option for development or proof-of-concept setups.

#### Option A: SQL authentication

Follow the on-premises instructions for
[creating the Debezium user](#1-create-a-debezium-user), with one Azure-specific
change: on Azure SQL Database, omit the `master`-database step and create a contained
user in the user database. Connect to your user database as the server admin and run:

```sql
CREATE USER <username> WITH PASSWORD = '<password>'
GO
ALTER ROLE db_datareader ADD MEMBER <username>
GO
GRANT VIEW DATABASE STATE TO <username>
GO
```

After enabling CDC on the tables you want to capture, add the user to the CDC role:

```sql
EXEC sp_addrolemember N'<cdc-role>', N'<username>'
GO
```

{{< note >}}Use `VIEW DATABASE STATE` rather than `VIEW SERVER STATE`. The server-scoped
permission does not exist on Azure SQL Database.{{< /note >}}

#### Option B: Microsoft Entra service principal

1. **Register an application in Microsoft Entra ID.**
    In the Azure portal, go to **Microsoft Entra ID > App registrations > New registration**.
    Note the **Application (client) ID** — you'll use it as the RDI `user` value. Create
    a client secret under **Certificates & secrets** and note its value — you'll use it
    as the RDI `password` value.

1. **Set a Microsoft Entra admin on the Azure SQL logical server.**
    In the Azure portal, open the logical SQL server and set a Microsoft Entra admin (a
    user or group you can sign in as). You will connect as this admin to create the
    contained user in the next step. (The permission to create contained users mapped
    to Microsoft Entra principals can also be delegated to other database principals;
    see Microsoft's [Microsoft Entra authentication for Azure SQL](https://learn.microsoft.com/en-us/azure/azure-sql/database/authentication-aad-overview)
    documentation.)

1. **Create a contained database user for the service principal.**
    Connect to the user database as the Microsoft Entra admin (for example, using
    `sqlcmd -G` or Azure Data Studio) and run:

    ```sql
    CREATE USER [<sp-display-name>] FROM EXTERNAL PROVIDER
    GO
    ALTER ROLE db_datareader ADD MEMBER [<sp-display-name>]
    GO
    GRANT VIEW DATABASE STATE TO [<sp-display-name>]
    GO
    ```

    After enabling CDC on the tables you want to capture, add the principal to the CDC role:

    ```sql
    EXEC sp_addrolemember N'<cdc-role>', N'<sp-display-name>'
    GO
    ```

    {{< note >}}`<sp-display-name>` is the **display name** of the app registration — the
    value shown in the **Name** column on the **App registrations** page — not its client
    ID. The client ID is used by the RDI connector (see the next section), but the
    database user must be created from the display name. If the display name is not
    unique in your Microsoft Entra tenant (display names are not guaranteed unique),
    disambiguate by adding the `WITH OBJECT_ID = '<sp-object-id>'` clause to the
    `CREATE USER` statement.{{< /note >}}

### Configure the RDI source for Azure SQL

Use a `cdc` source with `type: sqlserver`. The example below shows the validated
configuration for Azure SQL Database with Microsoft Entra service-principal
authentication:

```yaml
sources:
  sqlserver:
    type: cdc
    connection:
      type: sqlserver
      host: <server-name>.database.windows.net
      port: 1433
      database: <database-name>
      user: ${SOURCE_DB_USERNAME}
      password: ${SOURCE_DB_PASSWORD}
    logging:
      level: info
    schemas:
      - dbo
    tables:
      <table-name>:
        columns:
          - <column-1>
          - <column-2>
        keys:
          - <column-1>
    advanced:
      source:
        driver.authentication: ActiveDirectoryServicePrincipal
        database.encrypt: "true"
        database.hostNameInCertificate: "*.database.windows.net"
        database.trustServerCertificate: "false"
        database.applicationIntent: ReadOnly
        snapshot.mode: initial
```

The properties under `advanced.source` are passed straight through to the underlying
Debezium SQL Server connector and JDBC driver. The Azure-specific values are:

| Property | Purpose | Value for Azure SQL Database |
| --- | --- | --- |
| `driver.authentication` | Selects the JDBC Microsoft Entra authentication mode. | `ActiveDirectoryServicePrincipal` (validated). See [other Microsoft Entra authentication modes](#other-microsoft-entra-authentication-modes) for alternatives. |
| `database.encrypt` | Enforces TLS on the JDBC connection. | `"true"`. Azure SQL rejects unencrypted connections. |
| `database.trustServerCertificate` | If `true`, the driver skips certificate validation. | `"false"`. Azure SQL presents a valid certificate; never disable validation in production. |
| `database.hostNameInCertificate` | Tells the JDBC driver which hostname pattern to expect in the server's TLS certificate. Set explicitly when the certificate's subject does not match the connection hostname directly. | `"*.database.windows.net"` (used in the RDI-validated configuration to match Azure SQL's wildcard certificate). |
| `database.applicationIntent` | When set to `ReadOnly`, routes the connection to a read-only replica on tiers that support [read scale-out](https://learn.microsoft.com/en-us/azure/azure-sql/database/read-scale-out). | `ReadOnly`. Recommended because RDI only reads. On Business Critical and Hyperscale tiers, the CDC scan is routed to the included read-only replica and kept off the primary. On General Purpose, which has no read scale-out, the connection is routed to the primary; the setting is harmless but has no effect. |
| `snapshot.mode` | The Debezium snapshot strategy. | `initial`. Captures a snapshot of the existing rows, then streams subsequent changes from the CDC tables. |

For SQL authentication, omit the `driver.authentication` line and set
`${SOURCE_DB_USERNAME}` and `${SOURCE_DB_PASSWORD}` to the SQL user's credentials.
Keep the other Azure-specific properties.

#### Secret mapping

For Microsoft Entra service-principal authentication, the RDI source secret must
provide:

| Secret key | Value |
| --- | --- |
| `SOURCE_DB_USERNAME` | The service principal's **Application (client) ID** (a GUID). |
| `SOURCE_DB_PASSWORD` | The service principal's **client secret**. |

{{< warning >}}The `SOURCE_DB_USERNAME` value is the client ID (a GUID), but the contained
database user created in the previous section uses the service principal's **display
name**. These are two different identifiers for the same principal — mixing them up is
the most common cause of `Login failed for user '<token-identified principal>'` errors
at connection time.{{< /warning >}}

#### Other Microsoft Entra authentication modes

The Microsoft JDBC driver supports several other Microsoft Entra modes. The following
are technically usable but are not currently validated by RDI — check with Redis
support before using them in production:

- **`ActiveDirectoryServicePrincipalCertificate`** — service principal authenticated by
  a certificate instead of a secret. Useful when organizational policy forbids
  long-lived shared secrets.
- **`ActiveDirectoryManagedIdentity`** — for RDI installations running on an Azure
  resource (such as an Azure VM or Azure Kubernetes Service node) that has a system-
  or user-assigned managed identity.

The deprecated `ActiveDirectoryPassword` mode and the interactive
`ActiveDirectoryInteractive` mode are not suitable for a server-side connector and are
not supported.

See Microsoft's
[Connect using Microsoft Entra authentication](https://learn.microsoft.com/en-us/sql/connect/jdbc/connecting-using-azure-active-directory-authentication?view=sql-server-ver17)
for the full list of modes and their connection-string syntax.

### Verify the connection

Connect to the database as the Debezium user (the SQL user or the Microsoft Entra
service principal) and run `sys.sp_cdc_help_change_data_capture` to confirm that the
user can see the captured tables. The query is the same as for
[on-premises SQL Server](#4-check-that-you-have-access-to-the-cdc-table).

You can also confirm the database-level and table-level CDC state directly from the
catalog views:

```sql
-- Check whether CDC is enabled on the database
SELECT name, is_cdc_enabled FROM sys.databases WHERE name = '<database-name>'
GO

-- Check which tables in the current database have CDC enabled
SELECT name, is_tracked_by_cdc FROM sys.tables WHERE is_tracked_by_cdc = 1
GO
```

### Troubleshooting

- **`Login failed for user '<token-identified principal>'`** — the contained database
  user was not created for this service principal, or it was created with the wrong
  identifier. Verify that the `CREATE USER ... FROM EXTERNAL PROVIDER` statement used
  the service principal's display name, and that `SOURCE_DB_USERNAME` contains its
  client ID. Query `sys.database_principals` on the source database to see which
  principals exist.
- **`SSL Server certificate validation failed` or hostname mismatch** —
  `database.hostNameInCertificate` is missing or has the wrong value. For Azure SQL
  Database, set it to `"*.database.windows.net"` to match the wildcard certificate.
- **`Change data capture is not supported for this edition of SQL Server`** — the
  Azure SQL Database is on an unsupported service tier. In the DTU purchasing model,
  scale up to S3 or higher. In the vCore purchasing model, CDC is supported on all
  tiers, so check that you are connecting to a standard Azure SQL Database (CDC is
  not supported on Azure SQL Edge or other variants).
- **Connection timeouts** — the RDI connector's source IP is not allowed by the Azure
  SQL firewall, or the private endpoint is not reachable from the connector's network.
  Verify firewall rules in the Azure portal and that DNS resolves to the expected
  (public or private) endpoint.

## Handling changes to the schema

RDI can't adapt automatically when you change the schema of a CDC table in SQL Server. For example,
if you add a new column to a table you are capturing then RDI will generate errors
instead of capturing the changes correctly. See Debezium's
[SQL Server schema evolution](https://debezium.io/documentation/reference/stable/connectors/sqlserver.html#sqlserver-schema-evolution)
docs for more information.

If you have administrator privileges, you can follow the steps below to update RDI after
a schema change and resume CDC. See the
[online schema updates](https://debezium.io/documentation/reference/stable/connectors/sqlserver.html#online-schema-updates)
documentation for further details.

```checklist {id="sqlserver-schema-changes" nointeractive="true" }
- [ ] [Make your changes to the source table schema](#make-your-changes-to-the-source-table-schema)
- [ ] [Create a new capture table for the updated source table](#create-a-new-capture-table-for-the-updated-source-table)
- [ ] [Drop the old capture table](#drop-the-old-capture-table)
```

1. <a id="make-your-changes-to-the-source-table-schema"></a>
    Make your changes to the source table schema.

1. <a id="create-a-new-capture-table-for-the-updated-source-table"></a>
  Create a new capture table for the updated source table by running the `sys.sp_cdc_enable_table` stored
    procedure with a new, unique value for the parameter `@capture_instance`. For example, if the old value
    was `dbo_MyTable`, you could replace it with `dbo_MyTable_v2` (you can see the existing values by running
    stored procedure `sys.sp_cdc_help_change_data_capture`):

    ```sql
    EXEC sys.sp_cdc_enable_table
    @source_schema    = N'dbo',
    @source_name      = N'MyTable',
    @role_name        = N'MyRole',
    @capture_instance = N'dbo_MyTable_v2',
    @supports_net_changes = 0
    GO
    ```

1. <a id="drop-the-old-capture-table"></a>
    When Debezium starts streaming from the new capture table, drop the old capture table by running 
    the `sys.sp_cdc_disable_table` stored procedure with the parameter `@capture_instance` set to the old
    capture instance name, `dbo_MyTable`:

    ```sql
    EXEC sys.sp_cdc_disable_table
    @source_schema    = N'dbo',
    @source_name      = N'MyTable',
    @capture_instance = N'dbo_MyTable'
    GO
    ```

{{< note >}}RDI will *not* correctly capture changes that happen in the time gap between changing
the source schema (step 1 above) and updating the value of `@capture_instance` (step 2).
Try to keep the gap as short as possible or perform the update at a time when you expect
few changes to the data.{{< /note >}}