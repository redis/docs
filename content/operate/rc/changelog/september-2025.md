---
Title: Redis Cloud changelog (September 2025)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  September 2025.
highlights: Data Integration
linktitle: September 2025
weight: 70
tags:
- changelog
---

## New features

### Data Integration

Redis Cloud now supports [Redis Data Integration (RDI)]({{< relref "/operate/rc/databases/rdi" >}}) to create data pipelines that ingest data from a supported primary database to Redis. 

Using a data pipeline lets you have a cache that is always ready for queries. RDI Data pipelines ensure that any changes made to your primary database are captured in your Redis cache within a few seconds, preventing cache misses and stale data within the cache. 

See [Data Integration]({{< relref "/operate/rc/databases/rdi" >}}) to learn how to set up data pipelines with Redis Cloud.