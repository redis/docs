---
Title: Redis Insight v2.58.0, September 2024
linkTitle: v2.58.0 (September 2024)
date: 2024-09-30 00:00:00 +0000
description: Redis Insight v2.58
weight: 1

---
## 2.58 (September 2024)
This is the General Availability (GA) release of Redis Insight 2.58.

### Highlights
- Redis Insight now supports starting, stopping, and resetting [Redis Data Integration](https://redis.io/data-integration/?utm_source=redisinsight&utm_medium=repository&utm_campaign=release_notes) pipelines.
- Support for a [highly requested feature](https://github.com/RedisInsight/RedisInsight/issues/1671) to subscribe to specific Pub/Sub channels.
- Ability to delete previously added CA and Client certificates to keep them up-to-date.

### Details

**Features and improvements**
- [#3843](https://github.com/RedisInsight/RedisInsight/pull/3843) Redis Insight now supports starting, stopping, and resetting [Redis Data Integration](https://redis.io/data-integration/?utm_source=redisinsight&utm_medium=repository&utm_campaign=release_notes) (RDI) pipelines. Use RDI version 1.3.6 or later to seamlessly stop or resume processing new data. You can also reset an RDI pipeline to take a new snapshot of the data, process it, and continue tracking changes. To get started, navigate to the "Redis Data Integration" tab on the database list page and add or connect to your RDI endpoint.
- [#3832](https://github.com/RedisInsight/RedisInsight/pull/3832) Added support for a [highly requested feature](https://github.com/RedisInsight/RedisInsight/issues/1671) to subscribe to specific Pub/Sub channels. On the Pub/Sub page, you can now subscribe to multiple channels or patterns by entering them, separated by spaces.
- [#3796](https://github.com/RedisInsight/RedisInsight/pull/3796) Ability to delete previously added CA and Client certificates to keep them up-to-date.

**Bugs**
- [#3840](https://github.com/RedisInsight/RedisInsight/pull/3840) [Saved](https://github.com/RedisInsight/RedisInsight/issues/3833) SNI and SSH connection information for newly added database connections.
- [#3828](https://github.com/RedisInsight/RedisInsight/pull/3828) Fixed an issue to [display multiple hash fields](https://github.com/RedisInsight/RedisInsight/issues/3826) when expanding a hash value.
