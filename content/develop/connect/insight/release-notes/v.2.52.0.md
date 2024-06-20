---
Title: Redis Insight v2.52.0, June 2024
linkTitle: v2.52.0 (June 2024)
date: 2024-06-26 00:00:00 +0000
description: Redis Insight v2.52
weight: 1

---
## 2.52 (June 2024)
This is the General Availability (GA) release of Redis Insight 2.52.

### Highlights
- New tutorial exploring several common Redis use cases with paired-up sample data that will get you started quicker with your empty database.
- Performance and UX enhancements for the JSON data structure for smoother data rendering and interaction in the Browser.

### Details

**Features and improvements**
- [#3470](https://github.com/RedisInsight/RedisInsight/pull/3470) `Hash`: the first release candidate of Redis 7.4 now [supports expiration of individual hash fields](https://github.com/redis-stack/redis-stack/releases/tag/v7.4.0-rc1). Use Redis Insight together with Redis Redis [7.4](https://github.com/redis/redis/releases/tag/7.4-rc1) to set expiration for hash fields.
- [#2839](https://github.com/RedisInsight/RedisInsight/pull/2839), [#2853](https://github.com/RedisInsight/RedisInsight/pull/2853), [#3101](https://github.com/RedisInsight/RedisInsight/pull/3101) Redis Data Integration (RDI) is a robust tool designed to synchronize data from your existing database to Redis in near real-time. RDI establishes a data streaming pipeline that mirrors data from your existing database to Redis Enterprise, enabling seamless data integration and faster data access for launching real-time applications at any scale. Now Redis Insight is equipped with new capabilities to help you create and test RDI pipelines.
- [#3481](https://github.com/RedisInsight/RedisInsight/pull/3481) Removing support for triggers and functions due to the end of its preview.
- [#3447](https://github.com/RedisInsight/RedisInsight/pull/3447), [#3483](https://github.com/RedisInsight/RedisInsight/pull/3483) UX optimizations for displaying values of keys in Browser. A new layout includes displaying control to edit or delete values of keys only by hover to optimize space.
- [#3231](https://github.com/RedisInsight/RedisInsight/pull/3231) Apply the JSON format for values with float numbers that contain at least 10 decimal places.
- [#3492](https://github.com/RedisInsight/RedisInsight/pull/3492) Increase `slotsRefreshTimeoutchange` to 5000 to avoid cases when a connection is terminated before the acknowledgment of a successful connection establishment is received.

**Bugs**
- [#3490](https://github.com/RedisInsight/RedisInsight/pull/3490) Fix for an error when when adding a JSON field to a JSON key with many fields.
