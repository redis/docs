---
Title: Redis Stack 7.2 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Stack 7.2 release notes.
linkTitle: v7.2.0-v0 (August 2023)
weight: 100
---
## Redis Stack 7.2.0-v13 (October 2024)

This is a maintenance release for Redis Stack Server 7.2.0.

Update urgency: `SECURITY`: there are security fixes in the release.

[Docker](https://hub.docker.com/r/redis/redis-stack) | [Download](https://redis.io/downloads/#stack)

### Headlines:
This version includes security fixes for the **Redis** server, addressing potential vulnerabilities such as an RCE when using Lua library components, and a denial-of-service (DoS) risk due to malformed ACL selectors or unbounded pattern matching.
Additionally, this maintenance release contains a bug fix to prevent crashes in cluster mode and includes the latest version of **Redis Insight**.

### Details:
 **Security and privacy**
* **Redis**:
  * (CVE-2024-31449) Lua library commands may lead to stack overflow and potential RCE.
  * (CVE-2024-31227) Potential Denial-of-service due to malformed ACL selectors.
  * (CVE-2024-31228) Potential Denial-of-service due to unbounded pattern matching.

**Bug Fixes**
* **Redis**:
  *  [#13315](https://github.com/redis/redis/pull/13315) Fixed crashes in cluster mode

* **Redis version**:
  * __[Redis 7.2.6](https://github.com/redis/redis/releases/tag/7.2.6)__

**Module versions**	
* __[RediSearch 2.8.15](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.15)__
* __[RedisJSON 2.6.11](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.11)__
* __[RedisTimeSeries 1.10.13](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.12)__
* __[RedisBloom 2.6.12](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.12)__
* __[RedisGears 2.0.23](https://github.com/RedisGears/RedisGears/releases)__

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
* `b` denotes a patch to Redis or a module (any `z` of Redis modules). `b` will consist of a `v` + numeric value.

## Redis Stack 7.2.0-v12 (August 2024)

This is a maintenance release for Redis Stack Server 7.2.0.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

### Headlines:
The updated **search and query**  version introduces several new features and important bug fixes, including a critical one. This new release of Redis Stack 7.2.0 also includes updated versions of **JSON** and **time series** data structures, each incorporating several bug fixes.

This maintenance release also contains the latest version of **RedisInsight**.

### Details:

 **Improvements**
* **Search and query**:
  * [#4792](https://github.com/RediSearch/RediSearch/pull/4792) - Add character validations to simple string replies and escape it when required (MOD-7258)
  * [#4768](https://github.com/RediSearch/RediSearch/pull/4768) - Indicate which value is missing on the error message at the aggregation pipeline (MOD-7201)
  * [#4745](https://github.com/RediSearch/RediSearch/pull/4745) - `GROUPBY` recursion cleanup (MOD-7245)
  * [#4823](https://github.com/RediSearch/RediSearch/pull/4823) - Mechanism of keys expiration during the query execution clearing intermediate results

**Bug Fixes**
* **Search and query**:
  * [#4754](https://github.com/RediSearch/RediSearch/pull/4754) - Correct return the maximum value for negative values when using `MAX` reducer (MOD-7252)
  * [#4737](https://github.com/RediSearch/RediSearch/pull/4737) - Separators ignored when escaping backslash `\` after the escaped character such as in `hello\\,world` ignoring `,` (MOD-7240)
  * [#4717](https://github.com/RediSearch/RediSearch/pull/4717) - Sorting by multiple fields `SORTBY 2 @field1 @field2` was ignoring the subsequent field(MOD-7206)
  * [#4803](https://github.com/RediSearch/RediSearch/pull/4803) - Keys expiring during query returning empty array (MOD-7010)
  * [#4794](https://github.com/RediSearch/RediSearch/pull/4794) - Index sanitiser (GC) trying to clean deleted numeric index could cause a crash (MOD-7303)

* **JSON**:
  * [#1212](https://github.com/RedisJSON/RedisJSON/pull/1212) `JSON.MSET`- AOF commands are duplicated multiple times (MOD-7293)

* **Time series**:
  * [#1607](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1607) Potential crash after deleting and recreating a source key of a compaction rule (MOD-7338)
  * [#1610](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1610) `COUNT` argument accepts non-positive values (MOD-5413)

* **Redis version**:
  * __[Redis 7.2.5](https://github.com/redis/redis/releases/tag/7.2.5)__

**Module versions**	
* __[RediSearch 2.8.15](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.15)__
* __[RedisJSON 2.6.11](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.11)__
* __[RedisTimeSeries 1.10.13](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.12)__
* __[RedisBloom 2.6.12](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.12)__
* __[RedisGears 2.0.23](https://github.com/RedisGears/RedisGears/releases)__

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

## Redis Stack 7.2.0-v11 (June 2024)

This is a maintenance release for Redis Stack Server 7.2.0.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

[Docker](https://hub.docker.com/r/redis/redis-stack) | [Download](https://redis.io/downloads/#stack)

### Headlines:
Redis Stack 7.2.0-v11 introduces a new version of the **Redis** server with several bug fixes, and an updated **search and query** capability with numerous enhancements and bug fixes.

The updated **search and query** version features improved memory reporting that accounts for additional memory consumed by `TAG` and `TEXT` tries, as well as enhanced memory counting for inverted indexes.  Also, it includes additional fields in the `FT.INFO` command when used within a cluster.

This maintenance release also contains the latest version of **RedisInsight**.

### Details:

 **Improvements**
* **Search and query**:
  * [#4595](https://github.com/RediSearch/RediSearch/pull/4595) - Report memory of the `TAG` and `TEXT` tries (MOD-5902)
  * [#4669](https://github.com/RediSearch/RediSearch/pull/4669) - Inverted index memory counting (MOD-5977,MOD-5866)
  * [#4687](https://github.com/RediSearch/RediSearch/pull/4687) - Add missing `FT.INFO` fields when used within a cluster (MOD-6920)	

**Bug Fixes**
* **Redis**:
  * [#12824](https://github.com/redis/redis/pull/12824) A single shard cluster leaves failed replicas in CLUSTER SLOTS instead of removing them
  * [#12955](https://github.com/redis/redis/pull/12955) Crash in LSET command when replacing small items and exceeding 4GB
  * [#13004](https://github.com/redis/redis/pull/13004) Blocking commands timeout is reset due to re-processing command
  * [#13115](https://github.com/redis/redis/pull/13115) Conversion of numbers in Lua args to redis args can fail. Bug introduced in 7.2.0

* **CLI tools**:
  * [#13092](https://github.com/redis/redis/pull/13092) redis-cli: --count (for --scan, --bigkeys, etc) was ignored unless --pattern was also used
  * [#12958](https://github.com/redis/redis/pull/12958) redis-check-aof: incorrectly considering data in manifest format as MP-AOF

* **Search and query**:
  * [#4614](https://github.com/RediSearch/RediSearch/pull/4614) - Shards become unresponsive when using `FT.AGGREGATE` with `APPLY 'split(...)'`(MOD-6759)
  * [#4556](https://github.com/RediSearch/RediSearch/pull/4556) - `FT.EXPLAIN` returns additional } when querying using wildcards (MOD-6768)
  * [#4646](https://github.com/RediSearch/RediSearch/pull/4646) - `FT.DROPINDEX` with `DD` flag deleted keys in one AA cluster but not the others (MOD-1855)

* **Redis version**:
  * __[Redis 7.2.5](https://github.com/redis/redis/releases/tag/7.2.5)__

**Module versions**	
* __[RediSearch 2.8.14](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.14)__
* __[RedisJSON 2.6.10](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.10)__
* __[RedisTimeSeries 1.10.12](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.12)__
* __[RedisBloom 2.6.12](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.12)__
* __[RedisGears 2.0.23](https://github.com/RedisGears/RedisGears/releases)__

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

## Redis Stack 7.2.0-v10 (April 2024)

This is a maintenance release for Redis Stack Server 7.2.0.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

### Headlines:
This version contains the latest **search and query** capability with several improvements and bug fixes, including critical bug fixes. This release also includes the latest **JSON** data structure with a fix for a potential crash, the **time series** data structure with more detailed LibMR error messages, and the latest version of **triggers and functions** with updated v8 version and a bug fix. It also contains the latest version of **RedisInsight**.

### Details:

 **Improvements**
* **Search and query**:
  * [#4502](https://github.com/RediSearch/RediSearch/pull/4502) Handle error properly when trying to execute Search commands on cluster setup as part of `MULTI`/`EXEC` or LUA script (MOD-6541)
  * [#4526](https://github.com/RediSearch/RediSearch/pull/4526) Adding detailed geometry info on error messages (MOD-6701)

* **Time series**:
  * [#1593](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1593) More detailed LibMR error messages

* **Triggers and Functions**:
  * [#1100](https://github.com/RedisGears/RedisGears/pull/1100) Update v8 version to 12.3.219.15

**Bug Fixes**
* **Search and query**:
  * [#4481](https://github.com/RediSearch/RediSearch/pull/4481) Query syntax on `GEOSHAPE` accepting just prefix instead of complete predicate (MOD-6663)
  * [#4513](https://github.com/RediSearch/RediSearch/pull/4513) `FT.CURSOR READ` in a numeric query causing a crash (MOD-6597) [**critical bug**]
  * [#4534](https://github.com/RediSearch/RediSearch/pull/4534) `FT.PROFILE` with incorrect arguments could cause a crash on cluster setup (MOD-6791) [**critical bug**]
  * [#4530](https://github.com/RediSearch/RediSearch/pull/4530) Some parameter settings using just prefixes instead of full values were working (MOD-6709)
  * [#4539](https://github.com/RediSearch/RediSearch/pull/4539) Unfree memory while re-indexing loading a new RDB could cause a crash (MOD-6831, 6810) [**critical bug**]
  * [#4498](https://github.com/RediSearch/RediSearch/pull/4498) Vector pre-filtered query (hybrid query) that timeout causing a crash due to deadlock when trying to write a new document(MOD-6510, MOD-6244) [**critical bug**]
  * [#4495](https://github.com/RediSearch/RediSearch/pull/4495) `FT.SEARCH` accessing an inexistent memory address causes a crash if using the deprecated `FT.ADD` command (MOD-6599) [**critical bug**]

* **JSON**:
  * [#1192](https://github.com/RedisJSON/RedisJSON/pull/1192) Crashes with numeric values greater than i64::MAX (MOD-6501, MOD-4551, MOD-4856, MOD-5714)

* **Triggers and Functions**:
  * [#1093](https://github.com/RedisGears/RedisGears/pull/1093) Crash when logging NULL characters

**Redis version**:
  * __[Redis 7.2.4](https://github.com/redis/redis/releases/tag/7.2.4)__

**Module versions**	
* __[RediSearch 2.8.13](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.13)__
* __[RedisJSON 2.6.10](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.10)__
* __[RedisTimeSeries 1.10.12](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.12)__
* __[RedisBloom 2.6.12](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.12)__
* __[RedisGears 2.0.20](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.20-m21)__

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

* macOS: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.catalina.x86_64.zip), [arm64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.monterey.arm64.zip)
* AppImage: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10-x86_64.AppImage)
* Ubuntu: [Bionic x86_64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.bionic.x86_64.tar.gz), [Bionic arm64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.bionic.arm64.tar.gz), [Focal x86_64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.focal.x86_64.tar.gz), [Focal arm64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.focal.arm64.tar.gz), [Snap x86_64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.x86_64.snap), [Snap arm64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.arm64.snap), [Jammy x86_64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.jammy.x86_64.tar.gz), [Jammy arm64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.jammy.arm64.tar.gz)
* Debian: [Bullseye x86_64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.bullseye.x86_64.tar.gz)
* RHEL 7/CentOS Linux 7: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.rhel7.x86_64.tar.gz)
* RHEL 8/CentOS Linux 8: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.rhel8.x86_64.tar.gz)
* RHEL 9/Rocky Linux 9/CentOS Linux 9: [x86_64](https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v10.rhel9.x86_64.tar.gz)
* Redis Stack on [Dockerhub](https://hub.docker.com/u/redis): [x86_64 and arm64](https://hub.docker.com/r/redis/redis-stack)
* Redis Stack server on [Dockerhub](https://hub.docker.com/u/redis): [x86_64 and arm64](https://hub.docker.com/r/redis/redis-stack-server)

## Redis Stack 7.2.0-v9 (March 2024)

This is a maintenance release for Redis Stack Server 7.2.0.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

### Headlines:
This version contains the latest **search and query** capability with an improvement for memory allocation patterns on the memory used to query `GEOSHAPE` types, and several bug fixes. This release also includes the latest **probabilistic** data structures with a fix for a potential crash, and **triggers and functions** capability with an updated v8 version. It also contains the latest version of **RedisInsight**.

### Details:

 **Improvements**
* **Search and query**:
  * [#4313](https://github.com/RediSearch/RediSearch/pull/4313) Memory allocation patterns on the memory used to query `GEOSHAPE` types (MOD 6431)

**Bug Fixes**
* **Search and query**:
  * [#4476](https://github.com/RediSearch/RediSearch/pull/4476) Split `INFIX` and `SUFFIX` report on `FT.EXPLAIN` and `FT.EXPLAINCLI` (MOD-6186)
  * [#4467](https://github.com/RediSearch/RediSearch/pull/4467) Memory leak upon suffix query for a `TAG` indexed with `WITHSUFFIXTRIE` (MOD-6644)
  * [#4403](https://github.com/RediSearch/RediSearch/pull/4403) Clustered `FT.SEARCH` hangs forever without replying when an invalid topology is found (MOD-6557)
  * [#4355](https://github.com/RediSearch/RediSearch/pull/4355) Searching for a synonym will iterate in the same group multiple times, causing a performance hit (MOD-6490)

* **Probabilistic data structures**:
  * [#753](https://github.com/RedisBloom/RedisBloom/issues/753) Potential crash on `CMS.MERGE` when using invalid arguments

* **Triggers and Functions**:
  * [#1089](https://github.com/RedisGears/RedisGears/pull/1089) Update v8 version to 12.2.281.21

* **Redis version**:
  * __[Redis 7.2.4](https://github.com/redis/redis/releases/tag/7.2.4)__

**Module versions**	
* __[RediSearch 2.8.12](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.12)__
* __[RedisJSON 2.6.9](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.9)__
* __[RedisTimeSeries 1.10.11](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.11)__
* __[RedisBloom 2.6.12](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.12)__
* __[RedisGears 2.0.19](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.19-m20)__

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

## Redis Stack 7.2.0-v8 (January 2024)

This is a maintenance release for Redis Stack Server 7.2.0.

Update urgency: `HIGH`: There is a critical bug fixed in the probabilistic data structures that may affect a subset of users. Upgrade!

### Headlines:
This version contains the latest **probabilistic** data structures with a critical bug fix, as well as the latest **JSON** data structure with a breaking change to revert JSONPath default path value from `$` to `.` under RESP3, and a fix for RediSearch deadlock. This version contains the latest version of **RedisInsight**.

### Details:

 **Improvements**
* **JSON**:
  * [#1131](https://github.com/RedisJSON/RedisJSON/issues/1131), [#1143](https://github.com/RedisJSON/RedisJSON/pull/1143) BREAKING - Revert JSONPath default path value from `$` to `.` under RESP3 (MOD-6156)

**Bug Fixes**
* **JSON**:
  * [#1095](https://github.com/RedisJSON/RedisJSON/pull/1095) Fix for RediSearch deadlock. See RediSearch 2.8.10 release notes (MOD-5895)

* **Probabilistic data structures**:
  * [#727](https://github.com/RedisBloom/RedisBloom/pull/727) Potential crash on CF.LOADCHUNK (MOD-6344) - Additional fixes

* **Redis version**:
  * __[Redis 7.2.4](https://github.com/redis/redis/releases/tag/7.2.4)__

**Module versions**	
* __[RediSearch 2.8.11](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.11)__
* __[RedisJSON 2.6.9](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.9)__
* __[RedisTimeSeries 1.10.11](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.11)__
* __[RedisBloom 2.6.11](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.11)__
* __[RedisGears 2.0.16](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.16-m17)__

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

## Redis Stack 7.2.0-v7 (January 2024)

This is a maintenance release for Redis Stack Server 7.2.0.

Update urgency: `SECURITY`:  there are security fixes in the release.

### Headlines:
This version contains security fixes for the **Redis** server to properly handle the resizing of memory buffers, as well as security fixes for **probabilistic data structures** to avoid potential crashes. The new Redis Stack version also contains several improvements and bug fixes for the **Search and query** capability, including fixes of critical bugs. It also offers the latest **time series data structure**, the latest **Triggers and Functions** capability with various improvements and bug fixes, and it contains the latest version of **RedisInsight**.

### Details:

 **Security and privacy**
* **Redis**:
  * (CVE-2023-41056) In some cases, Redis may incorrectly handle resizing of memory buffers which can result in incorrect accounting of buffer sizes and lead to heap overflow and potential remote code execution

* **Probabilistic data structures**:
  * [#721](https://github.com/RedisBloom/RedisBloom/issues/721) Potential crash on `CF.RESERVE` (MOD-6343)
  * [#722](https://github.com/RedisBloom/RedisBloom/issues/722) Potential crash on `CF.LOADCHUNK` (MOD-6344)

 **Improvements**
* **Search and query**:
  * [#3682](https://github.com/RediSearch/RediSearch/pull/3682) Report last key error and field type indexing failures on `FT.INFO` (MOD-5364)
  * [#4236](https://github.com/RediSearch/RediSearch/pull/4236) Adding Vector index parameters at the `FT.INFO` report (MOD-6198)
  * [#4196](https://github.com/RediSearch/RediSearch/pull/4196) Check for timeout after results processing in `FT.SEARCH` on cluster setup (MOD-6278)
  * [#4164](https://github.com/RediSearch/RediSearch/pull/4164) Report `TIMEOUT`, `MAXPREFIXEXPANSION` warnings in RESP3 replies (MOD-6234)
  * [#4165](https://github.com/RediSearch/RediSearch/pull/4165) Indicate timeout on `FT.PROFILE` report (MOD-6184)
  * [#4149](https://github.com/RediSearch/RediSearch/pull/4149) Indicate timeout from Cursor on `FAIL` timeout policy (MOD-5990)
  * [#4147](https://github.com/RediSearch/RediSearch/pull/4147) Initialization of the maximum numeric value range leading to a better balance of the index leaf splitting (MOD-6232)
  * [#3940](https://github.com/RediSearch/RediSearch/pull/3940) Query optimisation when predicate contains multiple `INTERSECTION` (AND) of `UNION` (OR) (MOD-5910)
  * [#4059](https://github.com/RediSearch/RediSearch/pull/4059) Return cursor id when experiencing a timeout, when the policy is `ON_TIMEOUT RETURN` (MOD-5966)
  * [#4006](https://github.com/RediSearch/RediSearch/pull/4006) Possibly problematic index name alias validation (MOD-5945)
  * [#4264](https://github.com/RediSearch/RediSearch/pull/4264) Granularity of the time reporting counters on `FT.PROFILE` (MOD-6002)

* **Triggers and Functions**:
  * Update v8 version to 12.0/267.13

**Bug Fixes**
* **Redis**:
  * [#12805](https://github.com/redis/redis/pull/12805), [#12832](https://github.com/redis/redis/pull/12832) Fix crashes of cluster commands clusters with mixed versions of 7.0 and 7.2
  * [#12564](https://github.com/redis/redis/pull/12564) Fix slot ownership not being properly handled when deleting a slot from a node
  * [#12733](https://github.com/redis/redis/pull/12733) Fix atomicity issues with the RedisModuleEvent_Key module API event
  * [#4324](https://github.com/RediSearch/RediSearch/pull/4324) Internal cluster mechanism not waiting until all replies from shards causing a crash (MOD-6287)
  * [#4297](https://github.com/RediSearch/RediSearch/pull/4297) Execution loader when using `FT.AGGREGATE` with `LOAD` stage failing to buffer the right results potentially causing a crash (MOD-6385)

* **Search and query**:
  * [#4287](https://github.com/RediSearch/RediSearch/pull/4287) Re-index process while syncing from the replica causes a crash due to internal index variable initialisation
(MOD-6337, MOD-6336)
  * [#4249](https://github.com/RediSearch/RediSearch/pull/4249) Memory tracking on cluster setups causing high memory usage and potentially Out-of-Memory (MOD-6123, MOD-5639)
  * [#4244](https://github.com/RediSearch/RediSearch/pull/4244) Profiling `FT.AGGREGATE` using the `WITHCURSOR` flag with - clause causes a crash due to timeout (MOD-5512)
  * [#3916](https://github.com/RediSearch/RediSearch/pull/3916) Expiring `JSON` documents while querying it causing a crash due to deadlock (MOD-5769, MOD-5895, MOD-6189, MOD-5895)
  * [#4235](https://github.com/RediSearch/RediSearch/pull/4235) Memory excessively growing on databases caused by unbalanced nodes on inverted index trie (MOD-5880, MOD-5952, MOD-6003)
  * [#4190](https://github.com/RediSearch/RediSearch/pull/4190) Profiling `FT.AGGREGATE` causes a crash on RESP3 replies (MOD-6250, MOD-6295)
  * [#4148](https://github.com/RediSearch/RediSearch/pull/4148), [#4038](https://github.com/RediSearch/RediSearch/pull/4038) `ON_TIMEOUT FAIL\RETURN` policies in the cluster setup not being respected (MOD-6035, MOD-5948, MOD-6090)
  * [#4110](https://github.com/RediSearch/RediSearch/pull/4110) Format of error response contains inconsistencies when timing out(MOD-6011, MOD-5965)
  * [#4104](https://github.com/RediSearch/RediSearch/pull/4104) `FT.SEARCH` not responding when using TLS encryption on Amazon Linux 2 (MOD-6012)
  * [#4009](https://github.com/RediSearch/RediSearch/pull/4009) In cluster setup does not return a timeout error for `FT.SEARCH` (MOD-5911)
  * [#3920](https://github.com/RediSearch/RediSearch/pull/3920) In cluster setup does not return a timeout error for `FT.AGGREGATE` (MOD-5209)
  * [#3914](https://github.com/RediSearch/RediSearch/pull/3914) `FT.CURSOR READ` with geo queries causing a crash when data is updated between the cursor reads (MOD-5646)
  * [#4220](https://github.com/RediSearch/RediSearch/pull/4220) Server crash when attempting to run the ForkGC (Garbage Collection routine) after dropping the index (MOD-6276)

* **Time series**:
  * [LibMR[#51](https://github.com/RedisGears/libMR/pull/51)](https://github.com/RedisGears/LibMR/pull/51) Crash on SSL initialization failure (MOD-5647)
  * [#1538](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1538) Amazon Linux 2: crash on SSL initialization. We now use openssl11-devel instead of openssl-devel (MOD-6015)

* **Probabilistic data structures**:
  * [#707](https://github.com/RedisBloom/RedisBloom/pull/707) Top-K: `TOPK.ADD` and `TOPK.QUERY` crash when an item name is an empty string (RED-114676)

* **Triggers and Functions**:
  * [#1069](https://github.com/RedisGears/RedisGears/pull/1069) Fixed an issue where a keyspace notification could be lost

* **Redis version**:
  * __[Redis 7.2.4](https://github.com/redis/redis/releases/tag/7.2.4)__

**Module versions**	
* __[RediSearch 2.8.11](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.11)__
* __[RedisJSON 2.6.7](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.7)__
* __[RedisTimeSeries 1.10.11](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.11)__
* __[RedisBloom 2.6.10](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.10)__
* __[RedisGears 2.0.16](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.16-m17)__

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

## Redis Stack 7.2.0-v5 (October 2023)

This is a maintenance release for Redis Stack Server 7.2.0.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

### Headlines:
This version contains the latest Search and Query with various improvements and fixes for critical bugs, triggers and functions with an updated v8 version, as well as new JSON, time series, and probabilistic data structures with several improvements. The new version introduces support for RHEL 9 and Rocky Linux 9. It also includes the latest version of RedisInsight.

### Details:

 **Improvements**
* **Search and Query**:
  * [#3938](https://github.com/RediSearch/RediSearch/pull/3938) Propagating error messages in a multi-shard database, instead of failing silently (MOD-5211)

* **JSON**:
  * [#1102](https://github.com/RedisJSON/RedisJSON/pull/1102) Added support for CBL-Mariner 2

* **Time series**:
  * [#1516](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1516) Added support for CBL-Mariner 2

* **Probabilistic data structures**:
  * [#684](https://github.com/RedisBloom/RedisBloom/pull/684), [#685](https://github.com/RedisBloom/RedisBloom/pull/685) Added support for CBL-Mariner 2

**Bug Fixes**
* **Redis**:
  * Fix for the "The RDB file contains AUX module data I can't load: no matching module 'graphdata'" [error message](https://github.com/redis/redis/issues/12490) when upgrading Redis Stack

* **Search and Query**:
  * [#3874](https://github.com/RediSearch/RediSearch/pull/3874) Heavy document updates cause memory growth once memory blocks aren't properly released (MOD-5181)
  * [#3967](https://github.com/RediSearch/RediSearch/pull/3967) Resharding optimizations cause the process to get stuck (MOD-5874, MOD-5864)
  * [#3892](https://github.com/RediSearch/RediSearch/pull/3892) After cleaning the index the GC could cause corruption on unique values (MOD-5815)
  * [#3853](https://github.com/RediSearch/RediSearch/pull/3853) Queries with `WITHCURSOR` making memory growth since `CURSOR` wasn't invalidated in the shards (MOD-5580)

* **Triggers and Functions**:
  * Update v8 version to 11.8.172.15

**Redis version**
* __[Redis 7.2.2](https://github.com/redis/redis/releases/tag/7.2.2)__

**Module versions**	
* __[RediSearch 2.8.9](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.9)__
* __[RedisJSON 2.6.7](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.7)__
* __[RedisTimeSeries 1.10.9](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.9)__
* __[RedisBloom 2.6.8](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.8)__
* __[RedisGears 2.0.14](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.14-m15)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.0.2 or greater](https://github.com/redis/jedis/releases/tag/v5.0.2)
  * [redis-om-spring 0.8.7 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.7)
* Python
  * [redis-py 5.0.1 or greater ](https://github.com/redis/redis-py/releases/tag/v5.0.1)
  * [redis-om-python 0.2.1 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.2.1)
* NodeJS
  * [node-redis 4.6.10 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.10)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.5.3 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.5.3)
  * [NRedisStack 0.10.1 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.10.1)
* Go
  * [go-redis 9.2.1 or greater](https://github.com/redis/go-redis/releases/tag/v9.2.1)
  * [rueidis 1.0.20 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.20)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.36](https://github.com/RedisInsight/RedisInsight/releases/tag/2.36.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack 7.2.0-v4 (October 2023)

This is a maintenance release for Redis Stack Server 7.2.0.

Update urgency: `SECURITY`: There are security fixes in the release.

### Headlines:
This version contains a security fix for the Redis server to avoid bypassing desired Unix socket permissions on startup, as well as several improvements and bug fixes.

### Details:

**Security and privacy**
* **Redis**:
  * (CVE-2023-45145) The wrong order of `listen(2)` and `chmod(2)` calls creates a
race condition that can be used by another process to bypass desired Unix
socket permissions on startup.

 **Improvements**
* **Redis**:
  * [#12611](https://github.com/redis/redis/pull/12611) Fix compilation error on MacOS 13
  * [#12604](https://github.com/redis/redis/pull/12604) Fix crash when running rebalance command in a mixed cluster of 7.0 and 7.2
Nodes
  * [#12561](https://github.com/redis/redis/pull/12561) Fix the return type of the slot number in cluster shards to integer, which
makes it consistent with past behavior
  * [#12569](https://github.com/redis/redis/pull/12569) Fix CLUSTER commands are called from modules or scripts to return TLS info
appropriately
 * [#12571](https://github.com/redis/redis/pull/12571) redis-cli, fix crash on reconnect when in SUBSCRIBE mode
 * [#12474](https://github.com/redis/redis/pull/12474) Fix overflow calculation for next timer event

**Bug Fixes**
* **Redis**:
 * [#12620](https://github.com/redis/redis/pull/12620) WAITAOF could timeout in the absence of write traffic in case a new AOF is
created and an AOF rewrite can't immediately start

**Redis version**
* __[Redis 7.2.2](https://github.com/redis/redis/releases/tag/7.2.2)__

**Module versions**	
* __[RediSearch 2.8.8](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.8)__
* __[RedisJSON 2.6.6](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.6)__
* __[RedisTimeSeries 1.10.6](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.6)__
* __[RedisBloom 2.6.3](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.3)__
* __[RedisGears 2.0.13](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.13-m14)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.0.1 or greater](https://github.com/redis/jedis/releases/tag/v5.0.1)
  * [redis-om-spring 0.8.7 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.7)
* Python
  * [redis-py 5.0.1 or greater ](https://github.com/redis/redis-py/releases/tag/v5.0.1)
  * [redis-om-python 0.2.1 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.2.1)
* NodeJS
  * [node-redis 4.6.10 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.10)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.5.3 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.5.3)
  * [NRedisStack 0.9.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.9.0)
* Go
  * [go-redis 9.2.1 or greater](https://github.com/redis/go-redis/releases/tag/v9.2.1)
  * [rueidis 1.0.20 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.20)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.34](https://github.com/RedisInsight/RedisInsight/releases/tag/2.34.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack 7.2.0-v3 (October 2023)

This is a maintenance release for Redis Stack Server 7.2.0.

Update urgency: `SECURITY`: There are security fixes in the release.

### Headlines:
This version contains the latest Search and Query capability v. 2.8.8, and triggers and functions v. 2.0.13 with various improvements, security fixes for Search and Query, and several bug fixes. It also includes the latest version of RedisInsight.

### Details:

**Security and privacy**
* **Search and Query**:
  * [#3788](https://github.com/RediSearch/RediSearch/pull/3788) Don’t expose internal cluster commands
  * [#3844](https://github.com/RediSearch/RediSearch/pull/3844) Limits maximum phonetic length avoiding to be exploited

 **Improvements**
* **Search and Query**:
  * [#3534](https://github.com/RediSearch/RediSearch/pull/3534) - Vector Similarity [0.7.1](https://github.com/RedisAI/VectorSimilarity/releases/tag/v0.7.1)

**Bug Fixes**
* **Search and Query**:
  * [#3771](https://github.com/RediSearch/RediSearch/pull/3771)  Broken `lower()` and `upper()` functions on `APPLY` stage in `FT.AGGREGATE` in `DIALECT 3`
  * [#3752](https://github.com/RediSearch/RediSearch/pull/3752) Setting a low `MAXIDLE` parameter value in `FT.AGGREGATE` causes a crash
  * [#3780](https://github.com/RediSearch/RediSearch/pull/3780) Wrong document length calculation causing incorrect score values
  * [#3808](https://github.com/RediSearch/RediSearch/pull/3808) `LOAD` step after a `FILTER` step could cause a crash on `FT.AGGREGATE`
  * [#3823](https://github.com/RediSearch/RediSearch/pull/3823) `APPLY` or `FILTER` parser leak
  * [#3837](https://github.com/RediSearch/RediSearch/pull/3837) Connection using TLS fails on Redis 7.2
  * [#3856](https://github.com/RediSearch/RediSearch/pull/3856) Adding new nodes to OSS cluster causing a crash
  * [#3854](https://github.com/RediSearch/RediSearch/pull/3854) Vector range query could cause Out-of-Memory due a memory corruption

* **Triggers and Functions**:
  * Update v8 version to 11.7.439.17.

**Redis version**
* __[Redis 7.2.1](https://github.com/redis/redis/releases/tag/7.2.1)__

**Module versions**	
* __[RediSearch 2.8.8](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.8)__
* __[RedisJSON 2.6.6](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.6)__
* __[RedisTimeSeries 1.10.6](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.6)__
* __[RedisBloom 2.6.3](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.3)__
* __[RedisGears 2.0.13](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.13-m14)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.0.1 or greater](https://github.com/redis/jedis/releases/tag/v5.0.1)
  * [redis-om-spring 0.8.7 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.7)
* Python
  * [redis-py 5.0.1 or greater ](https://github.com/redis/redis-py/releases/tag/v5.0.1)
  * [redis-om-python 0.2.1 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.2.1)
* NodeJS
  * [node-redis 4.6.10 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.10)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.5.3 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.5.3)
  * [NRedisStack 0.9.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.9.0)
* Go
  * [go-redis 9.2.1 or greater](https://github.com/redis/go-redis/releases/tag/v9.2.1)
  * [rueidis 1.0.19 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.19)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.34](https://github.com/RedisInsight/RedisInsight/releases/tag/2.34.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack 7.2.0-v2 (September 2023)

This is a maintenance release for Redis Stack Server 7.2.0.

Update urgency: `SECURITY`: There are security fixes in the release.

### Headlines:
This version contains security improvements for time series to not expose internal commands and several bug fixes for triggers and functions.

### Details:

**Security and privacy**

* **Time series**:
  * [#1506](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1506) Don’t expose internal commands

**Bug Fixes**

* **Triggers and Functions**:
  * [#1023](https://github.com/RedisGears/RedisGears/pull/1023) Add TCONFIG_GET and redisgears_2.FORCESHARDSCONNECTION to exclude commands.
  * [#1008](https://github.com/RedisGears/RedisGears/pull/1008) and [#1020](https://github.com/RedisGears/RedisGears/pull/1020) Fix when the data is read when a StreamTrigger is fired.
  * [#1010](https://github.com/RedisGears/RedisGears/pull/1010) Apply loading timeout on AOF and replication stream.
  * Minor patch update for the V8 JavaScript engine.

**Redis version**
* __[Redis 7.2.1](https://github.com/redis/redis/releases/tag/7.2.1)__

**Module versions**	
* __[RediSearch 2.8.4](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.4)__
* __[RedisJSON 2.6.6](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.6)__
* __[RedisTimeSeries 1.10.6](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.6)__
* __[RedisBloom 2.6.3](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.3)__
* __[RedisGears 2.0.12](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.12-m13)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.0.0 or greater](https://github.com/redis/jedis/releases/tag/v5.0.0)
  * [redis-om-spring 0.8.7 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.7)
* Python
  * [redis-py 5.0.0 or greater ](https://github.com/redis/redis-py/releases/tag/v5.0.0)
  * [redis-om-python 0.2.1 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.2.1)
* NodeJS
  * [node-redis 4.6.8 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.8)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.5.3 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.5.3)
  * [NRedisStack 0.9.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.9.0)
* Go
  * [go-redis 9.1.0 or greater](https://github.com/redis/go-redis/releases/tag/v9.1.0)
  * [rueidis 1.0.17 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.17)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.32](https://github.com/RedisInsight/RedisInsight/releases/tag/2.32).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack 7.2.0-v1 (September 2023)

This is a maintenance release for Redis Stack Server 7.2.0

Update urgency: `SECURITY`: There are security fixes in the release.

### Headlines:
This version contains security fixes for the Redis server for cases when users may access keys that are not explicitly authorized by the ACL configuration using the [SORT_RO](https://redis.io/commands/sort_ro/) command.

### Details:

 **Security Fixes**
* **Redis**:
  * (CVE-2023-41053) Redis does not correctly identify keys accessed by SORT_RO and,
as a result, may grant users executing this command access to keys that are not
explicitly authorized by the ACL configuration.

**Bug Fixes**
* **Redis**:
  * [#12538](https://github.com/redis/redis/pull/12538) Fix crashes when joining a node to an existing 7.0 Redis Cluster
  * [#12545](https://github.com/redis/redis/pull/12545), [#12530](https://github.com/redis/redis/pull/12530) Correct request_policy and response_policy command tips on for some admin /
configuration commands

**Redis version**
* __[Redis 7.2.1](https://github.com/redis/redis/releases/tag/7.2.1)__

**Module versions**	
* __[RediSearch 2.8.4](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.4)__
* __[RedisJSON 2.6.6](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.6)__
* __[RedisTimeSeries 1.10.4](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.4)__
* __[RedisBloom 2.6.3](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.3)__
* __[RedisGears 2.0.11](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.11-m12)__

**Recommended Client Libraries**
* Java
  * [Jedis 5.0.0 or greater](https://github.com/redis/jedis/releases/tag/v5.0.0)
  * [redis-om-spring 0.8.7 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.7)
* Python
  * [redis-py 5.0.0 or greater ](https://github.com/redis/redis-py/releases/tag/v5.0.0)
  * [redis-om-python 0.2.1 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.2.1)
* NodeJS
  * [node-redis 4.6.8 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.8)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.5.3 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.5.3)
  * [NRedisStack 0.9.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.9.0)
* Go
  * [go-redis 9.1.0 or greater](https://github.com/redis/go-redis/releases/tag/v9.1.0)
  * [rueidis 1.0.17 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.17)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.32](https://github.com/RedisInsight/RedisInsight/releases/tag/2.32).

Note: version numbers follow the following pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack 7.2.0-v0 (August 2023)

This is a GA release of Redis Stack version 7.2.

### Headlines:
Redis server 7.2 introduces significant memory and speed optimizations for lists, sets, and sorted sets, several improvements, including encoding improvements for sets and lists, stream consumer group improvements, and improved durability.
Search and Query brings the frequently asked Geo polygons queries for basic shapes and improved query performance on sorting in different scenarios. 
JSON introduces two new commands: [JSON.MERGE](https://redis.io/commands/json.merge/) and [JSON.MSET](https://redis.io/commands/json.mset/) for more efficient data manipulation.
Preview of triggers and functions that allows developers to run JavaScript functions inside the Redis process.
Lastly, 7.2 adds the option to use the new protocol [RESP3](https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md) improving the response format for all commands.

**Redis server**:
Redis server 7.2 brings performance and resource utilization improvements, including significant memory and speed optimizations for lists, sets, and sorted sets. This new version adds a new `WITHSCORE` command argument for [ZRANK](https://redis.io/commands/zrank/) and [ZREVRANK](https://redis.io/commands/zrevrank/), new commands, such as [CLIENT NO-TOUCH](https://redis.io/commands/client-no-touch/) for clients to run commands without affecting LRU/LFU of keys, and more. Redis 7.2 brings behavior changes by introducing a new format (version 11) for RDB files, which is incompatible with older versions, changing module API, and other changes.

**Search and Query**:
This new major version introduces the frequently asked [Geo Polygon](https://redis.io/commands/ft.search/#examples) Search. Adding the [GEOSHAPE](https://redis.io/commands/ft.create/) field type that supports polygon shapes using the [WKT notation](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry). In addition to the existing `GEO` for geo range queries, now an alias for `GEOPOINT`, we add `GEOSHAPE` with the support for `POLYGON` and `POINT` as new shapes formats and polygons operations.

In addition, 7.2 brings improvements in performance for `SORT BY` operations using [`FT.SEARCH`](https://redis.io/commands/ft.search/#optional-arguments) and [`FT.AGGREGATE`](https://redis.io/commands/ft.aggregate/#optional-arguments), and the new `FORMAT` for better readability and future support for better error handling responses on `FT.SEARCH` and `FT.AGGREGATE` in RESP3 only.

**JSON**:
JSON introduces two new commands:
 - [JSON.MERGE](https://redis.io/commands/json.merge/) merges a given JSON value into matching paths so that the JSON values at the matching paths are updated, deleted, or expanded.
 - [JSON.MSET](https://redis.io/commands/json.mset/) sets or updates one or more JSON values according to specified key-path-value triplets.

**Graph**:

Graph capabilities are no longer included in Redis Stack. See the [RedisGraph End-of-Life Announcement](https://redis.com/blog/redisgraph-eol/).

> [!WARNING]  
If you are using graph capabilities with an older version of Redis Stack - please don't upgrade.

**Triggers and functions preview**:
Triggers and functions is part of Redis Stack 7.2 as public preview, any feedback is highly appreciated.

Triggers and functions provides support for running JavaScript functions inside the Redis process. These functions can be executed on-demand, by an event-driven trigger, or by a stream processing trigger. Triggers and functions empowers developers to build and maintain real-time applications by moving logic closer to the data, ensuring a lower latency whilst delivering the best developer experience.

Try it out with the [triggers and functions quick start](https://redis.io/docs/interact/programmability/triggers-and-functions/quick_start/).


### Details:
Find more details about features and optimizations introduced with Redis Stack 7.2 here:
* [Redis server](https://github.com/redis/redis/blob/7.2/00-RELEASENOTES)
* [Search and Query](https://github.com/RediSearch/RediSearch/releases/)
* [JSON](https://github.com/RedisJSON/RedisJSON/releases)
* [Triggers and functions](https://github.com/RedisGears/RedisGears/releases)

**Redis version**
* __[Redis 7.2](https://github.com/redis/redis/blob/7.2/00-RELEASENOTES)__

**Module versions**	
* __[RediSearch 2.8.4](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.4)__
* __[RedisJSON 2.6.6](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.6)__
* __[RedisTimeSeries 1.10.4](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.4)__
* __[RedisBloom 2.6.3](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.3)__
* __[RedisGears 2.0.11](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.11-m12)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.4.3 or greater](https://github.com/redis/jedis/releases/tag/v4.4.3)
  * [redis-om-spring 0.8.6 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.6)
* Python
  * [redis-py 5.0.0 or greater ](https://github.com/redis/redis-py/releases/tag/v5.0.0)
  * [redis-om-python 0.2.1 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.2.1)
* NodeJS
  * [node-redis 4.6.7 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.7)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.5.2 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.5.2)
  * [NRedisStack 0.8.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.8.0)
* Go
  * [go-redis 9.0.5 or greater](https://github.com/redis/go-redis/releases/tag/v9.0.5)
  * [rueidis 1.0.15 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.15)

Compatible with the latest [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.30](https://github.com/RedisInsight/RedisInsight/releases/tag/2.30.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack 7.2.0-rc2 (July 2023)

This is the third release of Redis Stack version 7.2.0.

Update urgency: `SECURITY`:  there are security fixes in the release.

### Headlines:

This version contains security improvements for the Redis server.

### Details:

**Features**
* **Redis**:
  * [#10362](https://github.com/redis/redis/pull/10362) Make SENTINEL CONFIG [SET|GET] variadic
  * [#12133](https://github.com/redis/redis/pull/12133) Add a new loglevel "nothing" to disable logging
  * [#9564](https://github.com/redis/redis/pull/9564) Add cluster-announce-human-nodename - a unique identifier for a node that is
be used in logs for debugging

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
  * [#12269](https://github.com/redis/redis/pull/12269) Allow CLUSTER SLOTS / SHARDS commands during loading
  * [#12233](https://github.com/redis/redis/pull/12233) Support TLS service when "tls-cluster" is not enabled and persist both plain
and TLS port in nodes.conf
  * [#12320](https://github.com/redis/redis/pull/12320) Update SPOP and RESTORE commands to replicate unlink commands to replicas
when the server is configured to use async server deletes
  * [#12229](https://github.com/redis/redis/pull/12229) Try lazyfree the temporary zset in ZUNION / ZINTER / ZDIFF
  * [#12298](https://github.com/redis/redis/pull/12298) Optimize PSUBSCRIBE and PUNSUBSCRIBE from O(N*M) to O(N)
  * [#12209](https://github.com/redis/redis/pull/12209) Optimize SCAN, SSCAN, HSCAN, ZSCAN commands
  * [#12315](https://github.com/redis/redis/pull/12315) Set Jemalloc --disable-cache-oblivious to reduce memory overhead
  * [#12229](https://github.com/redis/redis/pull/12229) Optimize ZINTERCARD to avoid create a temporary zset
  * [#12205](https://github.com/redis/redis/pull/12205) Optimize HRANDFIELD and ZRANDMEMBER listpack encoded ()
  * [#12155](https://github.com/redis/redis/pull/12155), [#12082](https://github.com/redis/redis/pull/12082), [#11626](https://github.com/redis/redis/pull/11626), [#11944](https://github.com/redis/redis/pull/11944), [#12316](https://github.com/redis/redis/pull/12316), [#12250](https://github.com/redis/redis/pull/12250),
[#12177](https://github.com/redis/redis/pull/12177), [#12185](https://github.com/redis/redis/pull/12185) Numerous other optimizations
  * [#12254](https://github.com/redis/redis/pull/12254) redis-cli: Handle RESP3 double responses that contain a NaN
  * [#11834](https://github.com/redis/redis/pull/11834) redis-cli: Support URIs with IPv6

**Changed Behavior**
* **Redis**:
  * [#10536](https://github.com/redis/redis/pull/10536), [#12166](https://github.com/redis/redis/pull/12166) Cluster SHARD IDs are no longer visible in the cluster nodes output
  * [#12326](https://github.com/redis/redis/pull/12326) When calling PUBLISH with a RESP3 client that's also subscribed to the same channel, the order is changed and the reply is sent before the published message
  * [#12321](https://github.com/redis/redis/pull/12321) Align semantics of the new (v7.2 RC2) RM_ReplyWithErrorFormat with RM_ReplyWithError.
This is a breaking change that affects the generated error code
  * [#12304](https://github.com/redis/redis/pull/12304) Forbid RM_AddPostNotificationJob on loading and on read-only replicas
  * [#12219](https://github.com/redis/redis/pull/12219) Add ability for module command filter to know which client is being handled

**Bug Fixes**
* **Redis**:
  * [#12326](https://github.com/redis/redis/pull/12326) Fix broken protocol when PUBLISH is used inside MULTI when the RESP3
publishing client is also subscribed for the channel
  * [#12220](https://github.com/redis/redis/pull/12220) Fix WAIT to be effective after a blocked module command being unblocked
  * [#12276](https://github.com/redis/redis/pull/12276) Re-enable downscale rehashing while there is a fork child
  * [#12276](https://github.com/redis/redis/pull/12276) Fix possible hang in HRANDFIELD, SRANDMEMBER, ZRANDMEMBER when used with `<count>`
  * [#12276](https://github.com/redis/redis/pull/12276) Improve fairness issue in RANDOMKEY, HRANDFIELD, SRANDMEMBER, ZRANDMEMBER, SPOP, and eviction
  * [#12344](https://github.com/redis/redis/pull/12344) Cluster: fix a race condition where a slot migration may revert on a subsequent failover or node joining
  * [#12301](https://github.com/redis/redis/pull/12301)Fix XREADGROUP BLOCK with ">" from hanging
  * [#12247](https://github.com/redis/redis/pull/12247)Fix assertion when a blocked command is rejected when re-processed
  * [#12342](https://github.com/redis/redis/pull/12342)Fix use after free on a blocking RM_Call

**Redis version**
* __[Redis 7.2 RC3](https://github.com/redis/redis/blob/7.2/00-RELEASENOTES)__


**Module versions**	
* __[RediSearch 2.8.3](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.3)__
* __[RedisJSON 2.6.2](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.2)__
* __[RedisTimeSeries 1.10.1](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.1)__
* __[RedisBloom 2.6.1](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.1)__
* __[RedisGears 2.0.6](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.6-m07)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.4.3 or greater](https://github.com/redis/jedis/releases/tag/v4.4.3)
  * [redis-om-spring 0.8.1 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.1)
* Python
  * [redis-py 4.5.5 or greater ](https://github.com/redis/redis-py/releases/tag/v4.5.5)
  * [redis-om-python 0.1.2 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.1.2)
* NodeJS
  * [node-redis 4.6.7 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.7)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.5.1 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.5.1)
  * [NRedisStack 0.7.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.7.0)
* Go
  * [go-redis 9.0.4 or greater](https://github.com/redis/go-redis/releases/tag/v9.0.4)
  * [rueidis 1.0.3 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.3)

Compatible with [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.26](https://github.com/RedisInsight/RedisInsight/releases/tag/2.26.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack 7.2.0-rc2 (June 2023)

This is the second release of Redis Stack version 7.2.0.

### Headlines:
This version contains a new capability - **Triggers and Functions**, improvements to the **Search and Query** capability, and improvements to the **JSON**, **time series** and **probabilistic data structures**. It also includes the latest version of **RedisInsight**.

The new **Search and Query** version introduces new and frequently asked **Geo Polygon Search**. Adding the `GEOSHAPE` field type that supports polygon shapes using [WKT notation](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry). Besides the current `GEO` (alias for `GEOPOINT`) used already geo range queries, we add the support for `POLYGON` as new shapes. In addition, it brings improvements in performance for `SORT BY` operations using `FT.SEARCH` and `FT.AGGREGATE`.

This release includes a new capability - [Triggers and Functions](https://github.com/RedisGears/RedisGears/tree/master) that brings the ability to execute and trigger business logic inside Redis using JavaScript (JS). Detailed documentation and examples can be found in this [GitHub repository](https://github.com/RedisGears/RedisGears#redisgears-20). The Triggers and Functions commands are aligned with the Redis Functions command. The API is not yet final and might change based on feedback. **Any [feedback](https://github.com/RedisGears/RedisGears) is highly appreciated.**
### Details:
**Features**
* **Search and Query**:
  * [#3553](https://github.com/RediSearch/RediSearch/pull/3553) Introduce support for Geo-polygon shapes and queries
    * [#3476](https://github.com/RediSearch/RediSearch/pull/3476), [#3660](https://github.com/RediSearch/RediSearch/pull/3660) Adding `GEOSHAPE` [field type](https://redis.io/commands/ft.create/) to map polygons in the `SCHEMA` on `FT.CREATE`.
    * Support for polygons `POLYGON` using [WKT notation](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry), for example `POLYGON((x1 y1, x2 y2, ...))`.
    * [#3556](https://github.com/RediSearch/RediSearch/pull/3556) Adjust the [query syntax](https://redis.io/commands/ft.search/#examples) on `FT.SEARCH` for Polygons using the predicate `@geom:[OPERATOR $poly]` and defining polygon in WKT format as `PARAMS 2 poly "POLYGON((10 20, ...))"` using `DIALECT 3`.
    * Initially `WITHIN` and `CONTAINS` operators with `GEOSHAPES` for now.
    * [#3645](https://github.com/RediSearch/RediSearch/pull/3645) Support multiple coordinate systems cartesian (X,Y) and geographic (lon, lat). Geographic coordinate system using spherical indexing as default (`SPHERICAL`).
  * [#3046](https://github.com/RediSearch/RediSearch/pull/3046) Introduce performance optimization for sorting operations on `FT.SEARCH` and `FT.AGGREGATE` as default on `DIALECT 4`. It will improve performance in 4 different scenarios, listed below:
    * Skip Sorter - applied when there is no sort of any kind. The query can return once it reaches the `LIMIT` requested results.
    * Partial Range - applied when there is a `SORTBY` a numeric field, with no filter or filter by the same numeric field, the query iterate on a range large enough to satisfy the `LIMIT` requested results.
    * Hybrid - applied when there is a `SORTBY` a numeric field in addition to another non-numeric filter. Some results will get filtered, and the initial range may not be large enough. The iterator then is rewinded with the following ranges, and an additional iteration takes place to collect `LIMIT` requested results.
    * No optimization - If there is a sort by score or by non-numeric field, there is no other option but to retrieve all results and compare their values.
    * [#3651](https://github.com/RediSearch/RediSearch/pull/3651) Add `WITHCOUNT` argument that allow return accurate counts for the query results with sorting. This operation processes all results in order to get accurate count, being less performant than the optimised option (default behaviour on `DIALECT 4`).


* **JSON**:
  * [#916](https://github.com/RedisJSON/RedisJSON/pull/916) Introduce the new `JSON.MERGE` in compliance with [RFC 7396](https://datatracker.ietf.org/doc/html/rfc7396), supporting:
    * Creating new attributes on an existing JSON document
    * Updating and replacing values in parent and child attributes
    * Deleting existing attributes (giving `null` as value)
    * Array update - replacing an entire array with the new value.
  * [#944](https://github.com/RedisJSON/RedisJSON/pull/944) Introduce `JSON.MSET`, supporting atomic multiple sets for keys in the same hash slot.

* **Triggers and Functions**:
  * [#875](https://github.com/RedisGears/RedisGears/pull/875) The api_version was added to the library prologue indicating the minimum required API version. Indicating the library works on the specified API version and later minor versions.
[#896](https://github.com/RedisGears/RedisGears/pull/896) Additional optional callback on a KeySpace trigger that can perform read operations exactly when the notification happens.
  * [#910](https://github.com/RedisGears/RedisGears/pull/910) The JavaScript API is updated to be inline with JavaScript best practices. Registrations of functions and triggers is done with mandatory arguments and a single optional object.
  * [#935](https://github.com/RedisGears/RedisGears/pull/935) Ability to load an RDB from a Redis Server with the RedisGears module loaded but NOT used into a Redis Server without the RedisGears module.
  * Updated commands:
    * [#910](https://github.com/RedisGears/RedisGears/pull/910) `TFUNCTION` and `TFCALL` is used instead of `RG.FUNCTION` and `RG.FCALL`.
    * [#939](https://github.com/RedisGears/RedisGears/pull/939) The commands are updated to match the Redis Functions commands. `TFCALL` combines the library and function in a single argument with '.' separated. Example: `TFCALL <library_name>.<function_name>`.
    * [#900](https://github.com/RedisGears/RedisGears/pull/900) rated the ability to run functions as a coroutine in `TFCALLASYNC`. Clients rely on `TFCALL` to never block shared connections so other commands are not delayed on such connections.


 **Improvements**
* **Search and Query**:
  * [#3641](https://github.com/RediSearch/RediSearch/pull/3641) Indexing sanitizing trigger in heavily data updates scenario.
  * [#3614](https://github.com/RediSearch/RediSearch/pull/3614) Several improvements in the aggregations execution pipeline.

* **Triggers and Functions**:
  * [#906](https://github.com/RedisGears/RedisGears/pull/906) Limit the total memory usage of all combined libraries, the values can be configured during module load.
  * [#940](https://github.com/RedisGears/RedisGears/pull/940) Validate the current memory usage when uploading a new library to not exceed the max memory limit.



**Changed Behavior**
* **Search and Query**:
  * [#3355](https://github.com/RediSearch/RediSearch/pull/3355), [#3635](https://github.com/RediSearch/RediSearch/pull/3635) Expired keys deleted from slave's index, returning an empty array instead of `nil`.

**Bug Fixes**
* **Search and Query**:
  * [#3597](https://github.com/RediSearch/RediSearch/pull/3597) Duplicating alias as output name on `FT.AGGREGATE` reducer (`REDUCE` argument) isn't return results.
  * [#3654](https://github.com/RediSearch/RediSearch/pull/3654) Added check for `@` prefix on `GROUPBY` fields returnig an error instead of wrong results.
  * [#3501](https://github.com/RediSearch/RediSearch/pull/3501) Sorting by 2 or more fields follow the order not ignoring the second argument.
  * [#3582](https://github.com/RediSearch/RediSearch/pull/3582) Sorter will set lower rank in documents expired during query time, preventing clients to freeze.

* **JSON**:
  * [#1025](https://github.com/RedisJSON/RedisJSON/pull/1025) `JSON.TOGGLE` key space notification fix.

* **Time series**:
  * [#1471](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1471) Potential crash on `MRANGE` when aggregating millions of time series.
  * [#1469](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1469) Potential memory leak in `MRANGE` after eviction.

* **Triggers and Functions**:
  * [#913](https://github.com/RedisGears/RedisGears/pull/913) Do not trigger notifications when Redis is loading from a persistence file.

**Redis version**
* __[Redis 7.2 RC2](https://github.com/redis/redis/blob/7.2/00-RELEASENOTES)__

**Module versions**	
* __[RediSearch 2.8.3](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.3)__
* __[RedisJSON 2.6.2](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.2)__
* __[RedisTimeSeries 1.10.1](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.1)__
* __[RedisBloom 2.6.1](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.1)__
* __[RedisGears 2.0.6](https://github.com/RedisGears/RedisGears/releases/tag/v2.0.6-m07)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.4.3 or greater](https://github.com/redis/jedis/releases/tag/v4.4.3)
  * [redis-om-spring 0.8.1 or greater](https://github.com/redis/redis-om-spring/releases/tag/v0.8.1)
* Python
  * [redis-py 4.5.5 or greater ](https://github.com/redis/redis-py/releases/tag/v4.5.5)
  * [redis-om-python 0.1.2 or greater](https://github.com/redis/redis-om-python/releases/tag/v0.1.2)
* NodeJS
  * [node-redis 4.6.7 or greater](https://github.com/redis/node-redis/releases/tag/redis%404.6.7)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/releases/tag/v0.2.0)
* .NET
  * [redis-om-dotnet 0.5.1 or greater](https://github.com/redis/redis-om-dotnet/releases/tag/v0.5.1)
  * [NRedisStack 0.7.0 or greater](https://github.com/redis/NRedisStack/releases/tag/v0.7.0)
* Go
  * [go-redis 9.0.4 or greater](https://github.com/redis/go-redis/releases/tag/v9.0.4)
  * [rueidis 1.0.3 or greater](https://github.com/redis/rueidis/releases/tag/v1.0.3)

Compatible with the latest [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.26](https://github.com/RedisInsight/RedisInsight/releases/tag/2.26.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.

## Redis Stack 7.2.0-rc1 (June 2023)

This is the first release of Redis Stack version 7.2.0.

### Headlines:
This version contains the latest **Search and Query** capability, **JSON** capability, and a new version of RedisInsight. 
The latest **Search and Query** capability introduces new and frequently asked Geo Polygon Search. Adding the `GEOMETRY` field type that supports polygon shapes using [WKT](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) notation. In addition, it brings improvements in performance for `SORT BY` operations using `FT.SEARCH` and `FT.AGGREGATE`.
The latest **JSON** capability introduces the new `JSON.MERGE` in compliance with [RFC 7396](https://datatracker.ietf.org/doc/html/rfc7396), and `JSON.MSET`, which supports atomic multiple sets for keys in the same hash slot.

### Details:
**Features**
* **Search and Query**:
  * [#3553](https://github.com/RediSearch/RediSearch/pull/3553) Introduce support for Geo-polygon shapes and queries
    * [#3476](https://github.com/RediSearch/RediSearch/pull/3476) Adding `GEOMETRY` [field type](https://redis.io/commands/ft.create/) to map polygons in the `SCHEMA` on `FT.CREATE`
    * Adding polygons using [WKT notation](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry), for example `POLYGON((x1 y1, x2 y2, ...))`
    * [#3556](https://github.com/RediSearch/RediSearch/pull/3556) Adjust the [query syntax](https://redis.io/commands/ft.search/#examples) on `FT.SEARCH` for Polygons using the predicate `@geom:[OPERATOR $poly]` and defining polygon in WKT format as `PARAMS 2 poly "POLYGON((10 20, ...))"` using `DIALECT 3`
    * Initially `WITHIN` and `CONTAINS` operators with Geometries only
  * [#3046](https://github.com/RediSearch/RediSearch/pull/3046) Introduce the `OPTIMIZE` keyword to `SORTBY` queries using `FT.SEARCH` and `FT.AGGREGATE` that improve performance in 4 different scenarios:
    * **Skip Sorter** - applied when there is no sort of any kind. The query can return once it reaches the `LIMIT` requested results.
    * **Partial Range** - applied when there is a `SORTBY` numeric field, with no filter or filter by the same numeric field, the query iterate on a range large enough to satisfy the `LIMIT` requested results.
    * **Hybrid** - applied when there is a `SORTBY` numeric field in addition to another non-numeric filter. Some results will get filtered, and the initial range may not be large enough. The iterator then is rewinded with the following ranges, and an additional iteration takes place to collect the `LIMIT` requested results.
    * **No optimization** - If there is a sort by score or non-numeric field, there is no other option but to retrieve all results and compare their values.

* **JSON**:
  * [#916](https://github.com/RedisJSON/RedisJSON/pull/916) Introduce the new `JSON.MERGE` in compliance with [RFC 7396](https://datatracker.ietf.org/doc/html/rfc7396), supporting:
    * Creating new attributes on an existing JSON document
    * Updating and replacing values in parent and child attributes
    * Deleting existing attributes (giving `null` as value)
    * Array update - replacing an entire array with the new value
  * [#944](https://github.com/RedisJSON/RedisJSON/pull/944) Introduce `JSON.MSET`, supporting atomic multiple sets for keys in the same hash slot

 **Improvements**
* **Search and Query**:
  * [#3628](https://github.com/RediSearch/RediSearch/pull/3628) Background indexing scanning performance

**Changed Behavior**
* **Search and Query**:
  * [#3355](https://github.com/RediSearch/RediSearch/pull/3355) Expired keys deleted from the slave's index, returning an empty array instead of `nil`

**Bug Fixes**
* **Search and Query**:
  * [#3562](https://github.com/RediSearch/RediSearch/pull/3562) Index definition may load several times when using `REPLICAOF` causing a failure
  * [#3557](https://github.com/RediSearch/RediSearch/pull/3557) `TIMEOUT` configuration on `FT.AGGREGATE` query being ignored
  * [#3606](https://github.com/RediSearch/RediSearch/pull/3606) Update numeric inverted index `numEntries` avoiding excessive memory consumption
  * [#3552](https://github.com/RediSearch/RediSearch/pull/3552) `FT.CURSOR READ` on `JSON` numeric queries not returning results

**Redis version**
* __[Redis 7.2 RC2](https://github.com/redis/redis/blob/7.2/00-RELEASENOTES)__

**Module versions**	
* __[RediSearch 2.8.2](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.2)__
* __[RedisJSON 2.6.1](https://github.com/RedisJSON/RedisJSON/releases/tag/v2.6.1)__
* __[RedisTimeSeries 1.10.0](https://github.com/RedisTimeSeries/RedisTimeSeries/releases/tag/v1.10.0)__
* __[RedisBloom 2.6.0](https://github.com/RedisBloom/RedisBloom/releases/tag/v2.6.0)__

**Recommended Client Libraries**
* Java
  * [Jedis 4.4.0 or greater](https://github.com/redis/jedis/releases/)
  * [redis-om-spring 0.8.1 or greater](https://github.com/redis/redis-om-spring/releases)
* Python
  * [redis-py 4.5.5 or greater ](https://github.com/redis/redis-py/releases)
  * [redis-om-python 0.1.2 or greater](https://github.com/redis/redis-om-python/releases)
* NodeJS
  * [node-redis 4.6.6 or greater](https://github.com/redis/node-redis/releases)
  * [redis-om-node 0.2.0 or greater](https://github.com/redis/redis-om-node/tags)
* .NET
  * [redis-om-dotnet 0.5.1 or greater](https://github.com/redis/redis-om-dotnet/releases)
  * [NRedisStack 0.6.1 or greater](https://github.com/redis/NRedisStack/releases)
* Go
  * [go-redis 9.0.4 or greater](https://github.com/redis/go-redis/releases)
  * [rueidis 1.0.3 or greater](https://github.com/redis/rueidis/releases)

Compatible with the latest [RedisInsight](https://redis.io/download). The docker image redis/redis-stack for this version is bundled with [RedisInsight 2.26](https://github.com/RedisInsight/RedisInsight/releases/tag/2.26.0).

Note: version numbers follow the pattern:

`x.y.z-b`
* `x.y` Redis major version
* `z` increases with even numbers as a module x.y version increases.
* `b` denotes a patch to Redis or a module (any `z` of Redis or modules). `b` will consist of a `v` + numeric value.
