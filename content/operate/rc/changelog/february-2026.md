---
Title: Redis Cloud changelog (February 2026)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  February 2026.
highlights: Redis 8.4 on Redis Cloud Pro, Automatic database upgrades
linktitle: February 2026
weight: 55
tags:
- changelog
---

## New features

### Redis 8.4 on Redis Cloud Pro

Redis 8.4 is now available for [Redis Cloud Pro databases]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}}) in select regions.

Redis 8.4 builds on the foundation of Redis 8.2 with significant enhancements to cluster operations, string manipulation, and stream processing capabilities. For more information on the changes in Redis 8.4, see [What's new in Redis 8.4]({{<relref "/develop/whats-new/8-4" >}}) and review the Redis Open Source [8.4 release notes]({{<relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.4-release-notes" >}}).

### Automatic database upgrades

All Redis Cloud databases running Redis 8.4 and later will be automatically upgraded to the next minor version upon release. For example, all Redis 8.4 databases will be upgraded to Redis 8.6 when it is available on Redis Cloud.

Redis Cloud Pro users can opt out of minor version auto-upgrades. See [Version management]({{< relref "/operate/rc/databases/version-management" >}}) for more details.
