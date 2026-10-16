---
Title: Data Integration
aliases:
    - /operate/rc/databases/rdi/
    - /operate/rc/databases/rdi
alwaysopen: false
categories:
- docs
- operate
- rc
description: Use Redis Data Integration with Redis Cloud.
hideListLinks: true
weight: 38
tocEmbedHeaders: true
---

Redis Cloud now supports [Redis Data Integration (RDI)](/content/integrate/redis-data-integration/_index.md), a fast and simple way to bring your data into Redis from other types of primary databases.

![The Data Integration page in the Redis Cloud console, with the Create workspace button and supported source databases.](/images/rc/rdi-get-started.png)
{width="75%" class="border border-redis-pen-300 rounded-lg"}

A relational database usually handles queries much more slowly than a Redis database. If your application uses a relational database and makes many more reads than writes (which is the typical case) then you can improve performance by using Redis as a cache to handle the read queries quickly. Redis Cloud uses [ingest](/content/integrate/redis-data-integration/_index.md) to help you offload all read queries from the application database to Redis automatically.

Using a data pipeline lets you have a cache that is always ready for queries. RDI Data pipelines ensure that any changes made to your primary database are captured in your Redis cache within a few seconds, preventing cache misses and stale data within the cache. 

RDI helps Redis customers sync Redis Cloud with live data from their primary databases to:
- Meet the required speed and scale of read queries and provide an excellent and predictable user experience.
- Save resources and time when building pipelines and coding data transformations.
- Reduce the total cost of ownership by saving money on expensive database read replicas.

Using RDI with Redis Cloud simplifies managing your data integration pipeline. No need to worry about hardware or underlying infrastructure, as Redis Cloud manages that for you. Creating the data flow from source to target is much easier, and there are validations in place to reduce errors.

## Is RDI a good fit for my architecture?

RDI is designed to support apps that must use a disk-based database as the system of record
but must also be fast and scalable. This is a common requirement for mobile and web
apps with a rapidly-growing number of users; the performance of the main database is fine at first
but it will soon struggle to handle the increasing demand without a cache.

Use the information in the sections below to determine whether RDI is a good fit for your architecture. See also the
[decision tree for using RDI](/content/integrate/redis-data-integration/when-to-use.md#decision-tree-for-using-rdi)
which presents the considerations in a straightforward question-and-answer format.

```decision-tree
```

{{< embed-md "rdi-when-to-use.md" >}}

{{< embed-md "rdi-when-not-to-use.md" >}}

## Data pipeline architecture

An RDI data pipeline connects one or more source databases to one target Redis database. Sources can use the same or different supported database types. Each source has its own collector, connectivity, credentials, and selection of tables and columns. All sources share the pipeline's processor and target.

Each source first imports its selected data during the *initial sync* phase, then captures changes during the *streaming* phase. The pipeline transforms the captured records and writes them to Redis. You can monitor and manage each source from the pipeline dashboard.

RDI Cloud uses the Flink processor for all pipelines.

For more info on how RDI works, see [RDI Architecture](/content/integrate/redis-data-integration/architecture/_index.md).

### Pipeline security

Data pipelines are set up to ensure a high level of data security. Source database credentials and TLS secrets are stored in AWS secret manager and shared using the Kubernetes CSI driver for secrets. See [Share source database credentials](/content/operate/rc/rdi/setup.md#share-source-database-credentials) to learn how to share your source database credentials and TLS certificates with Redis Cloud.

Configure connectivity separately for each source. A source can use a public endpoint or [AWS PrivateLink](https://aws.amazon.com/privatelink/), subject to the source-specific requirements in [Prerequisites](#prerequisites). See [Set up connectivity](/content/operate/rc/rdi/setup.md#set-up-connectivity) to learn how to connect your PrivateLink to the Redis Cloud VPC.

RDI encrypts all network connections with TLS. The pipeline will process data from the source database in-memory and write it to the target database using a TLS connection. There are no external connections to your data pipeline except from Redis Cloud management services.

## Prerequisites

Before you can create a data pipeline, you must have:

- A [Redis Cloud Pro database](/content/operate/rc/databases/create-database/create-pro-database-new.md) hosted on Amazon Web Services (AWS). This will be the target database.
- One or more supported source databases that are publicly accessible or hosted on an AWS EC2 instance, AWS RDS, or AWS Aurora:

| Database | Versions | AWS RDS  Versions |
|:---|:---|:---|
| Oracle | 19c, 21c | 19c, 21c |
| MariaDB | 10.5, 11.4.3 | 10.4 to 10.11, 11.4.3 |
| MySQL | 5.7, 8.0.x, 8.2 | 8.0.x |
| PostgreSQL | 10, 11, 12, 13, 14, 15, 16, 17, 18 | 11, 12, 13, 14, 15, 16, 17, 18 |
| Supabase (uses PostgreSQL) | 10, 11, 12, 13, 14, 15, 16, 17 | - |
| AWS Aurora PostgreSQL | 15 | 15 |
| SQL Server | 2017, 2019, 2022 | 2016, 2017, 2019, 2022 |
| MongoDB | 6.0, 7.0, 8.0 | - |
| MongoDB Atlas | 6.0, 7.0, 8.0 | - |
| Snowflake | - | - |


> [!NOTE]
> Please be aware of the following limitations:
>
> - The target database must be a Redis Cloud Pro database hosted on Amazon Web Services (AWS). Redis Cloud Essentials databases and databases hosted on Google Cloud do not support Data Integration.
> - The target database must use [high availability](/content/operate/rc/databases/configuration/high-availability.md). It can use either single-zone or multi-zone high availability.
> - The target database can use TLS, but can not use mutual TLS.
> - The target database can't use Active-Active topology.
> - If your source database is not publicly accessible, or if it is a MongoDB Atlas or Snowflake database, it must be hosted on AWS.
> - You must use a [custom encryption key on AWS](https://docs.aws.amazon.com/kms/latest/developerguide/create-keys.html) to create the instance hosting the database.
> - Each pipeline has one target database shared by all of its sources.
> - If the source database is not publicly accessible, you must be able to set up AWS PrivateLink to connect your source database to your target database. RDI only works with AWS PrivateLink and not VPC Peering or other private connectivity options.
> - Mutual TLS is not supported for AWS RDS and AWS Aurora source databases. 

## Get started

To get started fast with RDI on Redis Cloud, see the [RDI Cloud quick start](/content/operate/rc/rdi/quick-start.md) to create a data pipeline between a PostgreSQL source database and a Redis Cloud target database.

To create a new data pipeline, you need to:

1. [Create a Data Integration workspace](/content/operate/rc/rdi/create-workspace.md) for your Pro subscription.
1. [Prepare each source database](/content/operate/rc/rdi/setup.md) and any associated credentials.
1. [Define the source connection and data pipeline](/content/operate/rc/rdi/define.md) by selecting which tables to sync.

Once your data pipeline is defined, you can [view and edit](/content/operate/rc/rdi/view-edit.md) it.

For complete production setups, including SQL Server failover handling, see [Production use cases](/content/operate/rc/rdi/use-cases/_index.md).

To plan workspace capacity and scale a pipeline, see [Scale a Cloud RDI pipeline]({{<
relref "/operate/rc/rdi/scale-pipeline" >}}).

## Billing and common questions

See the [RDI Cloud FAQ](/content/operate/rc/rdi/faq.md) for billing examples, reset and flush behavior, and working with multiple sources.

## Maintenance windows

RDI Cloud maintenance follows the same subscription-wide maintenance window as your Redis Cloud Pro subscription. During a maintenance window, your data pipeline may experience brief interruptions as Redis applies updates.

To control when maintenance occurs, [set a manual maintenance window](/content/operate/rc/subscriptions/maintenance/set-maintenance-windows.md) for your Redis Cloud Pro subscription. Any maintenance window you configure applies to both your databases and your RDI data pipeline.
