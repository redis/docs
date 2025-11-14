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

You can also use the Debezium SQL Server connector with SQL Server on Azure.
See Microsoft's guide to
[configuring SQL Server on Azure for CDC with Debezium](https://learn.microsoft.com/en-us/samples/azure-samples/azure-sql-db-change-stream-debezium/azure-sql%2D%2Dsql-server-change-stream-with-debezium/)
for more information.

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