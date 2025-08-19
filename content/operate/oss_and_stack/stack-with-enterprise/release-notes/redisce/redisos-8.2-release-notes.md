---
Title: Redis Open Source 8.2 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Open Source 8.2 release notes.
linkTitle: v8.2.0 (August 2025)
min-version-db: blah
min-version-rs: blah
weight: 20
---

## Redis Open Source 8.2.1 (August 2025)

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

### Bug fixes

- [#14240](https://github.com/redis/redis/pull/14240) `INFO KEYSIZES` - potential incorrect histogram updates on cluster mode with modules.
- [#14274](https://github.com/redis/redis/pull/14274) Disable Active Defrag during flushing replica.
- [#14276](https://github.com/redis/redis/pull/14276) `XADD` or `XTRIM` can crash the server after loading RDB.
- [#Q6601](https://github.com/RediSearch/RediSearch/pull/6601) Potential crash when running `FLUSHDB` (MOD-10681).

### Performance and resource utilization

- Query Engine - LeanVec and LVQ proprietary Intel optimizations were removed from Redis Open Source.
- [#Q6621](https://github.com/RediSearch/RediSearch/pull/6621) Fix regression in `INFO` (MOD-10779).

## Redis Open Source 8.2 (August 2025)

This is the General Availability release of Redis 8.2 in Redis Open Source.

### Headlines

Redis 8.2 introduces major performance and memory footprint improvements, new commands, and command extensions.

### Major changes compared to 8.0

- Streams - new commands: `XDELEX` and `XACKDEL`; extension to `XADD` and `XTRIM`.
- Bitmap - `BITOP`: new operators: `DIFF`, `DIFF1`, `ANDOR`, and `ONE`.
- Query Engine - new SVS-VAMANA vector index type which supports vector compression.
- More than 15 performance and resource utilization improvements.
- New metrics: per-slot usage metrics, key size distributions for basic data types, and more.

### Binary distributions

- Alpine and Debian Docker images - https://hub.docker.com/_/redis
- Install using snap - see https://github.com/redis/redis-snap
- Install using brew - see https://github.com/redis/homebrew-redis
- Install using RPM - see https://github.com/redis/redis-rpm
- Install using Debian APT - see https://github.com/redis/redis-debian

### Redis 8.0.0 was tested on the following operating systems

- Ubuntu 22.04 (Jammy Jellyfish), 24.04 (Noble Numbat)
- Rocky Linux 8.10, 9.5
- AlmaLinux 8.10, 9.5
- Debian 12 (Bookworm)
- macOS 13 (Ventura), 14 (Sonoma), 15 (Sequoia)

### Security fixes (compared to 8.2-RC1)

- (CVE-2025-32023) Fix out-of-bounds write in `HyperLogLog` commands.
- (CVE-2025-48367) Retry accepting other connections even if the accepted connection reports an error.

### New Features (compared to 8.2-RC1)

- [#14141](https://github.com/redis/redis/pull/14141) Keyspace notifications - new event types:
  - `OVERWRITTEN` - the value of a key is completely overwritten
  - `TYPE_CHANGED` - key type change

### Bug fixes (compared to 8.2-RC1)

- [#14162](https://github.com/redis/redis/pull/14162) Crash when using evport with I/O threads.
- [#14163](https://github.com/redis/redis/pull/14163) `EVAL` crash when error table is empty.
- [#14144](https://github.com/redis/redis/pull/14144) Vector sets - RDB format is not compatible with big endian machines.
- [#14165](https://github.com/redis/redis/pull/14165) Endless client blocking for blocking commands.
- [#14164](https://github.com/redis/redis/pull/14164) Prevent `CLIENT UNBLOCK` from unblocking `CLIENT PAUSE`.
- [#14216](https://github.com/redis/redis/pull/14216) TTL was not removed by the `SET` command.
- [#14224](https://github.com/redis/redis/pull/14224) `HINCRBYFLOAT` removes field expiration on replica.

### Performance and resource utilization improvements (compared to 8.2-RC1)

- [#Q6430](https://github.com/RediSearch/RediSearch/pull/6430) More compression variants for the SVS-VAMANA vector index.
- [#Q6535](https://github.com/RediSearch/RediSearch/pull/6535) `SHARD_K_RATIO` parameter - favor network latency over accuracy for KNN vector query in a Redis cluster (unstable feature) (MOD-10359).
- [#14144](https://github.com/redis/redis/pull/14144) Vector set - improve RDB loading / RESTORE speed by storing the worst link info .

### Modules API

- [#14051](https://github.com/redis/redis/pull/14051) `RedisModule_Get*`, `RedisModule_Set*` - allow modules to access Redis configurations.
- [#14114](https://github.com/redis/redis/pull/14114) `RM_UnsubscribeFromKeyspaceEvents` - unregister a module from specific keyspace notifications.

## Redis Open Source 8.2-RC1 (July 2025)

This is the first Release Candidate of Redis Open Source 8.2.

Release Candidates are feature-complete pre-releases. Pre-releases are not suitable for production use.

### Headlines

Redis 8.2 introduces major performance and memory footprint improvements, new commands, and command extensions.

Redis 8.2-RC1 is available as a Docker image and can be downloaded from [Docker Hub](https://hub.docker.com/_/redis). Additional distributions will be introduced in upcoming pre-releases.

### Security fixes (compared to 8.2-M01)

- (CVE-2025-27151) redis-check-aof may lead to stack overflow and potential RCE

### New Features (compared to 8.2-M01)

- [#14130](https://github.com/redis/redis/pull/14130) Streams - new commands: `XDELEX` and `XACKDEL`; extension to `XADD` and `XTRIM`.
- [#14039](https://github.com/redis/redis/pull/14039) New command: `CLUSTER SLOT-STATS` - get per-slot usage metrics such as key count, CPU time, and network I/O.
- [#14122](https://github.com/redis/redis/pull/14122) `VSIM` - new `IN` operator for filtering expressions.
- [#Q6329](https://github.com/RediSearch/RediSearch/pull/6329), [#Q6394](https://github.com/RediSearch/RediSearch/pull/6394) - Query Engine - new SVS-VAMANA vector index type which supports vector compression (optimized for Intel machines).

### Bug fixes (compared to 8.2-M01)

- [#14143](https://github.com/redis/redis/pull/14143) Gracefully handle short read errors for hashes with TTL during full sync.

### Performance and resource utilization improvements (compared to 8.2-M01)

- [#14103](https://github.com/redis/redis/pull/14103) Optimize `BITCOUNT` by introducing prefetching.
- [#14121](https://github.com/redis/redis/pull/14121) Optimize `SCAN` by performing expiration checks only on DBs with volatile keys.
- [#14140](https://github.com/redis/redis/pull/14140) Optimize expiry check in `scanCallback`.
- [#14131](https://github.com/redis/redis/pull/14131) Optimize `LREM`, `LPOS`, `LINSERT`, `ZRANK`, and more by caching `string2ll` results in `quicklistCompare`.
- [#14088](https://github.com/redis/redis/pull/14088) Optimize `COPY`, `RENAME`, and `RESTORE` when TTL is used.
- [#14074](https://github.com/redis/redis/pull/14074) Reduce the overhead associated with tracking `malloc`’s usable memory.
- [#13900](https://github.com/redis/redis/pull/13900) Optimize the client’s cron to avoid blocking the main thread.
- [#J1350](https://github.com/RedisJSON/RedisJSON/pull/1350) JSON - memory footprint improvement by inlining numbers (MOD-9511).

### Metrics

- [#14067](https://github.com/redis/redis/pull/14067) `INFO`: `used_memory_peak_time` - time when `used_memory_peak` was hit.
- [#13990](https://github.com/redis/redis/pull/13990) `INFO`:
  - `master_current_sync_attempts` - number of times the replica attempted to sync to a master since last disconnection.
  - `master_total_sync_attempts` - number of times the replica attempted to sync to a master.
  - `master_link_up_since_seconds` - number of seconds since the link has been up.
  - `total_disconnect_time_sec` - total cumulative time the replica has been disconnected.
