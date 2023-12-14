---
Title: Metrics and Usage Statistics
alwaysopen: false
categories:
- docs
- operate
- rc
description: Using the metrics API operation to query database usage and statistics
  information
draft: true
weight: 80
---
You can get metrics and usage statistics for a database from the API operation:

`GET /subscriptions/{subscription-id}/databases/{database-id}/metrics?metricSpan={metric-span}`.

The metrics API is supported for Flexible and Annual subscriptions.

The query accepts 3 parameters:

- `subscription-id` (Required) - The relevant subscription ID for the database
- `database-id` (Required) - The ID of the database
- `metric-span` (Optional) - The [time span]({{< relref "/operate/rc/api/concepts/metrics#metric-spans-and-intervals" >}}) for the query. The default time span is `1hour`.

## Metrics query example

```shell
{{% embed-code "rv/api/70-query-metrics.sh" %}}
```
