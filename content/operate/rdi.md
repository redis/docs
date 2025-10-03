---
Title: Redis Data Integration (RDI)
alwaysopen: false
categories:
- docs
- operate
description: Keep Redis in sync with a primary database in near real time.
linkTitle: Redis Data Integration (RDI)
weight: 60
---

Redis Data Integration (RDI) is a [change data capture](https://en.wikipedia.org/wiki/Change_data_capture) (CDC) system that tracks changes to the data in a non-Redis source database and makes corresponding changes to a Redis target database. You can use the target as a cache to improve performance because it will typically handle read queries much faster than the source.

See the main [RDI docs section]({{< relref "/integrate/redis-data-integration" >}})
under [Libraries and tools]({{< relref "/integrate" >}}) for full documentation.
