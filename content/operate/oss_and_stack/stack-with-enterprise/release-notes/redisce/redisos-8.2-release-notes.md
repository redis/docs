---
Title: Redis Open Source 8.2 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Open Source 8.2 release notes.
linkTitle: v8.2.0 (July 2025)
min-version-db: blah
min-version-rs: blah
weight: 20
---

## Redis Open Source 8.2.0 (July 2025)

This is the first Release Candidate of Redis Open Source 8.2.

Release Candidates are feature-complete pre-releases. Pre-releases are not suitable for production use.

### Headlines

Redis 8.2 introduces major performance and memory footprint improvements, new commands, and command extensions.

8.2-RC1 is available as a Docker image and can be downloaded from [Docker Hub](https://hub.docker.com/_/redis). Additional distributions will be introduced in upcoming pre-releases.

### Security fixes (compared to 8.2-M01)

- (CVE-2025-27151) redis-check-aof may lead to stack overflow and potential RCE

### New Features (compared to 8.2-M01)

- [#14130](https://github.com/redis/redis/pull/14130) Streams - new commands: `XDELEX` and `XACKDEL`; extension to `XADD` and `XTRIM`
- [#14039](https://github.com/redis/redis/pull/14039) New command: `CLUSTER SLOT-STATS` - get per-slot usage metrics such as key count, CPU time, and network I/O
- [#14122](https://github.com/redis/redis/pull/14122) `VSIM` - new `IN` operator for filtering expressions
- [#Q6329](https://github.com/RediSearch/RediSearch/pull/6329), [#Q6394](https://github.com/RediSearch/RediSearch/pull/6394) - Query Engine - new SVS-VAMANA vector index type which supports vector compression (optimized for Intel machines)

### Bug fixes (compared to 8.2-M01)

- [#14143](https://github.com/redis/redis/pull/14143) Gracefully handle short read errors for hashes with TTL during full sync

### Performance and resource utilization improvements (compared to 8.2-M01)

- [#14103](https://github.com/redis/redis/pull/14103) Optimize `BITCOUNT` by introducing prefetching
- [#14121](https://github.com/redis/redis/pull/14121) Optimize `SCAN` by performing expiration checks only on DBs with volatile keys
- [#14140](https://github.com/redis/redis/pull/14140) Optimize expiry check in `scanCallback`
- [#14131](https://github.com/redis/redis/pull/14131) Optimize `LREM`, `LPOS`, `LINSERT`, `ZRANK`, and more by caching `string2ll` results in `quicklistCompare`
- [#14088](https://github.com/redis/redis/pull/14088) Optimize `COPY`, `RENAME`, and `RESTORE` when TTL is used
- [#14074](https://github.com/redis/redis/pull/14074) Reduce the overhead associated with tracking `malloc`’s usable memory
- [#13900](https://github.com/redis/redis/pull/13900) Optimize the client’s cron to avoid blocking the main thread
- [#J1350](https://github.com/RedisJSON/RedisJSON/pull/1350) JSON - memory footprint improvement by inlining numbers (MOD-9511)

### Metrics

- [#14067](https://github.com/redis/redis/pull/14067) `INFO`: `used_memory_peak_time` - time when `used_memory_peak` was hit
- [#13990](https://github.com/redis/redis/pull/13990) `INFO`:
  - `master_current_sync_attempts` - number of times the replica attempted to sync to a master since last disconnection
  - `master_total_sync_attempts` - number of times the replica attempted to sync to a master
  - `master_link_up_since_seconds` - number of seconds since the link has been up
  - `total_disconnect_time_sec` - total cumulative time the replica has been disconnected
