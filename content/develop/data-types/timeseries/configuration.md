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
description: Redis time series support multiple configuration parameters.
linkTitle: Configuration
title: Configuration Parameters
weight: 3
---
## Redis CE - Setting configuration parameters

Previous to version 8.0, all time series configuration parameters were load-time parameters.

In order to set the values of load-time parameters, you have to use one of the following methods:

- Pass them as command-line arguments following the `loadmodule` argument when starting redis-server

  `redis-server --loadmodule ./{modulename}.so [OPT VAL]...`

- Add them as arguments to the `loadmodule` directive in your configuration file (e.g., `redis.conf`):

  `loadmodule ./{modulename}.so [OPT VAL]...`

- Using the `MODULE LOAD path [arg [arg ...]]` command.

- Using the `MODULE LOADEX path [CONFIG name value [CONFIG name value ...]] [ARGS args [args ....]]` command.

With the introduction of Redis 8.0, most of the time series configuration parameters are now runtime parameters. This means that you can change their values at runtime.
You can also set runtime configuration parameters at load-time, but it is simpler to use the Redis `CONFIG` command with time series runtime configuration parameters, the same way you would do for Redis runtime configuration parameters.

This means:

- `CONFIG SET parameter value [parameter value ...] `

  Set one or more configuration parameters.

- `CONFIG GET parameter [parameter ...]`

  Read the current value of one of more parameters.

- `CONFIG REWRITE`

  Rewrite your Redis configuration file (e.g., the `redis.conf` file) to reflect the configuration changes.

Starting with Redis 8.0, you can also specify time series configuration parameters directly in your Redis configuration file (e.g., your `redis.conf` file) the same way you would do for Redis configuration parameters.

Once a value is set with `CONFIG SET` or added manually to your configuration file, it will overwrite values set with `--loadmodule`, `loadmodule`, `MODULE LOAD`, or `MODULE LOADEX`.

Note that on a cluster, `CONFIG SET` and `CONFIG REWRITE` have to be called on each node separately.

In Redis 8.0, we also introduced new names for the time series configuration parameters, to align the naming with Redis configuration parameters.
When using the `CONFIG` command, you must use the new names.

## Time series configuration parameters

| Parameter name<br />(version < 8.0) | Parameter name<br />(version &#8805; 8.0) | Run-time | Redis<br />Software | Redis<br />Cloud |
| :------- | :------- | :------- | :------- | :------- |
| CHUNK_SIZE_BYTES     | [ts-chunk-size-bytes](#chunk_size_bytes--ts-chunk-size-bytes)    | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| COMPACTION_POLICY    | [ts-compaction-policy](#compaction_policy--ts-compaction-policy) | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| DUPLICATE_POLICY     | [ts-duplicate-policy](#duplicate_policy--ts-duplicate-policy)    | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| RETENTION_POLICY     | [ts-retention-policy](#retention_policy--ts-retention-policy)    | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| ENCODING             | [ts-encoding](#encoding--ts-encoding)                            | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| IGNORE_MAX_TIME_DIFF | [ts-ignore-max-time-diff](#ignore_max_time_diff--ts-ignore-max-time-diff-and-ignore_max_val_diff--ts-ignore-max-val-diff) | :white_check_mark:   |||
| IGNORE_MAX_VAL_DIFF  | [ts-ignore-max-val-diff](#ignore_max_time_diff--ts-ignore-max-time-diff-and-ignore_max_val_diff--ts-ignore-max-val-diff)  | :white_check_mark:   |||
| NUM_THREADS          | [ts-num-threads](#num_threads--ts-num-threads)                   | :white_large_square: | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Not Supported">&#x274c; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| [OSS_GLOBAL_PASSWORD](#oss_global_password)  | Deprecated in v8.0                       | :white_check_mark:   |||

---

### CHUNK_SIZE_BYTES / ts-chunk-size-bytes

The initial allocation size, in bytes, for the data part of each new chunk. Actual chunks may consume more memory.
Changing this value does not affect existing chunks.

Type: integer

Valid range: `[48 .. 1048576]`; must be a multiple of 8

#### Precedence order

Since the chunk size can be provided at different levels, the actual precedence of the chunk size will be:

1. Key-level policy, as set with [`TS.CREATE`]({{< relref "/commands/ts.create/" >}})'s and [`TS.ALTER`]({{< relref "/commands/ts.alter/" >}})'s `CHUNK_SIZE` optional argument.
1. The `ts-chunk-size-bytes` configuration parameter.
1. The hard-coded default: `4096`

#### Example

Setting the default chunk size to 1024 bytes

Version < 8.0:

```
$ redis-server --loadmodule ./redistimeseries.so CHUNK_SIZE_BYTES 1024
```

Version >= 8.0:

```
redis> CONFIG SET ts-chunk-size-bytes 1024
```

### COMPACTION_POLICY / ts-compaction-policy

Default compaction rules for newly created keys with [`TS.ADD`]({{< relref "/commands/ts.add/" >}}), [`TS.INCRBY`]({{< relref "/commands/ts.incrby/" >}}), and  [`TS.DECRBY`]({{< relref "/commands/ts.decrby/" >}}).

Type: string

Note that this configuration parameter has no effect on keys created with [`TS.CREATE`]({{< relref "commands/ts.create/" >}}). To understand the motivation for this behavior, consider the following scenario: Suppose a default compaction policy is defined, but then one wants to manually create an additional compaction rule (using [`TS.CREATERULE`]({{< relref "commands/ts.createrule/" >}})) which requires first creating an empty destination key (using [`TS.CREATE`]({{< relref "commands/ts.create/" >}})). But now there is a problem: due to the default compaction policy, automatic compactions would be undesirably created for that destination key.

Each rule is separated by a semicolon (`;`), the rule consists of multiple fields that are separated by a colon (`:`):

* Aggregation type: One of the following:

  | Aggregator | Description                                                      |
  | ---------- | ---------------------------------------------------------------- |
  | `avg`      | Arithmetic mean of all values                                    |
  | `sum`      | Sum of all values                                                |
  | `min`      | Minimum value                                                    |
  | `max`      | Maximum value                                                    |
  | `range`    | Difference between the highest and the lowest value              |
  | `count`    | Number of values                                                 |
  | `first`    | The value with the lowest timestamp in the bucket                |
  | `last`     | The value with the highest timestamp in the bucket               |
  | `std.p`    | Population standard deviation of the values                      |
  | `std.s`    | Sample standard deviation of the values                          |
  | `var.p`    | Population variance of the values                                |
  | `var.s`    | Sample variance of the values                                    |
  | `twa`      | Time-weighted average of all values (since v1.8)                 |

* Duration of each time bucket - number and the time representation (Example for one minute: `1M`, `60s`, or `60000m`)

    * m - millisecond
    * s - seconds
    * M - minute
    * h - hour
    * d - day

* Retention time - number and the time representation (Example for one minute: `1M`, `60s`, or `60000m`)

    * m - millisecond
    * s - seconds
    * M - minute
    * h - hour
    * d - day
    
  `0m`, `0s`, `0M`, `0h`, or `0d` means no expiration.

* (Since v1.8):

  Optional: Time bucket alignment - number and the time representation (Example for one minute: `1M`, `60s`, or `60000m`)

    * m - millisecond
    * s - seconds
    * M - minute
    * h - hour
    * d - day

  Assure that there is a bucket that starts at exactly _alignTimestamp_ after the epoch and align all other buckets accordingly. Default value: 0 (aligned with the epoch). Example: if _bucketDuration_ is 24 hours, setting _alignTimestamp_ to `6h` (6 hours after the Epoch) will ensure that each bucket’s timeframe is [06:00 .. 06:00).

{{% warning %}}
In a clustered environment, if you set this configuration parameter, you must use [hash tags]({{< relref "/operate/oss_and_stack/reference/cluster-spec" >}}#hash-tags) for all time series key names. This ensures that Redis will create each compaction in the same hash slot as its source key. If you don't, the system may fail to compact the data without displaying any error messages.
{{% /warning %}}

When a compaction policy is defined, compaction rules will be created automatically for newly created time series, and their key would be set to:
  
* If the time bucket alignment is 0:

   _key_agg_dur_ where _key_ is the key of the source time series, _agg_ is the aggregator (in uppercase), and _dur_ is the bucket duration in milliseconds. Example: `key_SUM_60000`.
     
* If the time bucket alignment is not 0:

   _key_agg_dur_aln_ where _key_ is the key of the source time series, _agg_ is the aggregator (in uppercase), _dur_ is the bucket duration in milliseconds, and _aln_ is the time bucket alignment in milliseconds. Example: `key_SUM_60000_1000`.

#### Precedence order

1. The `ts-compaction-policy` configuration parameter.
1. No compaction rules.

#### Example rules

- `max:1M:1h` - Aggregate using `max` over one-minute windows and retain the last hour
- `twa:1d:0m:360M` - Aggregate daily [06:00 .. 06:00) using `twa`; no expiration

#### Example

Setting a compaction policy composed of 5 compaction rules

Version < 8.0:

```
$ redis-server --loadmodule ./redistimeseries.so COMPACTION_POLICY max:1m:1h;min:10s:5d:10d;last:5M:10m;avg:2h:10d;avg:3d:100d
```

Version >= 8.0:

```
redis> CONFIG SET ts-compaction-policy max:1m:1h;min:10s:5d:10d;last:5M:10m;avg:2h:10d;avg:3d:100d
```

### DUPLICATE_POLICY / ts-duplicate-policy

The default policy for handling insertion ([`TS.ADD`]({{< relref "/commands/ts.add/" >}}) and [`TS.MADD`]({{< relref "/commands/ts.madd/" >}})) of multiple samples with identical timestamps, with one of the following values:

  | policy     | description                                                      |
  | ---------- | ---------------------------------------------------------------- |
  | `BLOCK`    | Ignore any newly reported value and reply with an error          |
  | `FIRST`    | Ignore any newly reported value                                  |
  | `LAST`     | Override with the newly reported value                           |
  | `MIN`      | Only override if the value is lower than the existing value      |
  | `MAX`      | Only override if the value is higher than the existing value     |
  | `SUM`      | If a previous sample exists, add the new sample to it so that the updated value is equal to (previous + new). If no previous sample exists, set the updated value equal to the new value. |

The default value is applied to each new time series upon its creation.

Type: string

#### Precedence order

Since the duplication policy can be provided at different levels, the actual precedence of the duplication policy will be:

1. [`TS.ADD`]({{< relref "/commands/ts.add/" >}})'s `ON_DUPLICATE_POLICY` optional argument.
1. Key-level policy, as set with [`TS.CREATE`]({{< relref "/commands/ts.create/" >}})'s and [`TS.ALTER`]({{< relref "/commands/ts.alter/" >}})'s `DUPLICATE_POLICY` optional argument.
1. The `ts-duplicate-policy` configuration parameter.
1. The hard-coded default: `BLOCK`

### RETENTION_POLICY / ts-retention-policy

Default retention period, in milliseconds, for newly created keys.

Retention period is the maximum age of samples compared to highest reported timestamp, per key. Samples are expired based solely on the difference between their timestamp and the timestamps passed to subsequent [`TS.ADD`]({{< relref "commands/ts.add/" >}}), [`TS.MADD`]({{< relref "commands/ts.madd/" >}}), [`TS.INCRBY`]({{< relref "commands/ts.incrby/" >}}), and [`TS.DECRBY`]({{< relref "commands/ts.decrby/" >}}) calls.

Type: integer

Valid range: `[0 .. 9,223,372,036,854,775,807]`

The value `0` means no expiration.

When both `COMPACTION_POLICY` / `ts-compaction-policy` and `RETENTION_POLICY` / `ts-retention-policy` are specified, the retention of newly created compactions is according to the retention time specified in `COMPACTION_POLICY` / `ts-compaction-policy`.

#### Precedence order

Since the retention can be provided at different levels, the actual precedence of the retention will be:

1. Key-level retention, as set with [`TS.CREATE`]({{< relref "/commands/ts.create/" >}})'s and [`TS.ALTER`]({{< relref "/commands/ts.alter/" >}})'s `RETENTION` optional argument.
1. The `ts-retention-policy` configuration parameter.
1. No retention.

#### Example

Setting the default retention to 300 days 

Version < 8.0:

```
$ redis-server --loadmodule ./redistimeseries.so RETENTION_POLICY 25920000000
```

Version >= 8.0:

```
redis> CONFIG SET ts-retention-policy 25920000000
```

### ENCODING / ts-encoding

Note: Before v1.6 this configuration parameter was named `CHUNK_TYPE`.

Default chunk encoding for automatically created compactions when [ts-compaction-policy](#ts-compaction-policy) is configured.

Type: string

Valid values: `COMPRESSED`, `UNCOMPRESSED`

#### Precedence order

1. The `ts-encoding` configuration parameter.
1. The hard-coded default: `COMPRESSED`

#### Example

Setting the default encoding to `UNCOMPRESSED`

Version < 8.0:

```
$ redis-server --loadmodule ./redistimeseries.so ENCODING UNCOMPRESSED
```

Version >= 8.0:

```
redis> CONFIG SET ts-encoding UNCOMPRESSED
```

### IGNORE_MAX_TIME_DIFF / ts-ignore-max-time-diff and IGNORE_MAX_VAL_DIFF / ts-ignore-max-val-diff

Default values for newly created keys.

Types:
- `ts-ignore-max-time-diff`: integer
- `ts-ignore-max-val-diff`: double

Valid ranges:
- `ts-ignore-max-time-diff`: `[0 .. 9,223,372,036,854,775,807]`
- `ts-ignore-max-val-diff`: `[0 .. 1.7976931348623157e+308]`

Many sensors report data periodically. Often, the difference between the measured value and the previous measured value is negligible and related to random noise or to measurement accuracy limitations. In such situations it may be preferable not to add the new measurement to the time series.

A new sample is considered a duplicate and is ignored if the following conditions are met:

1. The time series is not a compaction.
1. The time series' `ts-duplicate-policy` is `LAST`.
1. The sample is added in-order (`timestamp ≥ max_timestamp`).
1. The difference of the current timestamp from the previous timestamp (`timestamp - max_timestamp`) is less than or equal to `ts-ignore-max-time-diff`.
1. The absolute value difference of the current value from the value at the previous maximum timestamp (`abs(value - value_at_max_timestamp`) is less than or equal to `ts-ignore-max-val-diff`.

where `max_timestamp` is the timestamp of the sample with the largest timestamp in the time series, and `value_at_max_timestamp` is the value at `max_timestamp`.

#### Precedence order

1. The `ts-ignore-max-time-diff` and `ts-ignore-max-val-diff` configuration parameters.
1. The hard-coded defaults: `0` and `0.0`.

#### Example

Version < 8.0:

```
$ redis-server --loadmodule ./redistimeseries.so IGNORE_MAX_TIME_DIFF 10 IGNORE_MAX_VAL_DIFF 0.1
```

Version >= 8.0:

```
redis> CONFIG SET ts-ignore-max-time-diff 10 ts-ignore-max-val-diff 0.1
```

### NUM_THREADS / ts-num-threads

The maximum number of per-shard threads for cross-key queries when using cluster mode ([`TS.MRANGE`]({{< relref "/commands/ts.mrange/" >}}), [`TS.MREVRANGE`]({{< relref "/commands/ts.mrevrange/" >}}), [`TS.MGET`]({{< relref "/commands/ts.mget/" >}}), and [`TS.QUERYINDEX`]({{< relref "/commands/ts.queryindex/" >}})). The value must be equal to or greater than `1`. Note that increasing this value may either increase or decrease the performance!

Type: integer

Valid range: `[1..16]`

Redis CE default: `3`

Redis Software default: Set by plan, and automatically updates when you change your plan.

Redis Cloud defaults:
- Flexible & Annual: Set by plan
- Free & Fixed: `1`

#### Example

Version < 8.0:

```
$ redis-server --loadmodule ./redistimeseries.so NUM_THREADS 3
```

Version >= 8.0:

```
redis> redis-server --loadmodule ./redistimeseries.so ts-num-threads 3
```


### OSS_GLOBAL_PASSWORD

Previous to version 8.0, when using a cluster with time series, you had to set the `OSS_GLOBAL_PASSWORD` configuration parameter on all the cluster nodes. Starting with version 8.0, this parameter is obsolete, and ignored if present. Redis now utilizes a new shared secret mechanism to allow sending internal commands between cluster nodes.
