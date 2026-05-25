---
Title: Redis Open Source 8.8 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Open Source 8.8 release notes.
linkTitle: v8.8.0 (May 2026)
min-version-db: blah
min-version-rs: blah
weight: 15
---

## Redis Open Source 8.8.0 (May 2026)

This is the General Availability release of Redis 8.8 in Redis Open Source.

### Major changes compared to 8.6

- New data structure: Array (@antirez)
- Subkey notification for hash fields - field-level notifications
- `INCREX`: a window counter rate limiter combining `INCR`, `INCRBY`, `INCRBYFLOAT`, bounds, and expiration (@raffertyyu + Redis team)
- `XNACK`: a new streams command - allow consumers to explicitly release pending messages
- `ZUNION`, `ZINTER`, `ZUNIONSTORE`, `ZINTERSTORE`: new `COUNT` aggregator
- `JSON.SET`: new `FPHA` argument to specify the FP type for homogeneous FP arrays
- `TS.RANGE`, `TS.REVRANGE`, `TS.MRANGE`, `TS.MREVRANGE`: multiple aggregators in a single command
- `FT.HYBRID` `KNN` clause: new argument to request fewer candidates per shard
- `FT.PROFILE` `HYBRID`: profiling support for `FT.HYBRID`
- Performance improvements

### Binary distributions

- Alpine and Debian Docker images - https://hub.docker.com/_/redis
- Install using snap - see https://github.com/redis/redis-snap
- Install using brew - see https://github.com/redis/homebrew-redis
- Install using RPM - see https://github.com/redis/redis-rpm
- Install using Debian APT - see https://github.com/redis/redis-debian

### Operating systems we test Redis 8.8 on

- Ubuntu 22.04 (Jammy Jellyfish), 24.04 (Noble Numbat), 26.04 (Resolute Raccoon)
- Rocky Linux 8.10, 9.7, 10.1
- AlmaLinux 8.10, 9.7, 10.1
- Debian 12.13 (Bookworm), Debian 13.4 (Trixie)
- Alpine 3.23
- macOS 14.8.4 (Sonoma), 15.7.4 (Sequoia), 26.3 (Tahoe) - for both Intel and ARM

### Bug fixes (compared to 8.8-RC1)

- [#15237](https://github.com/redis/redis/pull/15237) `INCREX` syntax update.
- [#15005](https://github.com/redis/redis/pull/15005) Memory tracking can be enabled at runtime in non-clustered mode .
- RedisTimeSeries/RedisTimeSeries[#1930](https://github.com/redistimeseries/redistimeseries/pull/1930) Cluster topology changes during a multi-shard command are not handled (MOD-14439).
- RedisBloom/RedisBloom[#1007](https://github.com/redisbloom/redisbloom/pull/1007) Memory leak on RDB load (MOD-15418).

## Redis Open Source 8.8-RC1 (May 2026)

This is the first Release Candidate of Redis 8.8 in Redis Open Source.

Release Candidates are feature-complete pre-releases. Pre-releases are not suitable for production use.

### Headlines:

Redis 8.8 introduces new features and performance improvements.

### Operating systems we test Redis 8.8 on

- Ubuntu 22.04 (Jammy Jellyfish), 24.04 (Noble Numbat), 26.04 (Resolute Raccoon)
- Rocky Linux 8.10, 9.7, 10.1
- AlmaLinux 8.10, 9.7, 10.1
- Debian 12.13 (Bookworm), Debian 13.4 (Trixie)
- Alpine 3.23
- macOS 14.8.4 (Sonoma), 15.7.4 (Sequoia), 26.3 (Tahoe) - for both Intel and ARM

### Security fixes (compared to 8.8-M03)

- (CVE-2026-23479) Use-After-Free in unblock client flow may lead to Remote Code Execution.
- (CVE-2026-25243) Invalid memory access in `RESTORE` may lead to Remote Code Execution.
- (CVE-2026-23631) Lua Use-After-Free may lead to remote code execution.
- (CVE-2026-25588) Invalid memory access in `RESTORE` may lead to Remote Code Execution (Time Series).
- (CVE-2026-25589) Invalid memory access in `RESTORE` may lead to Remote Code Execution (Probabilistic).

### New Features (compared to 8.8-M03)

- [#15162](https://github.com/redis/redis/pull/15162) New data structure: Array (@antirez)
- [#15045](https://github.com/redis/redis/pull/15045) `INCREX`: a window counter rate limiter combining `INCR`,`INCRBY`,`INCRBYFLOAT`, bounds, and expiration (@raffertyyu + Redis team)
- In group sorting new reducer, allowing unwind grouped documents (after `GROUPBY`) and sort them

### Removed Features (compared to 8.8-M03)

- [#15191](https://github.com/redis/redis/pull/15191) Remove GCRA rate limiter

### Bug fixes (compared to 8.8-M03)

- `SUBSCRIBE`, `PSUBSCRIBE`, `SSUBSCRIBE`: crash on OOM (RED-167788)
- `CONFIG SET`: some settings allow invalid characters (RED-167787)
- `SCRIPT DEBUG`: potential crash on scripts (RED-175507)
- `VADD`: crash or buffer overflow on large `REDUCE` value (RED-170921)
- `VSET`: crash on huge allocations (MOD-12678)
- [#15188](https://github.com/redis/redis/pull/15188) `cluster-announce-ip` rejecting hostnames (regression)
- [#15095](https://github.com/redis/redis/pull/15095) Double free when loading streams with duplicate consumer PEL entries
- [#15124](https://github.com/redis/redis/pull/15124) Issues processing corrupt Streams RDB data
- [#15111](https://github.com/redis/redis/pull/15111) `fast_float_strtod` rounding mismatch
- [#15190](https://github.com/redis/redis/pull/15190) `vecClear` reset the logical size without releasing element ownership
- [#15163](https://github.com/redis/redis/pull/15163) `MULTI` queue memory incorrect memory accounting 
- [#15094](https://github.com/redis/redis/pull/15094) Cluster crash when `CLIENT KILL` unsubscribes `SSUBSCRIBE` client inside `EXEC`
- [#15151](https://github.com/redis/redis/pull/15151) Listpack backlength encoding thresholds off-by-one
- [#15115](https://github.com/redis/redis/pull/15115) Under-copy in the Lua debugger
- [#14970](https://github.com/redis/redis/pull/14970) Sentinel config injection via `SENTINEL SET`
- [#14934](https://github.com/redis/redis/pull/14934) Client output buffer memory tracking not accounting for copy-avoided bulk string references
- RediSearch/RediSearch[#9182](https://github.com/redisearch/redisearch/pull/9182) `FT.PROFILE HYBRID` returns an empty reply (MOD-14778)
- RediSearch/RediSearch[#9079](https://github.com/redisearch/redisearch/pull/9079) `FT.SPELLCHECK` treats `PARAMS` placeholders as literal terms instead of resolving them (MOD-10596)
- RediSearch/RediSearch[#9047](https://github.com/redisearch/redisearch/pull/9047) `FT.PROFILE` output is inconsistent when a profiled value is missing (MOD-10560)
- RediSearch/RediSearch[#9078](https://github.com/redisearch/redisearch/pull/9078) `FT.CREATE` now rejects schema definitions with invalid option combinations at creation time (MOD-14655)
- RediSearch/RediSearch[#9012](https://github.com/redisearch/redisearch/pull/9012) `PERSIST` and `HPERSIST` notifications are not reflected in index expiration tracking (MOD-14800)
- RediSearch/RediSearch[#9066](https://github.com/redisearch/redisearch/pull/9066) Race condition in `FT.HYBRID` causes intermittent failures under concurrent hybrid query load (MOD-14732)
- RediSearch/RediSearch[#9163](https://github.com/redisearch/redisearch/pull/9163) Crash on `FT.SEARCH` when topology validation fails (for example, some nodes unreachable) (MOD-14475)
- RediSearch/RediSearch[#9031](https://github.com/redisearch/redisearch/pull/9031), RediSearch/RediSearch[#9473](https://github.com/redisearch/redisearch/pull/9473) Coordinator deadlock under mixed `FT.SEARCH` and `FT.AGGREGATE` load (MOD-14268)
- RediSearch/RediSearch[#9028](https://github.com/redisearch/redisearch/pull/9028) Memory leak when `FT.DROPINDEX` runs concurrently with in-flight hybrid queries (MOD-14135)
- RediSearch/RediSearch[#9310](https://github.com/redisearch/redisearch/pull/9310), RediSearch/RediSearch[#9350](https://github.com/redisearch/redisearch/pull/9350) `FT.CURSOR READ` timeout and `ON_TIMEOUT FAIL` not enforced on coordinator and shard (MOD-14284, MOD-14998)
- RediSearch/RediSearch[#9425](https://github.com/redisearch/redisearch/pull/9425) Cursors not cleaned up after `MAXIDLE`, causing resource exhaustion (MOD-6430)
- RediSearch/RediSearch[#9234](https://github.com/redisearch/redisearch/pull/9234), RediSearch/RediSearch[#9404](https://github.com/redisearch/redisearch/pull/9404) Coordinator `RETURN_STRICT` returns wrong data on partial results, including `SORTBY` pipeline (MOD-13617)
- RediSearch/RediSearch[#9382](https://github.com/redisearch/redisearch/pull/9382) `MAXPREFIXEXPANSION` warnings not propagated to clients in cluster mode (MOD-13804)
- RediSearch/RediSearch[#9218](https://github.com/redisearch/redisearch/pull/9218) Search commands fail when no worker thread is available instead of falling back to main thread (MOD-14921)
- RediSearch/RediSearch[#9448](https://github.com/redisearch/redisearch/pull/9448) RDB load missing validation of `FT.CREATE` arguments, allowing corrupt index state on load (MOD-13118)
- RediSearch/RediSearch[#9377](https://github.com/redisearch/redisearch/pull/9377) Use-after-move in `Indexer_Process` causes crash during indexing (MOD-14980)
- RediSearch/RediSearch[#9408](https://github.com/redisearch/redisearch/pull/9408) Deadlock between background query and main-thread writer (MOD-15364)
- RediSearch/RediSearch[#9114](https://github.com/redisearch/redisearch/pull/9114) `FT.PROFILE` prints output using wrong iterator type (MOD-14678)
- RediSearch/RediSearch[#9421](https://github.com/redisearch/redisearch/pull/9421) Confusing error returned when `DEBUG_PARAMS_COUNT` is zero (MOD-15118)
- RediSearch/RediSearch[#9045](https://github.com/redisearch/redisearch/pull/9045) Stack-smashing error in coordinator code path (MOD-14649)
- RedisJSON/RedisJSON[#1554](https://github.com/redisjson/redisjson/pull/1554) Trailing chars are ignored (MOD-7266); Fixes RedisJSON/RedisJSON[#976](https://github.com/redisjson/redisjson/pull/976)
- RedisJSON/RedisJSON[#1543](https://github.com/redisjson/redisjson/pull/1543) Wrong mutation ordering for array commands with recursive paths (MOD-6722)
- RedisJSON/RedisJSON[#1542](https://github.com/redisjson/redisjson/pull/1542) JSONPath evaluation issues (MOD-14664); Fixes RedisJSON/RedisJSON[#968](https://github.com/redisjson/redisjson/pull/968) (MOD-7264), RedisJSON/RedisJSON[#962](https://github.com/redisjson/redisjson/pull/962) (MOD-7272), RedisJSON/RedisJSON[#963](https://github.com/redisjson/redisjson/pull/963) (MOD-7270), RedisJSON/RedisJSON[#1089](https://github.com/redisjson/redisjson/pull/1089) (MOD-7268)
- RedisTimeSeries/RedisTimeSeries[#2003](https://github.com/redistimeseries/redistimeseries/pull/2003) Potential crash on disconnections and TLS failures (MOD-14850)
- RedisTimeSeries/RedisTimeSeries[#2013](https://github.com/redistimeseries/redistimeseries/pull/2013) `count`, `countNaN`, `countAll` reducers return NaN when all values are NaN (MOD-14420)

### Performance and resource utilization improvements (compared to 8.8-M03)

- [#15049](https://github.com/redis/redis/pull/15049) Hyperloglog: 4 independent accumulators that are merged at the end
- [#15133](https://github.com/redis/redis/pull/15133) Batched prefetch for `MGET` and `MSET`
- [#14988](https://github.com/redis/redis/pull/14988) Batched prefetch for `HGETALL` on hashtable-encoded hashes
- [#15071](https://github.com/redis/redis/pull/15071) Pass size hint to jemalloc for faster deallocation
- [#15096](https://github.com/redis/redis/pull/15096) Reduces allocator and accounting overhead by adding compile-time jemalloc tuning
- RediSearch/RediSearch[#9197](https://github.com/redisearch/redisearch/pull/9197) Vector index hot path (HNSW and brute-force) devirtualized, reducing per-query latency (MOD-14916)
- RediSearch/RediSearch[#9262](https://github.com/redisearch/redisearch/pull/9262), RediSearch/RediSearch[#9476](https://github.com/redisearch/redisearch/pull/9476) Inline LSE atomics enabled on AArch64, improving atomic operation throughput on ARM64 (MOD-14916, MOD-15419)
- RediSearch/RediSearch[#9293](https://github.com/redisearch/redisearch/pull/9293) Expiration handling overhead reduced when many keys expire simultaneously (MOD-14916)
- RediSearch/RediSearch[#9017](https://github.com/redisearch/redisearch/pull/9017) LTO (link-time optimization) enabled for x86_64 release builds (MOD-14700)
- RediSearch/RediSearch[#8765](https://github.com/redisearch/redisearch/pull/8765) Shard-level timeout adjusted to coordinator dispatch time for more accurate accounting (MOD-13189)
- RediSearch/RediSearch[#8790](https://github.com/redisearch/redisearch/pull/8790), RediSearch/RediSearch[#8900](https://github.com/redisearch/redisearch/pull/8900), RediSearch/RediSearch[#8827](https://github.com/redisearch/redisearch/pull/8827), RediSearch/RediSearch[#8971](https://github.com/redisearch/redisearch/pull/8971), RediSearch/RediSearch[#8966](https://github.com/redisearch/redisearch/pull/8966), RediSearch/RediSearch[#8762](https://github.com/redisearch/redisearch/pull/8762), RediSearch/RediSearch[#8678](https://github.com/redisearch/redisearch/pull/8678), RediSearch/RediSearch[#8915](https://github.com/redisearch/redisearch/pull/8915), RediSearch/RediSearch[#8653](https://github.com/redisearch/redisearch/pull/8653), RediSearch/RediSearch[#9085](https://github.com/redisearch/redisearch/pull/9085), RediSearch/RediSearch[#8751](https://github.com/redisearch/redisearch/pull/8751), RediSearch/RediSearch[#8692](https://github.com/redisearch/redisearch/pull/8692), RediSearch/RediSearch[#9224](https://github.com/redisearch/redisearch/pull/9224) Iterators ported to Rust, reducing FFI overhead
- RediSearch/RediSearch[#9500](https://github.com/redisearch/redisearch/pull/9500) `numRecords` no longer updated for vector fields, removing unnecessary write overhead on ingest (MOD-15487)
- VecSim SVS thread pool integrated with the worker pool for better thread utilization (MOD-9881)

### Configuration parameters

- [#15182](https://github.com/redis/redis/pull/15182) Slowlog entry truncation limits:
  - `slowlog-entry-max-argc`: maximum number of command arguments kept in a slowlog entry
  - `slowlog-entry-max-string-len`: maximum length of a command argument in a slowlog entry
- RediSearch/RediSearch[#8876](https://github.com/redisearch/redisearch/pull/8876), RediSearch/RediSearch[#8960](https://github.com/redisearch/redisearch/pull/8960) Default maximum worker threads value updated; `MAX_WORKER_THREADS` is now a string config (MOD-14486, MOD-14763)

### Metrics (compared to 8.8-M03)

- RediSearch/RediSearch[#8210](https://github.com/redisearch/redisearch/pull/8210), RediSearch/RediSearch[#8231](https://github.com/redisearch/redisearch/pull/8231) `FT.PROFILE`: added queue time tracking (MOD-13602)

### CLI tools

- [#15150](https://github.com/redis/redis/pull/15150) Memory leak on malformed legacy help entry in redis-cli
