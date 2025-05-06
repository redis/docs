---
Title: Redis Open Source 8.0.0 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Open Source 8.0.0 release notes.
linkTitle: v8.0.0 (May 2025)
min-version-db: blah
min-version-rs: blah
weight: 10
---

## Redis Open Source 8.0.0 (May 2025)

This is the General Availability release of Redis Open Source 8.0.

Redis 8.0 deprecates previous Redis and Redis Stack versions.

Stand alone RediSearch, RedisJSON, RedisTimeSeries, and RedisBloom modules are no longer needed as they are now part of Redis.


### Major changes compared to 7.4.2

- Name change: Redis Community Edition is now Redis Open Source
- License change: licensed under your choice of 
  - (a) the Redis Source Available License 2.0 (RSALv2); or
  - (b) the Server Side Public License v1 (SSPLv1); or
  - (c) the GNU Affero General Public License (AGPLv3)
- Redis Query Engine and 8 new data structures are now an integral part of Redis 8.
  - (1) Redis Query Engine, which now supports both horizontal and vertical scaling for search, query, and vector workloads.
  - (2) JSON, a queryable JSON document data type.
  - (3) Time series.
  - (4-8) Five probabilistic data structures: Bloom filter, Cuckoo filter, Count-min sketch, Top-k, and t-digest.
  - (9) Vector set [preview], a data structure designed for vector similarity search, inspired by sorted set.
  - These nine components are included in all binary distributions.

  - See the [build instructions]({{< relref "/operate/oss_and_stack/install/build-stack" >}}) for information about building from source code.
  - New configuration file: `redis-full.conf`, loads Redis with all components, 
    and contains new configuration parameters for Redis Query Engine and the new data structures .
  - New ACL categories: `@search`, `@json`, `@timeseries`, `@bloom`, `@cuckoo`, `@cms`, `@topk`, and `@tdigest`.
  - Commands are also included in the existing ACL categories such as `@read` and `@write`.

- More than 30 performance and resource utilization improvements.
- A new I/O threading implementation, which enables throughput increase on multi-core environments
  (set with the `io-threads` configuration parameter).
- An improved replication mechanism that is more performant and robust.
- New hash commands: [HGETDEL]({{< relref "/commands/hgetdel/" >}}), [HGETEX]({{< relref "/commands/hgetex" >}}), and [HSETEX]({{< relref "/commands/hsetex/" >}})

For more details, see the release notes for the [8.0-M01](https://github.com/redis/redis/releases/tag/8.0-m01), [8.0-M02](https://github.com/redis/redis/releases/tag/8.0-m02), [8.0-M03](https://github.com/redis/redis/releases/tag/8.0-m03), [8.0-M04](https://github.com/redis/redis/releases/tag/8.0-m04), and [8.0-RC1](https://github.com/redis/redis/releases/tag/8.0-rc1) releases of Redis Open Source.

### Binary distributions

- [Alpine and Debian Docker images](https://hub.docker.com/_/redis)
- [Install using snap](https://github.com/redis/redis-snap)
- [Install using brew](https://github.com/redis/homebrew-redis)
- [Install using RPM](https://github.com/redis/redis-rpm)
- [Install using Debian APT](https://github.com/redis/redis-debian)

### Redis 8.0.0 was tested on the following operating systems
- Ubuntu 20.04 (Focal Fossa), 22.04 (Jammy Jellyfish), and 24.04 (Noble Numbat).
- Rocky Linux 8.10 and 9.5.
- AlmaLinux 8.10 and 9.5.
- Debian 11 (Bullseye) and 12 (Bookworm).
- macOS 13 (Ventura), 14 (Sonoma), and 15 (Sequoia).

### Supported upgrade paths (by replication or persistence)

- From previous Redis versions without modules.
- From previous Redis versions with modules (RediSearch, RedisJSON, RedisTimeSeries, RedisBloom).
- From Redis Stack 7.2 or 7.4.

### Security fixes (compared to 8.0-RC1)

* (CVE-2025-21605) An unauthenticated client can cause an unlimited growth of output buffers

### Bug fixes (compared to 8.0-RC1)

- [#13966](https://github.com/redis/redis/pull/13966), [#13932](https://github.com/redis/redis/pull/13932) `CLUSTER SLOTS` - TLS port update not reflected.
- [#13958](https://github.com/redis/redis/pull/13958) `XTRIM`, `XADD` - incorrect lag due to trimming stream.
- [#13931](https://github.com/redis/redis/pull/13931) `HGETEX` - wrong order of keyspace notifications.
