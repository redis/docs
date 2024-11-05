---
Title: Redis Stack 6.2.6 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Stack 6.2.6 release notes.
linkTitle: v6.2.6-v0 (December 2022)
weight: 100
---

## Redis Stack Server 6.2.6-v17 (October 2024)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `SECURITY`: there are security fixes in the release.

[Docker](https://hub.docker.com/r/redis/redis-stack) | [Download](https://redis.io/downloads/#stack)

### Headlines:
This version includes security fixes for the **Redis** server, addressing potential vulnerabilities such as an RCE when using Lua library components, and a denial-of-service (DoS) risk due to unbounded pattern matching.
Additionally, this maintenance release includes the latest version of **Redis Insight**.

### Details:
 **Security and privacy**
* **Redis**:
  * (CVE-2024-31449) Lua library commands may lead to stack overflow and potential RCE.
  * (CVE-2024-31228) Potential Denial-of-service due to unbounded pattern matching.

**Redis version**
* [Redis 6.2.16](https://github.com/redis/redis/releases/tag/6.2.16)

**Module versions**	
* __[RediSearch 2.6.20](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.20)__
* __[RedisJSON 2.4.9](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.9)__
* __[RedisGraph 2.10.12](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.15)__
* __[RedisTimeSeries 1.8.14](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.14)__
* __[RedisBloom 2.4.9](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.9)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.2.0 or greater](https://github.com/redis/jedis/releases/tag/v5.2.0)
  * [redis-om-spring 0.9.5 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.9.5)
* Python
  * [redis-py 5.1.0 or greater](https://github.com/redis/redis-py/releases/tag/v5.1.0)
  * [redis-om-python 0.3.2 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.3.2)
* NodeJS
  * [node-redis 4.7.0 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.7.0)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.7.4 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.7.4)
  * [NRedisStack 0.13.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.13.0)
* Go
  * [go-redis 9.6.1 or greater](https://github.com/redis/go-redis/releases/tag/v9.6.1)
  * [rueidis 1.0.47 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.47)

Compatible with [Redis Insight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [Redis Insight 2.58](https://github.com/RedisInsight/RedisInsight/releases/tag/2.58.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v16 (August 2024)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

### Headlines:
The updated **search and query**  version introduces several new features and bug fixes. This new release of Redis Stack 6.2.6 also includes updated versions of **JSON** and **time series** data structures, each incorporating several bug fixes.

This maintenance release also contains the latest version of **RedisInsight**.

 ### Details:

 **Improvements**
* **Search and query**:
  * [#4793](https://github.com/RediSearch/RediSearch/pull/4793) - Add character validations to simple string replies and escape it when required(MOD-7258)
  * [#4769](https://github.com/RediSearch/RediSearch/pull/4769) - Indicate which value is missing on the error message at the aggregation pipeline (MOD-7201)
  * [#4746](https://github.com/RediSearch/RediSearch/pull/4746) - `GROUPBY` recursion cleanup (MOD-7245)

**Bug Fixes**
* **Search and query**:
  * [#4755](https://github.com/RediSearch/RediSearch/pull/4755) - Correct return the maximum value for negative values when using `MAX` reducer (MOD-7252)
  * [#4733](https://github.com/RediSearch/RediSearch/pull/4733) - Separators ignored when escaping backslash `\` after the escaped character such as in `hello\\,world` ignoring `,` (MOD-7240)
  * [#4717](https://github.com/RediSearch/RediSearch/pull/4717) - Sorting by multiple fields as in `SORTBY 2 @field1 @field2` was ignoring the subsequent field (MOD-7206)

* **Time series**:
  * [#1607](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1607) Potential crash after deleting and recreating a source key of a compaction rule (MOD-7338)
  * [#1610](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1610) `COUNT` argument accepts non-positive values (MOD-5413)

**Redis version**
* [Redis 6.2.14](https://github.com/redis/redis/releases/tag/6.2.14)

**Module versions**	
* __[RediSearch 2.6.20](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.20)__
* __[RedisJSON 2.4.9](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.9)__
* __[RedisGraph 2.10.12](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.15)__
* __[RedisTimeSeries 1.8.14](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.14)__
* __[RedisBloom 2.4.9](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.9)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.1.4 or greater](https://github.com/redis/jedis/releases/tag/v5.1.4)
  * [redis-om-spring 0.9.4 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.9.4)
* Python
  * [redis-py 5.0.9 or greater](https://github.com/redis/redis-py/releases/tag/v5.0.9)
  * [redis-om-python 0.3.1 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.3.1)
* NodeJS
  * [node-redis 4.7.0 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.7.0)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.7.4 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.7.4)
  * [NRedisStack 0.12.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.12.0)
* Go
  * [go-redis 9.6.1 or greater](https://github.com/redis/go-redis/releases/tag/v9.6.1)
  * [rueidis 1.0.43 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.43)

Compatible with [Redis Insight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [Redis Insight 2.54](https://github.com/RedisInsight/RedisInsight/releases/tag/2.54.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v15 (June 2024)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

### Headlines:
Redis Stack 6.2.6-v15 introduces an updated **search and query** capability with several enhancements and bug fixes.
The updated **search and query** version features improved memory reporting that accounts for additional memory consumed by `TAG` and `TEXT` tries. Also, it includes additional fields in the `FT.INFO` command when used within a cluster.
This maintenance release also contains the latest version of **RedisInsight**.

### Details:

 **Improvements**
* **Search and query**:
  * [#4599](https://github.com/RediSearch/RediSearch/pull/4599) - Report additional memory consumed by the `TAG` and `TEXT` tries (MOD-5902)
  * [#4688](https://github.com/RediSearch/RediSearch/pull/4688) - Add missing `FT.INFO` fields when used within a cluster (MOD-6920)

**Bug Fixes**
* **Search and query**:
  * [#4616](https://github.com/RediSearch/RediSearch/pull/4616) - Shards become unresponsive when using `FT.AGGREGATE` with `APPLY 'split(...)'`(MOD-6759)
  * [#4557](https://github.com/RediSearch/RediSearch/pull/4557) - `FT.EXPLAIN` returns additional `}` when querying using wildcards (MOD-6768)
  * [#4647](https://github.com/RediSearch/RediSearch/pull/4647) - `FT.DROPINDEX` with `DD` flag deleted keys in one AA cluster but not the others (MOD-1855)

**Redis version**
* [Redis 6.2.14](https://github.com/redis/redis/releases/tag/6.2.14)

**Module versions**	
* __[RediSearch 2.6.19](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.19)__
* __[RedisJSON 2.4.9](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.9)__
* __[RedisGraph 2.10.12](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.15)__
* __[RedisTimeSeries 1.8.13](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.13)__
* __[RedisBloom 2.4.9](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.9)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.1.3 or later](https://github.com/redis/jedis/releases/tag/v5.1.3)
  * [redis-om-spring 0.9.1 or later](https://github.com/redis/redis-om-spring/releases/tag/v0.9.1)
* Python
  * [redis-py 5.0.5 or later](https://github.com/redis/redis-py/releases/tag/v5.0.5)
  * [redis-om-python 0.3.1 or later](https://github.com/redis/redis-om-python/releases/tag/v0.3.1)
* NodeJS
  * [node-redis 4.6.14 or later](https://github.com/redis/node-redis/releases/tag/redis%404.6.14)
  * [redis-om-node 0.2.0 or later](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.7.1 or later](https://github.com/redis/redis-om-dotnet/releases/tag/v0.7.1)
  * [NRedisStack 0.12.0 or later](https://github.com/redis/NRedisStack/releases/tag/v0.12.0)
* Go
  * [go-redis 9.5.2 or later](https://github.com/redis/go-redis/releases/tag/v9.5.2)
  * [rueidis 1.0.38 or later](https://github.com/redis/rueidis/releases/tag/v1.0.38)

Compatible with [Redis Insight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [Redis Insight 2.50](https://github.com/RedisInsight/RedisInsight/releases/tag/2.50.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Downloads

* macOS: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.catalina.x86_64.zip), [arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.monterey.arm64.zip)
* AppImage: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15-x86_64.AppImage)
* Ubuntu: [Bionic x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.bionic.x86_64.tar.gz), [Bionic arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.bionic.arm64.tar.gz), [Focal x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.focal.x86_64.tar.gz), [Focal arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.focal.arm64.tar.gz), [Snap x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.x86_64.snap), [Snap arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.arm64.snap), [Jammy x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.jammy.x86_64.tar.gz), [Jammy arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.jammy.arm64.tar.gz)
* Debian: [Bullseye x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.bullseye.x86_64.tar.gz)
* RHEL 7/CentOS Linux 7: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.rhel7.x86_64.tar.gz)
* RHEL 8/CentOS Linux 8: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v15.rhel8.x86_64.tar.gz)
* Redis Stack on [Dockerhub](https://hub.docker.com/u/redis): [x86_64 and arm64](https://hub.docker.com/r/redis/redis-stack)
* Redis Stack server on [Dockerhub](https://hub.docker.com/u/redis): [x86_64 and arm64](https://hub.docker.com/r/redis/redis-stack-server)

## Redis Stack Server 6.2.6-v14 (April 2024)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

### Headlines:
This version contains the latest **search and query** capability with several improvements and bug fixes, including a critical bug fix. This release also includes the latest **JSON** data structure with a fix for a potential crash, and the **time series** data structure with more detailed LibMR error messages and a fix for a potential crash. It also contains the latest version of **RedisInsight**.

### Details:

 **Improvements**
* **Search and query**:
  * [#4502](https://github.com/RediSearch/RediSearch/pull/4502) Handle error properly when trying to execute Search commands on cluster setup as part of `MULTI`/`EXEC` or LUA script (MOD-6541)

* **Time series**:
  * [#1593](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1593) More detailed LibMR error messages

**Bug Fixes**
* **Search and query**:
  * [#4524](https://github.com/RediSearch/RediSearch/pull/4524) `FT.CURSOR READ` in a numeric query causing a crash (MOD-6597)
  * [#4543](https://github.com/RediSearch/RediSearch/pull/4543) `FT.SEARCH` accessing an inexistent memory address causes a crash if using deprecated `FT.ADD` command (MOD-6599)
  * [#4535](https://github.com/RediSearch/RediSearch/pull/4535) `FT.PROFILE` with incorrect arguments could cause a crash on cluster setup (MOD-6791)
  * [#4540](https://github.com/RediSearch/RediSearch/pull/4540) Unfree memory from an existing RDB while re-indexing loading a new RDB could cause a crash (MOD-6831, 6810)
  * [#4485](https://github.com/RediSearch/RediSearch/pull/4485) Some parameter settings using just prefixes instead of full values were working (MOD-6709)
  * [#4557](https://github.com/RediSearch/RediSearch/pull/4557) Additional "`}`" on wildcards replies for `FT.EXPLAIN` (MOD-6768)

* **JSON**:
  * [#1192](https://github.com/RedisJSON/RedisJSON/pull/1192) Crashes with numeric values greater than i64::MAX (MOD-6501, MOD-4551, MOD-4856, MOD-5714)

* **Time series**:
  * [LibMR#51](https://github.com/RedisGears/LibMR/pull/51) Crash on SSL initialization failure (MOD-5647)

**Redis version**
* [Redis 6.2.14](https://github.com/redis/redis/releases/tag/6.2.14)

**Module versions**	
* __[RediSearch 2.6.18](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.18)__
* __[RedisJSON 2.4.9](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.9)__
* __[RedisGraph 2.10.12](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.15)__
* __[RedisTimeSeries 1.8.13](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.13)__
* __[RedisBloom 2.4.9](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.9)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.1.2 or later](https://github.com/redis/jedis/releases/tag/v5.1.2)
  * [redis-om-spring 0.8.9 or later](https://github.com/redis/redis-om-spring/releases/tag/v0.8.9)
* Python
  * [redis-py 5.0.3 or later](https://github.com/redis/redis-py/releases/tag/v5.0.3)
  * [redis-om-python 0.2.2 or later](https://github.com/redis/redis-om-python/releases/tag/v0.2.2)
* NodeJS
  * [node-redis 4.6.13 or later](https://github.com/redis/node-redis/releases/tag/redis%404.6.13)
  * [redis-om-node 0.2.0 or later](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.6.1 or later](https://github.com/redis/redis-om-dotnet/releases/tag/v0.6.1)
  * [NRedisStack 0.12.0 or later](https://github.com/redis/NRedisStack/releases/tag/v0.12.0)
* Go
  * [go-redis 9.5.1 or later](https://github.com/redis/go-redis/releases/tag/v9.5.1)
  * [rueidis 1.0.33 or later](https://github.com/redis/rueidis/releases/tag/v1.0.33)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.46](https://github.com/RedisInsight/RedisInsight/releases/tag/2.46.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Downloads

* macOS: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.catalina.x86_64.zip), [arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.monterey.arm64.zip)
* AppImage: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14-x86_64.AppImage)
* Ubuntu: [Bionic x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.bionic.x86_64.tar.gz), [Bionic arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.bionic.arm64.tar.gz), [Focal x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.focal.x86_64.tar.gz), [Focal arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.focal.arm64.tar.gz), [Snap x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.x86_64.snap), [Snap arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.arm64.snap), [Jammy x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.jammy.x86_64.tar.gz), [Jammy arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.jammy.arm64.tar.gz)
* Debian: [Bullseye x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.bullseye.x86_64.tar.gz)
* RHEL 7/CentOS Linux 7: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.rhel7.x86_64.tar.gz)
* RHEL 8/CentOS Linux 8: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v14.rhel8.x86_64.tar.gz)
* Redis Stack on [Dockerhub](https://hub.docker.com/u/redis): [x86_64 and arm64](https://hub.docker.com/r/redis/redis-stack)
* Redis Stack server on [Dockerhub](https://hub.docker.com/u/redis): [x86_64 and arm64](https://hub.docker.com/r/redis/redis-stack-server)

## Redis Stack Server 6.2.6-v13 (March 2024)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

### Headlines:
This version contains the latest **search and query** capability and **probabilistic** data structures with several bug fixes. It also contains the latest version of **RedisInsight**.

### Details:

**Bug Fixes**
* **Search and query**:
  * [#4477](https://github.com/RediSearch/RediSearch/pull/4477) Split `INFIX` and `SUFFIX` report on `FT.EXPLAIN` and `FT.EXPLAINCLI` (MOD-6186)
  * [#4468](https://github.com/RediSearch/RediSearch/pull/4468) Memory leak upon suffix query for a `TAG` indexed with `WITHSUFFIXTRIE` (MOD-6644)
  * [#4407](https://github.com/RediSearch/RediSearch/pull/4407) Clustered `FT.SEARCH` hangs forever without replying when an invalid topology is found (MOD-6557)
  * [#4359](https://github.com/RediSearch/RediSearch/pull/4359) Searching for a synonym will iterate in the same group multiple times, causing a performance hit (MOD-6490)
  * [#4310](https://github.com/RediSearch/RediSearch/pull/4310) Memory tracking on cluster setups causing high memory usage and potentially Out-of-Memory (MOD-6123, MOD-5639)

* **Probabilistic data structures**:
  * [#753](https://github.com/RedisBloom/RedisBloom/issues/753) Potential crash on `CMS.MERGE` when using invalid arguments

**Redis version**
* [Redis 6.2.14](https://github.com/redis/redis/releases/tag/6.2.14)

**Module versions**	
* __[RediSearch 2.6.16](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.16)__
* __[RedisJSON 2.4.8](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.8)__
* __[RedisGraph 2.10.12](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.15)__
* __[RedisTimeSeries 1.8.12](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.12)__
* __[RedisBloom 2.4.9](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.9)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.1.1 or greater](https://github.com/redis/jedis/releases/tag/v5.1.1)
  * [redis-om-spring 0.8.8 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.8)
* Python
  * [redis-py 5.0.2 or greater](https://github.com/redis/redis-py/releases/tag/v5.0.2)
  * [redis-om-python 0.2.1 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.2.1)
* NodeJS
  * [node-redis 4.6.13 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.13)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.6.1 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.6.1)
  * [NRedisStack 0.11.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.11.0)
* Go
  * [go-redis 9.5.1 or greater](https://github.com/redis/go-redis/releases/tag/v9.5.1)
  * [rueidis 1.0.31 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.31)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.44](https://github.com/RedisInsight/RedisInsight/releases/tag/2.44.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Downloads

* macOS: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.catalina.x86_64.zip), [arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.monterey.arm64.zip)
* AppImage: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13-x86_64.AppImage)
* Ubuntu: [Bionic x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.bionic.x86_64.tar.gz), [Bionic arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.bionic.arm64.tar.gz), [Focal x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.focal.x86_64.tar.gz), [Focal arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.focal.arm64.tar.gz), [Snap x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.x86_64.snap), [Snap arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.arm64.snap), [Jammy x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.jammy.x86_64.tar.gz), [Jammy arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.jammy.arm64.tar.gz)
* Debian: [Bullseye x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.bullseye.x86_64.tar.gz)
* RHEL 7/CentOS Linux 7: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.rhel7.x86_64.tar.gz)
* RHEL 8/CentOS Linux 8: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v13.rhel8.x86_64.tar.gz)
* Redis Stack on [Dockerhub](https://hub.docker.com/u/redis): [x86_64 and arm64](https://hub.docker.com/r/redis/redis-stack)
* Redis Stack server on [Dockerhub](https://hub.docker.com/u/redis): [x86_64 and arm64](https://hub.docker.com/r/redis/redis-stack-server)

## Redis Stack Server 6.2.6-v12 (January 2024)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `HIGH`: There is a critical bug fixed in the probabilistic data structures that may affect a subset of users. Upgrade!

### Headlines:
This maintenance release contains the new version of **probabilistic** data structures with a critical bug fix, the new version of  **JSON** data structure with added support for CBL-Mariner 2, and a fix to add keyspace notifications for `JSON.TOGGLE`. It also contains the latest version of **RedisInsight**.

### Details:

 **Improvements**
* **JSON**:
  * [#1149](https://github.com/RedisJSON/RedisJSON/pull/1149) Added support for CBL-Mariner 2

**Bug Fixes**
* **JSON**:
  * [#1025](https://github.com/RedisJSON/RedisJSON/pull/1025) `JSON.TOGGLE` - missing keyspace notification

* **Probabilistic data structures**:
  * [#727](https://github.com/RedisBloom/RedisBloom/pull/727) Potential crash on `CF.LOADCHUNK` (MOD-6344) - Additional fixes

**Redis version**
* [Redis 6.2.14](https://github.com/redis/redis/releases/tag/6.2.14)

**Module versions**	
* __[RediSearch 2.6.15](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.15)__
* __[RedisJSON 2.4.8](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.8)__
* __[RedisGraph 2.10.12](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.12)__
* __[RedisTimeSeries 1.8.12](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.12)__
* __[RedisBloom 2.4.8](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.8)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.1.0 or greater](https://github.com/redis/jedis/releases/tag/v5.1.0)
  * [redis-om-spring 0.8.8 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.8)
* Python
  * [redis-py 5.0.1 or greater](https://github.com/redis/redis-py/releases/tag/v5.0.1)
  * [redis-om-python 0.2.1 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.2.1)
* NodeJS
  * [node-redis 4.6.12 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.12)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.6.1 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.6.1)
  * [NRedisStack 0.11.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.11.0)
* Go
  * [go-redis 9.4.0 or greater](https://github.com/redis/go-redis/releases/tag/v9.4.0)
  * [rueidis 1.0.27 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.27)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.40](https://github.com/RedisInsight/RedisInsight/releases/tag/2.40.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v11 (January 2024)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `SECURITY`:  there are security fixes in the release.

### Headlines:
This version contains the latest **time series data** structure with a security fix to not expose internal commands, a fix for potential crashes when using an invalid argument value, and support for CBL-Mariner 2. The new Redis Stack version introduces security fixes for **probabilistic data structures** to avoid potential crashes. It also includes the latest **search and query** capability with several bug fixes and improvements. This version contains the latest version of **RedisInsight**.

### Details:

 **Security and privacy**
* **Time series**:
  * [#1506](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1506)​​ Don’t expose internal commands (MOD-5643)

* **Probabilistic data structures**:
  * [#721](https://github.com/RedisBloom/RedisBloom/issues/721) Potential crash on `CF.RESERVE` (MOD-6343)
  * [#722](https://github.com/RedisBloom/RedisBloom/issues/722) Potential crash on `CF.LOADCHUNK` (MOD-6344)

 **Improvements**
* **Search and query**:
  * [#4176](https://github.com/RediSearch/RediSearch/pull/4176) Initialization of the maximum numeric value range leading to a better balance of the index leaf splitting (MOD-6232)
  * [#4123](https://github.com/RediSearch/RediSearch/pull/4123) Possibly problematic index name alias check-in command multiplexing (MOD-5945)
  * [#4195](https://github.com/RediSearch/RediSearch/pull/4195) Query optimisation when predicate contains multiple `INTERSECTION` (AND) of `UNION` (OR) (MOD-5910)

* **Time series**:
  * [#1516](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1516) Added support for CBL-Mariner 2

**Bug Fixes**
* **Search and query**:
  * [#4244](https://github.com/RediSearch/RediSearch/pull/4244), [#4255](https://github.com/RediSearch/RediSearch/pull/4255) Profiling `FT.AGGREGATE` using the `WITHCURSOR` flag cause a crash due to timeout (MOD-5512)
  * [#4238](https://github.com/RediSearch/RediSearch/pull/4238) Memory excessively growing on databases caused by unbalanced nodes on inverted index trie (MOD-5880, MOD-5952, MOD-6003)
  * [#3995](https://github.com/RediSearch/RediSearch/pull/3995) `FT.CURSOR READ` with geo queries causing a crash when data is updated between the cursor reads (MOD-5646)
  * [#4155](https://github.com/RediSearch/RediSearch/pull/4155) `FT.SEARCH` not responding when using TLS encryption on Amazon Linux 2 (MOD-6012)

* **Time series**:
  * [#1494](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1494) Potential crash when using an invalid argument value

**Redis version**
* [Redis 6.2.14](https://github.com/redis/redis/releases/tag/6.2.14)

**Module versions**	
* __[RediSearch 2.6.15](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.15)__
* __[RedisJSON 2.4.7](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.7)__
* __[RedisGraph 2.10.12](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.12)__
* __[RedisTimeSeries 1.8.12](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.12)__
* __[RedisBloom 2.4.7](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.7)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.1.0 or greater](https://github.com/redis/jedis/releases/tag/v5.1.0)
  * [redis-om-spring 0.8.7 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.7)
* Python
  * [redis-py 5.0.1 or greater](https://github.com/redis/redis-py/releases/tag/v5.0.1)
  * [redis-om-python 0.2.1 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.2.1)
* NodeJS
  * [node-redis 4.6.12 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.12)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.6.1 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.6.1)
  * [NRedisStack 0.11.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.11.0)
* Go
  * [go-redis 9.4.0 or greater](https://github.com/redis/go-redis/releases/tag/v9.4.0)
  * [rueidis 1.0.26 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.26)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.40](https://github.com/RedisInsight/RedisInsight/releases/tag/2.40.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v10 (November 2023)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `SECURITY`:  there are security fixes in the release.

### Headlines:
This version contains a security fix for the Redis server to avoid bypassing desired Unix socket permissions on startup. It also includes the latest Search and Query capability with a fix to limit the maximum phonetic length and several bug fixes. This version contains the latest version of RedisInsight.

### Details:

 **Security and privacy:**
* **Redis**:
  * (CVE-2023-45145) The wrong order of `listen(2)` and `chmod(2)` calls creates a race condition that can be used by another process to bypass desired Unix socket permissions on startup.

* **Search and Query**:
  * [#3844](https://github.com/RediSearch/RediSearch/pull/3844) Limits maximum phonetic length avoiding to be exploited (MOD 5767)

**Bug Fixes**
* **Search and Query**:
  * [#3771](https://github.com/RediSearch/RediSearch/pull/3771) Broken lower and upper `APPLY` functions in `FT.AGGREGATE` on `DIALECT 3` (MOD-5041)
  * [#3910](https://github.com/RediSearch/RediSearch/pull/3910) Heavy document updates causing memory growth once memory blocks weren't properly released (MOD-5181)
  * [#3853](https://github.com/RediSearch/RediSearch/pull/3853) Queries with `WITHCURSOR` making memory growth since `CURSOR` wasn't invalidated in the shards (MOD-5580)
  * [#3752](https://github.com/RediSearch/RediSearch/pull/3752) Setting low `MAXIDLE` parameter value in `FT.AGGREGATE` causes a crash (MOD-5608)
  * [#3823](https://github.com/RediSearch/RediSearch/pull/3823) `APPLY` or `FILTER` expression causing a leak (MOD-5751)
  * [#3837](https://github.com/RediSearch/RediSearch/pull/3837) Connection using TLS fails on Redis (MOD-5768)
  * [#3856](https://github.com/RediSearch/RediSearch/pull/3856) Adding new nodes to OSS cluster causing a crash (MOD-5778)
  * [#3854](https://github.com/RediSearch/RediSearch/pull/3854) Vector range query could cause Out-of-Memory due a memory corruption (MOD-5791)
  * [#3892](https://github.com/RediSearch/RediSearch/pull/3892) After cleaning the index the GC could cause corruption on unique values (MOD-5815)



**Redis version**
* [Redis 6.2.14](https://github.com/redis/redis/releases/tag/6.2.14)

**Module versions**	
* __[RediSearch 2.6.14](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.14)__
* __[RedisJSON 2.4.7](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.7)__
* __[RedisGraph 2.10.12](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.12)__
* __[RedisTimeSeries 1.8.11](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.11)__
* __[RedisBloom 2.4.5](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.5)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.0.2 or greater](https://github.com/redis/jedis/releases/tag/v5.0.2)
  * [redis-om-spring 0.8.7 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.7)
* Python
  * [redis-py 5.0.1 or greater](https://github.com/redis/redis-py/releases/tag/v5.0.1)
  * [redis-om-python 0.2.1 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.2.1)
* NodeJS
  * [node-redis 4.6.10 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.10)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.5.4 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.5.4)
  * [NRedisStack 0.10.1 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.10.1)
* Go
  * [go-redis 9.3.0 or greater](https://github.com/redis/go-redis/releases/tag/v9.3.0)
  * [rueidis 1.0.22 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.22)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.36](https://github.com/RedisInsight/RedisInsight/releases/tag/2.36.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Downloads

* macOS: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.catalina.x86_64.zip), [arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.monterey.arm64.zip)
* AppImage: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10-x86_64.AppImage)
* Ubuntu: [Bionic x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.bionic.x86_64.tar.gz), [Bionic arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.bionic.arm64.tar.gz), [Focal x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.focal.x86_64.tar.gz), [Focal arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.focal.arm64.tar.gz), [Snap x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.x86_64.snap), [Snap arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.arm64.snap), [Jammy x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.jammy.x86_64.tar.gz), [Jammy arm64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.jammy.arm64.tar.gz)
* Debian: [Bullseye x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.bullseye.x86_64.tar.gz)
* RHEL 7/CentOS Linux 7: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.rhel7.x86_64.tar.gz)
* RHEL 8/CentOS Linux 8: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-6.2.6-v10.rhel8.x86_64.tar.gz)
* Redis Stack on [Dockerhub](https://hub.docker.com/u/redis): [x86_64 and arm64](https://hub.docker.com/r/redis/redis-stack)
* Redis Stack server on [Dockerhub](https://hub.docker.com/u/redis): [x86_64 and arm64](https://hub.docker.com/r/redis/redis-stack-server)

## Redis Stack Server 6.2.6-v9 (July 2023)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

### Headlines:
This version contains the latest Search and Query capability v. 2.6.12, time series v. 1.8.11, and graph v. 2.10.12 with fixes and improvements. It also includes the latest version of RedisInsight.

### Details:

 **Improvements**
* **Search and Query**:
  * [#3628](https://github.com/RediSearch/RediSearch/pull/3628) Background indexing scanning performance
  * [#3259](https://github.com/RediSearch/RediSearch/pull/3259) Allow alias name beginning with `as`
  * [#3641](https://github.com/RediSearch/RediSearch/pull/3641) Indexing sanitizing trigger in heavily data updates scenario

* **Time series**:
  * [#1476](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1476) Significant performance improvement when using multiple label filters (`TS.MGET`, `TS.MRANGE`, `TS.MREVRANGE`, and `TS.QUERYINDEX`)

**Bug Fixes**
* **Search and Query**:
  * [#3557](https://github.com/RediSearch/RediSearch/pull/3557) `TIMEOUT` configuration on `FT.AGGREGATE` query being ignored
  * [#3552](https://github.com/RediSearch/RediSearch/pull/3552) `FT.CURSOR READ` on `JSON` numeric queries not returning results
  * [#3606](https://github.com/RediSearch/RediSearch/pull/3606) Update numeric inverted index `numEntries` avoiding excessive memory consumption
  * [#3597](https://github.com/RediSearch/RediSearch/pull/3597) Duplicating alias as output name on `FT.AGGREGATE` reducer (`REDUCE` argument) isn't return results
  * [#3654](https://github.com/RediSearch/RediSearch/pull/3654) Added check for @ prefix on `GROUPBY` fields returnig an error instead of wrong results

* **Time series**:
  * [#1486](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1486) When using `LATEST`, results may contain samples earlier than `fromTimestamp` (`TS.RANGE`, `TS.REVRANGE`, `TS.MRANGE`, and `TS.MREVRANGE`)
  * [#1471](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1471) Potential crash on `TS.MRANGE` when aggregating millions of time series
  * [#1469](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1469) Potential memory leak in `TS.MRANGE` after eviction

* **Graph**:
  * [#3129](https://github.com/RedisGraph/RedisGraph/pull/3129) Crash on certain queries (`INDEX SCAN` followed by `DEL` followed by `SET`)

**Redis version**
* [Redis 6.2.13](https://github.com/redis/redis/blob/6.2.13/00-RELEASENOTES)

**Module versions**	
* __[RediSearch 2.6.12](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.12)__
* __[RedisJSON 2.4.7](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.7)__
* __[RedisGraph 2.10.12](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.12)__
* __[RedisTimeSeries 1.8.11](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.11)__
* __[RedisBloom 2.4.5](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.5)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.4.3 or greater ](https://github.com/redis/jedis/releases/tag/v4.4.3)
  * [redis-om-spring 0.8.4 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.4)
* Python
  * [redis-py 4.6.0 or greater ](https://github.com/redis/redis-py/releases/tag/v4.6.0)
  * [redis-om-python 0.1.2 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.1.2)
* NodeJS
  * [node-redis 4.6.7  or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.7)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.5.2 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.5.2)
  * [NRedisStack 0.8.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.8.0)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.28](https://github.com/RedisInsight/RedisInsight/releases/tag/2.28.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v8 (July 2023)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `SECURITY`:  there are security fixes in the release.

### Headlines:
This version contains security improvements for the Redis server.

### Details:

 **Improvements**
* **Redis**:
  * ([CVE-2022-24834](https://github.com/redis/redis/security/advisories/GHSA-p8x2-9v9q-c838)) A specially crafted Lua script executing in Redis can trigger
a heap overflow in the cjson and cmsgpack libraries, and result in heap
corruption and potentially remote code execution. The problem exists in all
versions of Redis with Lua scripting support, starting from 2.6, and affects
only authenticated and authorized users.
  * ([CVE-2023-36824](https://github.com/redis/redis/security/advisories/GHSA-4cfx-h9gq-xpx3)) Extracting key names from a command and a list of arguments
may, in some cases, trigger a heap overflow and result in reading random heap
memory, heap corruption and potentially remote code execution. Specifically:
using COMMAND GETKEYS* and validation of key names in ACL rules.

**Bug Fixes**
* **Redis**:
  * [#12276](https://github.com/redis/redis/pull/12276) Re-enable downscale rehashing while there is a fork child

**Redis version**
* [Redis 6.2.13](https://github.com/redis/redis/blob/6.2.13/00-RELEASENOTES)

**Module versions**
* __[RediSearch 2.6.9](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.9)__
* __[RedisJSON 2.4.7](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.7)__
* __[RedisGraph 2.10.10](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.10)__
* __[RedisTimeSeries 1.8.10](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.10)__
* __[RedisBloom 2.4.5](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.5)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.3.1 or greater ](https://github.com/redis/jedis/releases/tag/v4.3.1)
  * [redis-om-spring](https://github.com/redis/redis-om-spring)
* Python
  * [redis-py 4.5.4 or greater ](https://github.com/redis/redis-py/releases/tag/v4.5.4)
  * [redis-om-python](https://github.com/redis/redis-om-python)
* NodeJS
  * [node-redis 4.6.5  or greater](https://www.npmjs.com/package/redis)
  * [redis-om-node](https://github.com/redis/redis-om-node)
* .NET
  * [redis-om-dotnet](https://github.com/redis/redis-om-dotnet)
  * [NRedisStack](https://github.com/redis/NRedisStack)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight](https://github.com/RedisInsight/RedisInsight/releases/).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v7 (April 2023)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `SECURITY`:  there are security fixes in the release.

### Headlines:
This version contains the latest RediSearch 2.6.9, RedisJSON 2.4.7, RedisGraph 2.10.10, RedisTimeSeries 1.8.10, and RedisBloom 2.4.5, RedisInsight 2.22 and new Redis server 6.2.12 with fixes to security issues.

### Details:

**Improvements**:
* Redis [#12057](https://github.com/redis/redis/pull/12057) Authenticated users can use the [HINCRBYFLOAT](https://redis.io/commands/hincrbyfloat/) command to create an invalid hash field that will crash Redis on access
* RediSearch [#3430](https://github.com/RediSearch/RediSearch/pull/3430) Improve `min-max heap` structure for better readability and performance
* RediSearch [#3450](https://github.com/RediSearch/RediSearch/pull/3450) Display `NOHL` option in `FT.INFO` command
* RediSearch [#3534](https://github.com/RediSearch/RediSearch/pull/3534) Vector Similarity 0.6.1: Improve multi-value index deletion logic [(#346)](https://github.com/RedisAI/VectorSimilarity/pull/346)

**Bug Fixes**
* RediSearch [#3468](https://github.com/RediSearch/RediSearch/pull/3468) KNN searching for 0 vectors with a filter resulted in crash
* RediSearch [#3499](https://github.com/RediSearch/RediSearch/pull/3499) `MAXSEARCHRESULTS` set to `0` causing `FT.SEARCH` crash
* RediSearch [#3494](https://github.com/RediSearch/RediSearch/pull/3494) Removing `MAXSEARCHRESULTS`limit causes crash on `FT.AGGREGATE`
* RediSearch [#3504](https://github.com/RediSearch/RediSearch/pull/3504) Uninitialised vector similarity query parameter bug
* RedisJSON [#947](https://github.com/RedisJSON/RedisJSON/issues/947) Using array slice operator (`[start:end:step]`) with step `0` causes crash
* RedisGraph [#3038](https://github.com/RedisGraph/RedisGraph/issues/3038) Potential crash when a query with a `UNION` clause sets or modifies an indexed property
* RedisGraph [#2631](https://github.com/RedisGraph/RedisGraph/issues/2631), [#2968](https://github.com/RedisGraph/RedisGraph/issues/2968) Potential crash on certain `MATCH` clauses where label filters are used
* RedisGraph [#2957](https://github.com/RedisGraph/RedisGraph/issues/2957) Label filters in expressions such as `WITH n MATCH (n:X)` are ignored
* RedisGraph [#2931](https://github.com/RedisGraph/RedisGraph/issues/2931), [#3027](https://github.com/RedisGraph/RedisGraph/issues/3027) Wrong overflow error message
* RedisTimeSeries [#1455](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1455) [TS.ADD](https://redis.io/commands/ts.add/) - optional arguments are not replicated

**Redis version**
* [Redis 6.2.12](https://github.com/redis/redis/blob/6.2.12/00-RELEASENOTES)

**Module versions**
* __[RediSearch 2.6.9](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.9)__
* __[RedisJSON 2.4.7](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.7)__
* __[RedisGraph 2.10.10](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.10)__
* __[RedisTimeSeries 1.8.10](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.10)__
* __[RedisBloom 2.4.5](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.5)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.3.1 or greater ](https://github.com/redis/jedis/releases/tag/v4.3.1)
  * [redis-om-spring](https://github.com/redis/redis-om-spring)
* Python
  * [redis-py 4.5.4 or greater ](https://github.com/redis/redis-py/releases/tag/v4.5.4)
  * [redis-om-python](https://github.com/redis/redis-om-python)
* NodeJS
  * [node-redis 4.6.5  or greater](https://www.npmjs.com/package/redis)
  * [redis-om-node](https://github.com/redis/redis-om-node)
* .NET
  * [redis-om-dotnet](https://github.com/redis/redis-om-dotnet)
  * [NRedisStack](https://github.com/redis/NRedisStack)

Compatible with the latest [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.22](https://github.com/RedisInsight/RedisInsight/releases/tag/2.22.1).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v6 (March 2023)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

### Headlines:
This version contains the latest RedisTimeSeries 1.8.9 with bugs fixed.

### Details:

**Bug Fixes**
* RedisTimeSeries [#1421](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1421) Potential crash after deleting from a time series with an `AVG` compaction
* RedisTimeSeries [#1422](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1422) Incorrectly return an error when deleting from a time series with a compaction and with no expiry


**Redis version**
* [Redis 6.2.11](https://github.com/redis/redis/blob/6.2.11/00-RELEASENOTES)


**Module versions**
* __[RediSearch 2.6.6](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.6)__
* __[RedisJSON 2.4.6](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.6)__
* __[RedisGraph 2.10.9](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.9)__
* __[RedisTimeSeries 1.8.9](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.9)__
* __[RedisBloom 2.4.5](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.5)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.3.1 or greater ](https://github.com/redis/jedis/releases/tag/v4.3.1)
  * [redis-om-spring](https://github.com/redis/redis-om-spring)
* Python
  * [redis-py 4.4.0 or greater ](https://github.com/redis/redis-py/releases/tag/v4.4.0)
  * [redis-om-python](https://github.com/redis/redis-om-python)
* NodeJS
  * [node-redis 4.5.0  or greater](https://www.npmjs.com/package/redis)
  * [redis-om-node](https://github.com/redis/redis-om-node)
* .NET
  * [redis-om-dotnet](https://github.com/redis/redis-om-dotnet)
  * [NRedisStack](https://github.com/redis/NRedisStack)

Compatible with the latest [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.20](https://github.com/RedisInsight/RedisInsight/releases/tag/2.20.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v5 (March 2023)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

### Headlines:
This version contains the latest RediSearch 2.6.6, RedisJSON 2.4.6, RedisGraph 2.10.9, RedisTimeSeries 1.8.8, RedisBloom 2.4.5, and RedisInsight 2.20 with improvements and bugs fixed.

### Details:
**Improvements**
* RediSearch [ #3397](https://github.com/RediSearch/RediSearch/pull/3397) Improve the Vecsim initial capacity default value
* RediSearch and RedisJSON [#3418](https://github.com/RediSearch/RediSearch/pull/3418) Add support to OS Amazon Linux 2
* RediSearch and RedisJSON - Add full OS list on RAMP file
* RedisBloom - Internal changes for supporting future Redis Enterprise releases

**Bug Fixes**
* RediSearch [#3403](https://github.com/RediSearch/RediSearch/pull/3403) Fix suffix and prefix matching when using `CASESENSITIVE` flag
* RedisJSON [#912](https://github.com/RedisJSON/RedisJSON/pull/912) Fix actual memory usage calculation
* RedisGraph [#2880](https://github.com/RedisGraph/RedisGraph/issues/2880) Potential crash when using `WITH *` expressions
* RedisGraph [#2917](https://github.com/RedisGraph/RedisGraph/issues/2917) Potential crash when using `CASE` expressions
* RedisGraph [#2836](https://github.com/RedisGraph/RedisGraph/issues/2836) Potential crash on `*0` variable-length path
* RedisGraph [#2916](https://github.com/RedisGraph/RedisGraph/issues/2916) Potential crash when executing concurrent queries that utilize full-text indices
* RedisTimeSeries [#1290](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1290) Potential crash when using `FILTER_BY_TS`
* RedisTimeSeries [#1397](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1397) Memory leak when trying to create an already existing key

**Redis version**
* [Redis 6.2.11](https://github.com/redis/redis/blob/6.2.11/00-RELEASENOTES)

**Module versions**
* __[RediSearch 2.6.6](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.6)__
* __[RedisJSON 2.4.6](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.6)__
* __[RedisGraph 2.10.9](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.9)__
* __[RedisTimeSeries 1.8.8](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.8)__
* __[RedisBloom 2.4.5](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.5)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.3.1 or greater ](https://github.com/redis/jedis/releases/tag/v4.3.1)
  * [redis-om-spring](https://github.com/redis/redis-om-spring)
* Python
  * [redis-py 4.4.0 or greater ](https://github.com/redis/redis-py/releases/tag/v4.4.0)
  * [redis-om-python](https://github.com/redis/redis-om-python)
* NodeJS
  * [node-redis 4.5.0  or greater](https://www.npmjs.com/package/redis)
  * [redis-om-node](https://github.com/redis/redis-om-node)
* .NET
  * [redis-om-dotnet](https://github.com/redis/redis-om-dotnet)
  * [NRedisStack](https://github.com/redis/NRedisStack)

Compatible with the latest [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.20](https://github.com/RedisInsight/RedisInsight/releases/tag/2.20.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v4 (February 2023)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

### Headlines:
This version contains the latest RedisJSON 2.4.5 with support for Ubuntu 20 - Focal Fossa OS.

**Module versions**
* __[RediSearch 2.6.5](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.5)__
* __[RedisJSON 2.4.5](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.5)__
* __[RedisGraph 2.10.8](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.8)__
* __[RedisTimeSeries 1.8.5](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.5)__
* __[RedisBloom 2.4.4](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.4)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.3.1 or greater ](https://github.com/redis/jedis/releases/tag/v4.3.1)
  * [redis-om-spring](https://github.com/redis/redis-om-spring)
* Python
  * [redis-py 4.4.0 or greater ](https://github.com/redis/redis-py/releases/tag/v4.4.0)
  * [redis-om-python](https://github.com/redis/redis-om-python)
* NodeJS
  * [node-redis 4.5.0  or greater](https://www.npmjs.com/package/redis)
  * [redis-om-node](https://github.com/redis/redis-om-node)
* .NET
  * [redis-om-dotnet](https://github.com/redis/redis-om-dotnet)
  * [NRedisStack](https://github.com/redis/NRedisStack)

Compatible with the latest [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.18](https://github.com/RedisInsight/RedisInsight/releases/tag/2.18.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v3 (February 2023)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

### Headlines:
This version contains the latest RediSearch 2.6.5, RedisJSON 2.4.4, RedisGraph 2.10.8, RedisBloom 2.4.4, and RedisInsight 2.18 with new features and bugs fixed.

### Details:
**Improvements**
* RediSearch [#3361](https://github.com/RediSearch/RediSearch/pull/3361) Enable the use of IPv6 for all cluster and module communication
* RedisJSON [#813](https://github.com/RedisJSON/RedisJSON/pull/813) - Improve the errors messages in modules [#725](https://github.com/RedisJSON/RedisJSON/issues/725)
* RedisJSON [#918](https://github.com/RedisJSON/RedisJSON/pull/918) - Add IPv6 on the capability list
* RedisGraph [#2790](https://github.com/RedisGraph/RedisGraph/pull/2790) Improved performance by disabling SuiteSparse:GraphBLAS' global free pool
* RedisGraph [#2758](https://github.com/RedisGraph/RedisGraph/pull/2758) Improved edge deletion performance
* RedisGraph [#2781](https://github.com/RedisGraph/RedisGraph/issues/2781) `indegree` and `outdegree` now also accept an argument which is a list of labels
* RedisBloom [#389](https://github.com/RedisBloom/RedisBloom/issues/389) Introduce `BF.CARD` to retrieve the cardinality of a Bloom filter or 0 when such key does not exist

**Bug Fixes**
* RediSearch [#3354](https://github.com/RediSearch/RediSearch/pull/3354) Library update preventing a crash during cluster failover
* RediSearch [#3357](https://github.com/RediSearch/RediSearch/pull/3357) Handling division by zero in expressions preventing nodes to restart
* RediSearch [#3332](https://github.com/RediSearch/RediSearch/pull/3332) Fix wildcards * queries on `DIALECT 2` and `DIALECT 3`
* RedisJSON [#919](https://github.com/RedisJSON/RedisJSON/pull/919) Possible failure loading `.rdb` files
* RedisGraph [#2777](https://github.com/RedisGraph/RedisGraph/issues/2777), [#2841](https://github.com/RedisGraph/RedisGraph/issues/2841) Potential crash when sending queries from multiple connections and timeout is not 0
* RedisGraph [#2844](https://github.com/RedisGraph/RedisGraph/issues/2844) Potential partial results when same parametrized query is running from multiple connections
* RedisGraph [#2739](https://github.com/RedisGraph/RedisGraph/issues/2739), [#2774](https://github.com/RedisGraph/RedisGraph/issues/2774) Paths with exact variable length >1 are not matched
* RedisGraph [#2794](https://github.com/RedisGraph/RedisGraph/issues/2794) `toInteger` and `toIntegerOrNull` don't convert Booleans
* RedisGraph [#2798](https://github.com/RedisGraph/RedisGraph/issues/2798) `right` and `left` should reply with an error when `length` is null
* RedisGraph [#2809](https://github.com/RedisGraph/RedisGraph/issues/2809) `TIMEOUT_MAX` configuration parameter in not enforced when `TIMEOUT_DEFAULT` is 0
* RedisGraph [#2780](https://github.com/RedisGraph/RedisGraph/issues/2780) `indegree` and `outdegree` - relationships are counted more than once when same relationship type is supplied more than once
* RedisBloom [#609](https://github.com/RedisBloom/RedisBloom/issues/609) `CF.INFO` - incorrect information for large filters

**Redis version**
* [Redis 6.2.10](https://github.com/redis/redis/blob/6.2.10/00-RELEASENOTES)

**Module versions**
* __[RediSearch 2.6.5](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.5)__
* __[RedisJSON 2.4.4](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.4)__
* __[RedisGraph 2.10.8](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.8)__
* __[RedisTimeSeries 1.8.5](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.5)__
* __[RedisBloom 2.4.4](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.4)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.3.1 or greater ](https://github.com/redis/jedis/releases/tag/v4.3.1)
  * [redis-om-spring](https://github.com/redis/redis-om-spring)
* Python
  * [redis-py 4.4.0 or greater ](https://github.com/redis/redis-py/releases/tag/v4.4.0)
  * [redis-om-python](https://github.com/redis/redis-om-python)
* NodeJS
  * [node-redis 4.5.0  or greater](https://www.npmjs.com/package/redis)
  * [redis-om-node](https://github.com/redis/redis-om-node)
* .NET
  * [nredisstack 0.5.0  or greater](https://www.nuget.org/packages/nredisstack/)
  * [redis-om-dotnet](https://github.com/redis/redis-om-dotnet)

Compatible with the latest [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for is bundled with [RedisInsight 2.18](https://github.com/RedisInsight/RedisInsight/releases/tag/2.18.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v2  (January 2023)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

### Headlines:
This version contains the latest RedisInsight 2.16 and RedisTimeSeries 1.8.5 with bugs fixed.

### Details:
**Bug Fixes**
* RedisTimeSeries [#1388](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1388) Potential crash when upgrading from v1.6 to 1.8 if there are compactions with `min` or `max` aggregation
 
**Redis version** (no changes)
* [Redis 6.2.8](https://github.com/redis/redis/blob/6.2.7/00-RELEASENOTES)
 
**Module versions**
* __[RediSearch 2.6.4](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.4)__
* __[RedisJSON 2.4.3](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.3)__
* __[RedisGraph 2.10.5](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.5)__
* __[RedisTimeSeries 1.8.5](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.5)__
* __[RedisBloom 2.4.3](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.3)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.3.1 or greater ](https://github.com/redis/jedis/releases/tag/v4.3.1)
  * [redis-om-spring](https://github.com/redis/redis-om-spring)
* Python
  * [redis-py 4.4.0 or greater ](https://github.com/redis/redis-py/releases/tag/v4.4.0)
  * [redis-om-python](https://github.com/redis/redis-om-python)
* NodeJS
  * [node-redis 4.5.0  or greater](https://www.npmjs.com/package/redis)
  * [redis-om-node](https://github.com/redis/redis-om-node)
* .NET
  * [redis-om-dotnet](https://github.com/redis/redis-om-dotnet)

Compatible with the latest [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.16](https://github.com/RedisInsight/RedisInsight/releases/tag/2.16.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack 6.2.6-v1 (January 2023)

This is a maintenance release for Redis Stack Server 6.2.6

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

### Headlines:
This version contains the latest RediSearch 2.6.4, RedisJSON 2.4.3, RedisGraph 2.10.5, and RedisTimeSeries 1.8.4 with new features and bugs fixed.

### Details:
**Improvements**
* RediSearch [#3256](https://github.com/RediSearch/RediSearch/pull/3256) Support IPv6 on cluster set command
* RediSearch [#3194](https://github.com/RediSearch/RediSearch/pull/3194) Add the query dialects that are in use to `FT.INFO` and `INFO MODULE` commands
* RediSearch [#3258](https://github.com/RediSearch/RediSearch/pull/3258) Add the module version and Redis version to `INFO MODULE`
* RedisJSON [#892](https://github.com/RedisJSON/RedisJSON/pull/892) Allow `JSON.ARRINDEX` with none scalar values
* RedisGraph [#2757](https://github.com/RedisGraph/RedisGraph/pull/2757) Improved performance of `indegree` and `outdegree`
* RedisGraph [#2681](https://github.com/RedisGraph/RedisGraph/issues/2681) Fixed some error messages
* RedisGraph [#2740](https://github.com/RedisGraph/RedisGraph/issues/2740) Don’t show partial results for timed-out [GRAPH.PROFILE](https://redis.io/commands/graph.profile/)
* RedisTimeSeries [#1215](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1215) OSS cluster: Support TLS and IPv6; Introduce new configuration parameter: [OSS_GLOBAL_PASSWORD](https://redis.io/docs/stack/timeseries/configuration/#oss_global_password)
 
**Bug Fixes**
* RediSearch [#3289](https://github.com/RediSearch/RediSearch/pull/3289) Potential crash when querying multiple fields
* RediSearch [#3279](https://github.com/RediSearch/RediSearch/pull/3279) Potential crash when querying using wildcard * on TAG field
* RedisJSON [#890](https://github.com/RedisJSON/RedisJSON/pull/890) JSONPath ignores any filter condition beyond the second
* RedisGraph [#2754](https://github.com/RedisGraph/RedisGraph/pull/2754) Partial sync may hang
* RedisTimeSeries [#1360](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1360) Potential crash when upgrading from v1.6 to 1.8 if there are compactions with `min` or `min` aggregation
* RedisTimeSeries [#1370](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1370) Potential crash when using [TS.REVRANGE](https://redis.io/commands/ts.revrange/) or [TS.MREVRANGE](https://redis.io/commands/ts.mrevrange/) with aggregation
* RedisTimeSeries [#1347](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1347) When adding samples with [TS.ADD](https://redis.io/commands/ts.add/) or [TS.MADD](https://redis.io/commands/ts.madd/) using * as timestamp, the timestamp could differ between master and replica shards
 
**Redis version** (no changes)
* [Redis 6.2.8](https://github.com/redis/redis/blob/6.2.8/00-RELEASENOTES)
 
**Module versions**
* __[RediSearch 2.6.4](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.4)__
* __[RedisJSON 2.4.3](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.3)__
* __[RedisGraph 2.10.5](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.5)__
* __[RedisTimeSeries 1.8.4](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.4)__
* __[RedisBloom 2.4.3 (v2.4.3)](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.3)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.3.1 or greater ](https://github.com/redis/jedis/releases/tag/v4.3.1)
  * [redis-om-spring](https://github.com/redis/redis-om-spring)
* Python
  * [redis-py 4.4.0 or greater ](https://github.com/redis/redis-py/releases/tag/v4.4.0)
  * [redis-om-python](https://github.com/redis/redis-om-python)
* NodeJS
  * [node-redis 4.5.0  or greater](https://www.npmjs.com/package/redis)
  * [redis-om-node](https://github.com/redis/redis-om-node)
* .NET
  * [redis-om-dotnet](https://github.com/redis/redis-om-dotnet)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.14](https://github.com/RedisInsight/RedisInsight/releases/tag/2.14.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-v0 (December 2022)

This is a GA release of Redis Stack version 6.2.6

### Headlines:
* Query & Search:
  - multi-value index and query for: text, tag, numeric, geo and vector!
  - suffix search `*vatore` and wildcard search `ant?rez`
  - support for FP64 vectors and range queries from a given vector
* New faster JSONPath parser
* New probabilistic data structure: t-digest
* New path-finding algorithms `algo.SPpaths` and `algo.SSpaths` for Graph
* Support for gap filling for Time series

### Details:
**RediSearch**  introduces the following features:
* Support for [wildcard queries](https://redis.io/docs/stack/search/reference/query_syntax/#wildcard-matching)  for TEXT and TAG fields, where
  - `?` matches any single character
  - `*` matches zero or more characters
  - use `'` and `\` for escaping, other special characters are ignored
  - Optimized wildcard query support (i.e., suffix trie)
* Multi-value indexing and querying
  - Multi-value text search - perform full-text search on [array of string or on a JSONPath](https://redis.io/docs/stack/search/indexing_json/#index-json-arrays-as-tag) leading to multiple strings
  - Support for Geo, Vector, Numeric, Tag
  - Return JSON rather than scalars from multi-value attributes. This is enabled via Dialect 3 in order not to break existing applications.
  - Support indexing and querying of multi-value JSONPath attributes and/or arrays (requires JSON >2.4.1)
  - Support for `SORTABLE` fields on JSON in an implicit un-normalized form (UNF)
* Vector similarity 0.5.1:
  - Better space optimization selection
  - Aligning index capacity with block size
  - Support FLOAT64 as vector data type
  - Range query support
  - Support query attributes for vector queries

**RedisJSON**  introduces the following features:
* Add JSONPath filter the regexp match operator
* Support legacy JSONpath with dollar `$`
* A new JSONPath library which enhances the performance of parsing any JSONPath expression in RedisJSON.
* Floating point numbers which become round numbers due to some operation, for example by `JSON.NUMINCRBY`, will now return as a floating point with a trailing `.0`, e.g., instead of just `42`, now `42.0` will be returned.

**RedisBloom** introduces the following new features:
* A new sketch data structure: t-digest. t-digest is a sketch data structure for estimating quantiles based on a data stream or a large dataset of values. As for other sketch data structures, t-digest requires sublinear space and has controllable space-accuracy tradeoffs.

**RedisGraph** introduces the following new features:
* New path-finding algorithms: 
  - The `algo.SPpaths` procedure returns one, _n_, or all minimal-weight, optionally bounded-cost, optionally bounded-length paths between a given pair of nodes.
  - The `algo.SSpaths` procedure returns one, _n_, or all minimal-weight, optionally bounded-cost, optionally bounded-length paths from a given node.
* Introduce `SET` for adding node labels and `REMOVE` for removing node labels, node properties, and edge properties
* Support deleting paths with `DELETE`
* Introduce `toBoolean`, `toBooleanOrNull`, `toFloatOrNull`, `toIntegerOrNull`, `toStringOrNull`, `toBooleanList`, `toFloatList`, `toIntegerList`, `toStringList`, `properties`, `split`, `last`, `isEmpty`,`e`, `exp`, `log`, `log10`, `sin`, `cos`, `tan`, `cot`, `asin`, `acos`, `atan`, `atan2`, `degrees`, `radians`, `pi`, and `haversin` functions.
* Graph slow log can be reset with `GRAPH.SLOWLOG g RESET`
* Queries are now atomic (_Atomicity_ is the guarantee that each query either succeeds or fails with no side effects). Whenever a failure occurs, the query effect is rolled-back from an undo-log.
 
**RedisTimeSeries** introduces the following new features:
* Introduction of a new aggregator: `twa` (time-weighted average)
* Introduction of a new optional `EMPTY` flag to `TS.RANGE`, `TS.REVRANGE`, `TS.MRANGE`, and `TS.MREVRANGE` to retrieve aggregations for empty buckets as well.
* Gap-filling: Using `EMPTY` when the aggregator is `twa` allows estimating the average of a continuous signal even for empty buckets based on linear interpolation of previous and next samples. Using `EMPTY` when the aggregator is `last` would repeat the value of the previous sample when the bucket is empty.
* Introduction of a new optional `BUCKETTIMESTAMP` parameter to `TS.RANGE`, `TS.REVRANGE`, `TS.MRANGE`, and `TS.MREVRANGE`. It is now possible to report the start time, the end time, or the mid time for each bucket.
* Introduction of a new optional `alignTimestamp` parameter to `TS.CREATERULE` and to `COMPACTION_POLICY` configuration parameter.  It is now possible to define alignment for compaction rules, so one can, for example, aggregate daily events from 06:00 to 06:00 the next day.
* Introduction of additional reducer types in `GROUPBY` (`TS.MRANGE`, and `TS.MREVRANGE`): `avg`, `range`, `count`, `std.p`, `std.s`, `var.p`, and `var.s`
* Introduction of a new optional `LATEST` flag to `TS.GET`, `TS.MGET`, `TS.RANGE`, `TS.REVRANGE`, `TS.MRANGE`, and `TS.MREVRANGE`. it is possible to retrieve the latest (possibly partial) bucket as well.

**Bug Fixes** (since 6.2.6-RC1):
* RediSearch [#3098](https://github.com/RediSearch/RediSearch/pull/3098) Wrong return value in Geo query
* RediSearch [#3230](https://github.com/RediSearch/RediSearch/pull/3230) Precalculated number of replies must be equal to actual number
* RediSearch [#3171](https://github.com/RediSearch/RediSearch/pull/3171) Shard of DB with RedisSearch 2.4.8/11 got restarted by node_wd
* RediSearch [#3197](https://github.com/RediSearch/RediSearch/pull/3197) RediSearch 2.4.15 crashed
* RediSearch [#3197](https://github.com/RediSearch/RediSearch/pull/3197) failure to create temporary indices
* RedisJSON [#850](https://github.com/RedisJSON/RedisJSON/pull/850) Allow repetition of filter relation instead of optional
* RedisGraph [#2695](https://github.com/RedisGraph/RedisGraph/pull/2695) Potential crash on certain write queries
* RedisGraph [#2724](https://github.com/RedisGraph/RedisGraph/pull/2724) Potential crash when setting property values based on nonexistent properties
* RedisGraph [#2460](https://github.com/RedisGraph/RedisGraph/issues/2460), [#2637](https://github.com/RedisGraph/RedisGraph/issues/2637), [#2680](https://github.com/RedisGraph/RedisGraph/issues/2680) Crash on invalid queries
* RedisGraph [#2672](https://github.com/RedisGraph/RedisGraph/pull/2672) Wrong matching result on multiple labels
* RedisGraph [#2643](https://github.com/RedisGraph/RedisGraph/issues/2643) Duplicate reports when matching relationship type `:R|R`
* RedisGraph [#2687](https://github.com/RedisGraph/RedisGraph/issues/2687), [#2414](https://github.com/RedisGraph/RedisGraph/issues/2414) Error when `UNWIND`ing relationships
* RedisGraph [#2636](https://github.com/RedisGraph/RedisGraph/issues/2636) `MERGE` …` ON` ... - cannot remove property by setting it to null
* RedisGraph [#2710](https://github.com/RedisGraph/RedisGraph/pull/2710) Undo-log fix
* RedisGraph [#2435](https://github.com/RedisGraph/RedisGraph/pull/2435) Incorrect result when comparing a value to NaN
* RedisGraph [#2497](https://github.com/RedisGraph/RedisGraph/pull/2497) Incorrect result when comparing a value to null
* RedisGraph [#2676](https://github.com/RedisGraph/RedisGraph/issues/2676) `sqrt`, `log`, `log10` - incorrect result for negative values
* RedisGraph [#2213](https://github.com/RedisGraph/RedisGraph/issues/2213) Division and Modulo by zero - wrong behavior
* RedisTimeSeries [#1333](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1333) Potential crash when aggregating over a compaction with the `avg` aggregator and the `LATEST` flag
 
**Redis version** (no changes)
* [Redis 6.2.7](https://github.com/redis/redis/blob/6.2.7/00-RELEASENOTES)
 
**Module versions**
* __[RediSearch 2.6.3](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.3)__
* __[RedisJSON 2.4.2](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.2)__
* __[RedisGraph 2.10.4](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.4)__
* __[RedisTimeSeries 1.8.3](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.3)__
* __[RedisBloom 2.4.3](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.3)__

**Recommended Client Libraries  (no changes)**
* Java
  * [Jedis 4.2.0 or greater ](https://github.com/redis/jedis/releases/tag/v4.2.0)
  * [redis-om-spring](https://github.com/redis/redis-om-spring)
* Python
  * [redis-py 4.3.1 or greater ](https://github.com/redis/redis-py/releases/tag/v4.3.1)
  * [redis-om-python](https://github.com/redis/redis-om-python)
* NodeJS
  * [node-redis 4.4.0  or greater](https://www.npmjs.com/package/redis)
  * [redis-om-node](https://github.com/redis/redis-om-node)
* .NET
  * [redis-om-dotnet](https://github.com/redis/redis-om-dotnet)

Compatible with the latest [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.14](https://github.com/RedisInsight/RedisInsight/releases/tag/2.14.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack Server 6.2.6-RC1 (November 2022)

This is a Release Candidate of Redis Stack Server 6.2.6

### Headlines:
* Query & Search:
  - multi-value index and query for: text, tag, numeric, geo and vector!
  - affix search `*oolman` and wildcard search `y?fta*`
  - support for FP64 vectors
* New faster JSONPath parser
* New probabilistic data structure: t-digest
* New path-finding algorithms `algo.SPpaths` and `algo.SSpaths` for Graph
* Support for gap filling for Time series

### Details:
**RediSearch**  introduces the following features:
* the ability to search using wildcard queries for TEXT and TAG fields. This enables the frequently asked feature of affix search and includes optimized wildcard query support :
   - `?` matches any single character
   - `*` matches zero or more characters
   - use `’` and `\` for escaping, other special characters are ignored
* Multi-value indexing and querying of attributes for any attribute type ([Text](https://redis.io/docs/stack/search/indexing_json/#index-json-arrays-as-text), [Tag](https://redis.io/docs/stack/search/indexing_json/#index-json-arrays-as-tag), [Numeric](https://redis.io/docs/stack/search/indexing_json/#index-json-arrays-as-numeric), [Geo](https://redis.io/docs/stack/search/indexing_json/#index-json-arrays-as-geo) and [Vector](https://redis.io/docs/stack/search/indexing_json/#index-json-arrays-as-vector)) defined by a [JSONPath](https://redis.io/docs/stack/json/path/) leading to an array:
  - Multi-value text search - perform full-text search on [array of string or on a JSONPath](https://redis.io/docs/stack/search/indexing_json/#index-json-arrays-as-tag) leading to multiple strings
  - Return JSON rather than scalars from multi-value attributes. This is enabled via Dialect 3 in order not to break existing applications.
  - Support for `SORTABLE` fields on JSON in an implicit un-normalized form (UNF)
* Support for indexing double-precision floating-point vectors and range queries from a given vector:
  - Better space optimization selection
  - Aligning index capacity with block size
  - Support FLOAT64 as vector data type
  - Range query support
  - Support query attributes for vector queries
 
**RedisJSON**  introduces the following features:
* A new JSONPath library which enhances the performance of parsing any JSONPath expression in RedisJSON.
 
**RedisBloom** introduces the following new features:
* A new sketch data structure: t-digest. t-digest is a sketch data structure for estimating quantiles based on a data stream or a large dataset of values. As for other sketch data structures, t-digest requires sublinear space and has controllable space-accuracy tradeoffs.

**RedisGraph** introduces the following new features:
* New path-finding algorithms: 
  - The `algo.SPpaths` procedure returns one, _n_, or all minimal-weight, optionally bounded-cost, optionally bounded-length paths between a given pair of nodes.
  - The `algo.SSpaths` procedure returns one, _n_, or all minimal-weight, optionally bounded-cost, optionally bounded-length paths from a given node.
* Introduce `SET` for adding node labels and `REMOVE` for removing node labels, node properties, and edge properties
* Support deleting paths with `DELETE`
* Introduce `toBoolean`, `toBooleanOrNull`, `toFloatOrNull`, `toIntegerOrNull`, `toStringOrNull`, `toBooleanList`, `toFloatList`, `toIntegerList`, `toStringList`, `properties`, `split`, `last`, `isEmpty`,`e`, `exp`, `log`, `log10`, `sin`, `cos`, `tan`, `cot`, `asin`, `acos`, `atan`, `atan2`, `degrees`, `radians`, `pi`, and `haversin` functions.
* Graph slow log can be reset with `GRAPH.SLOWLOG g RESET` (also added in 2.8.20)
* Queries are now atomic (_Atomicity_ is the guarantee that each query either succeeds or fails with no side effects). Whenever a failure occurs, the query effect is rolled-back from an undo-log.
 
**RedisTimeSeries** introduces the following new features:
* Introduction of a new aggregator: `twa` (time-weighted average)
* Introduction of a new optional `EMPTY` flag to `TS.RANGE`, `TS.REVRANGE`, `TS.MRANGE`, and `TS.MREVRANGE` to retrieve aggregations for empty buckets as well.
* Gap-filling: Using `EMPTY` when the aggregator is `twa` allows estimating the average of a continuous signal even for empty buckets based on linear interpolation of previous and next samples. Using `EMPTY` when the aggregator is `last` would repeat the value of the previous sample when the bucket is empty.
* Introduction of a new optional `BUCKETTIMESTAMP` parameter to `TS.RANGE`, `TS.REVRANGE`, `TS.MRANGE`, and `TS.MREVRANGE`. It is now possible to report the start time, the end time, or the mid time for each bucket.
* Introduction of a new optional `alignTimestamp` parameter to `TS.CREATERULE` and to `COMPACTION_POLICY` configuration parameter.  It is now possible to define alignment for compaction rules, so one can, for example, aggregate daily events from 06:00 to 06:00 the next day.
* Introduction of additional reducer types in `GROUPBY` (`TS.MRANGE`, and `TS.MREVRANGE`): `avg`, `range`, `count`, `std.p`, `std.s`, `var.p`, and `var.s`
* Introduction of a new optional `LATEST` flag to `TS.GET`, `TS.MGET`, `TS.RANGE`, `TS.REVRANGE`, `TS.MRANGE`, and `TS.MREVRANGE`. it is possible to retrieve the latest (possibly partial) bucket as well.

 
**Redis version** (no changes)
* [Redis 6.2.7](https://github.com/redis/redis/blob/6.2.7/00-RELEASENOTES)
 

**Module versions**
* __[RediSearch 2.6.1](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.1)__
* __[RedisJSON 2.4.0](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.4.0)__
* __[RedisGraph 2.10-RC1 (v2.10.2)](https://github.com/RedisGraph/RedisGraph/releases/tag/v2.10.2)__
* __[RedisTimeSeries 1.8-RC3 (v1.8.2)](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.8.2)__
* __[RedisBloom 2.4-RC3 (v2.4.2)](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.4.2)__

**Recommended Client Libraries  (no changes)**
* Java
  * [Jedis 4.2.0 or greater ](https://github.com/redis/jedis/releases/tag/v4.2.0)
  * [redis-om-spring](https://github.com/redis/redis-om-spring)
* Python
  * [redis-py 4.3.1 or greater ](https://github.com/redis/redis-py/releases/tag/v4.3.1)
  * [redis-om-python](https://github.com/redis/redis-om-python)
* NodeJS
  * [node-redis 4.4.0  or greater](https://www.npmjs.com/package/redis)
  * [redis-om-node](https://github.com/redis/redis-om-node)
* .NET
  * [redis-om-dotnet](https://github.com/redis/redis-om-dotnet)

Compatible with the latest [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with RedisInsight 2.12.0.

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

