---
Title: Redis Cloud changelog (February 2026)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  February 2026.
highlights: Dynamic endpoints, Dynamic endpoint migration
linktitle: February 2026
weight: 55
tags:
- changelog
---

## New features

### Dynamic endpoints

As of {{RELEASE DATE}}, Redis Cloud now generates dynamic endpoints for all databases. Databases created before {{RELEASE DATE}} can still view both static endpoints and dynamic endpoints. Static endpoints will still work at this time, but they may be deprecated in the future.

We recommend slowly migrating connections to the dynamic endpoints. You can migrate your dynamic endpoints to a Redis Cloud Pro database at any time.

### Redirect database endpoints

You can redirect your dynamic endpoints to any Redis Cloud Pro database in the same account. Migrating your database endpoints after migrating your data lets you direct connections to your new database without any code changes. See [Redirect database endpoints]({{< relref "/operate/rc/databases/migrate-databases#redirect-database-endpoints" >}}) for more information.
