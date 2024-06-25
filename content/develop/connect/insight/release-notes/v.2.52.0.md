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
- Expire individual hash fields - Redis Insight now supports one of the most requested features from the Redis community that is available with the [first release candidate of Redis 7.4](https://github.com/redis-stack/redis-stack/releases/tag/v7.4.0-rc1)
- Support for [Redis Data Integration (RDI)](https://redis.io/data-integration/?utm_source=redisinsight&utm_medium=repository&utm_campaign=release_notes) to help you create and test RDI pipelines. RDI is a powerful tool designed to synchronize data from your existing database to Redis in near real-time. It establishes a data streaming pipeline that mirrors data from your existing database to Redis Enterprise, enabling seamless data integration and faster data access for launching real-time applications at any scale.

### Details

**Features and improvements**
- [#3470](https://github.com/RedisInsight/RedisInsight/pull/3470) Expire individual hash fields - Redis Insight now supports one of the most requested features from the Redis community that is available with the [first release candidate of Redis 7.4](https://github.com/redis-stack/redis-stack/releases/tag/v7.4.0-rc1).
- [#2839](https://github.com/RedisInsight/RedisInsight/pull/2839), [#2853](https://github.com/RedisInsight/RedisInsight/pull/2853), [#3101](https://github.com/RedisInsight/RedisInsight/pull/3101) Redis Insight now comes with the support for [Redis Data Integration (RDI) pipelines](https://redis.io/data-integration/?utm_source=redisinsight&utm_medium=repository&utm_campaign=release_notes) to help you create and test RDI pipelines. RDI is a powerful tool designed to synchronize data from your existing database to Redis in near real-time. It establishes a data streaming pipeline that mirrors data from your existing database to Redis Enterprise, enabling seamless data integration and faster data access for launching real-time applications at any scale. Use RDI version 1.2.0 or later to seamlessly create, validate, deploy, and monitor your data pipelines within Redis Insight.
- [#3447](https://github.com/RedisInsight/RedisInsight/pull/3447), [#3483](https://github.com/RedisInsight/RedisInsight/pull/3483) UX optimizations for displaying the values of keys in the Browser. The new layout includes controls for editing key values that appear only when you hover over them, optimizing the use of space and providing a cleaner interface.
- [#3231](https://github.com/RedisInsight/RedisInsight/pull/3231) Support for applying the JSON formatting in Browser for values of keys with float numbers that contain 10 or more decimal places.
- [#3492](https://github.com/RedisInsight/RedisInsight/pull/3492) Increased the slot refresh timeout to 5000 milliseconds to enhance connection stability for clustered databases. This adjustment helps avoid scenarios where a connection is terminated before the acknowledgment of a successful connection establishment is received.

**Bugs**
- [#3490](https://github.com/RedisInsight/RedisInsight/pull/3490) Fix for an issue related to adding a JSON field to a key that already contains many fields.
