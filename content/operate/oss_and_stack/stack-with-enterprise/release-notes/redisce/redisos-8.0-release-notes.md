---
Title: Redis Open Source 8.0 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Open Source 8.0 release notes.
linkTitle: v8.0.0 (May 2025)
min-version-db: blah
min-version-rs: blah
weight: 40
---

## Redis Open Source 8.0.3 (July 2025)

Update urgency: `SECURITY`: There are security fixes in the release.

### Security fixes

* (CVE-2025-32023) Fix out-of-bounds write in `HyperLogLog` commands
* (CVE-2025-48367) Retry accepting other connections even if the accepted connection reports an error

### New Features

- [#14065](https://github.com/redis/redis/pull/14065) `VSIM`: Add new `WITHATTRIBS` option to return the JSON attribute associated with an element

### Bug fixes

- [#14085](https://github.com/redis/redis/pull/14085) A short read may lead to an `exit()` on a replica
- [#14092](https://github.com/redis/redis/pull/14092) `db->expires` is not defragmented

## Redis Open Source 8.0.2 (May 2025)

Update urgency: `SECURITY`: There are security fixes in the release.

### Security fixes

- (CVE-2025-27151) redis-check-aof may lead to stack overflow and potential RCE

### Bug fixes
- [#14081](https://github.com/redis/redis/pull/14081) Cron-based timers run twice as fast when active defrag is enabled.

### Other general improvements

- [#14048](https://github.com/redis/redis/pull/14048) `LOLWUT` improvements for Redis 8.

## Redis Open Source 8.0.1 (May 2025)

Update urgency: `MODERATE`: Plan an upgrade of the server, but it's not urgent.

### Performance and resource utilization improvements

- [#13959](https://github.com/redis/redis/pull/13959) Vector sets - faster `VSIM` `FILTER` parsing.

### Bug fixes

- [#QE6083](https://github.com/RediSearch/RediSearch/pull/6083) Query Engine - revert default policy `search-on-timeout` to `RETURN`.
- [#QE6050](https://github.com/RediSearch/RediSearch/pull/6050) Query Engine - `@__key` on `FT.AGGREGATE` used as reserved field name preventing access to Redis keyspace.
- [#QE6077](https://github.com/RediSearch/RediSearch/pull/6077) Query Engine - crash when calling `FT.CURSOR DEL` while reading from the CURSOR.

### Notes

- Fixed incorrect text in the license files.

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
    and contains new configuration parameters for Redis Query Engine and the new data structures.
  - New ACL categories: `@search`, `@json`, `@timeseries`, `@bloom`, `@cuckoo`, `@cms`, `@topk`, and `@tdigest` commands are also included in the existing ACL categories such as `@read` and `@write`. See [below]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.0-release-notes/#potentially-breaking-changes-to-acls" >}}) for information about potentially breaking changes.
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

{{<embed-md "redis8-breaking-changes-acl.md">}}

### Redis 8 introduces the following data structure and processing engine ACL categories.

| New ACL commands category names | Included commands               |
| :----                           | :----                           |
| `search`                        | All Redis Query Engine commands |
| `json`                          | All JSON commands               |
| `timeseries`                    | All time series commands        |
| `bloom`                         | All Bloom filter commands       |
| `cuckoo`                        | All cuckoo filter commands      |
| `topk`                          | All top-k commands              |
| `cms`                           | All count-min sketch commands   |
| `tdigest`                       | All t-digest commands           |

You can use these new categories in your ACL rules.

### Time series notes

The following time series commands retrieve data from all keys that match a given filter expression: `TS.MGET`, `TS.MRANGE`, and `TS.MREVRANGE`. 

There can be a case where a user may have to only some of the matching keys. In such cases, the command’s result is an error message: "*current user doesn't have read permission to one or more keys that match the specified filter*".

On the other hand, `TS.QUERYINDEX` does not require `@read` access to the keys that match the specified filter, as it accesses only time series metadata (name and labels) and not content (measurements).

### Redis Query Engine notes

The following Redis Query Engine commands may retrieve data from all keys that match the prefixes defined in the index (that is, all indexed documents, per-index):

- `FT.SEARCH`  
- `FT.AGGREGATE` (may be followed by `FT.CURSOR`)  
- `FT.PROFILE`

Only ACL users with access to a superset of the key prefixes defined during index creation can create, modify, or read the index. For example, a user with the key ACL pattern `h:*` can create an index with keys prefixed by `h:*` or `h:p*`, but not keys prefixed by `h*`, `k:*`, or `k*`, because these prefixes may involve keys to which the user does not have access.