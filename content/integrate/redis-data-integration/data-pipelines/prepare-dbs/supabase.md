---
Title: Prepare Supabase for RDI
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare a hosted Supabase database to work with RDI
group: di
linkTitle: Prepare Supabase
summary: Configure a hosted Supabase PostgreSQL database for snapshot and change data capture with Redis Data Integration.
type: integration
weight: 11
---

[Supabase](https://supabase.com/docs/guides/database/overview) is a hosted
PostgreSQL platform. RDI can connect to a hosted Supabase project
through any direct PostgreSQL endpoint as long as it is reachable from the RDI
deployment and supports logical replication.

{{< note >}}
RDI supports hosted Supabase projects running an
[RDI-supported PostgreSQL version]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs" >}}).
The integration was validated with RDI 1.19.0 and hosted Supabase PostgreSQL
17.6. For self-hosted Supabase deployments, follow the general
[PostgreSQL preparation guide]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/postgresql" >}}).
This page describes Supabase setup for a self-managed RDI deployment. For the
managed service, see
[Use Supabase with RDI on Redis Cloud]({{< relref "/operate/rc/rdi/supabase" >}}).
{{< /note >}}

Supabase differs from a typical self-managed PostgreSQL source in the following
ways:

- You can't edit `postgresql.conf` or `pg_hba.conf` directly. Supabase enables
  logical replication and manages these settings for you.
- You must use the direct database endpoint for logical replication because
  [Supavisor connection pooler endpoints don't support logical replication](https://supabase.com/docs/guides/database/replication/manual-replication-faq#which-connection-string-should-be-used).
- The direct endpoint uses IPv6 unless you enable the Supabase dedicated IPv4
  add-on. Enable the add-on if your RDI deployment can't connect over IPv6.
- Supabase can enforce TLS and provides a CA certificate that RDI can use to
  validate the database certificate.
- Supabase Row Level Security (RLS) can restrict the rows visible during the
  initial snapshot.

The following checklist summarizes the setup:

```checklist {id="supabaselist"}
- [ ] [Create or select a Supabase project](#1-create-or-select-a-supabase-project)
- [ ] [Configure direct network access](#2-configure-direct-network-access)
- [ ] [Create a dedicated RDI role](#3-create-a-dedicated-rdi-role)
- [ ] [Grant access to source tables](#4-grant-access-to-source-tables)
- [ ] [Configure TLS](#5-configure-tls)
- [ ] [Configure RDI](#6-configure-rdi)
- [ ] [Monitor replication slots](#7-monitor-replication-slots)
```

## 1. Create or select a Supabase project

Create a project in the [Supabase dashboard](https://supabase.com/dashboard)
or select an existing project. You can find its PostgreSQL version in the
Supabase dashboard or run the following query in the SQL editor:

```sql
SELECT version();
```

## 2. Configure direct network access

For a public connection, select **Connect** in the Supabase dashboard and copy
the **Direct connection** hostname. It has the following form:

```text
db.<project-ref>.supabase.co
```

You should generally use port `5432`, but you can use a private hostname or
address instead if you have configured private connectivity between the RDI
deployment and Supabase.
Don't use a Supavisor transaction or session pooler connection string because
these endpoints don't support logical replication.

Supabase direct connections use IPv6 by default. If your RDI deployment
doesn't have IPv6 egress, enable the
[dedicated IPv4 add-on](https://supabase.com/docs/guides/platform/ipv4-address).
The add-on requires a paid Supabase plan.

If you use the public endpoint and enable
[Supabase Network Restrictions](https://supabase.com/docs/guides/platform/network-restrictions),
add the public egress address of the RDI host or cluster to the allowlist. Use
a `/32` CIDR for an individual IPv4 address. For private connectivity, make
sure the RDI host or cluster can resolve and route to the private endpoint.

## 3. Create a dedicated RDI role

In the Supabase SQL editor, create a dedicated login for RDI. Replace the
example name and password with your own values:

```sql
CREATE ROLE rdi_replication
  WITH LOGIN REPLICATION PASSWORD '<strong-password>';
```

{{< warning >}}
Don't use the Supabase `postgres` administrator account for the RDI connection.
The RDI role's credentials provide continuous access to captured data, so grant
the role only the permissions it needs.
{{< /warning >}}

## 4. Grant access to source tables

The RDI role needs to connect to the database and read every table included in
the initial snapshot. For example:

```sql
GRANT CONNECT ON DATABASE postgres TO rdi_replication;

GRANT USAGE ON SCHEMA public TO rdi_replication;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO rdi_replication;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO rdi_replication;
```

Repeat the schema grants for every schema you want RDI to capture.

If RLS is enabled on a source table, the initial snapshot only contains rows
visible to the RDI role. To capture all rows, define appropriate RLS policies
for the role or grant `BYPASSRLS`:

```sql
ALTER ROLE rdi_replication BYPASSRLS;
```

`BYPASSRLS` applies to every table in the database. Grant it only to a
dedicated RDI role and protect that role's credentials.

### Create a publication

By default, RDI uses the PostgreSQL `pgoutput` logical decoding plug-in, a
publication named `dbz_publication`, and a replication slot named `debezium`.
These defaults work with Supabase if the RDI role has permission to create the
publication and manage its source tables.

It is recommended that a database administrator create a publication
containing only the tables RDI should capture:

```sql
CREATE PUBLICATION rdi_publication
  FOR TABLE public.customers, public.orders;
```

Creating the publication explicitly avoids granting table ownership or broad
publication-creation permissions to the RDI role and limits the publication's
table scope.

## 5. Configure TLS

In the Supabase dashboard, go to
[**Database settings** > **SSL configuration**](https://supabase.com/docs/guides/platform/ssl-enforcement):

1. Enable **Enforce SSL on incoming connections**.
1. Download the Supabase CA certificate.

Store the database username, password, and CA certificate as RDI secrets. Pass the
source name with `--db`; the source configured in the next step is named `supabase`:

```bash
redis-di set-secret USERNAME --db supabase rdi_replication
redis-di set-secret PASSWORD --db supabase '<strong-password>'
redis-di set-secret CACERT --db supabase /path/to/prod-ca-2021.crt
```

RDI verifies that the direct endpoint hostname matches the certificate.

## 6. Configure RDI

Add a PostgreSQL source to `config.yaml`. Replace the project reference and
table names with your values:

```yaml
sources:
  supabase:
    type: cdc
    connection:
      type: postgresql
      host: db.<project-ref>.supabase.co
      port: 5432
      database: postgres
      user: ${SUPABASE_DB_USERNAME}
      password: ${SUPABASE_DB_PASSWORD}
    schemas:
      - public
    tables:
      public.customers: {}
      public.orders: {}
    advanced:
      source:
        plugin.name: pgoutput
        publication.name: rdi_publication
        publication.autocreate.mode: disabled
        slot.name: rdi_supabase
```

Use a unique replication slot name for each active pipeline that connects to
the project.

## 7. Monitor replication slots

RDI creates a logical replication slot that retains write-ahead log (WAL)
records while the pipeline is stopped or disconnected. Use a query like the
following to monitor inactive slots and retained WAL to prevent unexpected
storage growth:

```sql
SELECT
  slot_name,
  active,
  restart_lsn,
  confirmed_flush_lsn
FROM pg_replication_slots;
```

[Supabase requires logical replication slots to be removed](https://supabase.com/docs/guides/platform/upgrading)
before a PostgreSQL major-version upgrade. Before upgrading:

1. Stop the RDI pipeline.
1. Record the pipeline configuration and slot name.
1. Drop the RDI replication slot.
1. Upgrade the Supabase project.
1. Reset and start the RDI pipeline to create a new slot and initial snapshot.

Allow time for the new initial snapshot to complete, and monitor the pipeline
until pending records return to zero.
