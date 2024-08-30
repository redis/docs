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

RDI's helps Redis customers sync Redis Cloud with live data from their primary databases to:
- Meet the required speed and scale of read queries and provide an excellent and predictable user experience.
- Save resources and time when building pipelines and coding data transformations.
- Reduce the total cost of ownership by saving money on expensive database read replicas.

Using RDI with Redis Cloud simplifies managing your data integration pipeline. No need to worry about hardware or underlying infrastructure, as Redis Cloud manages that for you. Creating the data flow from source to target is much easier, and there are validations in place to reduce errors.

## Get started

To start creating your new data pipeline, see [Prepare source database]({{<relref "content/operate/rc/databases/rdi/setup">}}).

## Limitations

Only the following are supported at this time:

- One source database connected to one target database
- AWS source databases
- Ingest use case