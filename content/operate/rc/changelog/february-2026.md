---
Title: Redis Cloud changelog (February 2026)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  February 2026.
highlights: Dynamic endpoints, Redirect dynamic endpoints
linktitle: February 2026
weight: 55
tags:
- changelog
---

## New features

### Dynamic endpoints

As of {{RELEASE DATE}}, Redis Cloud now generates dynamic endpoints for all databases. Databases created before {{RELEASE DATE}} can still view both static endpoints and dynamic endpoints. Static endpoints will still work at this time, but they may be deprecated in the future.

We recommend slowly migrating connections to the dynamic endpoints. See [Applications that use legacy static endpoints]({{< relref "/operate/rc/databases/redirect-endpoints#applications-that-use-legacy-static-endpoints" >}}) for more information.

### Redirect dynamic endpoints

You can redirect your dynamic endpoints to any Redis Cloud Pro database in the same account. Redirecting your database endpoints after migrating your data lets you direct connections to your new database without any code changes. See [Redirect database endpoints]({{< relref "/operate/rc/databases/redirect-endpoints" >}}) for more information.
