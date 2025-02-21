---
Title: Redis Cloud changelog (February 2025)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  February 2025.
highlights: Pico billing unit, Redis hashing policy
linktitle: February 2025
weight: 36
---

## New features

### Pico billing unit

We added a Pico billing unit for Pro databases with a maximum size of 100 MB and a maximum throughput of 100 ops/sec. Use it to create smaller databases for a lower cost.

### Redis hashing policy

Accounts created after February 23, 2025, can select the new [Redis hashing policy]({{< relref "/operate/rc/databases/configuration/clustering#redis-hashing-policy" >}}) for their databases when creating a new database. 

The Redis hashing policy is identical to the [hashing policy used by Redis Community Edition]({{< relref "/operate/oss_and_stack/reference/cluster-spec#hash-tags" >}}). This policy is recommended for most users. Select it if any of the following conditions apply:
- This is your first Redis Cloud account, and you are starting fresh.
- You are migrating data from Redis Community Edition or other Redis-managed platforms.
- Your application does not use hashtags in database key names.
- Your application uses binary data as key names.

See [Clustering]({{< relref "/operate/rc/databases/configuration/clustering#manage-the-hashing-policy" >}}) for more information.