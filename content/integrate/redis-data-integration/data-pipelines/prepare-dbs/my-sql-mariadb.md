---
Title: Prepare MySQL/MariaDB for RDI
aliases: /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/my-sql-mariadb/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare MySQL and MariaDB databases to work with RDI
group: di
linkTitle: Prepare MySQL/MariaDB
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 2
---

The following checklist summarizes the steps to prepare a MySQL or MariaDB
database for RDI, with links to the sections that explain the steps in
full detail. You may find it helpful to track your progress with the
checklist as you complete each step.

```checklist {id="mysqlmariadblist"}
- [ ] [Create a CDC user](#1-create-a-cdc-user)
- [ ] [Enable the binlog](#2-enable-the-binlog)
- [ ] [Enable GTIDs](#3-enable-gtids)
- [ ] [Configure session timeouts](#4-configure-session-timeouts)
- [ ] [Enable query log events](#5-enable-query-log-events)
- [ ] [Check binlog_row_value_options](#6-check-binlog_row_value_options)
```

## 1. Create a CDC user

The Debezium connector needs a user account to connect to MySQL/MariaDB. This
user must have appropriate permissions on all databases where you want Debezium
to capture changes.

Run the [MySQL CLI client](https://dev.mysql.com/doc/refman/8.3/en/mysql.html)
and then run the following commands:

```checklist {id="mysqlmariadb-create-cdc-user" nointeractive="true" }
- [ ] [Create the CDC user](#create-the-cdc-user)
- [ ] [Grant the user the necessary permissions](#grant-the-user-the-necessary-permissions)
- [ ] [Finalize the user's permissions](#finalize-the-users-permissions)
```

1.  <a id="create-the-cdc-user"></a>
    Create the CDC user:

    ```sql
    mysql> CREATE USER 'user'@'localhost' IDENTIFIED BY 'password';
    ```

1.  <a id="grant-the-user-the-necessary-permissions"></a>
    Grant the required permissions to the user:

    ```sql
    # MySQL <v8.0
    mysql> GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'user' IDENTIFIED BY 'password';

    # MySQL v8.0 and above
    mysql> GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'user'@'localhost';
    ```

1.  <a id="finalize-the-users-permissions"></a>
    Finalize the user's permissions:

    ```sql
    mysql> FLUSH PRIVILEGES;
    ```

## 2. Enable the binlog

You must enable binary logging for MySQL replication. The binary logs record transaction
updates so that replication tools can propagate changes. You will need administrator
privileges to do this.

First, you should check whether the `log-bin` option is already set to `ON`, using
the following query:

```sql
// for MySql 5.x
mysql> SELECT variable_value as "BINARY LOGGING STATUS (log-bin) ::"
FROM information_schema.global_variables WHERE variable_name='log_bin';
// for MySql 8.x
mysql> SELECT variable_value as "BINARY LOGGING STATUS (log-bin) ::"
FROM performance_schema.global_variables WHERE variable_name='log_bin';
```

If `log-bin` is `OFF` then add the following properties to your
server configuration file:

```
server-id         = 223344 # Querying variable is called server_id, e.g. SELECT variable_value FROM information_schema.global_variables WHERE variable_name='server_id';
log_bin                     = mysql-bin
binlog_format               = ROW
binlog_row_image            = FULL
binlog_expire_logs_seconds  = 864000
```

You can run the query above again to check that `log-bin` is now `ON`.

{{< note >}}If you are using [Amazon RDS for MySQL](https://aws.amazon.com/rds/mysql/) then
you must enable automated backups for your database before it can use binary logging.
If you don't enable automated backups first then the settings above will have no
effect.{{< /note >}}

## 3. Enable GTIDs

*Global transaction identifiers (GTIDs)* uniquely identify the transactions that occur
on a server within a cluster. You don't strictly need to use them with a Debezium MySQL
connector, but you might find it helpful to enable them.
Use GTIDs to simplify replication and to confirm that the primary and replica servers are
consistent.

GTIDs are available in MySQL 5.6.5 and later. See the
[MySQL documentation about GTIDs](https://dev.mysql.com/doc/refman/8.0/en/replication-options-gtids.html#option_mysqld_gtid-mode) for more information.

Follow the steps below to enable GTIDs. You will need access to the MySQL configuration file
to do this.

```checklist {id="mysqlmariadb-enable-gtids" nointeractive="true" }
- [ ] [Enable gtid_mode](#enable-gtid_mode)
- [ ] [Enable enforce_gtid_consistency](#enable-enforce_gtid_consistency)
- [ ] [Confirm the changes](#confirm-the-changes)
```

1.  <a id="enable-gtid_mode"></a>
    Enable `gtid_mode`:

    ```sql
    mysql> gtid_mode=ON
    ```

1.  <a id="enable-enforce_gtid_consistency"></a>
    Enable `enforce_gtid_consistency`:

    ```sql
    mysql> enforce_gtid_consistency=ON
    ```

1.  <a id="confirm-the-changes"></a>
    Confirm the changes:

    ```sql
    mysql> show global variables like '%GTID%';
    
    >>> Result:

    +--------------------------+-------+
    | Variable_name            | Value |
    +--------------------------+-------+
    | enforce_gtid_consistency | ON    |
    | gtid_mode                | ON    |
    +--------------------------+-------+
    ```

## 4. Configure session timeouts

RDI captures an initial *snapshot* of the source database when it begins
the CDC process (see the
[architecture overview]({{< relref "/integrate/redis-data-integration/architecture#overview" >}})
for more information). If your database is large then the connection could time out
while RDI is reading the data for the snapshot. You can prevent this using the
`interactive_timeout` and `wait_timeout` settings in your MySQL configuration file:

```
mysql> interactive_timeout=<duration-in-seconds>
mysql> wait_timeout=<duration-in-seconds>
```

## 5. Enable query log events

If you want to see the original SQL statement for each binlog event then you should
enable `binlog_rows_query_log_events` (MySQL configuration) or
`binlog_annotate_row_events` (MariaDB configuration):

```
mysql> binlog_rows_query_log_events=ON

mariadb> binlog_annotate_row_events=ON
```

This option is available in MySQL 5.6 and later.

## 6. Check `binlog_row_value_options`

You should check the value of the `binlog_row_value_options` variable
to ensure it is not set to `PARTIAL_JSON`. If it *is* set to
`PARTIAL_JSON` then Debezium might not be able to see `UPDATE` events.

Check the current value of the variable with the following command:

```sql
mysql> show global variables where variable_name = 'binlog_row_value_options';

>>> Result:

+--------------------------+-------+
| Variable_name            | Value |
+--------------------------+-------+
| binlog_row_value_options |       |
+--------------------------+-------+
```

If the value is `PARTIAL_JSON` then you should unset the variable:

```sql
mysql> set @@global.binlog_row_value_options="" ;
```

## 7. Configuration is complete

After following the steps above, your MySQL/MariaDB database is ready
for Debezium to use.
