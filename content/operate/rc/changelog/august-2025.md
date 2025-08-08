---
Title: Redis Cloud changelog (August 2025)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  August 2025.
highlights: Dynamic endpoints, Active-Active on Redis Cloud BYOC
linktitle: August 2025
weight: 70
tags:
- changelog
---

## New features

### Dynamic endpoints

As of DATE, 2025, Redis Cloud now generates dynamic endpoints for all databases. Databases created before DATE, 2025 can still view both static endpoints and dynamic endpoints. Static endpoints will still work at this time, but they may be deprecated in the future.

We recommend slowly migrating connections to the dynamic endpoints. In the future, you'll be able to point the dynamic endpoints to a different database without any changes to your application code.

### Active-Active on Redis Cloud BYOC

You can now deploy [Active-Active databases]({{< relref "/operate/rc/databases/create-database/create-active-active-database" >}}) to an existing Cloud account if [Redis Cloud Bring your own Cloud]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud" >}}) is enabled. 
