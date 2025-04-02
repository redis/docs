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
{{< note >}}
As of Redis 8 in Redis Open Source (Redis 8), configuration parameters for the time series data structure are now set in the following ways:
* At load time via your `redis.conf` file.
* At run time (where applicable) using the [`CONFIG SET`]({{< relref "/commands/config-set" >}}) command.

Also, Redis 8 persists probabilistic configuration parameters just like any other configuration parameters (e.g., using the [`CONFIG REWRITE`]({{< relref "/commands/config-rewrite/" >}}) command).
{{< /note >}}

## Time series configuration parameters

| Parameter name<br />(version < 8.0) | Parameter name<br />(version &#8805; 8.0) | Run-time | Redis<br />Software | Redis<br />Cloud |
| :------- | :------- | :------- | :------- | :------- |
| CHUNK_SIZE_BYTES     | [ts-chunk-size-bytes](#ts-chunk-size-bytes)                   | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| COMPACTION_POLICY    | [ts-compaction-policy](#ts-compaction-policy)                 | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| DUPLICATE_POLICY     | [ts-duplicate-policy](#ts-duplicate-policy)                   | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| ENCODING             | [ts-encoding](#ts-encoding)                                   | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| IGNORE_MAX_TIME_DIFF | [ts-ignore-max-time-diff](#ts-ignore-max-time-diff-and-ts-ignore-max-val-diff) | :white_check_mark:   |||
| IGNORE_MAX_VAL_DIFF  | [ts-ignore-max-val-diff](#ts-ignore-max-time-diff-and-ts-ignore-max-val-diff)  | :white_check_mark:   |||
| NUM_THREADS          | [ts-num-threads](#ts-num-threads)                             | :white_large_square: | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| RETENTION_POLICY     | [ts-retention-policy](#ts-retention-policy)                   | :white_check_mark:   | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |
| OSS_GLOBAL_PASSWORD  | Deprecated in v8.0.0. Replace with the `masterauth` password. | :white_check_mark:   |||

{{< note >}}
Parameter names for Redis Open Source versions < 8.0, while deprecated, will still be supported in Redis 8.
{{< /note >}}

---

### ts-chunk-size-bytes

Default initial allocation size, in bytes, for the data part of each new chunk.
This default value is applied to each new time series upon its creation.
Actual chunks may consume more memory.

Type: integer

Valid range: `[48 .. 1048576]`; must be a multiple of 8

Default: `4096`

### ts-compaction-policy

Default compaction rules for newly created keys with [`TS.ADD`]({{< relref "/commands/ts.add/" >}}), [`TS.INCRBY`]({{< relref "/commands/ts.incrby/" >}}), and  [`TS.DECRBY`]({{< relref "/commands/ts.decrby/" >}}).

Type: string

Default: No compaction rules.

**Discussion**

#### Example

```
$ redis-server --loadmodule ./redistimeseries.so NUM_THREADS 3
```

### COMPACTION_POLICY

Default compaction rules for newly created key with [`TS.ADD`]({{< relref "commands/ts.add/" >}}), [`TS.INCRBY`]({{< relref "commands/ts.incrby/" >}}), and  [`TS.DECRBY`]({{< relref "commands/ts.decrby/" >}}).

Note that `COMPACTION_POLICY` has no effect on keys created with [`TS.CREATE`]({{< relref "commands/ts.create/" >}}). To understand the motivation for this behavior, consider the following scenario: Suppose a `COMPACTION_POLICY` is defined, but then one wants to manually create an additional compaction rule (using [`TS.CREATERULE`]({{< relref "commands/ts.createrule/" >}})) which requires first creating an empty destination key (using [`TS.CREATE`]({{< relref "commands/ts.create/" >}})). But now there is a problem: due to the `COMPACTION_POLICY`, automatic compactions would be undesirably created for that destination key.

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
In a clustered environment, if you set `COMPACTION_POLICY`, you must use [hash tags]({{< relref "/operate/oss_and_stack/reference/cluster-spec" >}}#hash-tags) for all time series key names. This ensures that Redis will create each compaction in the same hash slot as its source key. If you don't, the system may fail to compact the data without displaying any error messages.
{{% /warning %}}

When a compaction policy is defined, compaction rules will be created automatically for newly created time series, and their key would be set to:
  
* If the time bucket alignment is 0:

   _key_agg_dur_ where _key_ is the key of the source time series, _agg_ is the aggregator (in uppercase), and _dur_ is the bucket duration in milliseconds. Example: `key_SUM_60000`.
     
* If the time bucket alignment is not 0:

   _key_agg_dur_aln_ where _key_ is the key of the source time series, _agg_ is the aggregator (in uppercase), _dur_ is the bucket duration in milliseconds, and _aln_ is the time bucket alignment in milliseconds. Example: `key_SUM_60000_1000`.

**Examples**

- `max:1M:1h` - Aggregate using `max` over one-minute windows and retain the last hour
- `twa:1d:0m:360M` - Aggregate daily [06:00 .. 06:00) using `twa`; no expiration

### ts-duplicate-policy

The default policy for handling insertion ([`TS.ADD`]({{< relref "/commands/ts.add/" >}}) and [`TS.MADD`]({{< relref "/commands/ts.madd/" >}})) of multiple samples with identical timestamps, with one of the following values:

#### Example

```
$ redis-server --loadmodule ./redistimeseries.so COMPACTION_POLICY max:1m:1h;min:10s:5d:10d;last:5M:10m;avg:2h:10d;avg:3d:100d
```

### RETENTION_POLICY

Default retention period, in milliseconds, for newly created keys.

Retention period is the maximum age of samples compared to highest reported timestamp, per key. Samples are expired based solely on the difference between their timestamp and the timestamps passed to subsequent [`TS.ADD`]({{< relref "commands/ts.add/" >}}), [`TS.MADD`]({{< relref "commands/ts.madd/" >}}), [`TS.INCRBY`]({{< relref "commands/ts.incrby/" >}}), and [`TS.DECRBY`]({{< relref "commands/ts.decrby/" >}}) calls.

The value `0` means no expiration.

When both `COMPACTION_POLICY` and `RETENTION_POLICY` are specified, the retention of newly created compactions is according to the retention time specified in `COMPACTION_POLICY`.

#### Default

0

#### Example

Setting the default retention to 300 days:

```
$ redis-server --loadmodule ./redistimeseries.so RETENTION_POLICY 25920000000
```

### DUPLICATE_POLICY

Is policy for handling insertion ([`TS.ADD`]({{< relref "commands/ts.add/" >}}) and [`TS.MADD`]({{< relref "commands/ts.madd/" >}})) of multiple samples with identical timestamps, with one of the following values:

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

Default: `BLOCK`

**Precedence order**

Since the duplication policy can be provided at different levels, the actual precedence of the used policy will be:

1. [`TS.ADD`]({{< relref "/commands/ts.add/" >}})'s `ON_DUPLICATE_POLICY` optional argument.
1. Key-level policy, as set with [`TS.CREATE`]({{< relref "/commands/ts.create/" >}})'s and [`TS.ALTER`]({{< relref "/commands/ts.alter/" >}})'s `DUPLICATE_POLICY` optional argument.
1. The `ts-duplicate-policy` configuration parameter.
1. The default policy.

### ts-encoding

Note: Before v1.6 this configuration parameter was named `CHUNK_TYPE`.

Default chunk encoding for automatically created time series keys when [ts-compaction-policy](#ts-compaction-policy) is configured.

Type: string

Valid values: `COMPRESSED`, `UNCOMPRESSED`

Default: `COMPRESSED`

### ts-ignore-max-time-diff and ts-ignore-max-val-diff

Default values for newly created keys.

Types:
- `ts-ignore-max-time-diff`: integer
- `ts-ignore-max-val-diff`: double

Valid ranges:
- `ts-ignore-max-time-diff`: `[0 .. 9,223,372,036,854,775,807]`
- `ts-ignore-max-val-diff`: `[0 .. 1.7976931348623157e+308]`

Defaults:
- `ts-ignore-max-time-diff`: 0
- `ts-ignore-max-val-diff`: 0.0

**Discussion**

Many sensors report data periodically. Often, the difference between the measured value and the previous measured value is negligible and related to random noise or to measurement accuracy limitations. In such situations it may be preferable not to add the new measurement to the time series.

A new sample is considered a duplicate and is ignored if the following conditions are met:

1. The time series is not a compaction.
1. The time series' `ts-duplicate-policy` is `LAST`.
1. The sample is added in-order (`timestamp ≥ max_timestamp`).
1. The difference of the current timestamp from the previous timestamp (`timestamp - max_timestamp`) is less than or equal to `ts-ignore-max-time-diff`.
1. The absolute value difference of the current value from the value at the previous maximum timestamp (`abs(value - value_at_max_timestamp`) is less than or equal to `ts-ignore-max-val-diff`.

where `max_timestamp` is the timestamp of the sample with the largest timestamp in the time series, and `value_at_max_timestamp` is the value at `max_timestamp`.

### ts-num-threads

The maximum number of per-shard threads for cross-key queries when using cluster mode ([`TS.MRANGE`]({{< relref "/commands/ts.mrange/" >}}), [`TS.MREVRANGE`]({{< relref "/commands/ts.mrevrange/" >}}), [`TS.MGET`]({{< relref "/commands/ts.mget/" >}}), and [`TS.QUERYINDEX`]({{< relref "/commands/ts.queryindex/" >}})). The value must be equal to or greater than `1`. Note that increasing this value may either increase or decrease the performance!

Type: integer

Valid range: `[1..16]`

Redis Open Source default: `3`

Redis Software default: Set by plan, and automatically updates when you change your plan.

Redis Cloud defaults:
- Flexible & Annual: Set by plan
- Free & Fixed: `1`

### ts-retention-policy

Default retention period, in milliseconds, for newly created keys.

Type: integer

Valid range: `[0 .. 9,223,372,036,854,775,807]`

Default: `0`

Retention period is the maximum age of samples compared to highest reported timestamp, per key. Samples are expired based solely on the difference between their timestamps and the timestamps passed to subsequent [`TS.ADD`]({{< relref "/commands/ts.add/" >}}), [`TS.MADD`]({{< relref "/commands/ts.madd/" >}}), [`TS.INCRBY`]({{< relref "/commands/ts.incrby/" >}}), and [`TS.DECRBY`]({{< relref "/commands/ts.decrby/" >}}) calls.

The value `0` means no expiration.

When both `ts-compaction-policy` and `ts-retention-policy` are specified, the retention of newly created compactions is according to the retention time specified in `ts-compaction-policy`.

## Setting configuration parameters on module load (deprecated)

These methods are deprecated beginning with Redis 8.

Setting configuration parameters at load-time is done by appending arguments after the `--loadmodule` argument when starting a server from the command line or after the `loadmodule` directive in a Redis config file. For example:

In [redis.conf]({{< relref "/operate/oss_and_stack/management/config" >}}):

```sh
loadmodule ./redistimeseries.so [OPT VAL]...
```

From the [Redis CLI]({{< relref "/develop/tools/cli" >}}), using the [MODULE LOAD]({{< relref "/commands/module-load" >}}) command:

```
127.0.0.6379> MODULE LOAD redistimeseries.so [OPT VAL]...
```

From the command line:

```sh
$ redis-server --loadmodule ./redistimeseries.so [OPT VAL]...
```