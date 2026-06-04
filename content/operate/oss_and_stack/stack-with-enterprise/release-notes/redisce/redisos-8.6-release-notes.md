---
Title: Redis Open Source 8.6 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Open Source 8.6 release notes.
linkTitle: v8.6.0 (February 2026)
min-version-db: blah
min-version-rs: blah
weight: 20
---

## Redis Open Source 8.6.4 (June 2026)

Update urgency: `HIGH`: There are critical bugs that may affect a subset of users.

### Bug fixes

- [#15175](https://github.com/redis/redis/pull/15175), RediSearch/RediSearch[#9262](https://github.com/redisearch/redisearch/pull/9262) Redis fails to start on AArch64.
- [#15163](https://github.com/redis/redis/pull/15163) `MULTI` queue memory incorrect memory accounting.
- [#15115](https://github.com/redis/redis/pull/15115) Under-copy in the Lua debugger.
- [#15094](https://github.com/redis/redis/pull/15094) Cluster crash when `CLIENT KILL` unsubscribes `SSUBSCRIBE` client inside `EXEC`.
- [#14963](https://github.com/redis/redis/pull/14963) `XREADGROUP`: consumer replication inconsistency.
- [#14934](https://github.com/redis/redis/pull/14934) Client output buffer memory tracking not accounting for copy-avoided bulk string references.
- [#14970](https://github.com/redis/redis/pull/14970) Sentinel config injection via `SENTINEL SET`.
- [#14982](https://github.com/redis/redis/pull/14982) `SCAN` commands: integer overflow in `COUNT` parameter.
- [#15073](https://github.com/redis/redis/pull/15073) `CLIENT TRACKING`: self-overlap returning non-zero loop index.
- [#15059](https://github.com/redis/redis/pull/15059) Use-after-free.
- [#15037](https://github.com/redis/redis/pull/15037) `XINFO STREAM`: wrong value in the per-slot memory tracking.
- [#15034](https://github.com/redis/redis/pull/15034), [#15081](https://github.com/redis/redis/pull/15081) Issues processing corrupt RDB data.
- [#15021](https://github.com/redis/redis/pull/15021) `HEXPIRE`: overflow on fields count.
- [#14942](https://github.com/redis/redis/pull/14942) Fix `COMMAND GETKEYS for PFMERGE` with no source keys.
- [#15188](https://github.com/redis/redis/pull/15188) `cluster-announce-ip` rejecting hostnames (regression).
- [#14667](https://github.com/redis/redis/pull/14667), [#14886](https://github.com/redis/redis/pull/14886) Potential TCP stalls/deadlocks.
- RediSearch/RediSearch[#9484](https://github.com/redisearch/redisearch/pull/9484) Shard crash during background index scan of JSON documents with vector fields on Active-Active (CRDT) databases (MOD-15542).
- RediSearch/RediSearch[#9635](https://github.com/redisearch/redisearch/pull/9635) Severe latency spikes and shard unresponsiveness when `EXPIRE` or `EXPIREAT` operations run concurrently with queries on large indexes (MOD-14930).

## Redis Open Source 8.6.3 (May 2026)

Update urgency: `SECURITY`: There are security fixes in the release.

### Security fixes

- (CVE-2026-23479) Use-After-Free in unblock client flow may lead to Remote Code Execution.
- (CVE-2026-25243) Invalid memory access in `RESTORE` may lead to Remote Code Execution.
- (CVE-2026-23631) Lua Use-After-Free may lead to remote code execution.
- (CVE-2026-25588) Invalid memory access in `RESTORE` may lead to Remote Code Execution (Time Series).
- (CVE-2026-25589) Invalid memory access in `RESTORE` may lead to Remote Code Execution (Probabilistic).

### Bug fixes

- `SUBSCRIBE`, `PSUBSCRIBE`, `SSUBSCRIBE`: crash on OOM (RED-167788).
- `CONFIG SET`: some settings allow invalid characters (RED-167787).
- `SCRIPT DEBUG`: potential crash on scripts (RED-175507).
- `VADD`: crash or buffer overflow on large `REDUCE` value (RED-170921).
- `VSET`: crash on huge allocations (MOD-12678).
- Potential crash on disconnections and TLS failures (Time Series) (MOD-14850).
- RediSearch/RediSearch[#8745](https://github.com/redisearch/redisearch/pull/8745) Crash when many keys receive expirations under heavy TTL activity (MOD-14500).
- RediSearch/RediSearch[#8848](https://github.com/redisearch/redisearch/pull/8848) HNSW vector index memory growth under high-churn workloads until shard restart (MOD-13761).
- RediSearch/RediSearch[#8205](https://github.com/redisearch/redisearch/pull/8205), RediSearch/RediSearch[#8259](https://github.com/redisearch/redisearch/pull/8259) `FT.HYBRID` `VSIM RANGE` + `FILTER` incorrectly returns zero results (MOD-12370, MOD-13884).
- RediSearch/RediSearch[#9182](https://github.com/redisearch/redisearch/pull/9182) `FT.PROFILE HYBRID` returns an empty reply (MOD-14778).
- RediSearch/RediSearch[#8129](https://github.com/redisearch/redisearch/pull/8129), RediSearch/RediSearch[#8140](https://github.com/redisearch/redisearch/pull/8140) `FT.PROFILE` reports an incorrect shard total profile time (MOD-13735, MOD-13181).
- RediSearch/RediSearch[#9047](https://github.com/redisearch/redisearch/pull/9047) `FT.PROFILE` output is inconsistent when a profiled value is missing (MOD-10560).
- RediSearch/RediSearch[#8791](https://github.com/redisearch/redisearch/pull/8791) `FT.EXPLAIN` does not lock, causing a race with concurrent index changes (MOD-14461).
- RediSearch/RediSearch[#8382](https://github.com/redisearch/redisearch/pull/8382) Crash when indexing negative zero (-0.0) (MOD-13904).
- RediSearch/RediSearch[#8590](https://github.com/redisearch/redisearch/pull/8590) `FILTER` returns inconsistent results with multiple indexes sharing field aliases (MOD-14063).
- RediSearch/RediSearch[#8660](https://github.com/redisearch/redisearch/pull/8660) `FILTER` behavior depends on property order in the expression (MOD-14065).
- RediSearch/RediSearch[#8593](https://github.com/redisearch/redisearch/pull/8593) Filter expressions are evaluated for indexes that do not match the document type (MOD-14064).
- RediSearch/RediSearch[#8591](https://github.com/redisearch/redisearch/pull/8591) Documents are inconsistently included or excluded depending on the indexing path taken (MOD-13948).
- RediSearch/RediSearch[#8589](https://github.com/redisearch/redisearch/pull/8589) `RENAME` notification handler loads the wrong key, causing stale index entries after a rename (MOD-14328).
- RediSearch/RediSearch[#9012](https://github.com/redisearch/redisearch/pull/9012) `PERSIST` and `HPERSIST` notifications are not reflected in index expiration tracking (MOD-14800).
- RediSearch/RediSearch[#9079](https://github.com/redisearch/redisearch/pull/9079) `FT.SPELLCHECK` treats `PARAMS` placeholders as literal terms instead of resolving them (MOD-10596).
- RediSearch/RediSearch[#8462](https://github.com/redisearch/redisearch/pull/8462) GC out-of-memory on replica shards leaves the replica in an inconsistent state (MOD-14066).
- RediSearch/RediSearch[#9066](https://github.com/redisearch/redisearch/pull/9066) Race condition in `FT.HYBRID` causes intermittent failures under concurrent hybrid query load (MOD-14732).
- RediSearch/RediSearch[#8109](https://github.com/redisearch/redisearch/pull/8109), RediSearch/RediSearch[#8149](https://github.com/redisearch/redisearch/pull/8149) Configuration registration omits module parameters, causing them to be unexposed or misapplied (RED-171841).
- RediSearch/RediSearch[#9163](https://github.com/redisearch/redisearch/pull/9163) Crash on `FT.SEARCH` when topology validation fails (for example, some nodes unreachable) (MOD-14475).
- RediSearch/RediSearch[#8395](https://github.com/redisearch/redisearch/pull/8395) `FT.SEARCH` fails with "Query requires unavailable slots" after shard restart or failover (MOD-13828).
- RediSearch/RediSearch[#8451](https://github.com/redisearch/redisearch/pull/8451) `FT.INFO`-style output no longer reports zero-index summary data when no indices exist (MOD-14079).
- RediSearch/RediSearch[#9078](https://github.com/redisearch/redisearch/pull/9078) `FT.CREATE` now rejects schema definitions with invalid option combinations at creation time (MOD-14655).
- RediSearch/RediSearch[#8051](https://github.com/redisearch/redisearch/pull/8051), RediSearch/RediSearch[#8114](https://github.com/redisearch/redisearch/pull/8114) Crash diagnostics now include the `IndexSpec` of the index the failing thread was working on (MOD-7574).

### Metrics

- RediSearch/RediSearch[#8210](https://github.com/redisearch/redisearch/pull/8210), RediSearch/RediSearch[#8231](https://github.com/redisearch/redisearch/pull/8231) `FT.PROFILE`: added queue time tracking (MOD-13602).

## Redis Open Source 8.6.2 (March 2026)

Update urgency: `SECURITY`: There are security fixes in the release.

### Security fixes

- [#14824](https://github.com/redis/redis/pull/14824) Potential UAF: don't use reply copy avoidance for module strings.

### Bug fixes

- [#14848](https://github.com/redis/redis/pull/14848) Crash during command processing on replicas performing full synchronization.
- [#14794](https://github.com/redis/redis/pull/14794) New `XIDMPRECORD` internal command and AOFRW emission to restore stream IDMP state.
- [#14816](https://github.com/redis/redis/pull/14816) `setModuleEnumConfig()` passing prefixed name to module callbacks.
- [#14858](https://github.com/redis/redis/pull/14858) Streams: Ensures `XADD` with `IDMP`/`IDMPAUTO` that hits an existing IID records the metadata change.
- [#14855](https://github.com/redis/redis/pull/14855), [#14831](https://github.com/redis/redis/pull/14831), [#14817](https://github.com/redis/redis/pull/14817) Potential Memory leaks.
- [#14869](https://github.com/redis/redis/pull/14869) Streams: IDMP cron expiration not working after RDB load.
- [#14847](https://github.com/redis/redis/pull/14847) Potential crash during ACL checks on wrong-arity commands.
- [#14883](https://github.com/redis/redis/pull/14883) `HSETEX` and `HGETEX` do not validate that `FIELDS` is specified only once.
- [#14897](https://github.com/redis/redis/pull/14897) Streams: IDMP-related bugs.

## Redis Open Source 8.6.1 (February 2026)

Update urgency: `SECURITY`: There are security fixes in the release.

### Security fixes

- A user can manipulate data read by a connection by injecting `\r\n` sequences into a Redis error reply.

### Bug fixes

- [#14785](https://github.com/redis/redis/pull/14785) `HOTKEYS`: The `INFO` command may display module information, and the missing `HOTKEYS HELP` subcommand has been added.
- [#14789](https://github.com/redis/redis/pull/14789) Bug in RDB loading prevented hash table expansion, increasing load time.

## Redis Open Source 8.6.0 (February 2026)

This is the General Availability release of Redis 8.6 in Redis Open Source.

### Major changes compared to 8.4

- Substantial performance improvements.
- Substantial memory reduction for hashes (hashtable-encoded) and sorted sets (skiplist-encoded).
- Streams: `XADD` idempotency (at-most-once guarantee) with new `IDMPAUTO` and `IDMP` arguments.
- New eviction policies - least recently modified: `volatile-lrm` and `allkeys-lrm`.
- Hot keys detection and reporting; new command: `HOTKEYS`.
- TLS certificate-based automatic client authentication.
- Time series: support NaN values; new aggregators: `COUNTNAN` and `COUNTALL`.

### Binary distributions

- Alpine and Debian Docker images - https://hub.docker.com/_/redis
- Install using snap - see https://github.com/redis/redis-snap
- Install using brew - see https://github.com/redis/homebrew-redis
- Install using RPM - see https://github.com/redis/redis-rpm
- Install using Debian APT - see https://github.com/redis/redis-debian

### Operating systems we test Redis 8.6 on

- Ubuntu 22.04 (Jammy Jellyfish), 24.04 (Noble Numbat)
- Rocky Linux 8.10, 9.5
- AlmaLinux 8.10, 9.5, 10.1
- Debian 12 (Bookworm), Debian 13 (Trixie)
- macOS 14 (Sonoma), 15 (Sequoia)

### New Features (compared to 8.6-RC1)

- [#14695](https://github.com/redis/redis/pull/14695) Keys memory size histograms.

### Performance and resource utilization improvements (compared to 8.6-RC1)

- [#14714](https://github.com/redis/redis/pull/14714) Optimize user ACL permission verification.
- [#14692](https://github.com/redis/redis/pull/14692) Optimize peak memory metric collection.
- [#14739](https://github.com/redis/redis/pull/14739) Avoid allocating and releasing list node in reply copy avoidance.
- [#14713](https://github.com/redis/redis/pull/14713) Reduce per command syscalls by reusing cached time when hardware monotonic clock is available.
- [#14726](https://github.com/redis/redis/pull/14726) Optimize `XREADGROUP CLAIM`.
- [#13962](https://github.com/redis/redis/pull/13962) Vector set: replace manual popcount with __builtin_popcountll for binary vector distance (Intel, AMD, ARM).
- [#14474](https://github.com/redis/redis/pull/14474) Vector set: vectorized the quantized 8-bit vector distance calculation (Intel, AMD).
- [#14492](https://github.com/redis/redis/pull/14492) Vector set: vectorize binary quantization path for vectorsets distance calculation (Intel, AMD).

### Configuration parameters

- [#14719](https://github.com/redis/redis/pull/14719) `cluster-slot-stats-enabled` - per-slot resource consumptions statistics to collect.
- [#14695](https://github.com/redis/redis/pull/14695) `key-memory-histograms` collect memory consumption histograms per data type.

### Metrics

- [#14695](https://github.com/redis/redis/pull/14695) `db0_distrib_lists_sizes`, `db0_distrib_sets_sizes`, `db0_distrib_hashes_sizes`, `db0_distrib_zsets_sizes`.

### Known bugs and limitations

- Streams: avoid using `XADD` with the new `IDMP` or `IDMPAUTO` options when using `appendonly yes` with `aof-use-rdb-preamble no` (non default).
  This limitation will be removed in the next patch.

## Redis Open Source 8.6-RC1 (January 2026)

This is the first Release Candidate of Redis 8.6 in Redis Open Source.

Release Candidates are feature-complete pre-releases. Pre-releases are not suitable for production use.

### Binary distributions

- Alpine and Debian Docker images - https://hub.docker.com/_/redis
- Install using snap - see https://github.com/redis/redis-snap
- Install using brew - see https://github.com/redis/homebrew-redis
- Install using RPM - see https://github.com/redis/redis-rpm
- Install using Debian APT - see https://github.com/redis/redis-debian

### Operating systems we test Redis 8.6 on

- Ubuntu 22.04 (Jammy Jellyfish), 24.04 (Noble Numbat)
- Rocky Linux 8.10, 9.5, 10.1
- AlmaLinux 8.10, 9.5, 10.1
- Debian 12 (Bookworm), Debian 13 (Trixie)
- 14 (Sonoma), 15 (Sequoia)

### New Features (compared to 8.4.0)

- [#14615](https://github.com/redis/redis/pull/14615) Streams: `XADD` idempotency (at-most-once guarantee) with new `IDMPAUTO` and `IDMP` arguments.
- [#14624](https://github.com/redis/redis/pull/14624) New eviction policies - least recently modified: `volatile-lrm` and `allkeys-lrm`.
- [#14680](https://github.com/redis/redis/pull/14680) Hot keys detection and reporting; new command: `HOTKEYS`.
- [#14610](https://github.com/redis/redis/pull/14610) TLS certificate-based automatic client authentication.
- RedisTimeSeries/RedisTimeSeries[#1853](https://github.com/redistimeseries/redistimeseries/pull/1853) Time series: support NaN values; new aggregators: `COUNTNAN` and `COUNTALL`.

### Security and privacy fixes

- [#14645](https://github.com/redis/redis/pull/14645) Hide personally identifiable information from ACL log.
- [#14659](https://github.com/redis/redis/pull/14659) ACL: Key-pattern bypass in `MSETEX`.
- RedisTimeSeries/RedisTimeSeries[#1837](https://github.com/redistimeseries/redistimeseries/pull/1837), RedisJSON/RedisJSON[#1474](https://github.com/redisjson/redisjson/pull/1474) Hide personally identifiable information from server log.
- RedisBloom/RedisBloom[#950](https://github.com/redisbloom/redisbloom/pull/950) Out-of-bounds read when loading an invalid RDB file (MOD-12802).

### Bug fixes (compared to 8.4.0)

- [#14545](https://github.com/redis/redis/pull/14545) ACL: AOF loading fails if ACL rules are changed and don't allow some commands in `MULTI`-`EXEC`.
- [#14637](https://github.com/redis/redis/pull/14637) Atomic slot migration: wrong adjacent slot range behavior.
- [#14567](https://github.com/redis/redis/pull/14567) Atomic slot migration: support delay trimming slots after finishing migrating slots.
- [#14623](https://github.com/redis/redis/pull/14623) Streams: `XTRIM`/`XADD` with approx mode (`~`) don’t delete entries for `DELREF`/`ACKED` strategies.
- [#14552](https://github.com/redis/redis/pull/14552) Streams: Incorrect behavior when using `XDELEX...ACKED` after `XGROUP DESTROY`.
- [#14537](https://github.com/redis/redis/pull/14537) `SCAN`: restore original filter order (revert change introduced in 8.2).
- [#14581](https://github.com/redis/redis/pull/14581) Rare server hang at shutdown.
- [#14597](https://github.com/redis/redis/pull/14597) Panic when cluster node is uninitialized.
- [#14583](https://github.com/redis/redis/pull/14583) `FLUSHALL ASYNC` on a writable replica may block the main thread for an extended period.
- [#14504](https://github.com/redis/redis/pull/14504) Cluster: fix race condition in broadcast configuration.
- [#14416](https://github.com/redis/redis/pull/14416) Fixed argument position handling in Redis APIs.
- RedisTimeSeries/RedisTimeSeries[#1784](https://github.com/redistimeseries/redistimeseries/pull/1784), RedisTimeSeries/RedisTimeSeries[#1839](https://github.com/redistimeseries/redistimeseries/pull/1839), RedisBloom/RedisBloom[#952](https://github.com/redisbloom/redisbloom/pull/952), RedisJSON/RedisJSON[#1477](https://github.com/redisjson/redisjson/pull/1477) Atomic slot migration support.
- RedisBloom/RedisBloom[#946](https://github.com/redisbloom/redisbloom/pull/946) `MEMORY USAGE`: fix reported value (MOD-12799).
- RedisJSON/RedisJSON[#1473](https://github.com/redisjson/redisjson/pull/1473) Adding escapes to already-escaped characters (MOD-8137).
- RedisJSON/RedisJSON[#1475](https://github.com/redisjson/redisjson/pull/1475) `JSON.CLEAR` does not error if more than one path is specified (MOD-13109).

### Performance and resource utilization improvements (compared to 8.4.0)

- [#14608](https://github.com/redis/redis/pull/14608) Reply copy-avoidance path to reduce memory copies for bulk string replies.
- [#14595](https://github.com/redis/redis/pull/14595) Hash: unify field name and value into a single struct.
- [#14701](https://github.com/redis/redis/pull/14701) Sorted set: unify score and value into a single struct.
- [#14662](https://github.com/redis/redis/pull/14662) Optimize listpack iterator on hash fields.
- [#14699](https://github.com/redis/redis/pull/14699) Optimize set commands with expiration.
- [#14700](https://github.com/redis/redis/pull/14700) Optimize prefetching.
- [#14715](https://github.com/redis/redis/pull/14715) Optimize prefetch sizing logic.
- [#14636](https://github.com/redis/redis/pull/14636) Optimize `ZRANK`.
- [#14676](https://github.com/redis/redis/pull/14676) Utilize hardware clock by default on ARM AArch64.
- [#14575](https://github.com/redis/redis/pull/14575) Disable RDB compression when diskless replication is used.


### Modules API
- [#14445](https://github.com/redis/redis/pull/14445)
  - `RM_CreateKeyMetaClass` - define a new key-metadata class.
  - `RM_ReleaseKeyMetaClass` - release a key-metadata class.
  - `RM_SetKeyMeta` - attach or update a metadata value for a key under a specific metadata-key class.
  - `RM_GetKeyMeta` - get a metadata value for a key under a specific metadata-key class.

### Configuration parameters

- [#14624](https://github.com/redis/redis/pull/14624) `maxmemory-policy`: new eviction policies: `volatile-lrm`, `allkeys-lrm`.
- [#14615](https://github.com/redis/redis/pull/14615) `stream-idmp-duration`, `stream-idmp-maxsize` - defaults for streams idempotent production.
- [#14610](https://github.com/redis/redis/pull/14610) `tls-auth-clients-user` TLS certificate-based automatic client authentication.
- [#14596](https://github.com/redis/redis/pull/14596) `flushdb` option for `repl-diskless-load`: always flush the entire dataset before diskless load.

### Metrics
- [#14610](https://github.com/redis/redis/pull/14610) `acl_access_denied_tls_cert` - failed TLS certificate–based authentication attempts.

### Known bugs and limitations

- Redis Search: In case of load rebalancing operations (such as Atomic Slot Migration) taking place during the lifetime of a cursor, there is a chance that some results may be missing.
