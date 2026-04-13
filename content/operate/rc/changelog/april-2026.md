---
Title: Redis Cloud changelog (April 2026)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  April 2026.
highlights: Dynamic endpoints, Redirect dynamic endpoints
linktitle: April 2026
weight: 52
tags:
- changelog
---

## New features

### Dynamic endpoints

As of April 21, 2026, Redis Cloud now generates dynamic endpoints for all databases. Databases created before April 21, 2026 can still view both legacy static endpoints and dynamic endpoints. Static endpoints will still work at this time, but they may be deprecated in the future.

We recommend slowly migrating connections to the dynamic endpoints. Moving connections from the static endpoints to the dynamic endpoints does not cause any downtime. See [Applications that use legacy static endpoints]({{< relref "/operate/rc/databases/redirect-endpoints#applications-that-use-legacy-static-endpoints" >}}) for more information.

### Redirect dynamic endpoints

You can redirect your dynamic endpoints to any Redis Cloud Pro database in the same account. Redirecting your dynamic endpoints lets you switch connections to your new database seamlessly through Redis Cloud without any code changes. See [Redirect database endpoints]({{< relref "/operate/rc/databases/redirect-endpoints" >}}) for more information.