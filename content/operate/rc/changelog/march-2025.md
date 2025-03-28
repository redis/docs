---
Title: Redis Cloud changelog (March 2025)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  March 2025.
highlights: Redis Insight on Redis Cloud, Redis Hashing policy
linktitle: March 2025
weight: 34
---

## New features

### Redis Insight on Redis Cloud

Users with select Redis Cloud Essentials databases can now open a browser-based version of [Redis Insight]({{< relref "/operate/rc/databases/connect/insight-cloud" >}}) directly from Redis Cloud. See [Connect to your database]({{< relref "/operate/rc/databases/connect#ri-browser" >}}) to learn how to open Redis Insight from Redis Cloud.

This browser-based version of Redis Insight has a subset of the features of Redis Insight on desktop. For more information, see [Open with Redis Insight on Redis Cloud]({{< relref "/operate/rc/databases/connect/insight-cloud" >}}).

### Redis hashing policy

Accounts created after March 30, 2025, can select the new [Redis hashing policy]({{< relref "/operate/rc/databases/configuration/clustering#redis-hashing-policy" >}}) for their databases when creating a new database. 

The Redis hashing policy is identical to the [hashing policy used by Redis Community Edition]({{< relref "/operate/oss_and_stack/reference/cluster-spec#hash-tags" >}}). This policy is recommended for most users. Select it if any of the following conditions apply:
- This is your first Redis Cloud account, and you are starting fresh.
- You are migrating data from Redis Community Edition or other Redis-managed platforms.
- Your application does not use hashtags in database key names.
- Your application uses binary data as key names.

See [Clustering]({{< relref "/operate/rc/databases/configuration/clustering#manage-the-hashing-policy" >}}) for more information.

## Deprecations

- The [Custom hashing policy]({{< relref "/operate/rc/databases/configuration/clustering#custom-hashing-policy" >}}) is no longer available for accounts created after March 30, 2025. For all other accounts, this policy is not recommended and will be deprecated in the future. Only select a custom hashing policy if you are already using a custom hashing policy with your existing Redis Cloud databases.