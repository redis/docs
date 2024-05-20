---
Title: Prepare SQL Server for RDI
aliases: null
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

To prepare your SQL Server database for Debezium, you must first run a query to
enable CDC globally and then separately enable CDC for each table you want to
capture. You need administrator privileges to do this.

Once you enable CDC, it captures all of the INSERT, UPDATE, and DELETE operations
on your chosen tables. The Debezium connector can then emit these events to
[Kafka topics](https://kafka.apache.org/intro#intro_concepts_and_terms).

## 1. Enable CDC on the database

There are two system stored procedures to enable CDC (you need
administrator privileges to run these). Use `sys.sp_cdc_enable_db`
to enable CDC for the whole database and then 
You can run the procedure with SQL Server Management Studio or with
Transact-SQL.

Before running the procedure, ensure that:

- You are a member of the `sysadmin` fixed server role for the SQL Server.
- You are a `db_owner` of the database.
- The SQL Server Agent is running.

Then, follow the steps below to enable CDC:

1.  From the **View** menu in SQL Server Management Studio, click **Template Explorer**.

1.  In the Template Browser, expand **SQL Server Templates**.

1.  Expand **Change Data Capture > Configuration** and then click **Enable Database for CDC**.

1.  In the template, replace the database name in the `USE` statement with the name of the
    database where you want to enable CDC. For example, if your database was called
    `myDB`, the template would be:

    ```sql
    USE MyDB
    GO
    EXEC sys.sp_cdc_enable_db
    GO
    ```

1.  Run the stored procedure `sys.sp_cdc_enable_db` to enable CDC for the database.

When you enable CDC for the database, it creates a schema called `cdc` and also
a CDC user, metadata tables, and other system objects. 

Keep the **Change Data Capture > Configuration** foldout open in the Template Explorer
because you will need it to enable CDC on the individual tables next.

## 2. Enable CDC for the tables you want to capture

You must also enable CDC on the tables you want Debezium to capture using the
following steps (again, you need administrator privileges for this):

1.  With the **Change Data Capture > Configuration** foldout still open in the
    Template Explorer, select **Enable Table Specifying Filegroup Option**.

1.  In the template, replace the table name in the USE statement with the name of
    the table you want to capture. For example, if your table was called `MyTable`
    then the template would look like the following:

    ```sql
    USE MyDB
    GO

    EXEC sys.sp_cdc_enable_table
    @source_schema = N'dbo',
    @source_name   = N'MyTable', 
    @role_name     = N'MyRole',  
    @filegroup_name = N'MyDB_CT',
    @supports_net_changes = 0
    GO
    ```
  
1.  Run the stored procedure `sys.sp_cdc_enable_table` to enable CDC for
    the table.

1.  Repeat steps 1 to 3 for every table you want to capture. 

## 3. Check that you have access to the CDC table

You can use another stored procedure `sys.sp_cdc_help_change_data_capture`
to query the CDC information for the database and check you have enabled
it correctly. Before doing this, check that:

* You have `SELECT` permission on all of the captured columns of the capture instance.
  If you are a member of the `db_owner` database role then you can view information for
  all of the defined capture instances.
* You are a member of any gating roles that are defined for the table that the query includes.

Follow the steps below to run `sys.sp_cdc_help_change_data_capture`:

1.  From the **View** menu in SQL Server Management Studio, click **Object Explorer**.

1.  From the Object Explorer, expand **Databases**, and then expand your database
    object, for example, `MyDB`.

1.  Expand **Programmability > Stored Procedures > System Stored Procedures**.

1.  Run the `sys.sp_cdc_help_change_data_capture` stored procedure to query
    the table. For example, if your database was called `MyDB` then you would
    run the following:

    ```sql
    USE MyDB;
    GO
    EXEC sys.sp_cdc_help_change_data_capture
    GO
    ```

1.  The query returns configuration information for each table in the database that
    has CDC enabled and that contains change data that you are authorized to
    access. If the result is empty then you should check that you have privileges
    to access both the capture instance and the CDC tables.

## SQL Server on Azure

You can also use the Debezium SQL Server connector with SQL Server on Azure.
See Microsoft's guide to
[configuring SQL Server on Azure for CDC with Debezium](https://learn.microsoft.com/en-us/samples/azure-samples/azure-sql-db-change-stream-debezium/azure-sql%2D%2Dsql-server-change-stream-with-debezium/)
for more information.

### SQL Server capture job agent configuration parameters

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
