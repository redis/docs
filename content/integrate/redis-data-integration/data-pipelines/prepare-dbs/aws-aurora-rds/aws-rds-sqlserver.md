---
Title: Prepare Microsoft SQL Server on AWS RDS for RDI
aliases: /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/aws-aurora-rds/aws-rds-sqlserver/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Enable CDC features in your source databases
group: di
hideListLinks: false
linkTitle: Prepare Microsoft SQL Server on AWS RDS
summary: Prepare Microsoft SQL Server on AWS RDS databases to work with Redis Data Integration.
type: integration
weight: 3
---

Follow the steps in the sections below to prepare a [Microsoft SQL Server on AWS RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.SQLServer.html) database to work with RDI.

{{< note >}}
Change Data Capture (CDC) is not supported on SQL Server Express Edition. Only the Standard, Enterprise, and Developer editions support CDC and are supported by RDI.
{{< /note >}}

```checklist {id="rds-sqlserver-list" nointeractive="true" }
- [ ] [Create the Debezium user](#create-the-debezium-user)
- [ ] [Enable CDC on the database](#enable-cdc-on-the-database)
```

## Create the Debezium user

The Debezium connector needs a user account to connect to SQL Server. This
user must have appropriate permissions on all databases where you want Debezium
to capture changes.

```checklist {id="rds-sqlserver-create-debezium-user" nointeractive="true" }
- [ ] [Connect to SQL Server as an admin user](#connect-to-sql-server-as-an-admin-user)
- [ ] [Grant the user the necessary permissions](#grant-the-user-the-necessary-permissions)
```

1. <a id="connect-to-sql-server-as-an-admin-user"></a>Connect to your database as an admin user and create a new user for the connector:

    ```sql
    USE master
    GO
    CREATE LOGIN <username> WITH PASSWORD = '<password>'
    GO
    USE <database>
    GO
    CREATE USER <username> FOR LOGIN <username>
    GO
    ```

    Replace `<username>` and `<password>` with a username and password for the new user and replace `<database>` with the name of your database.

1. <a id="grant-the-user-the-necessary-permissions"></a>Grant the user the necessary permissions:

    ```sql
    USE master
    GO
    GRANT VIEW SERVER STATE TO <username>
    GO
    USE <database>
    GO
    EXEC sp_addrolemember N'db_datareader', N'<username>'
    GO
    ```

    Replace `<username>` with the username of the Debezium user and replace `<database>` with the name of your database.

## Enable CDC on the database

Change Data Capture (CDC) must be enabled for the database and for each table you want to capture.

```checklist {id="rds-sqlserver-enable-cdc" nointeractive="true" }
- [ ] [Enable CDC for the database](#enable-cdc-for-the-database)
- [ ] [Enable CDC for each table you want to capture](#enable-cdc-for-each-table-you-want-to-capture)
- [ ] [Add the Debezium user to the CDC role](#add-the-debezium-user-to-the-cdc-role)
```

1. <a id="enable-cdc-for-the-database"></a>Enable CDC for the database by running the following command:

    ```sql
    EXEC msdb.dbo.rds_cdc_enable_db '<database>'
    GO
    ```

    Replace `<database>` with the name of your database.

1. <a id="enable-cdc-for-each-table-you-want-to-capture"></a>Enable CDC for each table you want to capture by running the following commands:

    ```sql
    USE <database>
    GO
    EXEC sys.sp_cdc_enable_table
    @source_schema = N'<schema>',
    @source_name   = N'<table>', 
    @role_name     = N'<role>',
    @supports_net_changes = 0
    GO
    ```

    Replace `<database>` with the name of your database, `<schema>` with the name of the schema containing the table, `<table>` with the name of the table, and `<role>` with the name of a new role that will be created to manage access to the CDC data. 

    {{< note >}}
The value for `@role_name` can’t be a fixed database role, such as `db_datareader`. 
Specifying a new name will create a corresponding database role that has full access to the
captured change data.
    {{< /note >}}

1. <a id="add-the-debezium-user-to-the-cdc-role"></a>Add the Debezium user to the CDC role:

    ```sql
    USE <database>
    GO
    EXEC sp_addrolemember N'<role>', N'<username>'
    GO
    ```

    Replace `<role>` with the name of the role you created in the previous step and replace `<username>` with the username of the Debezium user.