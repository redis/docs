---
Title: Redis Open Source 8.4 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Open Source 8.4 release notes.
linkTitle: v8.4.0 (November 2025)
min-version-db: blah
min-version-rs: blah
weight: 15
---

## Redis Open Source 8.4-RC1 (November 2025)

This is the first Release Candidate of Redis 8.4 in Redis Open Source.

Release Candidates are feature-complete pre-releases. Pre-releases are not suitable for production use.

### Binary distributions

- Alpine and Debian Docker images - https://hub.docker.com/_/redis
- Install using snap - see https://github.com/redis/redis-snap
- Install using brew - see https://github.com/redis/homebrew-redis
- Install using RPM - see https://github.com/redis/redis-rpm
- Install using Debian APT - see https://github.com/redis/redis-debian

### Redis 8.4 was tested on the following operating systems

- Ubuntu 22.04 (Jammy Jellyfish), 24.04 (Noble Numbat)
- Rocky Linux 8.10, 9.5
- AlmaLinux 8.10, 9.5
- Debian 12 (Bookworm), Debian 13 (Trixie)
- macOS 13 (Ventura), 14 (Sonoma), 15 (Sequoia)

### New Features (compared to 8.2.3)

- [#14414](https://github.com/redis/redis/pull/14414) New command: `CLUSTER MIGRATION` - atomic slot migration.
- [#14435](https://github.com/redis/redis/pull/14435) New commands: `DELEX` and `DIGEST`; `SET` extensions - atomic compare-and-set and compare-and-delete for string keys.
- [#14434](https://github.com/redis/redis/pull/14434) New command: `MSETEX` - set multiple keys and update their expiration.
- [#14402](https://github.com/redis/redis/pull/14402) `XREADGROUP` - add `CLAIM min-idle-time` to consume both idle pending entries and incoming entries.
- [#14058](https://github.com/redis/redis/pull/14058) Add auto-repair options for broken AOF tail on startup.
- [#14296](https://github.com/redis/redis/pull/14296) Support decoding JSON empty array as a Lua array.
- RedisTimeSeries/RedisTimeSeries[#1773](https://github.com/redistimeseries/redistimeseries/pull/1773) `HELP` and `COMMAND DOCS` now support time series commands (MOD-8133).
- RedisBloom/RedisBloom[#892](https://github.com/redisbloom/redisbloom/pull/892) `HELP` and `COMMAND DOCS` now support probabilistic commands (MOD-8133).
- RediSearch/RediSearch[#7076](https://github.com/redisearch/redisearch/pull/7076), RediSearch/RediSearch[#6857](https://github.com/redisearch/redisearch/pull/6857) New Command: `FT.HYBRID` - hybrid queries with RRF and LINEAR combination.
- RediSearch/RediSearch[#7022](https://github.com/redisearch/redisearch/pull/7022) Support index updates when atomic slot migrations occur.
- RediSearch/RediSearch[#6313](https://github.com/redisearch/redisearch/pull/6313) Support multiple I/O threads for RQE cluster manager - Coordinator (MOD-10562).

### Bug fixes (compared to 8.2.3)

- [#14423](https://github.com/redis/redis/pull/14423) Potential infinite loop when a stream is corrupted.
- [#14420](https://github.com/redis/redis/pull/14420) Shutdown blocked client not being properly reset after shutdown cancellation.
- [#14417](https://github.com/redis/redis/pull/14417) `CLUSTER FORGET` - heap-buffer-overflow.
- [#14415](https://github.com/redis/redis/pull/14415) Potential crash in `lookupKey()` when `executing_client` is NULL.
- RedisTimeSeries/RedisTimeSeries[#1776](https://github.com/redistimeseries/redistimeseries/pull/1776) Potential crash on `TS.RANGE` with `ALIGN +`, `AGGREGATION twa` and `EMPTY` (MOD-11620, MOD-10484).

### Performance and resource utilization improvements (compared to 8.2.3)

- [#14440](https://github.com/redis/redis/pull/14440) Lookahead prefetching - parse multiple commands in advance through a lookahead pipeline.
- [#14309](https://github.com/redis/redis/pull/14309) Optimize `BITCOUNT` with AVX2 and AVX512 popcount implementations.
- [#14227](https://github.com/redis/redis/pull/14227) Optimize `BITCOUNT` with Arm Neon SIMD vectorization.
- [#14428](https://github.com/redis/redis/pull/14428) Optimize HyperLogLog with branchless comparisons and Arm Neon SIMD vectorization.
- [#14222](https://github.com/redis/redis/pull/14222) Optimize Vector set `VADD` and `VSIM` with AVX2 and AVX512 dot product implementations.
- RedisJSON/ijson[#9](https://github.com/redisjson/redisjson/pull/9) JSON - memory footprint improvement by using homogeneous arrays (MOD-9511).
- RedisJSON/ijson[#7](https://github.com/redisjson/redisjson/pull/7) JSON - memory footprint improvement by inlining short strings (MOD-9511).

### Configuration parameters

- [#14058](https://github.com/redis/redis/pull/14058) `aof-load-corrupt-tail-max-size` - maximum corrupted tail size (in bytes) to attempt to repair automatically.
- [#14296](https://github.com/redis/redis/pull/14296) `decode_array_with_array_mt` - Lua: control how empty JSON arrays are handled.
- [#14440](https://github.com/redis/redis/pull/14440) `lookahead` - runtime-configurable lookahead depth (default: 16).
- RediSearch/RediSearch[#7065](https://github.com/redisearch/redisearch/pull/7065) `search-default-scorer` - default text and tag scorer (new default is BM25STD).
- RediSearch/RediSearch[#6769](https://github.com/redisearch/redisearch/pull/6769) `search-on-oom` - behavior when OOM event occurs in the query time, supports 3 values:
  - `IGNORE` - queries run despite OOM, not recommended for heavy result sets (current behaviour).
  - `FAIL` - query execution fails if any node is in OOM state at start.
  - `RETURN` - returns partial results if OOM is detected in only some cluster nodes (default).
- RediSearch/RediSearch[#6313](https://github.com/redisearch/redisearch/pull/6313) `search-io-threads` - allow setting the comms threads used by the cluster manager - coordinator (default: 20).

### Known bugs and limitations

- When executing `FT.SEARCH`, `FT.AGGREGATE`, `FT.CURSOR`, `FT.HYBRID`, `TS.MGET`, `TS.MRANGE`, `TS.MREVRANGE` and `TS.QUERYINDEX` while an atomic slot migration process is in progress, the results may be partial or contain duplicates.
- `FT.PROFILE`, `FT.EXPLAIN` and `FT.EXPLACINCLI` don’t contain the `FT.HYBRID` option.
- Metrics from `FT.HYBRID` command aren’t displayed on `FT.INFO` and `INFO`.
- Option `EXPLAINSCORE`, `SHARD_K_RATIO`, `YIELD_DISTANCE_AS`, and `WITHCURSOR` with `FT.HYBRID` are not available
- Post-filtering (after `COMBINE` step) using FILTER is not available.
- Currently, the default response format considers only `key_id` and `score`, this may change for delivering the entire document content.
