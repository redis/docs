---
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
description: 'Querying and searching in Redis Community Edition can be tuned through multiple
  configuration parameters. Some of these parameters can only be set at load-time,
  while other parameters can be set either at load-time or at run-time.

  '
linkTitle: Configuration parameters
title: Configuration parameters
weight: 4
---

## Set configuration parameters at module load-time

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

## Set configuration parameters at run-time (for supported parameters)

RediSearch exposes the `FT.CONFIG` endpoint to allow for the setting and retrieval of configuration parameters at run-time.

To set the value of a configuration parameter at run-time (for supported parameters), simply run:

```sh
FT.CONFIG SET OPT1 VAL1
```

Similarly, you can retrieve current configuration parameter values using:

```sh
FT.CONFIG GET OPT1
FT.CONFIG GET *
```

Values set using [`FT.CONFIG SET`]({{< relref "commands/ft.config-set/" >}}) are not persisted after server restart.

## RediSearch configuration parameters

The following table summarizes which configuration parameters can be set at module load-time and run-time:

| Configuration Parameter                             | Load-time          | Run-time             |
| :-------                                            | :-----             | :-----------         |
| [TIMEOUT](#timeout)                                 | :white_check_mark: | :white_check_mark:   |
| [ON_TIMEOUT](#on_timeout)                           | :white_check_mark: | :white_check_mark:   |
| [SAFEMODE](#safemode) deprecated in v1.6            | :white_check_mark: | :white_check_mark:   |
| [CONCURRENT_WRITE_MODE](#concurrent_write_mode)     | :white_check_mark: | :white_check_mark:   |
| [EXTLOAD](#extload)                                 | :white_check_mark: | :white_check_mark:   |
| [MINPREFIX](#minprefix)                             | :white_check_mark: | :white_check_mark:   |
| [MINSTEMLEN](#minstemlen)                           | :white_check_mark: | :white_check_mark:   |
| [MAXPREFIXEXPANSIONS](#maxprefixexpansions)         | :white_check_mark: | :white_check_mark:   |
| [MAXDOCTABLESIZE](#maxdoctablesize)                 | :white_check_mark: | :white_check_mark:   |
| [MAXSEARCHRESULTS](#maxsearchresults)               | :white_check_mark: | :white_check_mark:   |
| [MAXAGGREGATERESULTS](#maxaggregateresults)         | :white_check_mark: | :white_check_mark:   |
| [FRISOINI](#frisoini)                               | :white_check_mark: | :white_check_mark:   |
| [CURSOR_MAX_IDLE](#cursor_max_idle)                 | :white_check_mark: | :white_check_mark:   |
| [PARTIAL_INDEXED_DOCS](#partial_indexed_docs)       | :white_check_mark: | :white_check_mark:   |
| [GC_SCANSIZE](#gc_scansize)                         | :white_check_mark: | :white_large_square: | 
| [GC_POLICY](#gc_policy)                             | :white_check_mark: | :white_check_mark:   |
| [NOGC](#nogc)                                       | :white_check_mark: | :white_check_mark:   |
| [FORK_GC_RUN_INTERVAL](#fork_gc_run_interval)       | :white_check_mark: | :white_check_mark:   |
| [FORK_GC_RETRY_INTERVAL](#fork_gc_retry_interval)   | :white_check_mark: | :white_check_mark:   |
| [FORK_GC_CLEAN_THRESHOLD](#fork_gc_clean_threshold) | :white_check_mark: | :white_check_mark:   |
| [UPGRADE_INDEX](#upgrade_index)                     | :white_check_mark: | :white_check_mark:   |
| [OSS_GLOBAL_PASSWORD](#oss_global_password)         | :white_check_mark: | :white_large_square: |
| [DEFAULT_DIALECT](#default_dialect)                 | :white_check_mark: | :white_check_mark:   |
| [VSS_MAX_RESIZE](#vss_max_resize)                   | :white_check_mark: | :white_check_mark:   |
| [INDEX_CURSOR_LIMIT](#index_cursor_limit)           | :white_check_mark: | :white_check_mark:   |

---

### TIMEOUT

The maximum amount of time in milliseconds that a search query is allowed to run. If this time is exceeded, Redis returns the top results accumulated so far, or an error depending on the policy set with `ON_TIMEOUT`. The timeout can be disabled by setting it to 0.

{{% alert title="Notes" color="info" %}}

* `TIMEOUT` refers to query time only.
* Parsing the query is not counted towards `TIMEOUT`.
* If `TIMEOUT` was not reached during the search, finalizing operations such as loading document content or reducers continue.

{{% /alert %}}

#### Default

500

#### Example

```
$ redis-server --loadmodule ./redisearch.so TIMEOUT 100
```

---

### ON_TIMEOUT

The response policy for queries that exceed the `TIMEOUT` setting can be one of the following:

* **RETURN**: this policy will return the top results accumulated by the query until it timed out.
* **FAIL**: will return an error when the query exceeds the timeout value.

#### Default

RETURN

#### Example

```
$ redis-server --loadmodule ./redisearch.so ON_TIMEOUT fail
```

---

### SAFEMODE

{{% alert title="Deprecated" color="info" %}}

Deprecated in v1.6. From this version, SAFEMODE is the default.  If you would still like to re-enable the concurrent mode for writes, use [CONCURRENT_WRITE_MODE](#concurrent_write_mode).

{{% /alert %}}

If present in the argument list, RediSearch will turn off concurrency for query processing and work in a single thread.

This is useful if data consistency is extremely important, and avoids a situation where deletion of documents while querying them can cause momentarily inconsistent results. For example, documents that were valid during the invocation of the query are not returned because they were deleted during query processing.

#### Default
Off (not present)

#### Example

```
$ redis-server --loadmodule ./redisearch.so SAFEMODE
```

___

### CONCURRENT_WRITE_MODE

If enabled, write queries will be performed concurrently, but only the tokenization part is executed concurrently. The actual write operation still requires holding the Redis Global Lock.

#### Default

Not set - "disabled"

#### Example

```
$ redis-server --loadmodule ./redisearch.so CONCURRENT_WRITE_MODE
```

{{% alert title="Note" color="info" %}}

* Added in v1.6

{{% /alert %}}

---

### EXTLOAD

If present, RediSearch will try to load an extension dynamic library from its specified file path. See [Extensions]({{< relref "/develop/interact/search-and-query/administration/extensions" >}}) for details.

#### Default

None

#### Example

```
$ redis-server --loadmodule ./redisearch.so EXTLOAD ./ext/my_extension.so
```

---

### MINPREFIX

The minimum number of characters allowed for prefix queries (e.g., `hel*`). Setting it to 1 can hurt performance.

#### Default

2

#### Example

```
$ redis-server --loadmodule ./redisearch.so MINPREFIX 3
```

---

### MINSTEMLEN

The minimum word length to stem. The default value is `4`. Setting it lower than `4` can reduce performance.

#### Default

4

#### Example

```
$ redis-server --loadmodule ./redisearch.so MINSTEMLEN 3
```

---

### MAXPREFIXEXPANSIONS

The maximum number of expansions allowed for query prefixes. Setting it too high can cause performance issues. If MAXPREFIXEXPANSIONS is reached, the query will continue with the first acquired results. The configuration is applicable for all affix queries including prefix, suffix, and infix (contains) queries.

#### Default

200

#### Example

```
$ redis-server --loadmodule ./redisearch.so MAXPREFIXEXPANSIONS 1000
```

---

### MAXDOCTABLESIZE

The maximum size of the internal hash table used for storing the documents. 
Note: this configuration option doesn't limit the number of documents that can be stored. It only affects the hash table internal array maximum size.
Decreasing this property can decrease the memory overhead in cases where the index holds a small number of documents that are constantly updated.

#### Default

1000000

#### Example

```
$ redis-server --loadmodule ./redisearch.so MAXDOCTABLESIZE 3000000
```

---

### MAXSEARCHRESULTS

The maximum number of results to be returned by the [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) command if LIMIT is used.
Setting value to `-1` will remove the limit. 

#### Default

1000000

#### Example

```
$ redis-server --loadmodule ./redisearch.so MAXSEARCHRESULTS 3000000
```

---

### MAXAGGREGATERESULTS

The maximum number of results to be returned by the [`FT.AGGREGATE`]({{< relref "commands/ft.aggregate/" >}}) command if LIMIT is used.
Setting value to `-1` will remove the limit. 

#### Default

unlimited

#### Example

```
$ redis-server --loadmodule ./redisearch.so MAXAGGREGATERESULTS 3000000
```

---

### FRISOINI

If present, load the custom Chinese dictionary from the specified path. See [Using custom dictionaries]({{< relref "develop/interact/search-and-query/advanced-concepts/chinese#using-custom-dictionaries" >}}) for more details.

#### Default

Not set

#### Example

```
$ redis-server --loadmodule ./redisearch.so FRISOINI /opt/dict/friso.ini
```

---

### CURSOR_MAX_IDLE

The maximum idle time (in ms) that can be set to the [cursor api]({{< relref "develop/interact/search-and-query/advanced-concepts/aggregations#cursor-api" >}}).

#### Default

300000

#### Example

```
$ redis-server --loadmodule ./redisearch.so CURSOR_MAX_IDLE 500000
```

{{% alert title="Note" color="info" %}}

* Added in v1.6

{{% /alert %}}

---

### PARTIAL_INDEXED_DOCS

Enable/disable the Redis command filter. The filter optimizes partial updates of hashes
and may avoid re-indexing the hash if changed fields are not part of the schema. 

#### Considerations

The Redis command filter will be executed upon each Redis command.  Though the filter is
optimized, this will introduce a small increase in latency on all commands.  
This configuration is best used with partially indexed documents where the non-indexed fields are updated frequently.

#### Default

0

#### Example

```
$ redis-server --loadmodule ./redisearch.so PARTIAL_INDEXED_DOCS 1
```

{{% alert title="Note" color="info" %}}

* Added in v2.0.0

{{% /alert %}}


---

### GC_SCANSIZE

The bulk size of the internal GC used for cleaning up indexes.

#### Default

100

#### Example

```
$ redis-server --loadmodule ./redisearch.so GC_SCANSIZE 10
```

---

### GC_POLICY

The garbage collection policy. Supported policies are:

* **FORK**:   uses a forked thread for garbage collection (v1.4.1 and above).
              This is the default GC policy since version 1.6.1 and is ideal
              for general purpose workloads.
* **LEGACY**: Uses a synchronous, in-process fork. This is ideal for read-heavy
              and append-heavy workloads with very few updates/deletes.
              Deprecated in v2.6.0.

#### Default

FORK

#### Example

```
$ redis-server --loadmodule ./redisearch.so GC_POLICY FORK
```

{{% alert title="Note" color="info" %}}

* When the `GC_POLICY` is `FORK` it can be combined with the options below.

{{% /alert %}}

---

### NOGC

If set, Garbage Collection is disabled for all indexes. This is used mainly for debugging and testing and should not be set by users.

#### Default

Not set

#### Example

```
$ redis-server --loadmodule ./redisearch.so NOGC
```

---

### FORK_GC_RUN_INTERVAL

Interval (in seconds) between two consecutive `fork GC` runs.

#### Default

30

#### Example

```
$ redis-server --loadmodule ./redisearch.so GC_POLICY FORK FORK_GC_RUN_INTERVAL 60
```

{{% alert title="Note" color="info" %}}

* Can only be combined with `GC_POLICY FORK`

{{% /alert %}}

---

### FORK_GC_RETRY_INTERVAL

Interval (in seconds) in which RediSearch will retry to run `fork GC` in case of a failure. Usually, a failure could happen when the Redis fork API does not allow for more than one fork to be created at the same time.

#### Default

5

#### Example

```
$ redis-server --loadmodule ./redisearch.so GC_POLICY FORK FORK_GC_RETRY_INTERVAL 10
```

{{% alert title="Notes" color="info" %}}

* Can only be combined with `GC_POLICY FORK`
* Added in v1.4.16

{{% /alert %}}

---

### FORK_GC_CLEAN_THRESHOLD

The `fork GC` will only start to clean when the number of not cleaned documents exceeds this threshold, otherwise it will skip this run. While the default value is 100, it's highly recommended to change it to a higher number.

#### Default

100

#### Example

```
$ redis-server --loadmodule ./redisearch.so GC_POLICY FORK FORK_GC_CLEAN_THRESHOLD 10000
```

{{% alert title="Notes" color="info" %}}

* Can only be combined with `GC_POLICY FORK`
* Added in v1.4.16

{{% /alert %}}

---

### UPGRADE_INDEX

This configuration is a special configuration option introduced to upgrade indices from v1.x RediSearch versions, otherwise known as legacy indices. This configuration option needs to be given for each legacy index, followed by the index name and all valid options for the index description (also referred to as the `ON` arguments for following hashes) as described on [ft.create api]({{< relref "commands/ft.create/" >}}). 

#### Default

There is no default for index name, and the other arguments have the same defaults as with the [`FT.CREATE`]({{< relref "commands/ft.create/" >}}) API.

#### Example

```
$ redis-server --loadmodule ./redisearch.so UPGRADE_INDEX idx PREFIX 1 tt LANGUAGE french LANGUAGE_FIELD MyLang SCORE 0.5 SCORE_FIELD MyScore PAYLOAD_FIELD MyPayload UPGRADE_INDEX idx1
```

{{% alert title="Notes" color="info" %}}

* If the RDB file does not contain a legacy index that's specified in the configuration, a warning message will be added to the log file, and loading will continue.
* If the RDB file contains a legacy index that wasn't specified in the configuration, loading will fail and the server won't start.

{{% /alert %}}

---

### OSS_GLOBAL_PASSWORD

Global Redis Community Edition cluster password that will be used to connect to other shards.

#### Default

Not set

#### Example

```
$ redis-server --loadmodule ./redisearch.so OSS_GLOBAL_PASSWORD password
```

{{% alert title="Notes" color="info" %}}

* Only relevant when Coordinator is used
* Added in v2.0.3

{{% /alert %}}

---

### DEFAULT_DIALECT

The default
[DIALECT]({{< relref "/develop/interact/search-and-query/advanced-concepts/dialects" >}})
to be used by [`FT.CREATE`]({{< relref "commands/ft.create/" >}}), [`FT.AGGREGATE`]({{< relref "commands/ft.aggregate/" >}}), [`FT.EXPLAIN`]({{< relref "commands/ft.explain/" >}}), [`FT.EXPLAINCLI`]({{< relref "commands/ft.explaincli/" >}}), and [`FT.SPELLCHECK`]({{< relref "commands/ft.spellcheck/" >}}).
See [Query dialects]({{< relref "/develop/interact/search-and-query/advanced-concepts/dialects" >}})
for more information.

#### Default

1

#### Example

```
$ redis-server --loadmodule ./redisearch.so DEFAULT_DIALECT 2
```

---

### VSS_MAX_RESIZE

The maximum memory resize for vector similarity indexes in bytes. This value will override default memory limits if you need to allow for a large [`BLOCK_SIZE`]({{< relref "develop/interact/search-and-query/advanced-concepts/vectors/#creation-attributes-per-algorithm" >}}).

#### Default

0

#### Example

```
$ redis-server --loadmodule ./redisearch.so VSS_MAX_RESIZE 52428800  # 50MB
```

{{% alert title="Note" color="info" %}}

* Added in v2.4.8

{{% /alert %}}
### INDEX_CURSOR_LIMIT

The maximum number of cursors that can be opened, per shard, at any given time.  Cursors can be opened by the user via [`FT.AGGREGATE WITHCURSOR`]({{< relref "commands/ft.aggregate/" >}}).  Cursors are also opened internally by the Redis Query Engine for long-running queries.  Once `INDEX_CURSOR_LIMIT` is reached, any further attempts at opening a cursor will result in an error.

{{% alert title="Notes" color="info" %}}

* Caution should be used in modifying this parameter.  Every open cursor results in additional memory usage.
* Cursor usage should be regulated first by use of [`FT.CURSOR DEL`]({{< relref "commands/ft.cursor-del/" >}}) and/or [`MAXIDLE`]({{< relref "commands/ft.aggregate/" >}}) prior to modifying `INDEX_CURSOR_LIMIT`
* See [Cursor API]({{< relref "develop/interact/search-and-query/advanced-concepts/aggregations#cursor-api" >}}) for more details.

* Added in 2.10.8
{{% /alert %}}

#### Default

128

#### Example

```
$ redis-server --loadmodule ./redisearch.so INDEX_CURSOR_LIMIT 180
```