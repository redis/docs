---
Title: Data Integration
alwaysopen: false
categories:
- docs
- operate
- rc
description: Use Redis Data Integration in Redis Cloud.
hideListLinks: true
weight: 99
---

Redis Cloud now supports (Redis Data Integration (RDI)){{<relref "integrate/redis-data-integration">}}. RDI's purpose is to help Redis customers sync Redis Enterprise with live data from their disk-based databases to:
    - Meet the required speed and scale of read queries and provide an excellent and predictable user experience.
    - Save resources and time when building pipelines and coding data transformations.
    - Reduce the total cost of ownership by saving money on expensive database read replicas.

Redis Cloud currently only supports the (ingest scenario){{<relref "/integrate/redis-data-integration/ingest/">}}. This scenario helps you offload all read queries from the application database to Redis.

