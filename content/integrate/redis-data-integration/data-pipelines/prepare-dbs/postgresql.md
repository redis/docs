---
Title: Prepare PostgreSQL/Supabase for RDI
aliases: /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/postgresql/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare PostgreSQL databases (including Supabase) to work with RDI
group: di
linkTitle: Prepare PostgreSQL/Supabase
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 2
---

{{< note >}}
[Supabase](https://supabase.com/docs/guides/database/overview) uses PostgreSQL as
its database engine, so the instructions below also apply to Supabase. However, RDI
doesn't currently support cloud deployments of Supabase with AWS or GCP.
{{< /note >}}

PostgreSQL supports several
[logical decoding plug-ins](https://wiki.postgresql.org/wiki/Logical_Decoding_Plugins)
to enable CDC. If you don't want to use the native `pgoutput` logical replication stream support
then you must install your preferred plug-in into the PostgreSQL server. Once you have done this,
you must enable a replication slot, and configure a user with privileges to perform the replication.

If you are using a service like [Heroku Postgres](https://www.heroku.com/postgres) to host
your database then this might restrict the plug-ins you can use. If you can't use your preferred
plug-in then could try the `pgoutput` decoder if you are using PostgreSQL 10 or above.
If this doesn't work for you then you won't be able to use RDI with your database.

```checklist {id="postgreslist" nointeractive="true" }
- [ ] [Install the logical decoding output plug-in](#install-the-logical-decoding-output-plug-in)
- [ ] [Configure the PostgreSQL server](#configure-the-postgresql-server)
- [ ] [Set up permissions](#set-up-permissions)
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

1.  <a id="1-set-the-instance-parameter-rdslogicalreplication-to-1"></a>Set the instance parameter `rds.logical_replication` to 1.

1.  <a id="2-check-that-the-wal_level-parameter-is-set-to-logical"></a>Check that the `wal_level` parameter is set to `logical` by running the query `SHOW wal_level`
    as the database RDS master user. The parameter might not have this value in multi-zone replication
    setups. You can't change the value manually but it should change automatically when you set the
    `rds.logical_replication` parameter to 1. If it doesn't change then you probably just need to
    restart your database instance. You can restart manually or wait until a restart occurs
    during your maintenance window.

1.  <a id="3-set-the-debezium-pluginname-parameter-to-pgoutput"></a>Set the Debezium `plugin.name` parameter to `pgoutput`.

1.  <a id="4-initiate-logical-replication-from-an-aws-account-that-has-the-rdsreplication-role"></a>Initiate logical replication from an AWS account that has the `rds_replication` role. The role grants
    permissions to manage logical slots and to stream data using logical slots. By default, only the master user account on AWS has the `rds_replication` role on Amazon RDS, but if you have administrator privileges,
    you can grant the role to other accounts using a query like the following:

    ```sql
    GRANT rds_replication TO <my_user>
    ```

    To enable accounts other than the master account to create an initial snapshot, you must grant `SELECT`
    permission to the accounts on the tables to be captured. See the documentation about
    [security for PostgreSQL logical replication](https://www.postgresql.org/docs/current/logical-replication-security.html)
    for more information.

## Install the logical decoding output plug-in

As of PostgreSQL 9.4, the only way to read changes to the write-ahead-log is to
[install a logical decoding output plug-in](https://debezium.io/documentation/reference/2.6/postgres-plugins.html).
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

{{< note >}} The Debezium logical decoding plug-ins have been tested on Linux machines, but if you are
using Windows or other operating systems, the installation steps might be different from
those listed here. {{< /note >}}

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

{{< note >}}This guide summarizes the operation of the PostgreSQL write-ahead log, but we strongly
recommend you consult the [PostgreSQL write-ahead log](https://www.postgresql.org/docs/current/wal-configuration.html)
documentation to get a better understanding.{{< /note >}}

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

1.  Create the replication group (the name `replication_group` here is
    just an example):

    ```sql
    CREATE ROLE replication_group;
    ```
1.  Add the original owner of the table to the group:

    ```sql
    GRANT replication_group TO original_owner;
    ```

1.  Add the Debezium replication user to the group:

    ```sql
    GRANT replication_group TO replication_user;
    ```
1.  Transfer ownership of the table to `replication_group`:

    ```sql
    ALTER TABLE table_name OWNER TO replication_group;
    ```

You must also set the value of the `publication.autocreate.mode` parameter to `filtered`
to allow Debezium to specify the publication configuration. See the
[Debezium documentation for `publication.autocreate.mode`](https://debezium.io/documentation/reference/2.6/connectors/postgresql.html#postgresql-publication-autocreate-mode)
to learn more about this setting.

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
