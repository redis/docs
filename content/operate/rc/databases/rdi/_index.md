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

The applications that write data to your primary database are not always the same application that need faster access to the data. Redis Cloud uses [ingest]({{<relref "/integrate/redis-data-integration/ingest/">}}) to help you offload all read queries from the application database to Redis.

RDI's helps Redis customers sync Redis Cloud with live data from their primary databases to:
    - Meet the required speed and scale of read queries and provide an excellent and predictable user experience.
    - Save resources and time when building pipelines and coding data transformations.
    - Reduce the total cost of ownership by saving money on expensive database read replicas.

Using RDI with Redis Cloud simplifies managing your data integration pipeline. No need to worry about hardware or underlying infrastructure, as Redis Cloud manages that for you. Creating the data flow from source to target is much easier, and there are validations in place to reduce errors.

## Get started

To start creating your new data pipeline, see [Prepare source database]({{<relref "content/operate/rc/databases/rdi/setup.md">}}).

## Limitations

Only the following are supported at this time:

- One source database connected to one target database
- AWS source databases
- Ingest use case