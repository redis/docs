---
Title: Redis Cloud changelog (November 2025)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  November 2025.
highlights: Redis 8.2 on Redis Cloud Pro, FOCUS-compliant cost reports
linktitle: November 2025
weight: 60
tags:
- changelog
---

## New features

### FOCUS-compliant cost reports

You can now generate and download [cost reports]({{< relref "/operate/rc/billing-and-payments/cost-report" >}}) in a [FinOps Open Cost and Usage Specification (FOCUS)](https://focus.finops.org/) compliant format using the Redis Cloud REST API. You can use this cost report with any FOCUS-compatible cost reporting tool to analyze and visualize your costs.

See [Generate FOCUS-compliant cost report with REST API]({{< relref "/operate/rc/api/examples/generate-cost-report" >}}) for examples.

### Redis 8.2 on Redis Cloud Pro

Redis 8.2 is now available on Redis Cloud Pro. You can now upgrade your existing Pro database to Redis 8.2. 

See [upgrade database version]({{< relref "/operate/rc/databases/version-management/upgrade-version" >}}) to learn how to upgrade your existing Pro database to the latest version. If you are upgrading to Redis 8.2 from Redis 7.4 or earlier, review the [Redis 8.0 breaking changes]({{< relref "/operate/rc/changelog/version-release-notes/8-0#breaking-changes" >}}) before upgrading.