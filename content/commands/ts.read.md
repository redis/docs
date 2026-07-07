---
acl_categories:
- '@read'
- '@timeseries'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: timestamp
  name: timestamp
  type: string
- arguments:
  - display_text: milliseconds
    name: milliseconds
    token: BLOCK
    type: integer
  - display_text: min_count
    name: min_count
    type: integer
  name: BLOCK
  optional: true
  type: block
- arguments:
  - display_text: max_count
    name: max_count
    token: MAX_COUNT
    type: integer
  name: MAX_COUNT
  optional: true
  type: block
arity: -3
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
command_flags:
- readonly
- module
complexity: O(log(n)+k) where n is the number of samples in the series and k is the
  number of returned samples
description: 'Read: return up to max_count samples with timestamp >= timestamp. With
  BLOCK, waits up to milliseconds ms until at least min_count qualifying samples exist'
group: timeseries
hidden: false
hints:
- dont_cache
key_specs:
- RO: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: TS.READ
module: TimeSeries
railroad_diagram: /images/railroad/ts.read.svg
since: 8.10.0
stack_path: docs/data-types/timeseries
summary: 'Read: return up to max_count samples with timestamp >= timestamp. With BLOCK,
  waits up to milliseconds ms until at least min_count qualifying samples exist'
syntax_fmt: "TS.READ key timestamp [BLOCK\_milliseconds min_count]\n  [MAX_COUNT\_\
  max_count]"
title: TS.READ
---
Read a batch of time series samples at or after a cursor timestamp, returning up to `max_count` of the oldest qualifying samples ordered by increasing timestamp. By default `TS.READ` returns immediately with whatever is available; add the optional `BLOCK` keyword to wait until at least `min_count` samples exist.

`TS.READ` lets applications continuously consume historical and newly appended samples without polling [`TS.RANGE`]({{< relref "commands/ts.range/" >}}) manually. The key may be a regular time series or a compaction time series.

[Examples](#examples)

## Required arguments

<details open>
<summary><code>key</code></summary>

is the key name for the time series. It may identify a regular series or a compaction series.
</details>

<details open>
<summary><code>timestamp</code></summary>

is the inclusive lower-bound cursor for the read. The command selects samples whose timestamp is greater than or equal to the resolved cursor (`sample_timestamp >= resolved_timestamp`).

`timestamp` is either a non-negative integer Unix timestamp in milliseconds or one of the sentinels `-`, `+`, or `$`:

| Value                | Name          | Description |
| -------------------- | ------------- | ----------- |
| Non-negative integer | Literal cursor | A Unix timestamp in milliseconds. Matching is inclusive. `0` is accepted and reads from the beginning. |
| `-`                  | Earliest      | The timestamp of the earliest sample in the series, or `0` when the series is empty or does not exist. |
| `+`                  | Latest        | The timestamp of the latest sample in the series, or `0` when the series is empty or does not exist. The cursor is inclusive, so the latest existing sample itself qualifies (aligned with [`TS.RANGE`]({{< relref "commands/ts.range/" >}})). Without `BLOCK`, the call returns that sample immediately; with `BLOCK` and a `min_count` greater than `1`, it blocks until enough samples at or after that timestamp exist. Intended for the first call only. |
| `$`                  | New           | The timestamp of the latest sample plus 1, or `0` when the series is empty or does not exist. Only samples reported after the command was received by the server qualify; the latest existing sample is excluded. |

The `+` and `$` semantics mirror the special IDs of [`XREAD`]({{< relref "commands/xread/" >}}) and [`XREADGROUP`]({{< relref "commands/xreadgroup/" >}}). The server resolves all sentinels exactly once, when the command is received, so the cursor stays stable while the client is blocked. Send `-`, `+`, and `$` to the server as-is; do not resolve them on the client side.

Use the following table to choose the cursor for the first call:

| Goal                                          | First-call `timestamp` |
| --------------------------------------------- | ---------------------- |
| Read the full history, then new samples       | `-` or `0`             |
| Start from the current latest sample, inclusive | `+`                  |
| Receive only samples added after the call     | `$`                    |

For every subsequent call, use `last_returned_timestamp + 1` so you receive no misses and no duplicates. Do not reuse `+` or `$` after the first call. If no samples are returned, you can retry with the same cursor, subject to your application's delivery policy.
</details>

## Optional arguments

<details open>
<summary><code>BLOCK milliseconds min_count</code></summary>

makes the command block instead of returning immediately. When `BLOCK` is present, the command waits until at least `min_count` qualifying samples are available, until `milliseconds` elapse, or until the key is removed, whichever occurs first.

`milliseconds` is a non-negative integer timeout. A value of `0` means block indefinitely, until `min_count` samples become available or the key is removed (the same convention as [`BLPOP`]({{< relref "commands/blpop/" >}}) and `XREAD BLOCK 0`).

`min_count` is the unblock threshold: the number of qualifying samples required before the command returns ahead of the timeout. It must be a positive integer. When `BLOCK` is omitted, the command does not block and returns whatever is available immediately, even when no samples qualify.
</details>

<details open>
<summary><code>MAX_COUNT max_count</code></summary>

is the reply cap: the maximum number of samples to return. It must be a positive integer and, when `BLOCK` is used, greater than or equal to `min_count`. When `MAX_COUNT` is not provided, the reply is unbounded. When more matching samples exist than `max_count`, the server returns the oldest `max_count` samples first, so you can page forward.

`MAX_COUNT` defaults to unlimited; set it explicitly when consuming large histories to bound the reply size and enable paging.
</details>

The `BLOCK` and `MAX_COUNT` keywords are optional and independent. Omit `BLOCK` to read without blocking; omit `MAX_COUNT` to leave the reply size unbounded. The keyword tokens are case-insensitive and can be given in any order. A keyword without its values, or any stray trailing token, is rejected as a wrong-arity error.

## Examples

<details open>
<summary><b>Read history without blocking</b></summary>

Create a time series and add three samples.

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE sensor:1
OK
127.0.0.1:6379> TS.ADD sensor:1 100 1.0
(integer) 100
127.0.0.1:6379> TS.ADD sensor:1 200 2.0
(integer) 200
127.0.0.1:6379> TS.ADD sensor:1 300 3.0
(integer) 300
{{< / highlight >}}

Read all historical samples without blocking. With no `BLOCK` keyword the command returns immediately, and `max_count` is unlimited.

{{< highlight bash >}}
127.0.0.1:6379> TS.READ sensor:1 0
1) 1) (integer) 100
   2) 1
2) 1) (integer) 200
   2) 2
3) 1) (integer) 300
   2) 3
{{< / highlight >}}

The `-` sentinel is equivalent for a full read from the earliest sample.

{{< highlight bash >}}
127.0.0.1:6379> TS.READ sensor:1 -
{{< / highlight >}}
</details>

<details open>
<summary><b>Page through history in bounded batches</b></summary>

Read at most two samples per call, advancing the cursor to `last_returned_timestamp + 1` on each subsequent call.

{{< highlight bash >}}
127.0.0.1:6379> TS.READ sensor:1 - MAX_COUNT 2
1) 1) (integer) 100
   2) 1
2) 1) (integer) 200
   2) 2
127.0.0.1:6379> TS.READ sensor:1 201 MAX_COUNT 2
1) 1) (integer) 300
   2) 3
{{< / highlight >}}
</details>

<details open>
<summary><b>Start from the latest sample</b></summary>

Start from the current latest sample (inclusive). Without `BLOCK`, this returns immediately.

{{< highlight bash >}}
127.0.0.1:6379> TS.READ sensor:1 +
1) 1) (integer) 300
   2) 3
{{< / highlight >}}

With `BLOCK 5000 2`, the same `+` call blocks until a second sample with timestamp greater than or equal to 300 arrives, or returns the available samples after 5000 milliseconds.

{{< highlight bash >}}
127.0.0.1:6379> TS.READ sensor:1 + BLOCK 5000 2
{{< / highlight >}}
</details>

<details open>
<summary><b>Tail only new samples</b></summary>

Use `$` to ignore everything that already exists and receive only samples added after the call. `BLOCK 5000 1` waits up to 5000 milliseconds for the first new sample.

{{< highlight bash >}}
127.0.0.1:6379> TS.READ sensor:1 $ BLOCK 5000 1
{{< / highlight >}}

If another client runs `TS.ADD sensor:1 400 4.0` within 5000 milliseconds, the blocked call returns `[[400, 4]]`. If no new sample arrives, it returns an empty array.
</details>

<details open>
<summary><b>Partial flush on timeout</b></summary>

When `min_count` cannot be reached, the command returns the available samples after the timeout. Here `BLOCK 1000 10` cannot reach 10 samples, so the two qualifying samples are returned after 1000 milliseconds.

{{< highlight bash >}}
127.0.0.1:6379> TS.READ sensor:1 101 BLOCK 1000 10
1) 1) (integer) 200
   2) 2
2) 1) (integer) 300
   2) 3
{{< / highlight >}}

When nothing qualifies by the timeout, the reply is an empty array.

{{< highlight bash >}}
127.0.0.1:6379> TS.READ sensor:1 301 BLOCK 1000 1
(empty array)
{{< / highlight >}}
</details>

<details open>
<summary><b>Read from a compaction series</b></summary>

`key` may be a compaction series. The command can return compaction samples and, with `BLOCK`, can wait for future compaction output.

{{< highlight bash >}}
127.0.0.1:6379> TS.READ sensor:1:avg - BLOCK 10000 1
{{< / highlight >}}
</details>

## Details

### Blocking and retrieval semantics

- From `key`, the command reads samples whose timestamp is greater than or equal to the resolved cursor.
- Without `BLOCK`, the command never blocks: it returns up to `max_count` of the oldest qualifying samples immediately, even when no samples qualify (an empty array).
- With `BLOCK milliseconds min_count`, if at least `min_count` matching samples are already available, the server returns immediately with up to `max_count` of the oldest qualifying samples.
- With `BLOCK` and fewer than `min_count` matching samples available, the server blocks until `min_count` is reached, `milliseconds` elapse, or the key is removed. `BLOCK 0` blocks indefinitely. Each sample append ([`TS.ADD`]({{< relref "commands/ts.add/" >}}), [`TS.MADD`]({{< relref "commands/ts.madd/" >}}), [`TS.INCRBY`]({{< relref "commands/ts.incrby/" >}}), [`TS.DECRBY`]({{< relref "commands/ts.decrby/" >}}), and compaction-rule writes to the destination key) can unblock a blocked client.
- On timeout, the server returns whatever is available, which can be an empty array or fewer than `min_count` samples. This is a successful reply, not an error.
- If the key is removed while the client is blocked (`DEL`, `UNLINK`, `FLUSHDB`, `FLUSHALL`, expiry, or eviction), the server returns an empty list to the blocked client. This is a successful reply, not an error.
- Returned samples are sorted by increasing timestamp, including when samples were inserted out of order.
- Multiple blocked clients waiting on the same key wait independently. One client receiving samples does not consume them for another client.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Not supported</span><br /> | <span title="Not supported">&#x274c; Flexible & Annual</span><br /><span title="Not supported">&#x274c; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="ts-read-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of ([Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}})) pairs representing (timestamp, value), ordered by increasing timestamp. The array is empty when no matching samples are available by the time the command returns, or when the key was removed while the command was blocked.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid timestamp, invalid `milliseconds`, invalid `min_count` or `max_count`, `min_count` greater than `max_count`, wrong number of arguments, wrong key type, the command is used with `BLOCK` where blocking is not allowed (for example, inside `MULTI` or a Lua script), etc.

-tab-sep-

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of ([Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), [Double reply]({{< relref "/develop/reference/protocol-spec#doubles" >}})) pairs representing (timestamp, value), ordered by increasing timestamp. The array is empty when no matching samples are available by the time the command returns, or when the key was removed while the command was blocked.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid timestamp, invalid `milliseconds`, invalid `min_count` or `max_count`, `min_count` greater than `max_count`, wrong number of arguments, wrong key type, the command is used with `BLOCK` where blocking is not allowed (for example, inside `MULTI` or a Lua script), etc.

{{< /multitabs >}}

## See also

[`TS.GET`]({{< relref "commands/ts.get/" >}}) | [`TS.RANGE`]({{< relref "commands/ts.range/" >}}) | [`TS.REVRANGE`]({{< relref "commands/ts.revrange/" >}})

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
