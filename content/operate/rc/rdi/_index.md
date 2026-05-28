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

Redis Cloud now supports [Redis Data Integration (RDI)]({{<relref "integrate/redis-data-integration">}}), a fast and simple way to bring your data into Redis from other types of primary databases.

A relational database usually handles queries much more slowly than a Redis database. If your application uses a relational database and makes many more reads than writes (which is the typical case) then you can improve performance by using Redis as a cache to handle the read queries quickly. Redis Cloud uses [ingest]({{<relref "/integrate/redis-data-integration/">}}) to help you offload all read queries from the application database to Redis automatically.

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
[decision tree for using RDI]({{<relref "/integrate/redis-data-integration/when-to-use#decision-tree-for-using-rdi">}})
which presents the considerations in a straightforward question-and-answer format.

```decision-tree
```

<!-- {{/* embed-md "rdi-when-to-use.md" */}} -->
<!-- NOTE: Replace this with the original embed when Flink is available in Redis Cloud -->
### When to use RDI

RDI is a good fit when:

- You want your app/micro-services to read from Redis to scale reads at speed.
- You want to transfer data to Redis from a *single* source database.
- You must use a slow database as the system of record for the app.
- The app must always *write* its data to the slow database.
- Your app can tolerate *eventual* consistency of data in the Redis cache.
- You want a self-managed solution or AWS based solution.
- The source data changes frequently in small increments.
- The source database has no more than 10K changes per second.
- RDI throughput during [full sync]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}})
  stays below 30K records per second, assuming an average record size of 1KB and a pipeline without transformations.
- RDI throughput during [CDC]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}})
  stays below 10K records per second, assuming an average record size of 1KB and a pipeline without transformations.
- The total data size is no larger than 100GB, so a full sync completes in under an hour without exceeding the throughput
  limits above.
- You don’t need to perform join operations on the data from several tables
  into a [nested Redis JSON object]({{< relref "/integrate/redis-data-integration/data-pipelines/data-denormalization#joining-one-to-many-relationships" >}}).
- RDI supports the [data transformations]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}) you need for your app.
- Your data caching needs are too complex or demanding to implement and maintain yourself.
- Your database administrator has reviewed RDI's requirements for the source database and
  confirmed that they are acceptable.

### When not to use RDI

RDI is not a good fit when:

- You are migrating an existing data set into Redis only once.
- Your app needs *immediate* cache consistency (or a hard limit on latency) rather
  than *eventual* consistency.
- You need *transactional* consistency between the source and target databases.
- The data is ingested from two replicas of Active-Active at the same time.
- The app must *write* data to the Redis cache, which then updates the source database
  (write-behind/write-through patterns).
- Your data set will only ever be small.
- Your data is updated by some batch or ETL process with long and large transactions - RDI will fail
  processing these changes.
- You need complex stream processing of data (aggregations, sliding window processing, complex 
  custom logic).
- You need to write data to multiple targets from the same pipeline (Redis supports other
  ways to replicate data across Redis databases such as replicaOf and  Active Active).
- Your database administrator has rejected RDI's requirements for the source database.
<!-- End of embed replacement -->

## Data pipeline architecture

An RDI data pipeline sits between your source database and your target Redis database. Initially, the pipeline reads all of the data and imports it into the target database during the *initial sync* phase. After this initial sync is complete, the data pipeline enters the *streaming* phase, where changes are captured as they happen. Changes in the source database are added to the target within a few seconds of capture. The data pipeline translates relational database rows to Redis hashes or JSON documents. 

For more info on how RDI works, see [RDI Architecture]({{<relref "/integrate/redis-data-integration/architecture">}}).

### Pipeline security

Data pipelines are set up to ensure a high level of data security. Source database credentials and TLS secrets are stored in AWS secret manager and shared using the Kubernetes CSI driver for secrets. See [Share source database credentials]({{<relref "/operate/rc/rdi/setup#share-source-database-credentials">}}) to learn how to share your source database credentials and TLS certificates with Redis Cloud.

Connections to the source database use Java Database Connectivity (JDBC) through [AWS PrivateLink](https://aws.amazon.com/privatelink/), ensuring that the data pipeline is only exposed to the specific database endpoint. See [Set up connectivity]({{<relref "/operate/rc/rdi/setup#set-up-connectivity">}}) to learn how to connect your PrivateLink to the Redis Cloud VPC.

RDI encrypts all network connections with TLS. The pipeline will process data from the source database in-memory and write it to the target database using a TLS connection. There are no external connections to your data pipeline except from Redis Cloud management services.

## Prerequisites

Before you can create a data pipeline, you must have:

- A [Redis Cloud Pro database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}) hosted on Amazon Web Services (AWS). This will be the target database.
- One supported source database, hosted on an AWS EC2 instance, AWS RDS, or AWS Aurora:

| Database | Versions | AWS RDS  Versions |
|:---|:---|:---|
| Oracle | 19c, 21c | 19c, 21c |
| MariaDB | 10.5, 11.4.3 | 10.4 to 10.11, 11.4.3 |
| MySQL | 5.7, 8.0.x, 8.2 | 8.0.x |
| PostgreSQL | 10, 11, 12, 13, 14, 15, 16 | 11, 12, 13, 14, 15, 16 |
| AWS Aurora PostgreSQL | 15 | 15 |
| SQL Server | 2017, 2019, 2022 | 2016, 2017, 2019, 2022 |


{{< note >}}
Please be aware of the following limitations:

- The target database must be a Redis Cloud Pro database hosted on Amazon Web Services (AWS). Redis Cloud Essentials databases and databases hosted on Google Cloud do not support Data Integration.
- The target database must use [high availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}). It can use either single-zone or multi-zone high availability.
- The target database can use TLS, but can not use mutual TLS.
- The target database cannot be in the same subscription as another database that has a data pipeline.
- Source databases must also be hosted on AWS.
- You must use a [custom encryption key on AWS](https://docs.aws.amazon.com/kms/latest/developerguide/create-keys.html) to create the instance hosting the database.
- One source database can only be synced to one target database.
- You must be able to set up AWS PrivateLink to connect your source database to your target database. RDI only works with AWS PrivateLink and not VPC Peering or other private connectivity options.
- Mutual TLS is not supported for AWS RDS and AWS Aurora source databases.
{{< /note >}} 

## Get started

To get started fast with RDI on Redis Cloud, see the [RDI Cloud quick start]({{<relref "operate/rc/rdi/quick-start">}}) to create a data pipeline between a PostgreSQL source database and a Redis Cloud target database.

To create a new data pipeline, you need to:

1. [Create a Data Integration workspace]({{<relref "/operate/rc/rdi/create-workspace">}}) for your Pro subscription.
1. [Prepare your source database]({{<relref "/operate/rc/rdi/setup">}}) and any associated credentials.
1. [Define the source connection and data pipeline]({{<relref "/operate/rc/rdi/define">}}) by selecting which tables to sync.

Once your data pipeline is defined, you can [view and edit]({{<relref "/operate/rc/rdi/view-edit">}}) it.
