---
Title: Search and query configuration object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configuration object for search and query.
linkTitle: search
weight: $weight
---

Configuration fields for search and query.

| Field | Type/Value | Description |
|-------|------------|-------------|
| search-timeout | integer (range: 1-9223372036854775807) (default: 1000) | The maximum amount of time in milliseconds that a search query is allowed to run. |
| search-ext-load | string  | If present, RediSearch will try to load an extension dynamic library from its specified file path. Requires a database restart to take effect. |
| search-max-doctablesize | integer (range: 1-18446744073709551615) (default: 1000000) | The maximum size of the internal hash table used for storing the documents. Requires a database restart to take effect. |
| search-friso-ini | string  | If present, load the custom Chinese dictionary from the specified path. Requires a database restart to take effect. |
| search-cursor-max-idle | integer (range: 1-9223372036854775807) (default: 30000) | The maximum idle time in milliseconds that can be set to the cursor api. |
| search-partial-indexed-docs | integer (range: 1-9223372036854775807) (default: 30000) | Enable or turn off the Redis command filter. Requires a database restart to take effect. |
| search-gc-scan-size | integer (range: 1-9223372036854775807) (default: 100) | The bulk size of the internal GC used for cleaning up indexes. Requires a database restart to take effect. |
| search-no-gc | boolean (default: false) | If set, Garbage Collection is deactivated for all indexes. Requires a database restart to take effect. |
| search-fork-gc-run-interval | integer (range: 1-9223372036854775807) (default: 30) | Interval in seconds between two consecutive fork GC runs. |
| search-fork-gc-retry-interval | integer (range: 1-9223372036854775807) (default: 5) | Interval in seconds in which RediSearch will retry to run fork GC in case of a failure. |
| search-fork-gc-clean-threshold | integer (range: 1-9223372036854775807) (default: 100) | The fork GC will only start to clean when the number of not cleaned documents exceeds this threshold; otherwise, it will skip this run. |
| search-vss-max-resize | integer (range: 1-4294967295) (default: 100) | The maximum memory resize for vector similarity indexes in bytes. |
| search-union-iterator-heap | integer (range: 1-9223372036854775807) (default: 20) | The minimum number of iterators in a union from which the iterator will switch to heap-based implementation. |
| search-min-phonetic-term-len | integer (range: 1-9223372036854775807) (default: 3) | Minimum length of term to be considered for phonetic matching. |
| search-multi-text-slop | integer (range: 1-4294967295) (default: 100) | Set RediSearch delta used to increase positional offsets between array slots for multi-text values. Requires a database restart to take effect. |
| search-raw-docid-encoding | boolean (default: false) | Turn off compression for DocID inverted index. Boost CPU performance. Requires a database restart to take effect. |
| search-_print-profile-clock | boolean (default: true) | Turn off print of time for ft.profile. For testing only. |
| search-_free-resource-on-thread | boolean (default: true) | Determine whether some index resources are free on a second thread |
| search-_numeric-compress | boolean (default: false) | Enable legacy compression of double to float. |
| search-bg-index-sleep-gap | integer (range: 1-4294967295) (default: 100) | The number of iterations to run while performing background indexing before we call usleep(1) (sleep for 1 micro-second) and make sure that we allow Redis to process other commands. Requires a database restart to take effect. |
| search-_numeric-ranges-parents | integer (range: 0-2) (default: 0) | Keep numeric ranges in numeric tree parent nodes of leaves for `x` |
| search-fork-gc-sleep-before-exit | integer (range: 0-9223372036854775807) (default: 0) | Set the number of seconds for the fork GC to sleep before exists, should always be set to 0 (other then on tests). |
| search-no-mem-pools | boolean (default: false) | Set RediSearch to run without memory pools. Requires a database restart to take effect. |
| search-_prioritize-intersect-union-children | boolean (default: false) | Intersection iterator orders the children iterators by their relative estimated number of results in ascending order. If the first iterators have a lower count of results, skips a larger number of results, which translates into faster iteration. If this flag is set, we use this optimization in a way where union iterators are being factorized by the number of their own children, so that we sort by the number of children times the overall estimated number of results instead. |
| search-conn-per-shard | integer (range: 0-9223372036854775807) (default: 0) | Number of connections to each shard in the cluster. Default to 0. If 0, the number of connections is set to `WORKERS` + 1. |
| search-cursor-reply-threshold | integer (range: 1-9223372036854775807) (default: 1) | Maximum number of replies to accumulate before triggering `_FT.CURSOR READ` on the shards |
| search-threads | integer  | Maximum number of replies to accumulate before triggering `_FT.CURSOR READ` on the shards. Requires a database restart to take effect. |
| search-default-dialect | integer (range: 1-4) (default: 1) | The default DIALECT to be used by FT.CREATE, FT.AGGREGATE, FT.EXPLAIN, FT.EXPLAINCLI, and FT.SPELLCHECK. |
| search-topology-validation-timeout | integer (range: 0-9223372036854775807) (default: 30000) | Sets the timeout for topology validation (in milliseconds). After this timeout, any pending requests will be processed, even if the topology is not fully connected. |
| search-workers | integer (range: 0-8192) (default: 0) | Number of worker threads to use for query processing and background tasks. |
| search-min-operation-workers | integer (range: 0-8192) (default: 4) | Number of worker threads to use for background tasks when the server is in an operation event. |
| search-tiered-hnsw-buffer-limit | integer (range: 0-9223372036854775807) (default: 1024) | Sets the buffer limit threshold for vector similarity tiered HNSW index. If using WORKERS for indexing and the number of vectors waiting in the buffer to be indexed exceeds this limit, inserts new vectors directly into HNSW. Requires a database restart to take effect. |
| search-workers-priority-bias-threshold | integer (range: 0-9223372036854775807) (default: 1) | The number of high-priority tasks to run at any given time by the worker thread pool, before executing low-priority tasks. After this number of high-priority tasks are running, the worker thread pool will run high and low-priority tasks alternately. Requires a database restart to take effect. |
| search-on-timeout | string (values: RETURN, FAIL) (default: "RETURN") | The response policy for queries that exceed the TIMEOUT setting can be one of the following: RETURN / FAIL |
| search-min-prefix | integer (range: 1-9223372036854775807) (default: 2) | The minimum number of characters allowed for prefix queries (e.g., hel*) |
| search-min-stem-len | integer (range: 2-4294967295) (default: 0) | The minimum word length to stem |
| search-max-prefix-expansions | integer (range: 1-9223372036854775807) (default: 200) | The maximum number of expansions allowed for query prefixes |
| search-max-search-results | integer (range: 0-9223372036854775807) (default: 1000000) | The maximum number of results to be returned by the FT.SEARCH command if LIMIT is used |
| search-max-aggregate-results | integer (range: 0-9223372036854775807) (default: 2147483648) | The maximum number of results to be returned by the FT.AGGREGATE command if LIMIT is used |
| search-enable-unstable-features | boolean (default: false) | Enable unstable features. |
