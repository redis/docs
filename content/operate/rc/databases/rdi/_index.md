---
Title: Data Integration
alwaysopen: false
categories:
- docs
- operate
- rc
description: Use Redis Data Integration with Redis Cloud.
hideListLinks: true
weight: 99
---

Redis Cloud now supports [Redis Data Integration (RDI)]({{<relref "integrate/redis-data-integration">}}), a fast and simple way to bring your data into Redis.

A relational database usually handles queries much more slowly than a Redis database. If your application uses a relational database and makes many more reads than writes (which is the typical case) then you can improve performance by using Redis as a cache to handle the read queries quickly. Redis Cloud uses [ingest]({{<relref "/integrate/redis-data-integration/ingest/">}}) to help you offload all read queries from the application database to Redis automatically.

RDI helps Redis customers sync Redis Cloud with live data from their primary databases to:
- Meet the required speed and scale of read queries and provide an excellent and predictable user experience.
- Save resources and time when building pipelines and coding data transformations.
- Reduce the total cost of ownership by saving money on expensive database read replicas.

Using RDI with Redis Cloud simplifies managing your data integration pipeline. No need to worry about hardware or underlying infrastructure, as Redis Cloud manages that for you. Creating the data flow from source to target is much easier, and there are validations in place to reduce errors.

## Prerequisites

Before you can create a data pipeline, you must have:

- A [Redis Cloud Pro database]() hosted on Amazon Web Services (AWS)
- One supported source database, also hosted on AWS and connected to [AWS PrivateLink](https://aws.amazon.com/privatelink/):
    - MySQL
    - Oracle
    - SQL Server
    - PostgreSQL

{{< note >}}
Please be aware of the following limitations:

- The target database must be a Redis Cloud Pro database hosted on Amazon Web Services (AWS). Redis Cloud Essentials databases and databases hosted on Google Cloud do not support Data Integration.
- Only the Ingest use case is supported at this time.
- Source databases must also be hosted on AWS.
- One source database can only be connected to one target database.
{{< /note >}} 

## Get started

To create a new data pipeline, you need to:

1. [Prepare your source database]({{<relref "content/operate/rc/databases/rdi/setup">}}) and any associated credentials.
2. [Provision data pipeline]
3. [Define data pipeline]

Once your data pipeline is defined, you can [manage]() and [observe]() it.