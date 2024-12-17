---
Title: Redis Stack 7.4 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Stack 7.4 release notes.
linkTitle: v7.4.0-v0 (July 2024)
weight: 100
---
## Redis Stack 7.4.0-v1 (October 2024)

This is a maintenance release for Redis Stack Server 7.4.0.

Update urgency: `SECURITY`: there are security fixes in the release.

[Docker](https://hub.docker.com/r/redis/redis-stack) | [Download](https://redis.io/downloads/#stack)

### Headlines

This version includes security fixes for the **Redis** server, addressing potential vulnerabilities such as an RCE when using Lua library components, and a denial-of-service (DoS) risk due to malformed ACL selectors or unbounded pattern matching.
Additionally, this maintenance release includes the latest version of **Redis Insight**.

### Details

**Security and privacy**
* **Redis**:
  * (CVE-2024-31449) Lua library commands may lead to stack overflow and potential RCE.
  * (CVE-2024-31227) Potential Denial-of-service due to malformed ACL selectors.
  * (CVE-2024-31228) Potential Denial-of-service due to unbounded pattern matching.
	
**Redis Community Edition version**
  * [Redis 7.4.1](https://github.com/redis/redis/releases/tag/7.4.1)

**Module versions**	
* [RediSearch 2.10.5](https://github.com/RediSearch/RediSearch/releases/tag/v2.10.5)
* [RedisJSON 2.8.3](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.8.3)
* [RedisTimeSeries 1.12.2](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.12.2)
* [RedisBloom 2.8.2](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.8.2)

**Recommended client libraries**
* Java
  * [Jedis 5.2.0 or later](https://github.com/redis/jedis/releases/tag/v5.2.0)
  * [Lettuce 6.4.0 or later](https://github.com/redis/lettuce/releases/tag/6.4.0.RELEASE)
* Python
  * [redis-py 5.1.0 or later](https://github.com/redis/redis-py/releases/tag/v5.1.0)
* NodeJS
  * [node-redis 4.7.0 or later](https://github.com/redis/node-redis/releases/tag/redis%404.7.0)
* Go
  * [go-redis 9.6.1 or later](https://github.com/redis/go-redis/releases/tag/v9.6.1)

Compatible with [Redis Insight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [Redis Insight 2.58](https://github.com/RedisInsight/RedisInsight/releases/tag/2.58.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis Major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Community Edition 7.4.0-v0 (July 2024)

This is a GA release of Redis Stack version 7.4.

[Docker](https://hub.docker.com/r/redis/redis-stack) | [Download](https://redis.io/downloads/#stack)

### Headlines
**Data Structures**

`Hash`: Redis now supports expiration of individual hash fields. Redis already supports key expiration. For each key, users can specify a time when it should expire, or specify the remaining time-to-live (TTL) after which it would expire. One very frequent request was to allow specifying expiration time or TTL also for individual hash fields, which is now supported using nine new Redis commands:
- `HEXPIRE`, `HPEXPIRE`, `HEXPIREAT`, `HPEXPIREAT` - set the time when specific hash fields should expire, or the remaining time-to-live for specific fields. 
- `HTTL`, `HPTTL`, `HEXPIRETIME`, `HPEXPIRETIME` - retrieve the time when specific hash fields should expire, or the remaining time-to-live for specific fields
- `HPERSIST` - remove the expiration of specific hash fields.

`Streams`: It is now possible to start reading from the last stream message using `XREAD` with the new id value `+`.
There are many additional improvements, including new command arguments, security, performance, and resource utilization enhancements, several new metrics and configuration parameters were introduced, and multiple bugs were fixed.

`Time series`: The latest time series data structure adds a highly requested feature: insertion-filter for close samples. Many sensors report data periodically. Often, the difference between the measured value and the previously measured value is negligible and related to random noise or to measurement accuracy limitations. When both the time difference and the value difference between the current and the previous sample are small, it may be preferable to ignore (not to add) the new measurement.

`JSON`: Introduces a fix to avoid duplicating AOF commands multiple times in `JSON.MSET`.

`Probabilistic`: Now, an error is returned if `CMS.MERGE` results in an overflow or underflow.

**Search and query**

- New `BFLOAT16` and `FLOAT16` vector data types reduce memory consumed by vectors while preserving accuracy.
- Support for indexing empty and missing values and enhanced developer experience for queries with exact matching capabilities.
- Developers can now match `TAG` fields without needing to escape special characters, making the onboarding process and use of the query syntax simpler.
- Geospatial search capabilities have been expanded with new `INTERSECT` and `DISJOINT` operators, and ergonomics have been improved by providing better reporting of the memory consumed by the index and exposing the Full-text scoring in the aggregation pipeline.

{{< warning >}}
If one or more fields of a hash key expire after a query begins (using FT.SEARCH or FT.AGGREGATE), Redis does not account for these lazily expired fields. As a result, keys with expired fields may still be included in the query results, leading to potentially incorrect or inconsistent results.
{{< /warning >}}

**Removal of triggers and functions**

Redis Stack 7.4 will no longer include triggers and functions. To ensure a seamless upgrade, remove any T&F functions created before loading an RDB file into the new Redis Stack.

### Details
Find more details about features and optimizations introduced with Redis Stack 7.4 here:
  * [Redis server](https://github.com/redis/redis/blob/7.4.0/00-RELEASENOTES)
  * [Search and query capability](https://github.com/RediSearch/RediSearch/releases/tag/v2.10.5)
  * [JSON data structure](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.8.3)
  * [Time series data structure](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.12.2)
  * [Probabilistic data structures](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.8.2)

**Redis version**
  * [Redis 7.4.0](https://github.com/redis/redis/releases/tag/7.4.0)

**Module versions**	
* [RediSearch 2.10.5](https://github.com/RediSearch/RediSearch/releases/tag/v2.10.5)
* [RedisJSON 2.8.3](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.8.3)
* [RedisTimeSeries 1.12.2](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.12.2)
* [RedisBloom 2.8.2](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.8.2)

**Recommended client libraries**
* Java
  * [Jedis 5.1.4 or later](https://github.com/redis/jedis/releases/tag/v5.1.4)
  * [Lettuce 6.4.0 or later](https://github.com/redis/lettuce/releases/tag/6.4.0.RELEASE)
* Python
  * [redis-py 5.0.8 or later](https://github.com/redis/redis-py/releases/tag/v5.0.8)
* NodeJS
  * [node-redis 4.7.0 or later](https://github.com/redis/node-redis/releases/tag/redis%404.7.0)
* Go
  * [go-redis 9.6.1 or later](https://github.com/redis/go-redis/releases/tag/v9.6.1)

Compatible with [Redis Insight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [Redis Insight 2.52](https://github.com/RedisInsight/RedisInsight/releases/tag/2.52.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis Major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.
