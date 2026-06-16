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
- display_text: timeout
  name: timeout
  type: integer
- arguments:
  - display_text: min_count
    name: min_count
    token: MIN_COUNT
    type: integer
  name: MIN_COUNT
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
arity: -4
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
description: 'Blocking GET: wait up to timeout ms or until min_count samples with
  timestamp >= timestamp are available, then return up to max_count of the oldest
  such samples'
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
linkTitle: TS.BGET
module: TimeSeries
railroad_diagram: /images/railroad/ts.bget.svg
since: 8.10.0
stack_path: docs/data-types/timeseries
summary: 'Blocking GET: wait up to timeout ms or until min_count samples with timestamp
  >= timestamp are available, then return up to max_count of the oldest such samples'
syntax_fmt: "TS.BGET key timestamp timeout [MIN_COUNT\_min_count]\n  [MAX_COUNT\_\
  max_count]"
title: TS.BGET
---
Read a batch of time series samples at or after a cursor timestamp, blocking until enough samples are available. `TS.BGET` blocks until at least `min_count` samples with a timestamp greater than or equal to the resolved cursor are available, until `timeout` milliseconds elapse, or until the key is removed, whichever occurs first. It then returns up to `max_count` of the oldest qualifying samples, ordered by increasing timestamp, or an empty list when no matching samples are available.

`TS.BGET` lets applications continuously consume historical and newly appended samples without polling [`TS.RANGE`]({{< relref "commands/ts.range/" >}}) manually. The key may be a regular time series or a compaction time series.

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
| `-`                  | Earliest      | The timestamp of the earliest sample in the series, or `0` when the series is empty or missing. |
| `+`                  | Latest        | The timestamp of the latest sample in the series, or `0` when the series is empty or missing. The cursor is inclusive, so the latest existing sample itself qualifies (aligned with [`TS.RANGE`]({{< relref "commands/ts.range/" >}})). With the default `min_count` of `1`, the call returns that sample immediately; with a larger `min_count`, it blocks until enough samples at or after that timestamp exist. Intended for the first call only. |
| `$`                  | New           | The timestamp of the latest sample plus 1, or `0` when the series is empty or missing. Only samples reported after the command was received by the server qualify; the latest existing sample is excluded. |

The `+` and `$` semantics mirror the special IDs of [`XREAD`]({{< relref "commands/xread/" >}}) and [`XREADGROUP`]({{< relref "commands/xreadgroup/" >}}). The server resolves all sentinels exactly once, when the command is received, so the cursor stays stable while the client is blocked. Send `-`, `+`, and `$` to the server as-is; do not resolve them on the client side.

Use the following table to choose the cursor for the first call:

| Goal                                          | First-call `timestamp` |
| --------------------------------------------- | ---------------------- |
| Read the full history, then tail              | `-` or `0`             |
| Start from the current latest sample, inclusive | `+`                  |
| Receive only samples added after the call     | `$`                    |

For every subsequent call, use `last_returned_timestamp + 1` so you receive no misses and no duplicates. Do not reuse `+` or `$` after the first call. If no samples are returned, you can retry with the same cursor, subject to your application's delivery policy.
</details>

<details open>
<summary><code>timeout</code></summary>

is the maximum time to wait, expressed as a non-negative integer number of milliseconds. `timeout = 0` means do not block: the command returns whatever is available immediately, even when fewer than `min_count` samples qualify.

The client-side command/read timeout is separate from this argument and should exceed it. A client socket or read timeout that fires before the Redis `timeout` is a network timeout, not a `TS.BGET` timeout.
</details>

## Optional arguments

<details open>
<summary><code>MIN_COUNT min_count</code></summary>

is the unblock threshold: the number of qualifying samples required before the command returns ahead of the timeout. It must be a positive integer and defaults to `1`. With the default of `1`, the command returns all available samples (up to `max_count`) immediately if at least one sample qualifies; otherwise it waits up to `timeout`.
</details>

<details open>
<summary><code>MAX_COUNT max_count</code></summary>

is the reply cap: the maximum number of samples to return. It must be a positive integer and greater than or equal to `min_count`. When `MAX_COUNT` is not provided, the reply is unbounded. When more matching samples exist than `max_count`, the server returns the oldest `max_count` samples first, so you can page forward.

`MAX_COUNT` defaults to unlimited; set it explicitly when consuming large histories to bound the reply size and enable paging.
</details>

The `MIN_COUNT` and `MAX_COUNT` keyword pairs are optional and independent. Omit a pair entirely to apply the server default; do not send made-up defaults. When both are provided, emit the keyword tokens in uppercase and in the documented order (`MIN_COUNT` before `MAX_COUNT`). The server matches the tokens case-insensitively, but a keyword without a value, or any stray trailing token, is rejected as a wrong-arity error.

## Blocking and retrieval semantics

- The command reads samples from `key` whose timestamp is greater than or equal to the resolved cursor.
- If at least `min_count` matching samples are already available, the server returns immediately with up to `max_count` of the oldest qualifying samples.
- If fewer than `min_count` matching samples are available and `timeout > 0`, the server blocks until `min_count` is reached, the timeout expires, or the key is removed. Each sample append ([`TS.ADD`]({{< relref "commands/ts.add/" >}}), [`TS.MADD`]({{< relref "commands/ts.madd/" >}}), [`TS.INCRBY`]({{< relref "commands/ts.incrby/" >}}), [`TS.DECRBY`]({{< relref "commands/ts.decrby/" >}}), and compaction-rule writes to the destination key) can wake the waiter.
- On timeout, the server returns whatever is available, which can be empty or fewer than `min_count` samples. This is a successful reply, not an error.
- If the key is removed while the client is blocked (`DEL`, `UNLINK`, `FLUSHDB`, `FLUSHALL`, expiry, or eviction), the server wakes the client and returns an empty list. This is a successful reply, not an error.
- If `timeout = 0`, the server never blocks: it returns the available matching samples immediately, even when fewer than `min_count` qualify.
- Returned samples are sorted by increasing timestamp, including when samples were inserted out of order.
- Multiple blocked clients waiting on the same key are independent waiters. One client receiving samples does not consume them for another client.

## Examples

<details open>
<summary><b>Read history and tail new samples</b></summary>

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

Read all historical samples without blocking. The default `min_count` of `1` is already met and `max_count` is unlimited.

{{< highlight bash >}}
127.0.0.1:6379> TS.BGET sensor:1 0 0
1) 1) (integer) 100
   2) 1
2) 1) (integer) 200
   2) 2
3) 1) (integer) 300
   2) 3
{{< / highlight >}}

The `-` sentinel is equivalent for a full read from the earliest sample.

{{< highlight bash >}}
127.0.0.1:6379> TS.BGET sensor:1 - 0
{{< / highlight >}}
</details>

<details open>
<summary><b>Page through history in bounded batches</b></summary>

Read at most two samples per call, advancing the cursor to `last_returned_timestamp + 1` on each subsequent call.

{{< highlight bash >}}
127.0.0.1:6379> TS.BGET sensor:1 - 1000 MAX_COUNT 2
1) 1) (integer) 100
   2) 1
2) 1) (integer) 200
   2) 2
127.0.0.1:6379> TS.BGET sensor:1 201 1000 MAX_COUNT 2
1) 1) (integer) 300
   2) 3
{{< / highlight >}}
</details>

<details open>
<summary><b>Start from the latest sample</b></summary>

Start from the current latest sample (inclusive). With the default `min_count` of `1`, this returns immediately.

{{< highlight bash >}}
127.0.0.1:6379> TS.BGET sensor:1 + 5000
1) 1) (integer) 300
   2) 3
{{< / highlight >}}

With `MIN_COUNT 2`, the same `+` call blocks until a second sample with timestamp greater than or equal to 300 arrives, or returns the available samples after 5000 milliseconds.

{{< highlight bash >}}
127.0.0.1:6379> TS.BGET sensor:1 + 5000 MIN_COUNT 2
{{< / highlight >}}
</details>

<details open>
<summary><b>Tail only new samples</b></summary>

Use `$` to ignore everything that already exists and receive only samples added after the call.

{{< highlight bash >}}
127.0.0.1:6379> TS.BGET sensor:1 $ 5000
{{< / highlight >}}

If another client runs `TS.ADD sensor:1 400 4.0` within 5000 milliseconds, the blocked call returns `[[400, 4]]`. If no new sample arrives, it returns an empty array.
</details>

<details open>
<summary><b>Partial flush on timeout</b></summary>

When `MIN_COUNT` cannot be reached, the command returns the available samples after the timeout. Here `MIN_COUNT 10` cannot be reached, so the two qualifying samples are returned after 1000 milliseconds.

{{< highlight bash >}}
127.0.0.1:6379> TS.BGET sensor:1 101 1000 MIN_COUNT 10
1) 1) (integer) 200
   2) 2
2) 1) (integer) 300
   2) 3
{{< / highlight >}}

When nothing qualifies by the timeout, the reply is an empty array.

{{< highlight bash >}}
127.0.0.1:6379> TS.BGET sensor:1 301 1000
(empty array)
{{< / highlight >}}
</details>

<details open>
<summary><b>Read from a compaction series</b></summary>

`key` may be a compaction series. The command can return compaction samples and can block for future compaction output.

{{< highlight bash >}}
127.0.0.1:6379> TS.BGET sensor:1:avg - 10000
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Not supported</span><br /> | <span title="Not supported">&#x274c; Flexible & Annual</span><br /><span title="Not supported">&#x274c; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="ts-bget-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of ([Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}})) pairs representing (timestamp, value), ordered by increasing timestamp. The array is empty when no matching samples are available by the time the command returns, or when the key was removed while the command was blocked.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid timestamp, invalid timeout, invalid `min_count` or `max_count`, `min_count` greater than `max_count`, wrong number of arguments, wrong key type, the command is used where blocking is not allowed (for example, inside `MULTI` or a Lua script), etc.

-tab-sep-

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of ([Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), [Double reply]({{< relref "/develop/reference/protocol-spec#doubles" >}})) pairs representing (timestamp, value), ordered by increasing timestamp. The array is empty when no matching samples are available by the time the command returns, or when the key was removed while the command was blocked.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid timestamp, invalid timeout, invalid `min_count` or `max_count`, `min_count` greater than `max_count`, wrong number of arguments, wrong key type, the command is used where blocking is not allowed (for example, inside `MULTI` or a Lua script), etc.

{{< /multitabs >}}

## See also

[`TS.GET`]({{< relref "commands/ts.get/" >}}) | [`TS.RANGE`]({{< relref "commands/ts.range/" >}}) | [`TS.REVRANGE`]({{< relref "commands/ts.revrange/" >}})

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
