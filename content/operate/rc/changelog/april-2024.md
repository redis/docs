---
Title: Redis Cloud changelog (April 2024)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  April 2024.
highlights: Search and query throughput in ops/sec
linktitle: April 2024
weight: 55
---

## Enhancements

### Search and query throughput in ops/sec

You can now set the throughput for databases with Search and query in operations per second (ops/sec), like all other Redis databases. This will let you seamlessly scale your query workload in and out as needed. 

## Deprecations

- Setting throughput by `number-of-shards` is now deprecated for the `POST /v1/subscriptions/{subscriptionId}/databases` REST API endpoint and will be removed soon. We recommend changing the throughput measurement to `operations-per-second` when you create databases using the Redis Cloud API.