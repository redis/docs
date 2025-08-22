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
archive logging and the second adds [supplemental logging](#supp-logging).

```sql
exec rdsadmin.rdsadmin_util.set_configuration('archivelog retention hours',24);
exec rdsadmin.rdsadmin_util.alter_supplemental_logging('ADD');
```

## 2. Enable supplemental logging {#supp-logging}

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

## 3. Check the redo log sizing

Before you use the Debezium connector, you should check with your
database administrator that there are enough
redo logs with enough capacity to store the data dictionary for your
database. In general, the size of the data dictionary increases with the number
of tables and columns in the database. If you don't have enough capacity in
the logs then you might see performance problems with both the database and
the Debezium connector.

## 4. Set the Archive log destination

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

## 5. Create a user for the connector {#create-dbz-user}

The Debezium Oracle connector must run as an Oracle LogMiner user with specific permissions.

Typically, when you create the Oracle account for the connector, 
you grant the account a level of access that permits the connector to detect changes from all tables in the database. 
However, in some environments, security policies might prohibit you from granting such a broad level of access.

The following example shows some SQL that creates an Oracle user account for the connector in a multi-tenant database model. 
The grant settings in the example permit the Debezium user to access all user tables in the database.

To comply with security policies, you can modify the `SELECT ANY TABLE` and `FLASHBACK ANY TABLE` grants 
so that the connector can access only those tables that you intend to capture.

Do not modify other grants, such as the `SELECT ANY TRANSACTION` grant, 
or the set of `SELECT ON V_$` grants, which provide access to dynamic performance views (`V_$`). 
These grants are required for the connector to function.

{{< note >}}To prevent data loss, if you restrict the scope of the SELECT and FLASHBACK grants, 
be sure that the modified scope is compatible with the settings in the connector’s include configuration. 
The privileges that you set for the account must permit reading from all of the tables that you want the connector to capture.{{< /note >}}

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

-- See `Limiting privileges` below if the privileges
-- granted by these two commands raise security concerns.
GRANT FLASHBACK ANY TABLE TO c##dbzuser CONTAINER=ALL;
GRANT SELECT ANY TABLE TO c##dbzuser CONTAINER=ALL;
-- 

GRANT SELECT_CATALOG_ROLE TO c##dbzuser CONTAINER=ALL;
GRANT EXECUTE_CATALOG_ROLE TO c##dbzuser CONTAINER=ALL;
GRANT SELECT ANY TRANSACTION TO c##dbzuser CONTAINER=ALL;
GRANT LOGMINING TO c##dbzuser CONTAINER=ALL;

-- See `Limiting privileges` below if the privileges
-- granted by these two commands raise security concerns.
GRANT CREATE TABLE TO c##dbzuser CONTAINER=ALL;
GRANT LOCK ANY TABLE TO c##dbzuser CONTAINER=ALL;
-- 

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

| Role name                | Description                                                                                                                                                                                                                                                                                                                                                                                            |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| CREATE SESSION           | Enables the connector to connect to Oracle.                                                                                                                                                                                                                                                                                                                                                            |
| SET CONTAINER            | Enables the connector to switch between pluggable databases. This is only required when the Oracle installation has container database support (CDB) enabled.                                                                                                                                                                                                                                          |
| SELECT ON V_$DATABASE    | Enables the connector to read the V_$DATABASE table.                                                                                                                                                                                                                                                                                                                                                    |
| FLASHBACK ANY TABLE      | Enables the connector to perform Flashback queries, which is how the connector performs the initial snapshot of data. Optionally, rather than granting FLASHBACK permission on all tables, you can grant the FLASHBACK privilege for specific tables only.                                                                                                                                             |
| SELECT ANY TABLE         | Enables the connector to read any table. Optionally, rather than granting SELECT permission on all tables, you can grant the SELECT privilege for specific tables only.                                                                                                                                                                                                                                |
| SELECT_CATALOG_ROLE      | Enables the connector to read the data dictionary, which is needed by Oracle LogMiner sessions.                                                                                                                                                                                                                                                                                                        |
| EXECUTE_CATALOG_ROLE     | Enables the connector to write the data dictionary into the Oracle redo logs, which is needed to track schema changes.                                                                                                                                                                                                                                                                                 |
| SELECT ANY TRANSACTION   | Enables the snapshot process to perform a Flashback snapshot query against any transaction so that the connector can read past changes from LogMiner. When FLASHBACK ANY TABLE is granted, this should also be granted. This grant is optional for Oracle 12c and later. In those later releases, the connector obtains the required privileges through the EXECUTE_CATALOG_ROLE and LOGMINING grants. |
| LOGMINING                | This role was added in newer versions of Oracle as a way to grant full access to Oracle LogMiner and its packages. On older versions of Oracle that don’t have this role, you can ignore this grant.                                                                                                                                                                                                   |
| CREATE TABLE             | Enables the connector to create its flush table in its default tablespace. The flush table allows the connector to explicitly control flushing of the LGWR internal buffers to disk.                                                                                                                                                                                                                   |
| LOCK ANY TABLE           | Enables the connector to lock tables during schema snapshot. If snapshot locks are explicitly disabled via configuration, this grant can be safely ignored.                                                                                                                                                                                                                                            |
| CREATE SEQUENCE          | Enables the connector to create a sequence in its default tablespace.                                                                                                                                                                                                                                                                                                                                  |
| EXECUTE ON DBMS_LOGMNR   | Enables the connector to run methods in the DBMS_LOGMNR package. This is required to interact with Oracle LogMiner. On newer versions of Oracle this is granted via the LOGMINING role but on older versions, this must be explicitly granted.                                                                                                                                                         |
| EXECUTE ON DBMS_LOGMNR_D | Enables the connector to run methods in the DBMS_LOGMNR_D package. This is required to interact with Oracle LogMiner. On newer versions of Oracle this is granted via the LOGMINING role but on older versions, this must be explicitly granted.                                                                                                                                                       |
| SELECT ON V_$…​.          | Enables the connector to read these tables. The connector must be able to read information about the Oracle redo and archive logs, and the current transaction state, to prepare the Oracle LogMiner session. Without these grants, the connector cannot operate.                                                                                                                                      |

### Limiting privileges

The privileges granted in the example above are convenient,
but you may prefer to restrict them further to improve security. In particular,
you might want to prevent the Debezium user from creating tables, or
selecting or locking any table.

The Debezium user needs the `CREATE TABLE` privilege to create the
`LOG_MINING_FLUSH` table when it connects for the first
time. After this point, it doesn't need to create any more tables,
so you can safely revoke this privilege with the following command:

```sql
REVOKE CREATE TABLE FROM c##dbzuser container=all;
```

[The example above](#create-dbz-user) grants the `SELECT ANY TABLE` and
`FLASHBACK ANY TABLE` privileges for convenience, but only the tables synced to RDI
and the `V_$XXX` tables strictly need these privileges.
You can replace the `GRANT SELECT ANY TABLE` command with explicit
commands for each table. For example, you would use commands like the
following for the tables in our sample
[`chinook`](https://github.com/Redislabs-Solution-Architects/rdi-quickstart-postgres)
database. (Note that Oracle 19c requires you to run a separate `GRANT`
command for each table individually.)

```sql
GRANT SELECT ON chinook.album TO c##dbzuser;
GRANT SELECT ON chinook.artist TO c##dbzuser;
GRANT SELECT ON chinook.customer TO c##dbzuser;
...
```

Similarly, instead of `GRANT FLASHBACK ANY TABLE`, you would use the following
commands:

```sql
GRANT FLASHBACK ON chinook.album TO c##dbzuser;
GRANT FLASHBACK ON chinook.artist TO c##dbzuser;
GRANT FLASHBACK ON chinook.customer TO c##dbzuser;
...
```

The `LOCK` privilege is automatically granted by the `SELECT`
privilege, so you can omit this command if you have granted `SELECT`
on specific tables.

### Revoking existing privileges

If you initially set the Debezium user's privileges on all tables,
but you now want to restrict them, you can revoke the existing
privileges before resetting them as described in the
[Limiting privileges](#limiting-privileges) section.

Use the following commands to revoke and reset the `SELECT` privileges:

```sql
REVOKE SELECT ANY TABLE FROM c##dbzuser container=all;
ALTER SESSION SET container=orclpdb1;

GRANT SELECT ON chinook.album TO c##dbzuser;
-- ...etc
```

The equivalent commands for `FLASHBACK` are:

```sql
REVOKE FLASHBACK ANY TABLE FROM c##dbzuser container=all;
ALTER SESSION SET container=orclpdb1;
GRANT FLASHBACK ON chinook.album TO c##dbzuser;
```

The `SELECT` privilege automatically includes the `LOCK`
privilege, so when you grant `SELECT` for specific tables
you should also revoke `LOCK` on all tables:

```sql
REVOKE LOCK ANY TABLE FROM c##dbzuser container=all;
```

## 6. Support for Oracle XMLTYPE columns (optional)

If your Oracle database contains tables with columns of type
[`XMLTYPE`](https://docs.oracle.com/en/database/oracle/oracle-database/21/arpls/XMLTYPE.html),
you must configure additional libraries for Debezium Server to process these columns correctly.

### Create a custom Debezium Server image

To support `XMLTYPE` columns, you must create a custom [Docker](https://www.docker.com/) image
that includes the required Oracle XML libraries.

1. Download the required libraries from Maven Central:

   ```bash
   mkdir xml
   cd xml
   wget https://repo.maven.apache.org/maven2/com/oracle/database/xml/xdb/19.27.0.0/xdb-19.27.0.0.jar
   wget https://repo.maven.apache.org/maven2/com/oracle/database/xml/xmlparserv2/19.27.0.0/xmlparserv2-19.27.0.0.jar
   mv xdb-19.27.0.0.jar xdb.jar
   mv xmlparserv2-19.27.0.0.jar xmlparserv2.jar
   ```

2. Create a `Dockerfile` in the same directory:

   ```dockerfile
   FROM quay.io/debezium/server:3.0.8.Final

   USER root

   COPY xdb.jar /debezium/lib
   COPY xmlparserv2.jar /debezium/lib
   ```

3. Build the custom image:

   ```bash
   cd ..
   docker build -t dbz-xml xml
   docker tag dbz-xml quay.io/debezium/server:3.0.8.Final
   docker image save quay.io/debezium/server:3.0.8.Final -o dbz3.0.8-xml-linux-amd.tar
   ```

4. Add the image to your K3s image repository:

   ```bash
   sudo k3s ctr images import dbz3.0.8-xml-linux-amd.tar all
   ```

### Configure RDI for XMLTYPE support

In your RDI configuration file, set the `lob.enabled` property to `true` in the
`advanced.source` section:

```yaml
sources:
  oracle:
    type: cdc
    logging:
      level: info
    connection:
      type: oracle
      host: oracle
      port: 1521
      user: ${SOURCE_DB_USERNAME}
      password: ${SOURCE_DB_PASSWORD}
      database: ORCLCDB
    advanced:
      source:
        database.pdb.name: ORCLPDB1
        lob.enabled: true
```

### Test XMLTYPE support

You can create a test table to verify that `XMLTYPE` columns work correctly
(using the
[`CHINOOK`](https://github.com/Redislabs-Solution-Architects/rdi-quickstart-postgres/tree/main)
schema as an example):

```sql
CREATE TABLE tab1 (
  xmlid INT NOT NULL,
  col1  SYS.XMLTYPE,
  CONSTRAINT PK_tab1 PRIMARY KEY (xmlid)
);

DECLARE
  v_xml   SYS.XMLTYPE;
  v_doc   CLOB;
BEGIN
  -- XMLTYPE created from a CLOB
  v_doc := '<?xml version="1.0"?>' || Chr(10) || ' <TABLE_NAME>MY_TABLE</TABLE_NAME>';
  v_xml := SYS.XMLTYPE.createXML(v_doc);

  INSERT INTO tab1 (xmlid, col1) VALUES (1, v_xml);

  -- XMLTYPE created from a query
  SELECT SYS_XMLGEN(table_name)
  INTO   v_xml
  FROM   user_tables
  WHERE  rownum = 1;

  INSERT INTO tab1 (xmlid, col1) VALUES (2, v_xml);

  COMMIT;
END;
/

ALTER TABLE CHINOOK.TAB1 ADD SUPPLEMENTAL LOG DATA (ALL) COLUMNS;
```

After you run an initial
[snapshot]({{< relref "/integrate/redis-data-integration/data-pipelines/#pipeline-lifecycle" >}}),
the XML data appears in your Redis target database:

{{< image filename="/images/rdi/ingest/xmltype-example.webp" >}}

## 7. Configuration is complete

Once you have followed the steps above, your Oracle database is ready
for Debezium to use.
