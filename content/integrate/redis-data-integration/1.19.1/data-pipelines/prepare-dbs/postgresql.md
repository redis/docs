---
Title: Prepare PostgreSQL for RDI
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare PostgreSQL databases to work with RDI
group: di
linkTitle: Prepare PostgreSQL
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 2
url: '/integrate/redis-data-integration/1.19.1/data-pipelines/prepare-dbs/postgresql/'
---

PostgreSQL supports several
[logical decoding plug-ins](https://wiki.postgresql.org/wiki/Logical_Decoding_Plugins)
to enable CDC. If you don't want to use the native `pgoutput` logical replication stream support
then you must install your preferred plug-in into the PostgreSQL server. Once you have done this,
you must enable a replication slot, and configure a user with privileges to perform the replication.

If you are using a service like [Heroku Postgres](https://www.heroku.com/postgres) to host
your database then this might restrict the plug-ins you can use. If you can't use your preferred
plug-in then could try the `pgoutput` decoder if you are using PostgreSQL 10 or above.
If this doesn't work for you then you won't be able to use RDI with your database.

The following checklist summarizes the steps to prepare a PostgreSQL
database for RDI, with links to the sections that explain the steps in
full detail. You may find it helpful to track your progress with the
checklist as you complete each step.

```checklist {id="postgreslist"}
- [ ] [Install the logical decoding output plug-in](#install-the-logical-decoding-output-plug-in)
- [ ] [Configure the PostgreSQL server](#configure-the-postgresql-server)
- [ ] [Set up permissions](#set-up-permissions)
- [ ] [Check replica identity and choose a publication mode](#check-replica-identity-and-choose-a-publication-mode)
- [ ] [Set privileges for Debezium to create PostgreSQL publications with pgoutput](#set-privileges-for-debezium-to-create-postgresql-publications-with-pgoutput)
- [ ] [Configure PostgreSQL for replication with the Debezium connector host](#configure-postgresql-for-replication-with-the-debezium-connector-host)
```

## Amazon RDS for PostgreSQL

Follow the steps below to enable CDC with [Amazon RDS for PostgreSQL](https://aws.amazon.com/rds/postgresql/):

```checklist {id="postgresawslist" nointeractive="true" }
- [ ] [Set the instance parameter rds.logical_replication to 1](#1-set-the-instance-parameter-rdslogicalreplication-to-1)
- [ ] [Check that the wal_level parameter is set to logical](#2-check-that-the-wal_level-parameter-is-set-to-logical)
- [ ] [Set the Debezium plugin.name parameter to pgoutput](#3-set-the-debezium-pluginname-parameter-to-pgoutput)
- [ ] [Initiate logical replication from an AWS account that has the rds_replication role](#4-initiate-logical-replication-from-an-aws-account-that-has-the-rdsreplication-role)
```

1.  <a id="1-set-the-instance-parameter-rdslogicalreplication-to-1"></a>
    Set the instance parameter `rds.logical_replication` to 1.

1.  <a id="2-check-that-the-wal_level-parameter-is-set-to-logical"></a>
    Check that the `wal_level` parameter is set to `logical` by running the query `SHOW wal_level`
    as the database RDS master user. The parameter might not have this value in multi-zone replication
    setups. You can't change the value manually but it should change automatically when you set the
    `rds.logical_replication` parameter to 1. If it doesn't change then you probably just need to
    restart your database instance. You can restart manually or wait until a restart occurs
    during your maintenance window.

1.  <a id="3-set-the-debezium-pluginname-parameter-to-pgoutput"></a>
    Set the Debezium `plugin.name` parameter to `pgoutput`.

1.  <a id="4-initiate-logical-replication-from-an-aws-account-that-has-the-rdsreplication-role"></a>
    Initiate logical replication from an AWS account that has the `rds_replication` role. The role grants
    permissions to manage logical slots and to stream data using logical slots. By default, only the master user account on AWS has the `rds_replication` role on Amazon RDS, but if you have administrator privileges,
    you can grant the role to other accounts using a query like the following:

    ```sql
    GRANT rds_replication TO <my_user>
    ```

    To enable accounts other than the master account to create an initial snapshot, you must grant `SELECT`
    permission to the accounts on the tables to be captured. See the documentation about
    [security for PostgreSQL logical replication](https://www.postgresql.org/docs/current/logical-replication-security.html)
    for more information.


## Azure Database for PostgreSQL
If you are using [Azure Database for PostgreSQL](https://azure.microsoft.com/en-us/services/postgresql/) you need to 
manually set the `wal_level` parameter in the Azure portal for your PostgreSQL server. Go to the `server parameters` 
section, search for `wal_level` and set it to logical. Then save and restart the server.


## Install the logical decoding output plug-in

As of PostgreSQL 9.4, the only way to read changes to the write-ahead-log is to
[install a logical decoding output plug-in](https://debezium.io/documentation/reference/stable/postgres-plugins.html).
These plug-ins are written in C using PostgreSQL-specific APIs, as described in the
[PostgreSQL documentation](https://www.postgresql.org/docs/current/logicaldecoding-output-plugin.html). 
The PostgreSQL connector uses one of Debezium’s supported logical decoding
plug-ins to receive change events from the database in either the default
[`pgoutput`](https://github.com/postgres/postgres/blob/master/src/backend/replication/pgoutput/pgoutput.c) format (supplied with PostgreSQL) or the
[`Protobuf`](https://github.com/protocolbuffers/protobuf) format. 
See the
[decoderbufs Protobuf plug-in documentation](https://github.com/debezium/postgres-decoderbufs)
for more details about how to compile it and also its requirements and limitations.

For simplicity, Debezium also provides a container image that compiles and installs the plug-ins
on top of the upstream PostgreSQL server image. Use this image as an example of the steps
involved in the installation.

> [!NOTE]
>  The Debezium logical decoding plug-ins have been tested on Linux machines, but if you are
> using Windows or other operating systems, the installation steps might be different from
> those listed here. 

### Plug-in differences

Plug-ins don't all behave in exactly the same way. All of them refresh information about
the database schema when they detect that it has changed, but the `pgoutput` plug-in is
more "eager" than some other plug-ins to do this. For example, `pgoutput` will refresh
when it detects a change to the default value of a column but other plug-ins won't
notice this until another, more significant change happens (such as adding a new table
column).

The Debezium project maintains a
[Java class](https://github.com/debezium/debezium/blob/main/debezium-connector-postgres/src/test/java/io/debezium/connector/postgresql/DecoderDifferences.java) that tracks the known differences between plug-ins.


## Configure the PostgreSQL server

If you want to use a logical decoding plug-in other than the default `pgoutput` then
you must first configure it in the `postgresql.conf` file. Set the `shared_preload_libraries`
parameter to load your plug-in at startup. For example, to load the `decoderbufs`
plug-in, you would add the following line:

```
# MODULES
shared_preload_libraries = 'decoderbufs'
```

Add the line below to configure the replication slot (for any plug-in).
This instructs the server to use logical decoding with the write-ahead log.

```
# REPLICATION
wal_level = logical            
```

You can also set other PostgreSQL streaming replication parameters if you need them.
For example, you can use `max_wal_senders` and `max_replication_slots` to increase
the number of connectors that can access the sending server concurrently,
and `wal_keep_size` to limit the maximum WAL size that a replication slot retains.
The
[configuration parameters](https://www.postgresql.org/docs/current/runtime-config-replication.html#RUNTIME-CONFIG-REPLICATION-SENDER)
documentation describes all the parameters you can use.

PostgreSQL’s logical decoding uses replication slots. These are guaranteed to retain all the WAL
segments that Debezium needs even when Debezium suffers an outage. You should monitor replication
slots carefully to avoid excessive disk consumption and other conditions such as catalog bloat that can arise
if a replication slot is used infrequently. See the PostgreSQL documentation about
[replication slots](https://www.postgresql.org/docs/current/warm-standby.html#STREAMING-REPLICATION-SLOTS)
for more information.
If you are using a `synchronous_commit` setting other than `on`, then you should set `wal_writer_delay`
to a value of about 10 milliseconds to ensure a low latency for change events. If you don't set this then
the default value of about 200 milliseconds will apply.

> [!NOTE]
> This guide summarizes the operation of the PostgreSQL write-ahead log, but we strongly
> recommend you consult the [PostgreSQL write-ahead log](https://www.postgresql.org/docs/current/wal-configuration.html)
> documentation to get a better understanding.

## Set up permissions

The Debezium connector needs a database user that has the REPLICATION and LOGIN roles so that it
can perform replications. By default, a superuser has these roles but for security reasons, you
should give the minimum necessary permissions to the Debezium user rather than full superuser
permissions.

If you have administrator privileges then you can create a role for your Debezium user
using a query like the following. Note that these are the *minimum* permissions the user
needs to perform replications, but you might also need to grant other permissions.

```sql
CREATE ROLE <name> REPLICATION LOGIN;
```

## Check replica identity and choose a publication mode

Before you start RDI, check the tables that RDI will capture and choose how PostgreSQL
should publish their changes.

PostgreSQL needs a [replica identity](https://www.postgresql.org/docs/current/logical-replication-publication.html)
to identify the old row when it publishes an `UPDATE` or `DELETE`. By default, PostgreSQL
uses the table's primary key. A table without a primary key has no usable replica identity
unless you configure one. Inserts do not need a replica identity.

Run the following query while connected to the database that RDI uses. You do not put the
database name in the query; select that database in your SQL editor or connection settings.
The query checks all non-system schemas. To check only one schema, uncomment the marked line
and replace `<schema_name>` with your schema name.

```sql
SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       CASE c.relreplident
           WHEN 'd' THEN 'default'
           WHEN 'n' THEN 'nothing'
           WHEN 'f' THEN 'full'
           WHEN 'i' THEN 'index'
       END AS replica_identity
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  -- Optional: uncomment and replace <schema_name> to check one schema only.
  -- AND n.nspname = '<schema_name>'
  AND (
      c.relreplident = 'n'
      OR (
          c.relreplident = 'd'
          AND NOT EXISTS (
              SELECT 1
              FROM pg_index AS i
              WHERE i.indrelid = c.oid
                AND i.indisprimary
          )
      )
  )
ORDER BY n.nspname, c.relname;
```

If this query returns a table that will be published, add a primary key where possible.
You can also configure a suitable unique index as the replica identity:

```sql
ALTER TABLE <table_name> REPLICA IDENTITY USING INDEX <unique_index_name>;
```

As a fallback, you can record the full old row in the write-ahead log:

```sql
ALTER TABLE <table_name> REPLICA IDENTITY FULL;
```

`REPLICA IDENTITY FULL` can increase write-ahead log volume and reduce performance.
Use it when no suitable key is available or when RDI needs the full old row, such as
[denormalizing child tables with nesting](/content/integrate/redis-data-integration/1.19.1/data-pipelines/data-denormalization.md#using-nesting).
The `keys` setting in an RDI table definition creates a key for the Redis record.
It does not create a PostgreSQL primary key or replica identity.

### Understand which row values are available

Replica identity controls the old row values available to logical decoding for updates
and deletes. With the default identity, PostgreSQL uses the primary key; it does not
provide a complete old row. `REPLICA IDENTITY FULL` records all old column values.

Update events are not generally limited to changed fields. However, PostgreSQL can omit
unchanged large values stored through The Oversized-Attribute Storage Technique (TOAST)
when they are not part of the replica identity. Debezium represents unavailable values
with a placeholder. With `FULL`, these values are available in the event's old and new row
images. See [Debezium's TOAST guidance](https://debezium.io/documentation/reference/3.0/connectors/postgresql.html#postgresql-toasted-values).

For example, nesting a child record requires its `parent_key` to identify the parent
Redis document, including when the child is deleted. Set `REPLICA IDENTITY FULL` on
PostgreSQL child tables as required by the [nesting instructions](/content/integrate/redis-data-integration/1.19.1/data-pipelines/data-denormalization.md#using-nesting).

### Choose a publication mode

The `publication.autocreate.mode` setting controls how RDI and Debezium manage the
PostgreSQL publication:

| Mode | Behavior | Recommended use |
| --- | --- | --- |
| **`all_tables` (default)** | Creates a `FOR ALL TABLES` publication when the publication does not exist. If it already exists, RDI uses the existing publication. | Use when all tables in the database should be published, after checking their replica identities. |
| `filtered` | Creates or updates the publication to contain the tables configured for the RDI source. | Recommended when RDI captures selected tables. RDI manages the publication when the pipeline is redeployed with a changed table filter. |
| `disabled` | Does not create or change the publication. The publication must already exist. | Use when a database administrator manages the publication. |

The `all_tables` mode can publish changes for tables that are not listed in the RDI
pipeline, including tables created in the future. If an application later updates or
deletes a row in a published table without a replica identity, PostgreSQL can reject
that application write. For this reason,
`filtered` is the recommended mode for a pipeline that captures only selected tables.

The `filtered` mode requires permission to create the publication and ownership rights on
the tables it manages. Use a separate publication for each source with different table
filters, so one source does not change another source's publication.

For a customer-managed publication, create an explicit table list and disable automatic
publication management. Replace the example table names with the tables you want to capture:

```sql
CREATE PUBLICATION rdi_publication
FOR TABLE public.customers, public.orders;
```

Then set the following properties under the PostgreSQL source in your RDI `config.yaml`:

```yaml
sources:
  <source_name>:
    advanced:
      source:
        publication.name: rdi_publication
        publication.autocreate.mode: disabled
```

For RDI on Redis Cloud, enter these properties under **Collector properties** in the
source configuration. See [Configure PostgreSQL publications on Redis Cloud](/content/operate/rc/rdi/setup.md#postgresql-publications).
With `disabled`, update the publication's table list yourself when changing the source's
selected tables. Selecting a table in RDI does not add it to a customer-managed publication.

### Replace an existing all-tables publication

Changing the RDI table selection does not narrow a `FOR ALL TABLES` publication.
Changing `publication.autocreate.mode` to `filtered` also does not convert it:
PostgreSQL rejects attempts to set, add, or remove individual tables in that publication.

Have your database administrator plan the change with the owners of every consumer of
the publication:

1. Check existing publications in the source database:

    ```sql
    SELECT pubname, puballtables, pubupdate, pubdelete
    FROM pg_publication;
    ```

1. Identify every consumer of the broad publication and coordinate a maintenance window.
1. Stop the affected RDI sources before replacing the publication.
1. Replace the broad publication with an explicit table-list publication. You can recreate
   it under the same name, or create a new publication and update each consumer's publication
   name. For RDI, use `publication.autocreate.mode: disabled` for an administrator-managed
   publication. On Redis Cloud, contact support if the running source's collector properties
   cannot be edited in the console.
1. Remove the old broad publication only after coordinating all consumers. Leaving it in
   place still subjects its tables to replica-identity requirements, even if RDI uses a
   different publication or is stopped.
1. Resume the affected sources and verify inserts, updates, and deletes reach Redis.

Keep the replication slots and saved RDI offsets during this change. Do not reset the
pipeline or drop its slot as a publication repair. If other consumers still need the broad
publication, configure replica identity on its affected tables instead of removing it.

### PostgreSQL publication error FAQ

#### I get this PostgreSQL error. What should I do?

You may see the following error when an application updates a published table without a
replica identity:

```text
SQLSTATE 55000
ERROR: cannot update table "example_table" because it does not have a replica identity and publishes updates
HINT: To enable updating the table, set REPLICA IDENTITY using ALTER TABLE.
```

Check whether the table should be captured by RDI. If it should, add a primary key or
configure a suitable replica identity. As a fallback, run:

```sql
ALTER TABLE <table_name> REPLICA IDENTITY FULL;
```

If the table should not be captured, remove it from an explicit table-list publication or
use `filtered` with the required permissions. For an existing `FOR ALL TABLES` publication,
follow [Replace an existing all-tables publication](#replace-an-existing-all-tables-publication).
Check all publications containing the table: another publication that publishes updates or
deletes can still require replica identity. After changing RDI configuration, redeploy the
pipeline so RDI applies it.

## Set privileges for Debezium to create PostgreSQL publications with `pgoutput`

The Debezium user needs specific permissions to work with the `pgoutput` plug-in.
The plug-in captures change events from the
[*publications*](https://www.postgresql.org/docs/current/logical-replication-publication.html)
that PostgreSQL produces for your chosen source tables. A publication contains change events from
one or more tables that are filtered using criteria from a *publication specification*.

If you have administrator privileges, you can create the publication specification
manually or you can grant the Debezium user the privileges to create the specification
automatically. The required privileges are:

-   Replication privileges in the database to add the table to a publication.
-   `CREATE` privileges on the database to add publications.
-   `SELECT` privileges on the tables to copy the initial table data. Table owners
    automatically have `SELECT` permission for the table.

To add a table to a publication, the user must be an owner of the table. However, in
this case, the source table already exists, so you must use a PostgreSQL replication
group to share ownership between the Debezium user and the original owner. Configure
the replication group using the following commands:

```checklist {id="postgrespgoutputlist" nointeractive="true" }
- [ ] [Create the replication group](#1-create-the-replication-group)
- [ ] [Add the original owner of the table to the group](#2-add-the-original-owner-of-the-table-to-the-group)
- [ ] [Add the Debezium replication user to the group](#3-add-the-debezium-replication-user-to-the-group)
- [ ] [Transfer ownership of the table to the replication group](#4-transfer-ownership-of-the-table-to-the-replication-group)
```

1.  <a id="1-create-the-replication-group"></a>
    Create the replication group (the name `replication_group` here is
    just an example):

    ```sql
    CREATE ROLE replication_group;
    ```

1.  <a id="2-add-the-original-owner-of-the-table-to-the-group"></a>
    Add the original owner of the table to the group:

    ```sql
    GRANT replication_group TO original_owner;
    ```

1.  <a id="3-add-the-debezium-replication-user-to-the-group"></a>
    Add the Debezium replication user to the group:

    ```sql
    GRANT replication_group TO replication_user;
    ```

1.  <a id="4-transfer-ownership-of-the-table-to-the-replication-group"></a>
    Transfer ownership of the table to `replication_group`:

    ```sql
    ALTER TABLE table_name OWNER TO replication_group;
    ```

If you want Debezium to create or update a publication for the tables configured in the RDI
source, set `publication.autocreate.mode` to `filtered`. See the
[Debezium documentation for `publication.autocreate.mode`](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-publication-autocreate-mode)
to learn more about this setting. If a database administrator manages an existing
publication, use `disabled` instead, as described in [Choose a publication mode](#choose-a-publication-mode).

## Configure PostgreSQL for replication with the Debezium connector host

You must configure the database to allow replication with the host that runs
the PostgreSQL Debezium connector. To do this, add an entry to the
host-based authentication file, `pg_hba.conf`, for each client that needs to
use replication. For example, to enable replication for `<youruser>` locally,
on the server machine, you would add a line like the following:

```
local   replication     <youruser>                          trust
```

To allow `<youruser>` on localhost to receive replication changes using IPV4,
add the line:

```
host    replication     <youruser>  127.0.0.1/32            trust
```

To allow `<youruser>` on localhost to receive replication changes using IPV6,
add the line:

```
host    replication     <youruser>  ::1/128                 trust 
```

Find out more from the PostgreSQL pages about
[`pg_hba.conf`](https://www.postgresql.org/docs/10/auth-pg-hba-conf.html)
and
[network address types](https://www.postgresql.org/docs/current/datatype-net-types.html).

## Supported PostgreSQL topologies

You can use the Debezium PostgreSQL connector with a standalone PostgreSQL server or
with a cluster of servers.
For versions 12 and below, PostgreSQL supports logical replication slots on only primary servers.
This means that Debezium can only connect to a primary server for CDC and the connection will
stop if this server fails. If the same server is promoted to primary when service resumes
then you can simply restart the Debezium connector. However, if a different server is
promoted to primary, then you must reconfigure Debezium to use the new server
before restarting. Also, make sure the new server has the correct plug-in and configuration
for Debezium.
