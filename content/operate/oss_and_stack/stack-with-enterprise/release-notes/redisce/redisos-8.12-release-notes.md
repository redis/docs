---
Title: Redis Open Source 8.12 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Open Source 8.12 release notes.
linkTitle: v8.12-RC1 (October 2026)
min-version-db: blah
min-version-rs: blah
weight: 5
---

## Redis Open Source 8.12-RC1 (October 2026)

This is the first Release Candidate of Redis 8.12 in Redis Open Source.

Release Candidates are feature-complete pre-releases. Pre-releases are not suitable for production use.

### Headlines:

Redis 8.12 introduces new features and performance improvements.

### Operating systems we test Redis 8.12 on

<!-- TODO: OS list needs review -->

- Ubuntu 22.04 (Jammy Jellyfish), 24.04 (Noble Numbat), 26.04 (Resolute Raccoon)
- Rocky Linux 8.10, 9.7, 10.1
- AlmaLinux 8.10, 9.7, 10.1
- Debian 12.13 (Bookworm), Debian 13.4 (Trixie)
- Alpine 3.23
- macOS 14.8.4 (Sonoma), 15.7.4 (Sequoia), 26.3 (Tahoe) - for both Intel and ARM

### Security fixes (compared to 8.10.0)

- [#Q10073](https://github.com/RediSearch/RediSearch/pull/10073) Indexed value hashing is collision-resistant, preventing index degradation from hash-based denial-of-service (HashDoS) attacks. (MOD-14459)
- [#Q11202](https://github.com/RediSearch/RediSearch/pull/11202) `unicode_tolower` no longer reads out of bounds on a dangling multi-byte lead byte in indexed TEXT fields encoded with the 8-bit Unicode Transformation Format (UTF-8). (MOD-18088)

### New Features (compared to 8.10)

- [#15331](https://github.com/redis/redis/pull/15331) Compressed bitmaps - redis-roaring integration reduces memory usage and speeds up bitmap operations. Thanks to Antonio, its creator, for [contributing this capability](https://redisroaring.com/redis-merge/#/1).
- [#15986](https://github.com/redis/redis/pull/15986) New command: `BITRANGEINTARRAY` - returns set bit offsets within a range, equivalent to redis-roaring's `R.RANGEINTARRAY`.
- [#15938](https://github.com/redis/redis/pull/15938) Set expiration on individual set members:
  - New commands: `SEXPIRE`, `SPEXPIRE`, `SEXPIREAT`, `SPEXPIREAT` - set expiration.
  - New commands: `STTL`, `SPTTL`, `SEXPIRETIME`, `SPEXPIRETIME` - retrieve remaining time-to-live (TTL) values or expiration timestamps.
- [#15828](https://github.com/redis/redis/pull/15828) Bless keys: avoid eviction of specified keys; new command: `BLESS`.
- [#15829](https://github.com/redis/redis/pull/15829) `CLUSTER MIGRATION STATUS` reports progress for both the snapshot and incremental migration phases.
- [#15556](https://github.com/redis/redis/pull/15556) Configure Transport Layer Security (TLS) named groups with `tls-groups`.
- [#P1063](https://github.com/RedisBloom/RedisBloom/pull/1063) Count-min sketches support optional `CELL_SIZE` in `CMS.INITBYDIM` and `CMS.INITBYPROB` for lower memory usage. `CMS.INCRBY` accepts negative increments to decrement counts. `CMS.INFO` reports cell sizes.
- [#J1640](https://github.com/RedisJSON/RedisJSON/pull/1640) Automatically create deep paths in JavaScript Object Notation (JSON).
- [#Q11330](https://github.com/RediSearch/RediSearch/pull/11330) 8-bit scalar quantization (SQ8) compression is available for hierarchical navigable small world (HNSW) vector fields. (MOD-14958)
- [#Q10063](https://github.com/RediSearch/RediSearch/pull/10063) `COLLECT LIMIT` honors the configurable `search-max-aggregate-results`.

### Bug fixes (compared to 8.10.0)

- [#15569](https://github.com/redis/redis/pull/15569) Changes made by `XDELEX DELREF` for already-deleted stream entries could fail to propagate to replicas or the append-only file (AOF).
- [#15508](https://github.com/redis/redis/pull/15508) Operations using random radix-tree traversal could behave incorrectly when starting from certain leaf nodes.
- [#15604](https://github.com/redis/redis/pull/15604) Memory usage could be calculated incorrectly for hashes using shared templates.
- [#15489](https://github.com/redis/redis/pull/15489) Redis database (RDB) files could fail to load after `XSETID` reduced a stream's `entries_added` counter.
- [#15626](https://github.com/redis/redis/pull/15626) `SET` could calculate an incorrect expiration time when given an excessively large relative TTL.
- [#15628](https://github.com/redis/redis/pull/15628) Active defragmentation could incorrectly handle the shared-template registry used by compact hashes.
- [#15530](https://github.com/redis/redis/pull/15530) After failover, a replica could remain connected to another replica instead of the new primary.
- [#15733](https://github.com/redis/redis/pull/15733) Invalid cluster slot ranges could be accepted after being merged into a valid range.
- [#15756](https://github.com/redis/redis/pull/15756) `RESTORE` could calculate an incorrect expiration time when given an excessively large relative TTL.
- [#15699](https://github.com/redis/redis/pull/15699) Memory growth could be accounted for incorrectly when `SETBIT` or `BITFIELD` expanded a string.
- [#15815](https://github.com/redis/redis/pull/15815) `XTRIM` could leave a stream in a state that prevented an RDB file containing it from loading.
- [#15795](https://github.com/redis/redis/pull/15795) Clients could fail to receive a protocol error when a malformed command arrived across multiple network reads.
- [#15875](https://github.com/redis/redis/pull/15875) `ARLASTITEMS` could omit elements appearing after a gap in an array.
- [#15916](https://github.com/redis/redis/pull/15916) Data could be lost when a legacy AOF file was upgraded before loading completed.
- [#15917](https://github.com/redis/redis/pull/15917) Hiredis clients on Linux could mishandle errors when establishing Transmission Control Protocol (TCP) connections.
- [#15869](https://github.com/redis/redis/pull/15869) Redis could crash when a module thread paused input/output (I/O) threads.
- [#15468](https://github.com/redis/redis/pull/15468) Publish/subscribe (Pub/Sub) subscriptions could remain active after the subscribing user's channel permissions were revoked or the user was deleted, if the client had re-authenticated as another user.
- [#15623](https://github.com/redis/redis/pull/15623) Module actions scheduled by hash-field expiration notifications could be delayed after fields expired in the background.
- [#15680](https://github.com/redis/redis/pull/15680) Data could be lost after a replica migrated to a different shard.
- [#15587](https://github.com/redis/redis/pull/15587) `LMOVEM` could emit keyspace notifications inconsistent with those produced by `LMOVE`.
- [#15695](https://github.com/redis/redis/pull/15695) Command side effects could be propagated to replicas or the AOF despite settings that should have excluded them.
- [#Q10872](https://github.com/RediSearch/RediSearch/pull/10872) The shard no longer crashes with a segmentation fault (`SIGSEGV`) when `RESTORE` of a legacy `ft_index0` payload is issued outside an RDB load. (MOD-15685)
- [#Q10728](https://github.com/RediSearch/RediSearch/pull/10728) Arming the garbage collection (GC) timer off the main thread on ARM no longer causes random shard crashes after extended uptime. (MOD-17309)
- [#Q10767](https://github.com/RediSearch/RediSearch/pull/10767) The server no longer crashes on writes when an index `FILTER` references no schema fields. (MOD-15592)
- [#Q11303](https://github.com/RediSearch/RediSearch/pull/11303), [#Q11304](https://github.com/RediSearch/RediSearch/pull/11304), [#Q11308](https://github.com/RediSearch/RediSearch/pull/11308), [#Q11309](https://github.com/RediSearch/RediSearch/pull/11309), [#Q11310](https://github.com/RediSearch/RediSearch/pull/11310), [#Q11311](https://github.com/RediSearch/RediSearch/pull/11311) `FT.ALTER SCHEMA ADD` running concurrently with queries under `WORKERS>0` no longer crashes query execution across VECTOR, TAG, NUMERIC, GEO, ISMISSING, and GEOSHAPE nodes. (MOD-18356, MOD-18361, MOD-18366, MOD-18367, MOD-18368)
- [#Q11474](https://github.com/RediSearch/RediSearch/pull/11474) `FT.AGGREGATE` with the numeric `SORTBY` optimizer no longer crashes or returns wrong results. (MOD-6967)
- [#Q10209](https://github.com/RediSearch/RediSearch/pull/10209) The coordinator no longer crashes with Redis serialization protocol version 2 (RESP2) when `FT.PROFILE HYBRID` hits a return-strict timeout. (MOD-16396)
- [#Q10145](https://github.com/RediSearch/RediSearch/pull/10145) TEXT `PHONETIC` matches now behave correctly when non-TEXT fields precede TEXT fields in the schema. (MOD-16304)
- [#Q11262](https://github.com/RediSearch/RediSearch/pull/11262) An `FT.AGGREGATE` cursor with `FILTER` reports the correct result count. (MOD-18172)
- [#Q11282](https://github.com/RediSearch/RediSearch/pull/11282) `FT.EXPLAIN` now renders a multi-word tag value as a single tag rather than an `INTERSECT`. (MOD-8666)
- [#Q10768](https://github.com/RediSearch/RediSearch/pull/10768) NOT queries no longer leak excluded documents or drop results after a concurrent index change. (MOD-17394)
- [#Q10637](https://github.com/RediSearch/RediSearch/pull/10637) Numeric index cardinality and bounds are now correct under float compression. (MOD-16877)
- [#Q10704](https://github.com/RediSearch/RediSearch/pull/10704) Empty wildcard patterns no longer cause out-of-bounds writes or spurious empty-value matches. (MOD-17451)
- [#Q10752](https://github.com/RediSearch/RediSearch/pull/10752) Wildcard `?` on `WITHSUFFIXTRIE` TEXT fields now matches per codepoint rather than per byte. (MOD-17476)
- [#Q10112](https://github.com/RediSearch/RediSearch/pull/10112) Suffix-trie wildcard queries on TEXT fields are now case-insensitive. (MOD-16259)
- [#Q11450](https://github.com/RediSearch/RediSearch/pull/11450) `Wildcard_MatchRune` no longer hangs on a literal `*` in the indexed string.
- [#Q11267](https://github.com/RediSearch/RediSearch/pull/11267) Duplicate vector results are no longer returned during tiered indexing. (MOD-17795)
- [#Q10731](https://github.com/RediSearch/RediSearch/pull/10731) `FT.SEARCH` on a cluster returns an error for invalid `LIMIT` arguments, matching standalone behavior. (MOD-12465)
- [#Q10251](https://github.com/RediSearch/RediSearch/pull/10251) `FT.SEARCH` under `WORKERS>0` no longer returns a nil field-array for documents re-indexed mid-query. (MOD-16507)
- [#Q10921](https://github.com/RediSearch/RediSearch/pull/10921) Sort keys with embedded NUL bytes are no longer truncated in replies.
- [#Q10085](https://github.com/RediSearch/RediSearch/pull/10085) The `RETURN_STRICT` safe-loader no longer deadlocks the Redis global lock (GIL) on client timeout. (MOD-16267)
- [#Q11449](https://github.com/RediSearch/RediSearch/pull/11449) An index reference leak after queued search cancellation no longer occurs. (MOD-18682)
- [#Q11369](https://github.com/RediSearch/RediSearch/pull/11369) Memory leaks after coordinator SEARCH cancellation no longer occur. (MOD-18548)
- [#Q10881](https://github.com/RediSearch/RediSearch/pull/10881) SST replication no longer hangs and the numeric snapshot is no longer corrupted when disk GC is mid-cycle. (MOD-17197) <!-- TODO: Expand SST. -->
- [#Q10110](https://github.com/RediSearch/RediSearch/pull/10110) `FT.HYBRID` cursor setup now has a bounded channel timeout. (MOD-16145)
- [#Q10211](https://github.com/RediSearch/RediSearch/pull/10211), [#Q10745](https://github.com/RediSearch/RediSearch/pull/10745) `RETURN_STRICT` cursors are depleted on timeout; strict-timed-out hybrid cursor cycles drop their cursors at cycle end. (MOD-16091, MOD-16991) <!-- TODO: Clarify strict timeout behavior. -->
- [#Q10947](https://github.com/RediSearch/RediSearch/pull/10947) Coordinator cursor memory is now capped via `INDEX_CURSOR_LIMIT`. (MOD-17479)
- [#Q10766](https://github.com/RediSearch/RediSearch/pull/10766), [#Q10763](https://github.com/RediSearch/RediSearch/pull/10763) Cursor reads no longer time out against an earlier read's deadline and correctly report a timeout that expires while iterators are revalidated. (MOD-17489, MOD-17488)
- [#Q10993](https://github.com/RediSearch/RediSearch/pull/10993) RDB and replication payloads no longer leak a stray heap byte. (MOD-17800)
- [#Q10074](https://github.com/RediSearch/RediSearch/pull/10074) `FT.HYBRID` returns a stable reciprocal rank fusion (RRF) result order across cluster shards. (MOD-12438)
- [#Q11027](https://github.com/RediSearch/RediSearch/pull/11027) Cluster TLS connections now use Redis node metadata, aligning with topology changes. (MOD-15869)
- [#Q10380](https://github.com/RediSearch/RediSearch/pull/10380), [#Q10430](https://github.com/RediSearch/RediSearch/pull/10430) Cluster topology is now refreshed on topology-change events rather than by polling. (MOD-15868, MOD-15870)
- [#Q10835](https://github.com/RediSearch/RediSearch/pull/10835) Coordinator fanout now preserves binary argument lengths.
- [#Q11095](https://github.com/RediSearch/RediSearch/pull/11095) Replica stalls during `FT.DROPINDEX DD` are reduced.
- [#Q10083](https://github.com/RediSearch/RediSearch/pull/10083) Internal query arguments missing during a rolling upgrade are tolerated. (MOD-16047)
- [#Q10816](https://github.com/RediSearch/RediSearch/pull/10816) Forced GC now waits for a concurrent child process instead of skipping its cycle.
- [#Q10958](https://github.com/RediSearch/RediSearch/pull/10958) The asynchronous disk read pool no longer spins when saturated; it blocks instead.
- [#Q10646](https://github.com/RediSearch/RediSearch/pull/10646) The VectorSimilarity dependency addresses unaligned metadata access on ARM/Scalable Vector Extension (SVE) paths. (MOD-15303)
- [#Q10352](https://github.com/RediSearch/RediSearch/pull/10352) `FT.PROFILE ON_TIMEOUT FAIL` now reports a pre-execution timeout as a warning rather than an error. (MOD-16660)
- [#Q10870](https://github.com/RediSearch/RediSearch/pull/10870) Crash reports now include in-flight coordinator aggregate, hybrid, and cursor-read queries. (MOD-16992)
- [#Q11089](https://github.com/RediSearch/RediSearch/pull/11089) Debug aggregate request synchronization no longer crashes. (MOD-17616)
- [#J1636](https://github.com/RedisJSON/RedisJSON/pull/1636) Fixed array-index normalization overflow for extreme negative indexes, including `i64::MIN`, affecting commands such as `JSON.ARRTRIM`.
- [#J1648](https://github.com/RedisJSON/RedisJSON/pull/1648) Corrected `JSON.MGET` key-spec metadata to identify all key arguments and exclude the trailing JSONPath argument.
- [#J1670](https://github.com/RedisJSON/RedisJSON/pull/1670) Fixed downstream compilation when using `redis_json_module_create!` with the `as-library` feature and the new RDB depth configuration.
- [#P1035](https://github.com/RedisBloom/RedisBloom/pull/1035) `TDIGEST.QUANTILE`, `TDIGEST.CDF`, and `TDIGEST.TRIMMED_MEAN` could return a not-a-number (NaN) value for a sketch with exactly one observation.
- [#P1053](https://github.com/RedisBloom/RedisBloom/pull/1053) RDB loading and `RESTORE` inconsistently rejected invalid numeric values, allocation sizes, serialized counts, or inconsistent metadata in Bloom filters, Count-Min Sketches, Top-K sketches, and t-digests. Bloom filter growth lacked overflow checks.
- [#P1067](https://github.com/RedisBloom/RedisBloom/pull/1067) Bloom filters with excessive hash-function counts could be accepted during loading and restoration, including through `BF.LOADCHUNK`.
- [#P1053](https://github.com/RedisBloom/RedisBloom/pull/1053) Top-K sketches containing nonempty items with zero counts or empty-string items with nonzero counts could be restored incorrectly.
- [#P1062](https://github.com/RedisBloom/RedisBloom/pull/1062) `CMS.MERGE` key metadata did not correctly identify the destination and all source keys, affecting cluster slot validation.
- [#P1071](https://github.com/RedisBloom/RedisBloom/pull/1071) `CF.COMPACT` command metadata was missing its argument count and key specification.

### Performance and resource utilization improvements (compared to 8.10.0)

- [#15618](https://github.com/redis/redis/pull/15618) Batch updates to hashes using shared templates run more efficiently.
- [#15018](https://github.com/redis/redis/pull/15018) Supported x86 systems use the processor-based monotonic clock by default, with runtime calibration to reduce timing overhead.
- [#15782](https://github.com/redis/redis/pull/15782) RDB and AOF loading provides sequential-read hints to the operating system to improve loading efficiency.
- [#Q10169](https://github.com/RediSearch/RediSearch/pull/10169) Searches on indexes using field-level expiration (`HEXPIRE`) are faster. (MOD-16350)
- [#Q10981](https://github.com/RediSearch/RediSearch/pull/10981), [#Q11065](https://github.com/RediSearch/RediSearch/pull/11065) Coordinator field lookup and row-reply serialization overhead is reduced. (MOD-17924)
- [#Q11055](https://github.com/RediSearch/RediSearch/pull/11055), [#Q11056](https://github.com/RediSearch/RediSearch/pull/11056), [#Q11057](https://github.com/RediSearch/RediSearch/pull/11057) Cluster reply conversion, result destruction, and `GROUPBY` cleanup have reduced overhead. (MOD-17908, MOD-17909, MOD-17910)
- [#Q11507](https://github.com/RediSearch/RediSearch/pull/11507), [#Q11506](https://github.com/RediSearch/RediSearch/pull/11506) Query replies now format integral numeric values without `snprintf` and declare reply collection lengths up front. (MOD-18800, MOD-18799)
- [#Q11509](https://github.com/RediSearch/RediSearch/pull/11509) Hash field loading for `RETURN` and `LOAD` no longer requires per-field allocations. (MOD-18811)
- [#Q11278](https://github.com/RediSearch/RediSearch/pull/11278) `FT.ALTER` avoids unnecessary document reindexing during schema additions. (MOD-18171)
- [#Q11384](https://github.com/RediSearch/RediSearch/pull/11384) Score/payload-only hash updates avoid reindexing. (MOD-18182)
- [#Q11230](https://github.com/RediSearch/RediSearch/pull/11230) Hash documents are no longer re-indexed when no indexed field is touched. (MOD-17688)
- [#Q10515](https://github.com/RediSearch/RediSearch/pull/10515) Coordinator requests are now allocated on the main thread, removing `CoordRequestCtx`. (MOD-16990)
- [#Q11018](https://github.com/RediSearch/RediSearch/pull/11018) Query usage is now separated from administrative index operations. (MOD-17536)
- [#J1645](https://github.com/RedisJSON/RedisJSON/pull/1645) Memory usage reporting divides a shared string's allocation, including header and padding, proportionally among its references. Previously, each reference was charged the full allocation.
- [#J1660](https://github.com/RedisJSON/RedisJSON/pull/1660) JSON parsing uses compact object allocation to reduce memory usage.
- [#J1661](https://github.com/RedisJSON/RedisJSON/pull/1661) JSONPath parsing and evaluation reduce backtracking, temporary allocations, and repeated traversal. Optimizations cache root-path operands across filter candidates, stop existence checks at the first match, and reduce regex matching and string comparison overhead.
- [#J1631](https://github.com/RedisJSON/RedisJSON/pull/1631) Improved typed-array element access through direct indexing, avoiding repeated iteration and quadratic work during full indexed scans.
- [#P1049](https://github.com/RedisBloom/RedisBloom/pull/1049) Improved t-digest compression performance for inputs containing many duplicate values. Sorting is bounded to O(n log n), avoiding quadratic behavior on pathological inputs.

### Configuration parameters

- [#15331](https://github.com/redis/redis/pull/15331) redis-roaring: `bitmap-default-roaring` - enables the new roaring bitmaps type; disabled by default.
- [#J1657](https://github.com/RedisJSON/RedisJSON/pull/1657) `json-legacy-rdb-depth-limit` enforces a maximum nesting depth of 128 when loading JSON from RDB or through `RESTORE`. It is disabled by default.
- [#J1640](https://github.com/RedisJSON/RedisJSON/pull/1640) `json-auto-create-deep-paths` is disabled by default and configurable only at load time. Use the same value across shard nodes and AOF replays to prevent data divergence.

### Metrics

- [#15374](https://github.com/redis/redis/pull/15374) `INFO keysizes` histograms include stream key sizes.
- [#15682](https://github.com/redis/redis/pull/15682) `INFO STREAMS` provides per-database histograms of consumer groups per stream, pending entries per group, and consumers per group. Enable with `stream-stats yes` (disabled by default).
- [#Q10097](https://github.com/RediSearch/RediSearch/pull/10097) `FT.INFO` now exposes the default `EF_RUNTIME`. (MOD-16147)
- [#Q10107](https://github.com/RediSearch/RediSearch/pull/10107) Disk GC `bytes_collected` and cycle statistics are reported in `FT.INFO`. (MOD-14621)
- [#Q10464](https://github.com/RediSearch/RediSearch/pull/10464) `FT.INFO` on the coordinator aggregates per-field disk metrics via the reducer. (MOD-14859)
- [#Q10204](https://github.com/RediSearch/RediSearch/pull/10204) Redis `INFO` now breaks down query timeout metrics by pipeline stage. (MOD-13192)
- [#Q11521](https://github.com/RediSearch/RediSearch/pull/11521) Index metrics are no longer collected for unrelated `INFO` sections. (MOD-18033)
- [#Q10536](https://github.com/RediSearch/RediSearch/pull/10536) `FT.PROFILE` loader-field timing resolution is improved. (MOD-17132)

### Behavior changes

- [#Q10109](https://github.com/RediSearch/RediSearch/pull/10109) `FT.CREATE` rejects `RERANK` on HNSW vector fields in random access memory (RAM) mode. (MOD-16015)
- [#Q10200](https://github.com/RediSearch/RediSearch/pull/10200) Disk indexes reject `DIALECT 4` and `WITHOUTCOUNT`. (MOD-15997)
- [#Q10082](https://github.com/RediSearch/RediSearch/pull/10082) `COLLECT` requires an `@` prefix for field names. (MOD-16233)
- [#Q11106](https://github.com/RediSearch/RediSearch/pull/11106) JSON `HIGHLIGHT`/`SUMMARIZE` fields with multi-value JSONPath are now rejected. (MOD-16530)
- [#Q10208](https://github.com/RediSearch/RediSearch/pull/10208) Non-cacheable commands are now marked with `dont_cache`. (MOD-16175)
- [#Q10699](https://github.com/RediSearch/RediSearch/pull/10699) Numeric command arguments are now strictly parsed. (MOD-17409)
- [#Q11335](https://github.com/RediSearch/RediSearch/pull/11335) The Search module requires Redis 8.9.241 or newer to load. (MOD-15868)
- [#P1063](https://github.com/RedisBloom/RedisBloom/pull/1063) Rejected `CMS.INCRBY` item updates now leave counters and the total count unchanged instead of saturating counters on overflow. Multi-item commands can still partially succeed.
- [#P1063](https://github.com/RedisBloom/RedisBloom/pull/1063) `CMS.MERGE` now requires matching cell sizes across the destination and all sources.

### Modules API

- [#15517](https://github.com/redis/redis/pull/15517) The modules application programming interface (API) adds the `REDISMODULE_NODE_PORT_TLS` flag to `RM_GetClusterNodeInfo()` to retrieve a cluster node's TLS port.
- [#J1623](https://github.com/RedisJSON/RedisJSON/pull/1623) Added `getWithPath` in shared API V9 to evaluate a precompiled JSONPath, allowing callers to compile a path once and reuse it across documents.
- [#J1666](https://github.com/RedisJSON/RedisJSON/pull/1666) Added `pathParseNoErrorMsg` in shared API V10 to compile JSONPaths without a Redis context or an allocated error message. Returns a compiled handle on success or `NULL` on failure.
- [#J1653](https://github.com/RedisJSON/RedisJSON/pull/1653) Made pre-command hooks optional and allowed hook errors to abort JSON commands before execution. Hooks now return `RedisResult<()>`; shared C API calls continue to ignore hook errors.
- [#J1640](https://github.com/RedisJSON/RedisJSON/pull/1640) Extended the Rust `Manager` interface with `clone_value` and `create_object` to support construction of missing paths. Custom implementations must implement these methods and satisfy the new `Borrow<Self::V>` requirement for owned values.
