---
Title: Use Supabase with RDI
linkTitle: Supabase
alwaysopen: false
categories:
- docs
- operate
- rc
description: Connect a hosted Supabase database to RDI on Redis Cloud.
hideListLinks: true
weight: 7
---

You can use a hosted [Supabase](https://supabase.com/) PostgreSQL database as
the source for an RDI pipeline on Redis Cloud. This page describes the
Redis Cloud-specific networking, secrets, and source configuration.

The integration was validated with RDI 1.19.0 and hosted Supabase PostgreSQL
17.6. See [RDI on Redis Cloud prerequisites]({{< relref "/operate/rc/rdi#prerequisites" >}})
for supported source versions.

{{< warning >}}
Supabase AWS PrivateLink connectivity isn't supported. Supabase shares a
Resource Configuration through AWS Resource Access Manager and requires a
Resource-type VPC endpoint. This differs from the AWS PrivateLink
endpoint-service connectivity supported by RDI on Redis Cloud.

Use the Supabase public direct database endpoint.
{{< /warning >}}

## Before you begin

You need:

- A Redis Cloud RDI workspace and target database.
- A hosted Supabase project.
- A dedicated Supabase role with PostgreSQL replication and table-read
  permissions.
- The Supabase CA certificate.
- An AWS Secrets Manager credentials secret and CA certificate secret shared
  with Redis Cloud.

Follow the steps in [Prepare Supabase for RDI]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/supabase" >}})
to create the database role, grant table access, account for Row Level
Security, and create a publication.

## Configure public connectivity

Supabase logical replication requires the direct database endpoint. Don't use
a Supavisor transaction or session pooler endpoint.

The direct endpoint uses IPv6 by default, but RDI on Redis Cloud requires an
IPv4 endpoint, so you must enable the Supabase
[dedicated IPv4 add-on](https://supabase.com/docs/guides/platform/ipv4-address)
(you need a paid Supabase plan to do this).

When you create the RDI pipeline:

1. Select **PostgreSQL** as the source type.
1. Select **Public endpoint**.
1. Copy every **Redis Cloud outbound IP address** displayed by the setup flow.
1. In Supabase, open **Database settings** > **Network restrictions**.
1. Add every Redis Cloud outbound address as a `/32` CIDR.

If you recreate the RDI workspace, its outbound addresses can change. Add the
new addresses to Supabase before starting the replacement pipeline, and remove
the old addresses after the new connection succeeds.

## Configure secrets

Follow the steps in [Share source database credentials]({{< relref "/operate/rc/rdi/setup#share-source-database-credentials" >}})
to create and share:

- A credentials secret containing the dedicated Supabase `username` and
  `password`.
- A plaintext CA certificate secret containing the certificate downloaded
  from Supabase **Database settings** > **SSL configuration**.

Encrypt both secrets with the customer-managed AWS KMS key configured for the
RDI workspace. Use the AWS region that contains your Redis Cloud subscription.

In the pipeline's **Secrets** section:

1. Enter the credentials secret ARN.
1. Select **TLS** under **Transit security**.
1. Enter the CA certificate secret ARN.
1. Select **Validate**.

RDI on Redis Cloud uses TLS and validates the Supabase CA certificate.

## Configure the source

In the RDI pipeline setup flow, open the source configuration and enter the
following values:

| Field | Value |
|:--|:--|
| Source IP address / Hostname | `db.<project-ref>.supabase.co` |
| Port | `5432` |
| Database | `postgres` |

Under **Collector properties**, set:

| Property | Value |
|:--|:--|
| `plugin.name` | `pgoutput` |
| `publication.name` | `rdi_publication` |
| `publication.autocreate.mode` | `disabled` |
| `slot.name` | A unique value, such as `rdi_supabase` |

The publication name must match the publication you created in Supabase. Use a
unique replication slot name for each active pipeline connected to the
project.

Select **Test source**. After the test succeeds, select the schemas and tables
to capture and deploy the pipeline.

## Monitor the pipeline

After deployment:

1. Confirm the initial snapshot reaches zero pending and rejected records.
1. Insert, update, and delete test records in Supabase.
1. Confirm the corresponding counters increase in the pipeline metrics.

Supabase logical replication slots retain write-ahead log (WAL) while the
pipeline is stopped. Follow the steps in
[Monitor replication slots]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/supabase#7-monitor-replication-slots" >}})
to monitor retained WAL and prepare for Supabase PostgreSQL upgrades.
