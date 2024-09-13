---
Title: Prepare Oracle and Oracle RAC for RDI
aliases: /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/oracle/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare Oracle and Oracle RAC databases to work with RDI
group: di
linkTitle: Prepare Oracle
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 1
---

The Oracle Debezium connector uses
[Oracle LogMiner](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-logminer-utility.html)
to get data from the commitlog to a view inside the database. Follow the
steps below to configure LogMiner and prepare your database for use with
RDI.

## 1. Configure Oracle LogMiner

The following example shows the configuration for Oracle LogMiner.

{{< note >}}[Amazon RDS for Oracle](https://aws.amazon.com/rds/oracle/)
doesn't let you execute the commands
in the example below or let you log in as `sysdba`. See the
separate example below to [configure Amazon RDS for Oracle](#config-aws).
{{< /note >}}

```sql
ORACLE_SID=ORACLCDB dbz_oracle sqlplus /nolog

CONNECT sys/top_secret AS SYSDBA
alter system set db_recovery_file_dest_size = 10G;
alter system set db_recovery_file_dest = '/opt/oracle/oradata/recovery_area' scope=spfile;
shutdown immediate
startup mount
alter database archivelog;
alter database open;
-- You should now see "Database log mode: Archive Mode"
archive log list

exit;
```

### Configure Amazon RDS for Oracle {#config-aws}

AWS provides its own set of commands to configure LogMiner.

{{< note >}}Before executing these commands,
you must enable backups on your Oracle AWS RDS instance.
{{< /note >}}

Check that Oracle has backups enabled with the following command:

```sql
SQL> SELECT LOG_MODE FROM V$DATABASE;

LOG_MODE
------------
ARCHIVELOG
```

The `LOG_MODE` should be set to `ARCHIVELOG`. If it isn't then you
should reboot your Oracle AWS RDS instance.

Once `LOG_MODE` is correctly set to ARCHIVELOG, execute the following
commands to complete the LogMiner configuration. The first command enables
archive logging and the second adds supplemental logging.

```sql
exec rdsadmin.rdsadmin_util.set_configuration('archivelog retention hours',24);
exec rdsadmin.rdsadmin_util.alter_supplemental_logging('ADD');
```

You must enable supplemental logging for the tables you want to capture or
for the entire database. This lets Debezium capture the state of
database rows before and after changes occur. 

The following example shows how to configure supplemental logging for all columns
in a single table called `inventory.customers`:

```sql
ALTER TABLE inventory.customers ADD SUPPLEMENTAL LOG DATA (ALL) COLUMNS;
```

{{< note >}}If you enable supplemental logging for *all* table columns, you will
probably see the size of the Oracle redo logs increase dramatically. Avoid this
by using supplemental logging only when you need it. {{< /note >}} 

You must also enable minimal supplemental logging at the database level with
the following command:

```sql
ALTER DATABASE ADD SUPPLEMENTAL LOG DATA;
```

## 2. Check the redo log sizing

Before you use the Debezium connector, you should check with your
database administrator that there are enough
redo logs with enough capacity to store the data dictionary for your
database. In general, the size of the data dictionary increases with the number
of tables and columns in the database. If you don't have enough capacity in
the logs then you might see performance problems with both the database and
the Debezium connector.

## 3. Set the Archive log destination

You can configure up to 31 different destinations for archive logs
(you must have administrator privileges to do this). You can set parameters for
each destination to specify its purpose, such as log shipping for physical
standbys, or external storage to allow for extended log retention. Oracle reports
details about archive log destinations in the `V$ARCHIVE_DEST_STATUS` view.

The Debezium Oracle connector only uses destinations that have a status of
`VALID` and a type of `LOCAL`. If you only have one destination with these
settings then Debezium will use it automatically.
If you have more than one destination with these settings,
then you should consult your database administrator about which one to
choose for Debezium.

Use the `log.mining.archive.destination.name` property in the connector configuration
to select the archive log destination for Debezium.

For example, suppose you have two archive destinations, `LOG_ARCHIVE_DEST_2` and
`LOG_ARCHIVE_DEST_3`, and they both have status set to `VALID` and type set to
`LOCAL`. Debezium could use either of these destinations, so you must select one
of them explicitly in the configuration. To select `LOG_ARCHIVE_DEST_3`, you would
use the following setting:

```json
{
    "log.mining.archive.destination.name": "LOG_ARCHIVE_DEST_3"
}
```

## 4. Create a user for the connector

The Debezium Oracle connector must run as an Oracle LogMiner user with
specific permissions. The following example shows some SQL that creates
an Oracle user account for the connector in a multi-tenant database model:

```sql
sqlplus sys/top_secret@//localhost:1521/ORCLCDB as sysdba
CREATE TABLESPACE logminer_tbs DATAFILE '/opt/oracle/oradata/ORCLCDB/logminer_tbs.dbf'
    SIZE 25M REUSE AUTOEXTEND ON MAXSIZE UNLIMITED;
exit;

sqlplus sys/top_secret@//localhost:1521/ORCLPDB1 as sysdba
CREATE TABLESPACE logminer_tbs DATAFILE '/opt/oracle/oradata/ORCLCDB/ORCLPDB1/logminer_tbs.dbf'
    SIZE 25M REUSE AUTOEXTEND ON MAXSIZE UNLIMITED;
exit;

sqlplus sys/top_secret@//localhost:1521/ORCLCDB as sysdba

CREATE USER c##dbzuser IDENTIFIED BY dbz
    DEFAULT TABLESPACE logminer_tbs
    QUOTA UNLIMITED ON logminer_tbs
    CONTAINER=ALL;

GRANT CREATE SESSION TO c##dbzuser CONTAINER=ALL; 
GRANT SET CONTAINER TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ON V_$DATABASE to c##dbzuser CONTAINER=ALL; 
GRANT FLASHBACK ANY TABLE TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ANY TABLE TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT_CATALOG_ROLE TO c##dbzuser CONTAINER=ALL; 
GRANT EXECUTE_CATALOG_ROLE TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ANY TRANSACTION TO c##dbzuser CONTAINER=ALL; 
GRANT LOGMINING TO c##dbzuser CONTAINER=ALL; 

GRANT CREATE TABLE TO c##dbzuser CONTAINER=ALL; 
GRANT LOCK ANY TABLE TO c##dbzuser CONTAINER=ALL; 
GRANT CREATE SEQUENCE TO c##dbzuser CONTAINER=ALL; 

GRANT EXECUTE ON DBMS_LOGMNR TO c##dbzuser CONTAINER=ALL; 
GRANT EXECUTE ON DBMS_LOGMNR_D TO c##dbzuser CONTAINER=ALL; 

GRANT SELECT ON V_$LOG TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ON V_$LOG_HISTORY TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ON V_$LOGMNR_LOGS TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ON V_$LOGMNR_CONTENTS TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ON V_$LOGMNR_PARAMETERS TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ON V_$LOGFILE TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ON V_$ARCHIVED_LOG TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ON V_$ARCHIVE_DEST_STATUS TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ON V_$TRANSACTION TO c##dbzuser CONTAINER=ALL; 

GRANT SELECT ON V_$MYSTAT TO c##dbzuser CONTAINER=ALL; 
GRANT SELECT ON V_$STATNAME TO c##dbzuser CONTAINER=ALL; 

exit;
```

## 5. Configuration is complete

Once you have followed the steps above, your Oracle database is ready
for Debezium to use.
