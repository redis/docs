---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
description: Patterns for real-time analytics with counters, windows, and aggregations
linkTitle: Analytics
title: Real-time analytics patterns
weight: 30
---

Real-time analytics patterns help you calculate metrics, track trends, and aggregate data as events occur. These patterns use sorted sets, HyperLogLog, and Search aggregations for efficient real-time calculations.

## When to use these patterns

Use analytics patterns when you need to:

- Track metrics in sliding time windows
- Count unique visitors or events at scale
- Calculate real-time aggregations and statistics
- Implement rate limiting and quotas
- Build real-time dashboards and reports
- Detect trends and anomalies

## Available patterns

### [Sliding window counters](sliding-windows/)

Implement time-based analytics using sorted sets. Learn how to track metrics in sliding windows, implement rate limiting, and calculate trends.

**Key concepts:** Sorted sets, ZADD, ZREMRANGEBYSCORE, time-based scoring

### [Unique counting with HyperLogLog](unique-counting/)

Track unique visitors and cardinality at scale using probabilistic data structures. Learn when to use HyperLogLog and how to combine counts.

**Key concepts:** PFADD, PFCOUNT, PFMERGE, cardinality estimation

### [Real-time aggregations](real-time-aggregations/)

Build dashboards with Search aggregations. Learn how to group, reduce, and calculate statistics in real time.

**Key concepts:** FT.AGGREGATE, GROUPBY, REDUCE, aggregation pipelines

## Prerequisites

Before working with these patterns, familiarize yourself with:

- [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}) - Time-series and range queries
- [Probabilistic data structures]({{< relref "/develop/data-types/probabilistic" >}}) - HyperLogLog, Bloom filters
- [Search aggregations]({{< relref "/develop/ai/search-and-query/query/aggregation" >}}) - Group and reduce operations
- [Time-series data]({{< relref "/develop/data-types/timeseries" >}}) - RedisTimeSeries module

## Common use cases

- **Rate limiting** - Limit API requests per user per time window
- **Trending topics** - Track popular content with time decay
- **Real-time dashboards** - Display live metrics and KPIs
- **A/B testing** - Track unique visitors per variant
- **Session analytics** - Count active users in time windows
- **Leaderboards** - Rank users by score with time-based filtering

## Related patterns

- [Time-series data]({{< relref "/develop/patterns/data-modeling/time-series" >}}) - Model time-series efficiently
- [Event pipelines with Streams]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Ingest events for analytics
- [JSON document queries]({{< relref "/develop/patterns/queries/json-document-queries" >}}) - Query and aggregate documents

## More information

- [Sorted sets documentation]({{< relref "/develop/data-types/sorted-sets" >}})
- [Probabilistic data structures]({{< relref "/develop/data-types/probabilistic" >}})
- [Search aggregations]({{< relref "/develop/ai/search-and-query/query/aggregation" >}})
- [RedisTimeSeries]({{< relref "/develop/data-types/timeseries" >}})

