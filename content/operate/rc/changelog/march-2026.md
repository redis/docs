---
Title: Redis Cloud changelog (March 2026)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  March 2026.
highlights: Dynamic endpoints & endpoint redirection, Redis 8.4 on Redis Cloud Pro
linktitle: March 2026
weight: 53
tags:
- changelog
---

## New features

### Dynamic endpoints

As of March 22, 2026, Redis Cloud now generates dynamic endpoints for all databases. Databases created before March 22, 2026 can still view both legacy static endpoints and dynamic endpoints. Static endpoints will still work at this time, but they may be deprecated in the future.

We recommend slowly migrating connections to the dynamic endpoints. Moving connections from the static endpoints to the dynamic endpoints does not cause any downtime. See [Applications that use legacy static endpoints]({{< relref "/operate/rc/databases/redirect-endpoints#applications-that-use-legacy-static-endpoints" >}}) for more information.

### Redirect dynamic endpoints

You can redirect your dynamic endpoints to any Redis Cloud Pro database in the same account. Redirecting your dynamic endpoints lets you switch connections to your new database seamlessly through Redis Cloud without any code changes. See [Redirect database endpoints]({{< relref "/operate/rc/databases/redirect-endpoints" >}}) for more information.

### Redis 8.4 on Redis Cloud Pro

Redis 8.4 is now available for [Redis Cloud Pro databases]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}}) in select regions.

Redis 8.4 builds on the foundation of Redis 8.2 with significant enhancements to cluster operations, string manipulation, and stream processing capabilities. For more information on the changes in Redis 8.4, see [What's new in Redis 8.4]({{<relref "/develop/whats-new/8-4" >}}) and review the Redis Open Source [8.4 release notes]({{<relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.4-release-notes" >}}).

### Automatic database upgrades

All Redis Cloud databases running Redis 8.4 and later will be automatically upgraded to the next minor version upon release. For example, all Redis 8.4 databases will be upgraded to Redis 8.6 when it is available on Redis Cloud.

Redis Cloud Pro users can opt out of minor version auto-upgrades. See [Version management]({{< relref "/operate/rc/databases/version-management" >}}) for more details.
