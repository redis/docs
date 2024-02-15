---
Title: Add tables to existing pipelines
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Set up and use Debezium to add additional tables to an existing pipeline
group: di
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: '1'
---

If you want to add a new table to a pipeline that is already in streaming (CDC) mode, you can do so without resetting Debezium Server and executing a new full snapshot. In Debezium, this is called incremental snapshot and it is performed using a table on the source database as the interface with the Debezium connector.

## Prepare the source database for Debezium incremental snapshots

In this section we describe the one time preparation you need to introduce to your source database in order to allow for incremental snapshot.

Incremental snapshot is needed when adding a new table to the pipeline while it's already in streaming (CDC mode). To enable incremenal snapshot, you will need to make a change to your source database. For more formation, see [Debezium's documentation](https://debezium.io/documentation/reference/stable/configuration/signalling).

### Create the signaling table

On the source database, create a signaling table for sending signals to the connector:

```sql
CREATE TABLE <signalingTableName>
(
  id VARCHAR(42) PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  data VARCHAR(2048) NULL
);
```

For more information about the required structure of the signaling table, see [the structure of a signaling data collection](https://debezium.io/documentation/reference/stable/configuration/signalling.html#debezium-signaling-data-collection-structure).

### SQL Server - Enable CDC for the signaling table

On the source database, enable CDC for the signaling table by running this stored procedure:

```sql
USE <databaseName>
GO

EXEC sys.sp_cdc_enable_table
@source_schema = N'<schemaName>'
@source_name   = N'<tableName>',
@role_name     = N'<roleName>',
@filegroup_name = N'<fileGroupName>',
@supports_net_changes = 0
GO
```

For more information, see [stored procedure arguments](#sql-server-sp_cdc_enable_table-stored-procedure-arguments).

### Configure Debezium Server's `application.properties`

- Add the property `debezium.source.signal.data.collection` and set its value to the fully-qualified name of the signaling table that you created.

  The format for the fully-qualified name of the signaling table depends on the source database type.
  The following examples show the naming formats to use for each supported database:

  - MySQL: `<databaseName>.<tableName>`

  - Oracle: `<databaseName>.<schemaName>.<tableName>`

  - PostgreSQL: `<schemaName>.<tableName>`

  - SQL Server: `<databaseName>.<schemaName>.<tableName>`

## Snapshotting an additional table (incremental snapshot)

This section describes the steps to snapshot an additional table using Debezium signaling table mechanism. For more information, see [Debezium documentation](https://debezium.io/documentation/reference/1.6/configuration/signalling.html).

### Prerequisites

A signaling table exists on the source database and the connector is configured to capture it as described [here](#preparing-the-source-database-for-debezium-incremental-snapshots).

### Debezium Server's `application.properties`

Update the property `debezium.source.table.include.list` to contain the new table name to be monitored.

### SQL Server - Enable CDC for the Table

On the source database, enable CDC for the additional table by running this stored procedure:

```sql
USE <databaseName>
GO

EXEC sys.sp_cdc_enable_table
@source_schema = N'<schemaName>'
@source_name   = N'<tableName>',
@role_name     = N'<roleName>',
@filegroup_name = N'<fileGroupName>',
@supports_net_changes = 0
GO
```

For more details on the stored procedure arguments, see [here](#sql-server-sp_cdc_enable_table-stored-procedure-arguments).

### Signal Debezium to execute an incremental snapshot

The following `INSERT` statement will trigger a snapshot signal to the signaling table on the source database. After Debezium detects the change in the signaling table, it reads the signal and runs the requested snapshot operation.

```sql
INSERT INTO
   <signalingTableName>(id, type, data)
VALUES
   (
      '<signalRequestID>', 'execute-snapshot', '{"data-collections":["_<tableName1>_","_<tableName2>_">],"type":"incremental"}'
   )
;
```

The data-collections array lists tables by their fully-qualified names, using the same format as mentioned [here](#configure-debezium-servers-applicationproperties).

#### Signaling Table Columns

| Column | Description                                                                       |
| ------ | --------------------------------------------------------------------------------- |
| id     | An arbitrary string that is assigned as the identifier for the signal request.    |
| type   | The type of signal to send.                                                       |
| data   | An array of table names to include in the snapshot.                               |

## SQL Server: `sp_cdc_enable_table` Stored Procedure Arguments

- `@source_name` - Specifies the name of the table that you want to capture.
- `@role_name` - Specifies a role MyRole to which you can add users to whom you want to grant SELECT permission on the captured columns of the source table. Users in the sysadmin or db_owner role also have access to the specified change tables. Set the value of @role_name to NULL, to allow only members in the sysadmin or db_owner to have full access to captured information.
- `@filegroup_name` - Specifies the filegroup where SQL Server places the change table for the captured table. The named filegroup must be already exist. It is best not to locate change tables in the same filegroup that you use for source tables.
