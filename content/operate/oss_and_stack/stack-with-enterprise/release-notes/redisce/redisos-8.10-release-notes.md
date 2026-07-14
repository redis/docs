---
Title: Redis Open Source 8.10 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Open Source 8.10 release notes.
linkTitle: v8.10.0 (July 2026)
min-version-db: blah
min-version-rs: blah
weight: 10
---

## Redis Open Source 8.10-RC1 (July 2026)

This is the first Release Candidate of Redis 8.10 in Redis Open Source.

Release Candidates are feature-complete pre-releases. Pre-releases are not suitable for production use.

### Headlines:

Redis 8.10 introduces new features and performance improvements.

### Operating systems we test Redis 8.10 on

- Ubuntu 22.04 (Jammy Jellyfish), 24.04 (Noble Numbat), 26.04 (Resolute Raccoon)
- Rocky Linux 8.10, 9.7, 10.1
- AlmaLinux 8.10, 9.7, 10.1
- Debian 12.13 (Bookworm), Debian 13.4 (Trixie)
- Alpine 3.23
- macOS 14.8.4 (Sonoma), 15.7.4 (Sequoia), 26.3 (Tahoe) - for both Intel and ARM

### New Features (compared to 8.8)

- Hash templates
- [#15405](https://github.com/redis/redis/pull/15405) New commands: `LMOVEM`, `BLMOVEM` - move multiple elements between lists
- [#14893](https://github.com/redis/redis/pull/14893) New command: `SUNIONCARD` - get the cardinality of the union of multiple sets
- [#15278](https://github.com/redis/redis/pull/15278) New command: `SDIFFCARD` - get the cardinality of the difference between sets
- [#15282](https://github.com/redis/redis/pull/15282) `XREAD`, `XREADGROUP` - new `MAXCOUNT` and `MAXSIZE` arguments to cap the cumulative reply entries and size
- [#15337](https://github.com/redis/redis/pull/15337) New `SCRIPT_RUNNER` command flag: flag commands that execute scripts or functions
- [#15347](https://github.com/redis/redis/pull/15347) `SLOWLOG GET` - new reply argument: total argument count
- [#Q9626](https://github.com/RediSearch/RediSearch/pull/9626) New command: `FT.ALIASLIST` - get all aliases for the index (RED-197340)
- [#Q9052](https://github.com/RediSearch/RediSearch/pull/9052) Stemmer support for Malay and Tagalog languages (RED-132425)
- [#Q9291](https://github.com/RediSearch/RediSearch/pull/9291) `FT.AGGREGATE` - new `COLLECT` reducer: separate remote and local reducer invocations (RED-177887)
- [#Q8169](https://github.com/RediSearch/RediSearch/pull/8169), [#Q8236](https://github.com/RediSearch/RediSearch/pull/8236), [#Q9234](https://github.com/RediSearch/RediSearch/pull/9234), [#Q9443](https://github.com/RediSearch/RediSearch/pull/9443) `FT.SEARCH`, `FT.AGGREGATE`, `FT.HYBRID`: enforce query `TIMEOUT` more strictly
  - The `search-on-timeout` policy now offers three options:
    - `FAIL` — reject timed-out queries. With `search-workers > 0` (the default), the timeout is enforced preemptively
    - `RETURN` (default) — return best-effort partial results, without enforcing strictness during post-processing
    - `RETURN_STRICT` (new) — return best-effort partial results while enforcing the timeout through the post-processing (result) pipeline. Available when `search-workers > 0`
  - Queries executed on the main thread (i.e., when `search-workers` is 0) are capped by `search-max-foreground-timeout-limit` (default 60000 ms).
- [#J1602](https://github.com/RedisJSON/RedisJSON/pull/1602), [#J1603](https://github.com/RedisJSON/RedisJSON/pull/1603), [#J1604](https://github.com/RedisJSON/RedisJSON/pull/1604), [#J1607](https://github.com/RedisJSON/RedisJSON/pull/1607), [#J1618](https://github.com/RedisJSON/RedisJSON/pull/1618) JSONPath extensions (MOD-16274, MOD-16275):
  - Projection expressions at the top level of a JSONPath query
  - `==` and `!=` can now compare any literal, including array and object literals
  - Filter negation operator: `!`
  - `size`/`sizeof` and `empty` operators on string, array, object, and nodelist
  - `in` and `nin` operators: membership test on an array and nodelist
  - Operators on numbers: binary `-`, `+`, `*`, `/`, `%`, and unary `-` and `+`
  - Operator on object: `~`
  - `length()` function on array, object, and string
  - Functions on number: `abs()`, `ceiling()`, `floor()`
  - Functions on string: `match()`, `search()`
  - Strings concatenation with `concat()`
  - Functions on array: `first()`, `last()`, `index()`, `append()`
  - Aggregation functions on array: `min()`, `max()`, `avg()`, `sum()`, `stddev()`
  - Function on object: `keys()`
  - Function on nodelist: `count()`
  - Function on nodelist with exactly one node: `value()`
  - Relations functions on array and nodelist: `subsetof()`, `anyof()`, `noneof()`
- [#T2052](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/2052) New commands: `TS.NRANGE`, `TS.NREVRANGE` - Query a range across multiple time series; group results by timestamp (RED-149232)
- [#T2054](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/2054) New command: `TS.READ` - optionally blocking read (RED-132421)
- [#T2090](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/2090) New command: `TS.QUERYLABELS` - Get a list of labels and label-values (RED-132355)
- [#T2072](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/2072) New command: `TS.MRANGE`, `TS.MREVRANGE` - new `EXCLUDEEMPTY` argument to exclude series with no reported samples (RED-132536)

### Bug fixes (compared to 8.8.0)

- [#15447](https://github.com/redis/redis/pull/15447) Full sync under heavy write load
- [#15412](https://github.com/redis/redis/pull/15412) Unit mismatch disables the FAST expire cycle stale trigger
- [#15392](https://github.com/redis/redis/pull/15392) Crash on `VRANDMEMBER` with `LLONG_MIN` count
- [#15409](https://github.com/redis/redis/pull/15409) `CONFIG SET` - crash on TLS options in non-TLS builds
- [#15371](https://github.com/redis/redis/pull/15371) ACL key-name leak in BCAST client-side caching invalidations
- [#15433](https://github.com/redis/redis/pull/15433) Signed overflow in `BITFIELD` offset parsing
- [#15446](https://github.com/redis/redis/pull/15446) The select-based event loop backend enqueues registered file descriptors that `select()` did not mark ready
- [#15309](https://github.com/redis/redis/pull/15309) `mem_clients_normal` drift when a replica drops its cached master after a failed partial resync
- [#15357](https://github.com/redis/redis/pull/15357) Crash on missing module numeric config
- [#15377](https://github.com/redis/redis/pull/15377) In-progress atomic slot migration tasks keep running on `RM_ResetDataset` and `RM_RdbLoad`
- [#15391](https://github.com/redis/redis/pull/15391), [#15356](https://github.com/redis/redis/pull/15356) NULL dereference
- [#15390](https://github.com/redis/redis/pull/15390) Overflow on memory unit conversions
- [#15291](https://github.com/redis/redis/pull/15291) `SET` does not enforce mutually exclusive `NX`/`XX` and `IF*` options
- [#15322](https://github.com/redis/redis/pull/15322) `CONFIG SET` does not reject duplicate arguments when using both primary name and alias
- [#15407](https://github.com/redis/redis/pull/15407) `LSET` out-of-range 64-bit index truncation
- [#15308](https://github.com/redis/redis/pull/15308) Improve RDB load robustness (streams)
- [#15263](https://github.com/redis/redis/pull/15263) Tighter cluster bus parsing for `PING`, `PONG`, and `MEET` packets
- [#15247](https://github.com/redis/redis/pull/15247) Partial crash log on LoongArch architecture
- [#15270](https://github.com/redis/redis/pull/15270) `VADD ... CAS SETATTR` - wrong attributes count
- [#Q9963](https://github.com/RediSearch/RediSearch/pull/9963) Range query returns incomplete results when the lower bound is an excluded empty string (MOD-15897)
- [#Q10066](https://github.com/RediSearch/RediSearch/pull/10066) `FT.AGGREGATE .. WITHCOUNT` coordinator leaks resources on timeout (MOD-16210)
- [#Q10247](https://github.com/RediSearch/RediSearch/pull/10247) Local `FT.HYBRID` ignores `ON_TIMEOUT RETURN_STRICT` and continues execution past the deadline (MOD-16492)
- [#Q10255](https://github.com/RediSearch/RediSearch/pull/10255) Blocked search clients trigger unnecessary query dumps, adding CPU and log overhead (MOD-16518)
- [#Q10151](https://github.com/RediSearch/RediSearch/pull/10151) `FT.HYBRID` supports `EXPLAINSCORE`, exposing the fusion method (`RRF` or `LINEAR`) (MOD-10044)
- [#J1542](https://github.com/RedisJSON/RedisJSON/pull/1542), [#J1543](https://github.com/RedisJSON/RedisJSON/pull/1543) Wrong results when evaluating paths with recursive descent (MOD-6722, MOD-14664)
- [#J1554](https://github.com/RedisJSON/RedisJSON/pull/1554) Any literal that starts with true/false/null is interpreted as true/false/null (MOD-7266)
- [#J1600](https://github.com/RedisJSON/RedisJSON/pull/1600) Improve RDB load robustness
- [#T2067](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/2067) `TS.INFO` - inaccurate memory usage calculation (MOD-6409)
- [#T2036](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/2036), [#T2053](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/2053), [#T2056](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/2056), [#T2074](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/2074) Aggregation fixes (MOD-8187, MOD-16224, MOD-15565)
- [#T2004](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/2004), [#T2051](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/2051) Improve RDB load robustness
- [#P1014](https://github.com/RedisBloom/RedisBloom/pull/1014) `CF.LOADCHUNK` partial replication (MOD-16050)
- [#P1026](https://github.com/RedisBloom/RedisBloom/pull/1026), [#P1027](https://github.com/RedisBloom/RedisBloom/pull/1027) Improve RDB load robustness

### Performance and resource utilization improvements (compared to 8.8.0)

- [#15376](https://github.com/redis/redis/pull/15376) Optimize `lpSeek()` by validating entries only when necessary
- [#15345](https://github.com/redis/redis/pull/15345) Optimize wide `HSET`/`HMSET` on a fresh hash with a single batched listpack append
- [#15330](https://github.com/redis/redis/pull/15330) Avoid recomputing allocator fragmentation twice per cron tick (RED-200844)
- [#15259](https://github.com/redis/redis/pull/15259) Trim excess SDS allocation in inline command parsing
- [#15256](https://github.com/redis/redis/pull/15256) rax memory reduction: leaf-inlining for fixed-length-key trees - improves `XREADGROUP` performance
- [#15397](https://github.com/redis/redis/pull/15397) Improve `RESTORE REPLACE` performance for new keys
- [#14704](https://github.com/redis/redis/pull/14704) Optimizes an internal memory accounting
- [#Q10246](https://github.com/RediSearch/RediSearch/pull/10246) Write operations block on a read lock held throughout vector range query result collection (MOD-16437)
- [#J1617](https://github.com/RedisJSON/RedisJSON/pull/1617) JSON - memory object footprint improvements (MOD-16608)

### Modules API

- [#15350](https://github.com/redis/redis/pull/15350) `RedisModuleEvent_ClusterTopologyChange` - cluster topology change
- [#15327](https://github.com/redis/redis/pull/15327) `REDISMODULE_SUBEVENT_FORK_CHILD_*` - allow multi-threaded modules can quiesce background work before `fork()`
- [#15373](https://github.com/redis/redis/pull/15373) `REDISMODULE_SUBEVENT_CLUSTER_SLOT_MIGRATION_MIGRATE_MODULE_PROPAGATE_END` - inject commands after ASM replication stream
- [#15242](https://github.com/redis/redis/pull/15242) `RedisModule_AddPostNotificationJobForKey` - binds deferred work to a specific key from a keyspace-notification handler

### CLI tools

- [#15352](https://github.com/redis/redis/pull/15352) Adds `--latency-percentiles <p1,p2,...>` to `--latency` / `--latency-history`: reporting user-chosen percentiles
- [#15262](https://github.com/redis/redis/pull/15262) `redis-cli --cluster rebalance` - CROSSSLOT error when using `-user` without `-a`
- [#15338](https://github.com/redis/redis/pull/15338) `redis-cli --cluster reshard` and `rebalance` now move slots with server-side atomic slot migration
</content>
</invoke>
