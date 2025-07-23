---
aliases:
- /develop/interact/search-and-query/administration/configuration
- /develop/interact/search-and-query/basic-constructs/configuration-parameters
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Redis Query Engine can be tuned through multiple configuration parameters. Some of these parameters can only be set at load-time, while other parameters can be set either at load-time or at run-time.
linkTitle: Configuration parameters
title: Configuration parameters
weight: 1
---
{{< note >}}
As of Redis 8 in Redis Open Source (Redis 8), configuration parameters for the time series data structure are now set in the following ways:
* At load time via your `redis.conf` file.
* At run time (where applicable) using the [`CONFIG SET`]({{< relref "/commands/config-set" >}}) command.

Also, Redis 8 persists RQE configuration parameters just like any other configuration parameters (e.g., using the [`CONFIG REWRITE`]({{< relref "/commands/config-rewrite/" >}}) command).
{{< /note >}}

## RQE configuration parameters

The following table summarizes which configuration parameters can be set at run-time, and compatibility with Redis Software and Redis Cloud.

| Parameter name<br />(version < 8.0) | Parameter name<br />(version &#8805; 8.0) | Run-time | Redis<br />Software | Redis<br />Cloud |
| :------- | :------- | :------- | :------- | :------- |
| BG_INDEX_SLEEP_GAP                | [search-bg-index-sleep-gap](#search-bg-index-sleep-gap)         | :white_large_square: |||
| CONCURRENT_WRITE_MODE             | [search-concurrent-write-mode](#search-concurrent-write-mode)   | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| CONN_PER_SHARD                    | [search-conn-per-shard](#search-conn-per-shard)                 | :white_check_mark:   |||
| CURSOR_MAX_IDLE                   | [search-cursor-max-idle](#search-cursor-max-idle)               | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| CURSOR_READ_SIZE                  | [search-cursor-read-size](#search-cursor-read-size)             | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| CURSOR_REPLY_THRESHOLD            | [search-cursor-reply-threshold](#search-cursor-reply-threshold) | :white_check_mark:   |||
| DEFAULT_DIALECT                   | [search-default-dialect](#search-default-dialect)               | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| EXTLOAD                           | [search-ext-load](#search-ext-load)                             | :white_large_square: | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| FORK_GC_CLEAN_THRESHOLD           | [search-fork-gc-clean-threshold](#search-fork-gc-clean-threshold) | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| FORK_GC_RETRY_INTERVAL            | [search-fork-gc-retry-interval](#search-fork-gc-retry-interval) | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| FORK_GC_RUN_INTERVAL              | [search-fork-gc-run-interval](#search-fork-gc-run-interval)     | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| FORKGC_SLEEP_BEFORE_EXIT          | [search-fork-gc-sleep-before-exit](#search-fork-gc-sleep-before-exit) | :white_check_mark: |||
| FRISOINI                          | [search-friso-ini](#search-friso-ini)                             | :white_large_square: | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| [GC_POLICY](#gc_policy)           | There is no matching `CONFIG` parameter.                        | :white_large_square: | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| GCSCANSIZE                        | [search-gc-scan-size](#search-gc-scan-size)                       | :white_large_square: | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| INDEX_CURSOR_LIMIT                | [search-index-cursor-limit](#search-index-cursor-limit)         | :white_large_square: |||
| INDEX_THREADS                     | search-index-threads                                            | :white_large_square: |||
| MAXAGGREGATERESULTS               | [search-max-aggregate-results](#search-max-aggregate-results)   | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| MAXDOCTABLESIZE                   | [search-max-doctablesize](#search-max-doctablesize)             | :white_large_square: | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| MAXEXPANSIONS                     | [search-max-expansions](#search-max-expansions)                 | :white_check_mark:   |||
| MAXPREFIXEXPANSIONS               | [search-max-prefix-expansions](#search-max-prefix-expansions)   | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| MAXSEARCHRESULTS                  | [search-max-search-results](#search-max-search-results)           | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| MIN_OPERATION_WORKERS             | [search-min-operation-workers](#search-min-operation-workers)   | :white_check_mark:   |||
| MIN_PHONETIC_TERM_LEN             | [search-min-phonetic-term-len](#search-min-phonetic-term-len)   | :white_check_mark:   |||
| MINPREFIX                         | [search-min-prefix](#search-min-prefix)                         | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| MINSTEMLEN                        | [search-min-stem-len](#search-min-stem-len)                     | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| MULTI_TEXT_SLOP                   | [search-multi-text-slop](#search-multi-text-slop)               | :white_large_square: |||
| NO_MEM_POOLS                      | [search-no-mem-pools](#search-no-mem-pools)                     | :white_large_square: |||
| NOGC                              | [search-no-gc](#search-no-gc)                                     | :white_large_square: | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| ON_TIMEOUT                        | [search-on-timeout](#search-on-timeout)                         | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| PARTIAL_INDEXED_DOCS              | [search-partial-indexed-docs](#search-partial-indexed-docs)     | :white_large_square: | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| RAW_DOCID_ENCODING                | [search-raw-docid-encoding](#search-raw-docid-encoding)         | :white_large_square: |||
| SEARCH_THREADS                    | [search-threads](#search-threads)                               | :white_large_square: |||
| TIERED_HNSW_BUFFER_LIMIT          | [search-tiered-hnsw-buffer-limit](#search-tiered-hnsw-buffer-limit) | :white_large_square: |||
| TIMEOUT                           | [search-timeout](#search-timeout)                               | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| TOPOLOGY_VALIDATION_TIMEOUT       | [search-topology-validation-timeout](#search-topology-validation-timeout) | :white_check_mark: |||
| UNION_ITERATOR_HEAP               | [search-union-iterator-heap](#search-union-iterator-heap)       | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| UPGRADE_INDEX                     | [search-upgrade-index](#search-upgrade-index)                   | :white_large_square: | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| VSS_MAX_RESIZE                    | [search-vss-max-resize](#search-vss-max-resize)                 | :white_check_mark:   |||
| WORKERS_PRIORITY_BIAS_THRESHOLD   | [search-workers-priority-bias-threshold](#search-workers-priority-bias-threshold) | :white_large_square: |||
| WORKERS                           | [search-workers](#search-workers)                               | :white_check_mark: |||
| OSS_GLOBAL_PASSWORD               | Deprecated in v8.0.0. Replace with the `masterauth` password.   | :white_large_square: | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Not supported"><nobr>&#x274c; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| MT_MODE                           | Deprecated in v8.0.0. Use search-workers.                       | :white_large_square: |||
| PRIVILEGED_THREADS_NUM            | Deprecated in v8.0.0. Use search-workers-priority-bias-threshold.| :white_large_square: |||
| WORKER_THREADS                    | Deprecated in v8.0.0. Use search-min-operation-workers.         | :white_large_square: |||
| SAFEMODE                          | Deprecated in v1.6.0. This is now the default setting.          | :white_large_square: |||
| FORK_GC_CLEAN_NUMERIC_EMPTY_NODES | Deprecated in v8.0.0.                                           | :white_large_square: |||

{{< note >}}
Parameter names for Redis Open Source versions < 8.0, while deprecated, will still be supported in Redis 8.
{{< /note >}}

---

### search-bg-index-sleep-gap

The number of iterations to run while performing background indexing before `usleep(1)` (sleep for 1 microsecond) is called, ensuring that Redis can process other commands.

Type: integer

Valid range: `[1 .. 4294967295]`

Default: `100`

### search-concurrent-write-mode

If enabled, the tokenization of write queries will be performed concurrently.

Type: boolean

Default: `FALSE`

### search-conn-per-shard

The number of connections to each shard in a cluster.
If `0`, the number of connections is set to `search-workers` + 1.

Type: integer

Valid range: `[0 .. 9,223,372,036,854,775,807]`

Default: `0`

### search-cursor-max-idle

The maximum idle time (in ms) that can be set to the [cursor api]({{< relref "/develop/ai/search-and-query/advanced-concepts/aggregations#cursor-api" >}}).

Type: integer

Valid range: `[0 .. 9,223,372,036,854,775,807]`

Default: `300000`

### search-cursor-read-size

Type: integer

Default: `1000`

### search-cursor-reply-threshold

The maximum number of replies to accumulate before triggering `_FT.CURSOR READ` on the shards.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Default: `1`

### search-default-dialect

The default
[DIALECT]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}})
to be used by [`FT.CREATE`]({{< relref "/commands/ft.create/" >}}), [`FT.AGGREGATE`]({{< relref "/commands/ft.aggregate/" >}}), [`FT.EXPLAIN`]({{< relref "/commands/ft.explain/" >}}), [`FT.EXPLAINCLI`]({{< relref "/commands/ft.explaincli/" >}}), and [`FT.SPELLCHECK`]({{< relref "/commands/ft.spellcheck/" >}}).
See [Query dialects]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}})
for more information.

Default: `1`

### search-ext-load

If present, Redis will try to load an extension dynamic library from the specified file path.
See [Extensions]({{< relref "/develop/ai/search-and-query/administration/extensions" >}}) for details.

Type: string

Default: not set

### search-fork-gc-clean-numeric-empty-nodes

Clean empty nodes from numeric tree.

Type: boolean

Default: `TRUE`

### search-fork-gc-clean-threshold

The fork GC will only start to clean when the number of uncleaned documents exceeds this threshold, otherwise it will skip this run.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Default: `100`

### search-fork-gc-retry-interval

Interval (in seconds) in which Redis will retry to run fork GC in case of a failure.
This setting can only be combined with the [`search-gc-policy`](#search-gc-policy) `FORK` setting.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Default: `5`

### search-fork-gc-run-interval

Interval (in seconds) between two consecutive fork GC runs.
This setting can only be combined with the [`search-gc-policy`](#search-gc-policy) `FORK` setting.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Default: `30`

### search-fork-gc-sleep-before-exit

The number of seconds for the fork GC to sleep before exit. This value should always be set to 0 except when testing.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Default: `0`

### search-friso-ini

If present, load the custom Chinese dictionary from the specified path. See [Using custom dictionaries]({{< relref "/develop/ai/search-and-query/advanced-concepts/chinese#using-custom-dictionaries" >}}) for more details.

Type: string

Default: not set

### GC_POLICY

The garbage collection policy. The two supported policies are:
* FORK: uses a forked thread for garbage collection (v1.4.1 and above). This is the default GC policy since v1.6.1 and is ideal for general purpose workloads.
* LEGACY: uses a synchronous, in-process fork. This is ideal for read-heavy and append-heavy workloads with very few updates/deletes. Deprecated in v2.6.0.

Note: When `GC_POLICY` is set to `FORK`, it can be combined with the `search-fork-gc-run-interval` and `search-fork-gc-retry-interval` settings. 

Type: string

Valid values: `FORK` or `DEFAULT`

Default: `FORK`

### search-gc-scan-size

The bulk size of the internal GC used for cleaning up indexes.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Redis Open Source default: `100`

Redis Software default: `-1` (unlimited)

Redis Cloud defaults:
- Flexible & Annual: `-1` (unlimited)
- Free & Fixed: `10000`

### search-index-cursor-limit

Added in v2.10.8.

The maximum number of cursors that can be opened, per shard, at any given time. Cursors can be opened by the user via [`FT.AGGREGATE WITHCURSOR`]({{< relref "/commands/ft.aggregate/" >}}). Cursors are also opened internally by the RQE for long-running queries. Once `INDEX_CURSOR_LIMIT` is reached, any further attempts to open a cursor will result in an error.

{{% alert title="Notes" color="info" %}}
* Caution should be used in modifying this parameter.  Every open cursor results in additional memory usage.
* Cursor usage should be regulated first by use of [`FT.CURSOR DEL`]({{< relref "/commands/ft.cursor-del/" >}}) and/or [`MAXIDLE`]({{< relref "/commands/ft.aggregate/" >}}) prior to modifying `INDEX_CURSOR_LIMIT`
* See [Cursor API]({{< relref "/develop/ai/search-and-query/advanced-concepts/aggregations#cursor-api" >}}) for more details.
{{% /alert %}}

Type: integer

Default: `128`

### search-max-aggregate-results

The maximum number of results to be returned by the `FT.AGGREGATE` command if `LIMIT` is used.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Redis Open Source default: `-1` (unlimited)

Redis Software default: `-1` (unlimited)

Redis Cloud defaults:
- Flexible & Annual: `-1` (unlimited)
- Free & Fixed: `10000`

### search-max-doctablesize

The maximum size of the internal hash table used for storing documents. 
Note: this configuration option doesn't limit the number of documents that can be stored. It only affects the hash table internal array maximum size.
Decreasing this property can decrease the memory overhead in cases where the index holds a small number of documents that are constantly updated.

Type: integer

Valid range: `[1 .. 18,446,744,073,709,551,615]`

Default: `1000000`

### search-max-expansions

This parameter is an alias for [search-max-prefix-expansions](#search-max-prefix-expansions).

### search-max-prefix-expansions

The maximum number of expansions allowed for query prefixes.
The maximum number of expansions allowed for query prefixes. Setting it too high can cause performance issues. If `search-max-prefix-expansions` is reached, the query will continue with the first acquired results. The configuration is applicable for all affix queries including prefix, suffix, and infix (contains) queries.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Default: `200`

### search-max-search-results

The maximum number of results to be returned by the `FT.SEARCH` command if `LIMIT` is used. Set it to `-1` to remove the limit.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Redis Open Source default: `1000000`

Redis Software default: `1000000`

Redis Cloud defaults:
- Flexible & Annual: `1000000`
- Free & Fixed: `10000`

### search-min-operation-workers

The number of worker threads to use for background tasks when the server is in an operation event.

Type: integer

Valid range: `[0 .. 8192]`

Default: `4`

### search-min-phonetic-term-len

The minimum length of term to be considered for phonetic matching.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Default: `3`

### search-min-prefix

The minimum number of characters allowed for prefix queries (for example, hel*). Setting it to `1` can reduce performance.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Default: `2`

### search-min-stem-len

The minimum word length to stem. Setting it lower than `4` can reduce performance.

Type: integer

Valid range: `[2 .. 4,294,967,295]`

Redis Open Source default: `4`

Redis Software and Redis Cloud default: `2`

### search-multi-text-slop

Set the delta that is used to increase positional offsets between array slots for multi text values.
This will allow you to control the level of separation between phrases in different array slots; related to the `SLOP` parameter of `FT.SEARCH` command.

Type: integer

Valid range: `[0 .. 4,294,967,295]`

Default: `100`

### search-no-mem-pools

Set RQE to run without memory pools.

Type: boolean

Default: `FALSE`

### search-no-gc

If set to `TRUE`, garbage collection is disabled for all indexes.

Type: boolean

Default: `FALSE`

### search-on-timeout

The response policy for queries that exceed the [`search-timeout`](#search-timeout) setting can be one of the following:

* `RETURN`: this policy will return the top results accumulated by the query until it timed out.
* `FAIL`: will return an error when the query exceeds the timeout value.

Type: string

Valid values: `RETURN`, `FAIL`

Default: `RETURN`

### search-partial-indexed-docs

Added in v2.0.0.

Enable/disable the Redis command filter. The filter optimizes partial updates of hashes
and may avoid re-indexing the hash if changed fields are not part of the schema. 

The Redis command filter will be executed upon each Redis command.  Though the filter is
optimized, this will introduce a small increase in latency on all commands.  
This configuration is best used with partially indexed documents where the non-indexed fields are updated frequently.

Type: integer

Valid values: `0` (false), `1` (true)

Default: `0`

### search-raw-docid-encoding

Disable compression for DocID inverted indexes to boost CPU performance.

Type: boolean

Default: `FALSE`

### search-threads

Sets the number of search threads in the coordinator thread pool.

Type: integer

### search-tiered-hnsw-buffer-limit

Used for setting the buffer limit threshold for vector tiered HNSW indexes. If Redis is using `WORKERS` for indexing, and the number of vectors waiting in the buffer to be indexed exceeds this limit, new vectors are inserted directly into HNSW.

Type: integer

Valid range: `[0 .. 9,223,372,036,854,775,807]`

Default: `1024`

### search-timeout

The maximum amount of time in milliseconds that a search query is allowed to run. If this time is exceeded, Redis returns the top results accumulated so far, or an error depending on the policy set with [`search-on-timeout`](#search-on-timeout). The timeout can be disabled by setting it to `0`.

{{% alert title="Notes" color="info" %}}
* `search-timeout` refers to query time only.
* Parsing the query is not counted towards `search-timeout`.
* If `search-timeout` was not reached during the search, finalizing operations such as loading document content or reducers continue.
{{% /alert %}}

Type: integer

Value range: `[1 .. 9,223,372,036,854,775,807]`

Redis Open Source default: `500`

Redis Software default: `500`

Redis Cloud defaults:
- Flexible & Annual: `500`
- Free & Fixed: `100`

### search-topology-validation-timeout

Sets the timeout in milliseconds for topology validation. After this timeout, any pending requests will be processed, even if the topology is not fully connected. A value of `0` means no timeout.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Default: `30000`

### search-union-iterator-heap

The minimum number of iterators in a union at which the iterator will switch to a heap based implementation.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Default: `20`

### search-upgrade-index

Relevant only when loading an v1.x RDB file. Specify the argument for upgrading the index.
This configuration setting is a special configuration option introduced to upgrade indexes from v1.x RQE versions, otherwise known as legacy indexes. This configuration option needs to be given for each legacy index, followed by the index name and all valid options for the index description (also referred to as the `ON` arguments for following hashes) as described on [FT.CREATE]({{< relref "/commands/ft.create/" >}}) command page. 

Type: string

Default: there is no default for index name, and the other arguments have the same defaults as with the [`FT.CREATE`]({{< relref "/commands/ft.create/" >}}) command.

**Example**

```
search-upgrade-index idx PREFIX 1 tt LANGUAGE french LANGUAGE_FIELD MyLang SCORE 0.5 SCORE_FIELD MyScore
    PAYLOAD_FIELD MyPayload UPGRADE_INDEX idx1
```

{{% alert title="Notes" color="info" %}}
* If the RDB file does not contain a legacy index that's specified in the configuration, a warning message will be added to the log file, and loading will continue.
* If the RDB file contains a legacy index that wasn't specified in the configuration, loading will fail and the server won't start.
{{% /alert %}}

### search-vss-max-resize

Added in v2.4.8.

The maximum memory resize (in bytes) for vector indexes.
The maximum memory resize (in bytes) for vector indexes. This value will override default memory limits if you need to allow for a large [`BLOCK_SIZE`]({{< relref "/develop/ai/search-and-query/vectors/#creation-attributes-per-algorithm" >}}).

Type: integer

Valid range: `[0 .. 4,294,967,295]`

Default: `0`

### search-workers-priority-bias-threshold

The number of high priority tasks to be executed at any given time by the worker thread pool before executing low priority tasks. After this number of high priority tasks are being executed, the worker thread pool will execute high and low priority tasks alternately.

Type: integer

Valid range: `[1 .. 9,223,372,036,854,775,807]`

Default: `1`

### search-workers

The number of worker threads to use for query processing and background tasks.

Type: integer

Valid range: `[0 .. 8192]`

Default: `0`

## Set configuration parameters at module load-time (deprecated)

These methods are deprecated beginning with Redis 8.

Setting configuration parameters at load-time is done by appending arguments after the `--loadmodule` argument when starting a server from the command line, or after the `loadmodule` directive in a Redis config file. For example:

In [redis.conf]({{< relref "/operate/oss_and_stack/management/config" >}}):

```
loadmodule ./redisearch.so [OPT VAL]...
```

From the [Redis CLI]({{< relref "/develop/tools/cli" >}}), using the [MODULE LOAD]({{< relref "/commands/module-load" >}}) command:

```
127.0.0.6379> MODULE LOAD redisearch.so [OPT VAL]...
```

From the command line:

```
$ redis-server --loadmodule ./redisearch.so [OPT VAL]...
```

## Set configuration parameters at run-time (for supported parameters, deprecated)

These methods are deprecated beginning with Redis 8.

RQE exposes the `FT.CONFIG` endpoint to allow for the setting and retrieval of configuration parameters at run-time.

To set the value of a configuration parameter at run-time (for supported parameters), simply run:

```sh
FT.CONFIG SET OPT1 VAL1
```

Similarly, you can retrieve current configuration parameter values using:

```sh
FT.CONFIG GET OPT1
FT.CONFIG GET *
```

Values set using [`FT.CONFIG SET`]({{< relref "/commands/ft.config-set/" >}}) are not persisted after server restart.