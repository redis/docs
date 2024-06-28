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
- Redis Insight now supports [setting expiration for individual hash fields](https://redis.io/docs/latest/develop/data-types/hashes/?utm_source=redisinsight&utm_medium=release_notes&utm_campaign=2.52#field-expiration), a highly requested feature available in the [first release candidate of Redis 7.4](https://github.com/redis-stack/redis-stack/releases/tag/v7.4.0-rc1)
- Learn how to leverage Redis for Retrieval Augmented Generation (RAG) use cases via a new built-in Redis Insight tutorial

### Details

**Features and improvements**
- [#3470](https://github.com/RedisInsight/RedisInsight/pull/3470) Redis Insight now supports [setting expiration for individual hash fields](https://redis.io/docs/latest/develop/data-types/hashes/?utm_source=redisinsight&utm_medium=release_notes&utm_campaign=2.52#field-expiration) through intuitive Browser controls. The hash field expiration is a highly requested feature available in the [first release candidate of Redis 7.4](https://github.com/redis-stack/redis-stack/releases/tag/v7.4.0-rc1).
- [#60](https://github.com/RedisInsight/Tutorials/pull/60) Redis, with its high performance and versatile data structures, is an excellent choice for implementing Retrieval Augmented Generation (RAG). Our new built-in tutorial provides an overview of how Redis can be leveraged in a RAG use case. To get started, open the "Insights" panel in the top right corner and try the new tutorial.
- [#3447](https://github.com/RedisInsight/RedisInsight/pull/3447), [#3483](https://github.com/RedisInsight/RedisInsight/pull/3483) UX optimizations for displaying the values of keys in the Browser. The new layout includes controls for editing key values that appear only when you hover over them, optimizing the use of space and providing a cleaner interface.
- [#3231](https://github.com/RedisInsight/RedisInsight/pull/3231) Support for applying the JSON formatting in Browser for values of keys with float numbers that contain 10 or more decimal places.
- [#3492](https://github.com/RedisInsight/RedisInsight/pull/3492) Increased the slot refresh timeout to 5000 milliseconds to enhance connection stability for clustered databases. This adjustment helps avoid scenarios where a connection is terminated before the acknowledgment of a successful connection establishment is received.

**Bugs**
- [#3490](https://github.com/RedisInsight/RedisInsight/pull/3490) Fix for an issue related to adding a JSON field to a key that already contains many fields.
