---
Title: Redis Cloud changelog (February 2026)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  February 2026.
highlights: Metrics resolution updates
linktitle: February 2026
weight: 55
tags:
- changelog
---

## Enhancements

### Metrics resolution updates

The [metrics tab of a Redis Cloud database]({{< relref "/operate/rc/databases/monitor-performance#view-database-metrics" >}}) now displays database metrics at different levels of granularity depending on the selected time range. Short time ranges now show finer granularity for detailed investigation, and longer time ranges use aggregated intervals for clearer trend analysis. See [Metric intervals]({{< relref "/operate/rc/databases/monitor-performance#metric-intervals" >}}) for a list of available intervals and their corresponding resolutions.

To simplify the monitoring experience and ensure each time range provides meaningful insight, the 1 minute and 1 year ranges have been removed. The 1 year range has been replaced with a 3 month range.
