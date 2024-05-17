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

## Enable CDC on the database and tables

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

Keep the **Change Data Capture > Configuration** foldout open in the

## 2. Enable CDC for the tables you want to capture

You must also enable CDC on the tables you want Debezium to capture (again, you need
administrator privileges for this).