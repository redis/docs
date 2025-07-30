---
Title: Redis Data Integration (RDI)
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Deploy and manage Redis Enterprise on Kubernetes with the Redis Enterprise operator.
linkTitle: Redis Data Integration (RDI)
weight: 60
---

Redis Data Integration (RDI) implements a [change data capture](https://en.wikipedia.org/wiki/Change_data_capture) (CDC) pattern that tracks changes to the data in a
non-Redis *source* database and makes corresponding changes to a Redis
*target* database. You can use the target as a cache to improve performance
because it will typically handle read queries much faster than the source.