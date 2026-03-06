---
Title: Prepare Neon for RDI
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare Neon databases to work with RDI
group: di
linkTitle: Prepare Neon
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

[Neon](https://neon.com/) is a serverless PostgreSQL platform. To use Neon as a source database for Redis Data Integration (RDI), you must enable logical replication for the compute endpoint that serves your branch, create a dedicated replication role, grant it the minimum required privileges, and allow inbound network traffic from the RDI connector host.

The following checklist summarizes the steps to prepare a Neon database for
RDI, with links to the sections that explain the steps in full detail. You may
find it helpful to track your progress with the checklist as you complete each
step.

```checklist {id="neonlist"}
- [ ] [Enable logical replication in Neon](#1-enable-logical-replication-in-neon)
- [ ] [Create a replication role for RDI](#2-create-a-replication-role-for-rdi)
- [ ] [Grant database and table privileges](#3-grant-database-and-table-privileges)
- [ ] [Allow inbound traffic to Neon](#4-allow-inbound-traffic-to-neon)
```

## 1. Enable logical replication in Neon

To capture changes from Neon, the compute endpoint for your branch must have
logical replication enabled. This sets the PostgreSQL `wal_level` parameter to
`logical` for that compute.

1. Sign in to the Neon Console and select the project that hosts the database
   you want to use with RDI.
1. On the **Branches** page, choose the branch you want to capture from.
1. Either create a new compute endpoint for that branch or edit an existing
   one.
1. In the compute configuration, enable **Logical replication**.
1. Save the changes and wait for the compute to restart if required.

After the compute is running, connect with a SQL client and confirm that
logical replication is enabled by running:

```sql
SHOW wal_level;
```

The query should return `logical`.

{{< note >}}
Enabling logical replication increases the volume of write-ahead log (WAL)
data that Neon retains. Monitor the project for any impact on storage usage and
cost.
{{< /note >}}

## 2. Create a replication role for RDI

It is strongly recommended to create a dedicated database role for the
connection that RDI uses, rather than reusing an existing superuser or
application role.

Connect to the Neon database as a user with sufficient privileges and create a
role similar to the following (replace the identifiers with values that match
your environment):

```sql
CREATE ROLE rdi_replication
  WITH LOGIN REPLICATION PASSWORD 'Strong_Password';
```

This role:

- can sign in to the database (`LOGIN`)
- can consume logical replication streams (`REPLICATION`)
- does not have superuser privileges

## 3. Grant database and table privileges

The replication role must be able to connect to the database, access the
schemas you want to capture, and read from the tables in those schemas.

Run commands like the following, replacing `mydb` and `rdi_replication` with
your database name and replication role:

```sql
GRANT CONNECT ON DATABASE mydb TO rdi_replication;

GRANT USAGE ON SCHEMA public TO rdi_replication;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO rdi_replication;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO rdi_replication;
```

If you use multiple schemas or need access to sequences, repeat the `GRANT`
and `ALTER DEFAULT PRIVILEGES` statements for each schema and include
`SEQUENCES` where appropriate.

## 4. Allow inbound traffic to Neon

RDI connects to Neon over the public Internet using the connection string for
your compute endpoint. You must ensure that Neon allows inbound traffic from
the IP addresses that the RDI connector uses.

1. In the Neon Console, open the project that contains your database.
1. Go to the **Settings** or **Networking** section for the project and locate
   the IP allow list or **Allowed IPs** configuration.
1. Add the public IP address or address range that the RDI connector uses to
   reach Neon. For production systems, restrict this to the smallest set of
   IPs possible.
1. Save the configuration.

For development or testing, you can temporarily allow access from your own
client machine or a broader IP range, but for production environments you
should always restrict access to known connector IP addresses.

You will also need the Neon connection string for use when you configure the
source in RDI. In the Neon Console, copy the PostgreSQL connection URI for the
compute endpoint you prepared above. It has the form:

```text
postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
```

Use this URI, together with the replication role you created, when you set up
the Neon source connection in RDI.
