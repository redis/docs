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
weight: 60
---

## Redis Open Source 8.2.4 (February 2026)

Update urgency: `SECURITY`: There are security fixes in the release.

### Security fixes

- RedisTimeSeries/RedisTimeSeries[#1837](https://github.com/redistimeseries/redistimeseries/pull/1837), RedisJSON/RedisJSON[#1474](https://github.com/redisjson/redisjson/pull/1474) Hide Personally Identifiable Information from server log.

### Bug fixes

- RedisJSON/RedisJSON[#1430](https://github.com/redisjson/redisjson/pull/1430) Malformed panic log messages (MOD-9365).
- RedisBloom/RedisBloom[#945](https://github.com/redisbloom/redisbloom/pull/945) Bloom filter: crash on RDB load on large number of filters (MOD-11590).
- RediSearch/RediSearch[#6973](https://github.com/redisearch/redisearch/pull/6973) Correct empty string token counting in byteOffset calculations to ensure accurate text position tracking (MOD-11233).
- RediSearch/RediSearch[#6995](https://github.com/redisearch/redisearch/pull/6995) Prevent `FT.INFO` command fanout to replicas to reduce unnecessary cluster traffic.
- RediSearch/RediSearch[#7034](https://github.com/redisearch/redisearch/pull/7034) Correct goto statement handling on RDB load.
- RediSearch/RediSearch[#7154](https://github.com/redisearch/redisearch/pull/7154) Display Background Indexing OOM warning in `FT.AGGREGATE` when memory limits are approached (MOD-11817).
- RediSearch/RediSearch[#7219](https://github.com/redisearch/redisearch/pull/7219) Resolve concurrency issue in Reducer that caused intermittent errors (MOD-12243).
- RediSearch/RediSearch[#7255](https://github.com/redisearch/redisearch/pull/7255) Correct `BM25STD` underflow wraparound to prevent incorrect scoring (MOD-12223).
- RediSearch/RediSearch[#7264](https://github.com/redisearch/redisearch/pull/7264) Ensure accurate `totalDocsLen` updates to maintain correct document statistics (MOD-12234).
- RediSearch/RediSearch[#7275](https://github.com/redisearch/redisearch/pull/7275) Report used memory as unsigned long to prevent overflow (RED-169833).
- RediSearch/RediSearch[#7350](https://github.com/redisearch/redisearch/pull/7350) Allow `FT.CREATE` with LeanVec parameters on non-Intel architectures (RED-176382).
- RediSearch/RediSearch[#7384](https://github.com/redisearch/redisearch/pull/7384) Reduce index load from RDB temporary memory overhead (MOD-12212).
- RediSearch/RediSearch[#7435](https://github.com/redisearch/redisearch/pull/7435) Ensure full profile output on timeout with `RETURN` policy in `FT.PROFILE` (MOD-12320).
- RediSearch/RediSearch[#7446](https://github.com/redisearch/redisearch/pull/7446) Remove outdated validation from debug aggregate in cluster mode (MOD-12435).
- RediSearch/RediSearch[#7458](https://github.com/redisearch/redisearch/pull/7458) Correct GC regression that caused stability issues (MOD-12538).
- RediSearch/RediSearch[#7459](https://github.com/redisearch/redisearch/pull/7459) Prevent potential double-free in Fork GC error path (MOD-12521).
- RediSearch/RediSearch[#7470](https://github.com/redisearch/redisearch/pull/7470) Remove draining from Flush callback to avoid blocking.
- RediSearch/RediSearch[#7499](https://github.com/redisearch/redisearch/pull/7499) Propagate `HGETALL` command in HDT mode (MOD-12662).
- RediSearch/RediSearch[#7534](https://github.com/redisearch/redisearch/pull/7534) Reduce number of worker threads asynchronously to prevent performance degradation (MOD-12252, MOD-11658).
- RediSearch/RediSearch[#7554](https://github.com/redisearch/redisearch/pull/7554) Handle Coordinator case when `SCORE` is sent alone without extra fields (MOD-12647).
- RediSearch/RediSearch[#7561](https://github.com/redisearch/redisearch/pull/7561) Prevent memory corruption when freeing searchRequestCtx on error (MOD-12699).
- RediSearch/RediSearch[#7685](https://github.com/redisearch/redisearch/pull/7685) Resolve cursor logical leak that could lead to resource exhaustion (MOD-12807).
- RediSearch/RediSearch[#7710](https://github.com/redisearch/redisearch/pull/7710) Add support for `WITHCOUNT` in `FT.AGGREGATE` (MOD-11751).
- RediSearch/RediSearch[#7794](https://github.com/redisearch/redisearch/pull/7794) Correctly handle binary data with embedded NULLs to prevent crashes (MOD-13010).
- RediSearch/RediSearch[#7812](https://github.com/redisearch/redisearch/pull/7812) Correct SVS GC for no-workers case (MOD-12983).
- RediSearch/RediSearch[#7873](https://github.com/redisearch/redisearch/pull/7873) Handle warnings in empty `FT.AGGREGATE` replies in cluster mode (MOD-12640).
- RediSearch/RediSearch[#7886](https://github.com/redisearch/redisearch/pull/7886) Remove non-TEXT fields from spec's keys dictionary to prevent incorrect field handling (MOD-13150).
- RediSearch/RediSearch[#7901](https://github.com/redisearch/redisearch/pull/7901) Support multiple warnings in reply to prevent warning loss (MOD-13252).
- RediSearch/RediSearch[#8083](https://github.com/redisearch/redisearch/pull/8083) Correct `FULLTEXT` field metric count accuracy (MOD-13432).
- RediSearch/RediSearch[#8153](https://github.com/redisearch/redisearch/pull/8153) Resolve config registration issue (RED-171841).
- RediSearch/RediSearch[#7371](https://github.com/redisearch/redisearch/pull/7371) Validate `search-min-operation-workers` min value correctly (MOD-12383).
- RediSearch/RediSearch[#8151](https://github.com/redisearch/redisearch/pull/8151) Correct `FT.PROFILE` shard total profile time calculation (MOD-13735, MOD-13181).
- RediSearch/RediSearch[#7165](https://github.com/redisearch/redisearch/pull/7165) (Redis Enterprise only) `FT.DROPINDEX` as touches-arbitrary-keys for proper cluster handling causing crash on A-A (MOD-11090).
- RediSearch/RediSearch[#7023](https://github.com/redisearch/redisearch/pull/7023) (Redis Enterprise only) Ensure all `FT.SUG*` commands are hashslot-aware to prevent cluster routing errors (MOD-11756).

### Performance and resource utilization improvements

- RediSearch/RediSearch[#7496](https://github.com/redisearch/redisearch/pull/7496) Vector search performance improvements (MOD-12011, MOD-12063, MOD-12629, MOD-12346).
- RediSearch/RediSearch[#7694](https://github.com/redisearch/redisearch/pull/7694) Use asynchronous jobs in GC for SVS to reduce blocking (MOD-12668).

### Metrics

- RediSearch/RediSearch[#7614](https://github.com/redisearch/redisearch/pull/7614) Track timeout errors and warnings in info (MOD-12419).
- RediSearch/RediSearch[#7646](https://github.com/redisearch/redisearch/pull/7646) Track `maxprefixexpansions` errors and warnings in info (MOD-12417).
- RediSearch/RediSearch[#7957](https://github.com/redisearch/redisearch/pull/7957) Persist query warnings across cursor reads (MOD-12984).
- RediSearch/RediSearch[#7341](https://github.com/redisearch/redisearch/pull/7341) Rename `FT.PROFILE` counter fields for clarity (MOD-6056).
- RediSearch/RediSearch[#7436](https://github.com/redisearch/redisearch/pull/7436) Enhance `FT.PROFILE` with vector search execution details (MOD-12263).
- RediSearch/RediSearch[#7737](https://github.com/redisearch/redisearch/pull/7737) Add `Internal cursor reads` metric to cluster `FT.PROFILE` output (MOD-12414).
- RediSearch/RediSearch[#7692](https://github.com/redisearch/redisearch/pull/7692) Declare query error struct on `_FT.CURSOR PROFILE` (MOD-12955).
- RediSearch/RediSearch[#7552](https://github.com/redisearch/redisearch/pull/7552) Add `active_io_threads` metric (MOD-12069, MOD-12695).
- RediSearch/RediSearch[#7564](https://github.com/redisearch/redisearch/pull/7564) Add `active_worker_threads` metric (MOD-12694, MOD-12069).
- RediSearch/RediSearch[#7623](https://github.com/redisearch/redisearch/pull/7623) Add `active_coord_threads` metric (MOD-12694, MOD-12069).
- RediSearch/RediSearch[#7626](https://github.com/redisearch/redisearch/pull/7626) Add `*_pending_jobs` metrics for job queues (MOD-12069).
- RediSearch/RediSearch[#7672](https://github.com/redisearch/redisearch/pull/7672) Add pending workers admin jobs metric (MOD-12069, MOD-12791).
- RediSearch/RediSearch[#7732](https://github.com/redisearch/redisearch/pull/7732) Introduce `active_topology_update_threads` metric (MOD-12069, MOD-12790).
- RediSearch/RediSearch[#7759](https://github.com/redisearch/redisearch/pull/7759) Extend indexing metrics for better observability (MOD-12070).

### Configuration parameters

- RediSearch/RediSearch[#7083](https://github.com/redisearch/redisearch/pull/7083) Add default scorer configuration option (MOD-10037)

## Redis Open Source 8.2.3 (November 2025)

Update urgency: `SECURITY`: There is a security fix in the release.

### Security fixes

- (CVE-2025-62507) `XACKDEL` - potential stack overflow and RCE

### Bug fixes

- `HGETEX` - potential crash when `FIELDS` is used  and `numfields` is missing
- Potential crash on HyperLogLog with 2GB+ entries
- Cuckoo filter - Division by zero in Cuckoo filter insertion
- Cuckoo filter - Counter overflow
- Bloom filter - Arbitrary memory read/write with invalid filter
- Bloom filter - Out-of-bounds access with empty chain
- Bloom filter - Restore invalid filter
- Top-k - Out-of-bounds access

## Redis Open Source 8.2.2 (October 2025)

Update urgency: `SECURITY`: There are security fixes in the release.

### Security fixes

- (CVE-2025-49844) A Lua script may lead to remote code execution
- (CVE-2025-46817) A Lua script may lead to integer overflow and potential RCE
- (CVE-2025-46818) A Lua script can be executed in the context of another user
- (CVE-2025-46819) LUA out-of-bound read

### New Features

- [#14223](https://github.com/redis/redis/pull/14223) `VSIM`: new `EPSILON` argument to specify maximum distance
- [#Q6867](https://github.com/RediSearch/RediSearch/pull/6867), [#Q6845](https://github.com/RediSearch/RediSearch/pull/6845) `SVS-VAMANA`: allow use of `BUILD_INTEL_SVS_OPT` flag for Intel optimisations (MOD-10920)

### Bug fixes

- [#14319](https://github.com/redis/redis/pull/14319) Potential crash on Lua script defrag
- [#14323](https://github.com/redis/redis/pull/14323) Potential crash on streams and HFE defrag
- [#14330](https://github.com/redis/redis/pull/14330) Potential use-after-free after pubsub and Lua defrag
- [#14288](https://github.com/redis/redis/pull/14288) `MEMORY USAGE`: fix reported value
- [#14259](https://github.com/redis/redis/pull/14259) `XGROUP CREATE`, `XGROUP SETID`: limit `ENTRIESREAD` value to the number of entries added to the stream
- [#J1374](https://github.com/RedisJSON/RedisJSON/issues/1374) `JSON.DEL` doesn’t delete all matching object members / array elements (MOD-11032, MOD-11067)
- [#P886](https://github.com/RedisBloom/RedisBloom/pull/886) `TDIGEST.CREATE` crashes (OOM) on huge initialization values (MOD-10840)
- [#Q6787](https://github.com/RediSearch/RediSearch/pull/6787) Potential shard restart while reindexing vectors on RDB loading (MOD-11011)
- [#Q6676](https://github.com/RediSearch/RediSearch/pull/6676) Potential crash when using small `CONSTRUCTION_WINDOW_SIZE` on `SVS-VAMANA` (MOD-10771)
- [#Q6701](https://github.com/RediSearch/RediSearch/pull/6701) Potential crash (OOM) in heavy updates due to a file descriptor leak (MOD-10975)
- [#Q6723](https://github.com/RediSearch/RediSearch/pull/6723) Potential crash when using ACL rules (MOD-10748)
- [#Q6641](https://github.com/RediSearch/RediSearch/pull/6641) `INFO SEARCH`: `search_used_memory_indexes` vector index memory value incorrect
- [#Q6665](https://github.com/RediSearch/RediSearch/pull/6665) `FT.PROFILE`: more accurate execution duration measurements (MOD-10622)

### Performance and resource utilization

- [#Q6648](https://github.com/RediSearch/RediSearch/pull/6648) Improve RESP3 serialization performance (MOD-9687)

### Metrics

- [#Q6671](https://github.com/RediSearch/RediSearch/pull/6671) `INFO SEARCH`: new `SVS-VAMANA` metrics

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
