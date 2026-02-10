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
weight: 40
---

## Redis Open Source 8.4.1 (February 2026)

Update urgency: `SECURITY`: There are security fixes in the release.

### Security fixes

- RedisTimeSeries/RedisTimeSeries[#1837](https://github.com/redistimeseries/redistimeseries/pull/1837), RedisJSON/RedisJSON[#1474](https://github.com/redisjson/redisjson/pull/1474) Hide personally identifiable information from server log.
- RedisBloom/RedisBloom[#936](https://github.com/redisbloom/redisbloom/pull/936) Cuckoo filter: crash on RDB load on 0 buckets (MOD-11593).
- RedisBloom/RedisBloom[#945](https://github.com/redisbloom/redisbloom/pull/945) Bloom filter: crash on RDB load on large number of filters (MOD-11590).

### Bug fixes

- [#14637](https://github.com/redis/redis/pull/14637) Atomic slot migration: wrong adjacent slot range behavior.
- [#14567](https://github.com/redis/redis/pull/14567) Atomic slot migration: support delay trimming slots after finishing migrating slots.
- [#14746](https://github.com/redis/redis/pull/14746) `CLUSTER SLOT-STATS`: Fix a few memory tracking bugs.
- RedisTimeSeries/RedisTimeSeries[#1864](https://github.com/redistimeseries/redistimeseries/pull/1864) Atomic slot migration: time series limitations (MOD-13611).
- RediSearch/RediSearch[#6973](https://github.com/redisearch/redisearch/pull/6973) Correct empty string token counting in `byteOffset` calculations to ensure accurate text position tracking (MOD-11233).
- RediSearch/RediSearch[#6995](https://github.com/redisearch/redisearch/pull/6995) Prevent `FT.INFO` command fanout to replicas to reduce unnecessary cluster traffic.
- RediSearch/RediSearch[#7154](https://github.com/redisearch/redisearch/pull/7154) Display Background Indexing OOM warning in `FT.AGGREGATE` when memory limits are approached (MOD-11817).
- RediSearch/RediSearch[#7219](https://github.com/redisearch/redisearch/pull/7219) Resolve concurrency issue in `FT.AGGREGATE `reducer that caused intermittent errors (MOD-12243).
- RediSearch/RediSearch[#7255](https://github.com/redisearch/redisearch/pull/7255) Correct `BM25STD` underflow wraparound to prevent incorrect scoring (MOD-12223).
- RediSearch/RediSearch[#7264](https://github.com/redisearch/redisearch/pull/7264) Ensure accurate `totalDocsLen` updates to maintain correct document statistics (MOD-12234).
- RediSearch/RediSearch[#7275](https://github.com/redisearch/redisearch/pull/7275) Report used memory as `unsigned long` to prevent overflow (RED-169833).
- RediSearch/RediSearch[#7350](https://github.com/redisearch/redisearch/pull/7350) `FT.CREATE` with LeanVec parameters on non-Intel architectures (RED-176382).
- RediSearch/RediSearch[#7371](https://github.com/redisearch/redisearch/pull/7371) Validate `search-min-operation-workers` min value correctly (MOD-12383).
- RediSearch/RediSearch[#7430](https://github.com/redisearch/redisearch/pull/7430) Prevent coordinator deadlock in `FT.HYBRID` queries by avoiding index read lock (MOD-12489).
- RediSearch/RediSearch[#7435](https://github.com/redisearch/redisearch/pull/7435) Ensure full profile output on timeout with `RETURN` policy in `FT.PROFILE` (MOD-12320).
- RediSearch/RediSearch[#7446](https://github.com/redisearch/redisearch/pull/7446) Remove outdated validation from debug aggregate in cluster mode (MOD-12435).
- RediSearch/RediSearch[#7455](https://github.com/redisearch/redisearch/pull/7455) Ensure internal cursors are deleted immediately in cluster mode (MOD-12493).
- RediSearch/RediSearch[#7458](https://github.com/redisearch/redisearch/pull/7458) Correct GC regression that caused stability issues (MOD-12538).
- RediSearch/RediSearch[#7460](https://github.com/redisearch/redisearch/pull/7460) Prevent potential double-free on error path in Fork GC (MOD-12521).
- RediSearch/RediSearch[#7499](https://github.com/redisearch/redisearch/pull/7499) Propagate `HGETALL` command in HDT mode (MOD-12662).
- RediSearch/RediSearch[#7534](https://github.com/redisearch/redisearch/pull/7534) Reduce number of worker threads asynchronously to prevent performance degradation (MOD-12252, MOD-11658).
- RediSearch/RediSearch[#7553](https://github.com/redisearch/redisearch/pull/7553) Handle `WITHSCORES` correctly when `SCORE` is sent alone without extra fields in coordinator (MOD-12647).
- RediSearch/RediSearch[#7560](https://github.com/redisearch/redisearch/pull/7560) Properly handle connection closing in IO thread at shutdown and fix `searchRequestCtx` freeing on error (MOD-12699).
- RediSearch/RediSearch[#7685](https://github.com/redisearch/redisearch/pull/7685) Resolve cursor logical leak that could lead to resource exhaustion (MOD-12807).
- RediSearch/RediSearch[#7710](https://github.com/redisearch/redisearch/pull/7710) Support for `WITHCOUNT` in `FT.AGGREGATE` (MOD-11751).
- RediSearch/RediSearch[#7794](https://github.com/redisearch/redisearch/pull/7794) Correctly handle binary data with embedded nulls to prevent crashes (MOD-13010).
- RediSearch/RediSearch[#7812](https://github.com/redisearch/redisearch/pull/7812) Correct SVS GC for no-workers case (MOD-12983).
- RediSearch/RediSearch[#7815](https://github.com/redisearch/redisearch/pull/7815) Fix command routing in cluster mode by not relying on shard index (MOD-13049).
- RediSearch/RediSearch[#7823](https://github.com/redisearch/redisearch/pull/7823) Support vector blob only through parameter in `FT.HYBRID`(MOD-13123).
- RediSearch/RediSearch[#7873](https://github.com/redisearch/redisearch/pull/7873) Handle warnings in empty `FT.AGGREGATE` replies in cluster mode (MOD-12640).
- RediSearch/RediSearch[#7897](https://github.com/redisearch/redisearch/pull/7897) Remove asserts from `DownloadFile` to prevent crash (MOD-13096).
- RediSearch/RediSearch[#7901](https://github.com/redisearch/redisearch/pull/7901) Support multiple warnings in reply to prevent warning loss (MOD-13252).
- RediSearch/RediSearch[#7903](https://github.com/redisearch/redisearch/pull/7903) Eliminate memory leak in `FT.HYBRID` queries with Active-Active enabled (MOD-13143).
- RediSearch/RediSearch[#7886](https://github.com/redisearch/redisearch/pull/7886) Remove non-TEXT fields from spec's keys dictionary to prevent incorrect field handling (MOD-13150).
- RediSearch/RediSearch[#7905](https://github.com/redisearch/redisearch/pull/7905) Remove non-TEXT fields from spec's keys dictionary and refactor keys dict (MOD-13150, MOD-13151).
- RediSearch/RediSearch[#7978](https://github.com/redisearch/redisearch/pull/7978) Avoid using negative key position values during command registration (MOD-13332).
- RediSearch/RediSearch[#8052](https://github.com/redisearch/redisearch/pull/8052) Resolve incorrect results when using `LOAD *` with `FT.HYBRID` (MOD-12736, MOD-13556).
- RediSearch/RediSearch[#8083](https://github.com/redisearch/redisearch/pull/8083) Correct `FULLTEXT` field metric count accuracy (MOD-13432).
- RediSearch/RediSearch[#8089](https://github.com/redisearch/redisearch/pull/8089) Handle edge case in clusterset (MOD-13562).
- RediSearch/RediSearch[#8151](https://github.com/redisearch/redisearch/pull/8151) Correct `FT.PROFILE` shard total profile time calculation (MOD-13735, MOD-13181).
- RediSearch/RediSearch[#8153](https://github.com/redisearch/redisearch/pull/8153) Resolve config registration issue (RED-171841).
- RediSearch/RediSearch[#7449](https://github.com/redisearch/redisearch/pull/7449) Ensure `FT.HYBRID` respects timeout settings (MOD-11004).
- RediSearch/RediSearch[#7238](https://github.com/redisearch/redisearch/pull/7238) Initialize `GIL_TIME` properly for `FT.PROFILE` (MOD-12553).
- RediSearch/RediSearch[#7453](https://github.com/redisearch/redisearch/pull/7453) Error behavior on early bailout and split OOM warning for shard and coordinator (MOD-12449).
- RediSearch/RediSearch[#7615](https://github.com/redisearch/redisearch/pull/7615) Parameter `numDocs` from non-optimized wildcard iterator (MOD-12392).
- RediSearch/RediSearch[#7165](https://github.com/redisearch/redisearch/pull/7165) (Redis Enterprise only) `FT.DROPINDEX` as touches-arbitrary-keys for proper cluster handling causing crash on A-A (MOD-11090).
- RediSearch/RediSearch[#7023](https://github.com/redisearch/redisearch/pull/7023) (Redis Enterprise only) Ensure all `FT.SUG*` commands are hashslot-aware to prevent cluster routing errors (MOD-11756).

### Performance and resource utilization improvements

- RediSearch/RediSearch[#7496](https://github.com/redisearch/redisearch/pull/7496) Vector search performance improvements (MOD-12011, MOD-12063, MOD-12629, MOD-12346).
- RediSearch/RediSearch[#7519](https://github.com/redisearch/redisearch/pull/7519) Reduce number of worker threads asynchronously to improve resource utilization (MOD-12252, MOD-11658).
- RediSearch/RediSearch[#7694](https://github.com/redisearch/redisearch/pull/7694) Use asynchronous jobs in GC for SVS to reduce blocking (MOD-12668).
- RediSearch/RediSearch[#7730](https://github.com/redisearch/redisearch/pull/7730) Support `filter_policy` and `batch_size` parameters for vector similarity search tuning (MOD-13007, MOD-12371).
- RediSearch/RediSearch[#7782](https://github.com/redisearch/redisearch/pull/7782) Resolve SVS GC failures when worker threads are disabled (MOD-12983).
- RediSearch/RediSearch[#7572](https://github.com/redisearch/redisearch/pull/7572) Implement ASM state machine on notifications (MOD-12170).
- RediSearch/RediSearch[#7829](https://github.com/redisearch/redisearch/pull/7829) ASM-aware search flow for Active-Active deployments (MOD-12171, MOD-12169).
- RediSearch/RediSearch[#7589](https://github.com/redisearch/redisearch/pull/7589) Support multiple slot ranges in `search.CLUSTERSET` for flexible cluster topology updates (MOD-11657).
- RediSearch/RediSearch[#7862](https://github.com/redisearch/redisearch/pull/7862) Support subquery count in `FT.HYBRID` (MOD-11858, MOD-13146).
- RediSearch/RediSearch[#7893](https://github.com/redisearch/redisearch/pull/7893) Request policy support for cursor operations (MOD-13146, MOD-9573, MOD-8104).
- RediSearch/RediSearch[#8087](https://github.com/redisearch/redisearch/pull/8087) Warning when cursor may give inaccurate results due to Active-Active replication (MOD-12899).
- RediSearch/RediSearch[#7445](https://github.com/redisearch/redisearch/pull/7445) Remove outdated validation from Debug Aggregate in cluster mode (MOD-12435).
- RediSearch/RediSearch[#7384](https://github.com/redisearch/redisearch/pull/7384) Reduce index load from RDB temporary memory overhead (MOD-12212).

### Metrics

- RediSearch/RediSearch[#7960](https://github.com/redisearch/redisearch/pull/7960) Persist query warnings across cursor reads (MOD-12984).
- RediSearch/RediSearch[#7612](https://github.com/redisearch/redisearch/pull/7612) Track `maxprefixexpansions` errors and warnings in info (MOD-12417).
- RediSearch/RediSearch[#7872](https://github.com/redisearch/redisearch/pull/7872) Handle warnings in empty `FT.AGGREGATE` replies in cluster mode (MOD-12640).
- RediSearch/RediSearch[#7900](https://github.com/redisearch/redisearch/pull/7900) Support multiple warnings in reply (MOD-13252).
- RediSearch/RediSearch[#7576](https://github.com/redisearch/redisearch/pull/7576) Track OOM errors and warnings in info (MOD-12418).
- RediSearch/RediSearch[#7507](https://github.com/redisearch/redisearch/pull/7507) Track timeout errors and warnings in info (MOD-12419).
- RediSearch/RediSearch[#7341](https://github.com/redisearch/redisearch/pull/7341) Rename `FT.PROFILE` counter fields for clarity .(MOD-6056)
- RediSearch/RediSearch[#7436](https://github.com/redisearch/redisearch/pull/7436), RediSearch/RediSearch[#7427](https://github.com/redisearch/redisearch/pull/7427) Enhance `FT.PROFILE` with vector search execution details (MOD-12263).
- RediSearch/RediSearch[#7573](https://github.com/redisearch/redisearch/pull/7573) Debug support for `FT.PROFILE` command (MOD-12627).
- RediSearch/RediSearch[#7736](https://github.com/redisearch/redisearch/pull/7736) Add `Internal cursor reads` metric to cluster `FT.PROFILE` output (MOD-12414).
- RediSearch/RediSearch[#7692](https://github.com/redisearch/redisearch/pull/7692) Declare query error struct on `_FT.CURSOR PROFILE` (MOD-12955).
- RediSearch/RediSearch[#7848](https://github.com/redisearch/redisearch/pull/7848) Store and display shard ID in profile output (MOD-12321).
- RediSearch/RediSearch[#7422](https://github.com/redisearch/redisearch/pull/7422) Track syntax and argument errors in query error metrics (MOD-12416).
- RediSearch/RediSearch[#7552](https://github.com/redisearch/redisearch/pull/7552) Add `active_io_threads` metric (MOD-12069, MOD-12695).
- RediSearch/RediSearch[#7622](https://github.com/redisearch/redisearch/pull/7622) Add `active_coord_threads` metric (MOD-12694, MOD-12069).
- RediSearch/RediSearch[#7564](https://github.com/redisearch/redisearch/pull/7564) Add `active_worker_threads` metric (MOD-12694, MOD-12069).
- RediSearch/RediSearch[#7626](https://github.com/redisearch/redisearch/pull/7626) Add `*_pending_jobs` metrics for job queues (MOD-12069).
- RediSearch/RediSearch[#7658](https://github.com/redisearch/redisearch/pull/7658) Add pending workers admin jobs metric (MOD-12069, MOD-12791).
- RediSearch/RediSearch[#7731](https://github.com/redisearch/redisearch/pull/7731) Add `active_topology_update_threads` metric (MOD-12069, MOD-12790).
- RediSearch/RediSearch[#7760](https://github.com/redisearch/redisearch/pull/7760) Extend indexing metrics for more detailed performance data (MOD-12070).

### Configuration parameters

- RediSearch/RediSearch[#7083](https://github.com/redisearch/redisearch/pull/7083) Add default scorer configuration option (MOD-10037).

## Redis Open Source 8.4.0 (November 2025)

This is the General Availability (GA) release of Redis 8.4 in Redis Open Source.

### Major changes compared to Redis 8.2

- `DIGEST`, `DELEX`; `SET` extensions - atomic compare-and-set and compare-and-delete for string keys
- `MSETEX` - atomically set multiple string keys and update their expiration
- `XREADGROUP` - new `CLAIM` option for reading both idle pending and incoming stream entries
- `CLUSTER MIGRATION` - atomic slot migration
- `CLUSTER SLOT-STATS` - per-slot usage metrics: key count, CPU time, and network I/O
- Redis query engine: `FT.HYBRID` - hybrid search and fused scoring
- Redis query engine: I/O threading with performance boost for search and query commands (`FT.*`) 
- I/O threading: substantial throughput increase (e.g. >30% for caching use cases (10% `SET`, 90% `GET`), 4 cores)
- JSON: substantial memory reduction for homogenous arrays (up to 91%)

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

### Bug fixes (compared to 8.4-RC1)

- [#14524](https://github.com/redis/redis/pull/14524) `XREADGROUP CLAIM` returns strings instead of integers
- [#14529](https://github.com/redis/redis/pull/14529) Add variable key-spec flags to `SET IF*` and `DELEX`
- #P928 Potential memory leak (MOD-11484)
- #T1801, #T1805 macOS build failures (MOD-12293)
- #J1438 `JSON.NUMINCRBY` - wrong result on integer array with non-integer increment (MOD-12282)
- #J1437 Thread safety issue related to ASM and shared strings (MOD-12013)

### Performance and resource utilization improvements (compared to 8.4-RC1)

- [#14480](https://github.com/redis/redis/pull/14480), [#14516](https://github.com/redis/redis/pull/14516) Optimize `XREADGROUP`

### Known bugs and limitations

- When executing `FT.SEARCH`, `FT.AGGREGATE`, `FT.CURSOR`, `FT.HYBRID`, `TS.MGET`, `TS.MRANGE`, `TS.MREVRANGE` and `TS.QUERYINDEX` while an atomic slot migration process is in progress, the results may be partial or contain duplicates.
- `FT.PROFILE`, `FT.EXPLAIN` and `FT.EXPLACINCLI` do not contain the `FT.HYBRID` option.
- Metrics from `FT.HYBRID` command aren’t displayed on `FT.INFO` and `INFO`.
- Option `EXPLAINSCORE`, `SHARD_K_RATIO`, `YIELD_DISTANCE_AS` and `WITHCURSOR` with `FT.HYBRID` are not available.
- Post-filtering (after `COMBINE` step) using FILTER is not available.
- Currently the default response format considers only `key_id` and `score`, this may change for delivering entire document content.

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
