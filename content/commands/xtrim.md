---
acl_categories:
- '@write'
- '@stream'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- arguments:
  - arguments:
    - display_text: maxlen
      name: maxlen
      token: MAXLEN
      type: pure-token
    - display_text: minid
      name: minid
      since: 6.2.0
      token: MINID
      type: pure-token
    name: strategy
    type: oneof
  - arguments:
    - display_text: equal
      name: equal
      token: '='
      type: pure-token
    - display_text: approximately
      name: approximately
      token: '~'
      type: pure-token
    name: operator
    optional: true
    type: oneof
  - display_text: threshold
    name: threshold
    type: string
  - display_text: count
    name: count
    optional: true
    since: 6.2.0
    token: LIMIT
    type: integer
  name: trim
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
- write
complexity: O(N), with N being the number of evicted entries. Constant times are very
  small however, since entries are organized in macro nodes containing multiple entries
  that can be released with a single deallocation.
description: Deletes messages from the beginning of a stream.
group: stream
hidden: false
hints:
- nondeterministic_output
history:
- - 6.2.0
  - Added the `MINID` trimming strategy and the `LIMIT` option.
key_specs:
- RW: true
  begin_search:
    spec:
      index: 1
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: XTRIM
railroad_diagram: /images/railroad/xtrim.svg
since: 5.0.0
summary: Deletes messages from the beginning of a stream.
syntax_fmt: "XTRIM key <MAXLEN | MINID> [= | ~] threshold [LIMIT\_count] [KEEPREF | DELREF | ACKED]"
title: XTRIM
---

`XTRIM` trims the stream by evicting older entries (entries with lower IDs) if needed.

## Required arguments

<details open>
<summary><code>key</code></summary>

The name of the stream key.
</details>

<details open>
<summary><code>MAXLEN | MINID</code></summary>

The trimming strategy:
- `MAXLEN`: Evicts entries as long as the stream's length exceeds the specified threshold
- `MINID`: Evicts entries with IDs lower than the specified threshold (available since Redis 6.2.0)
</details>

<details open>
<summary><code>threshold</code></summary>

The trimming threshold:
- For `MAXLEN`: `threshold` is a non-negative integer specifying the maximum number of entries that may remain in the stream after trimming. Redis enforces this by removing the oldest entries - that is, the entries with the lowest stream IDs - so that only the newest entries are kept.
- For `MINID`: `threshold` is a stream ID. All entries whose IDs are less than `threshold` are trimmed. All entries with IDs greater than or equal to `threshold` are kept.
</details>

## Optional arguments

<details open>
<summary><code>= | ~</code></summary>

The trimming operator:
- `=`: Exact trimming (default) - trims to the exact threshold
- `~`: Approximate trimming - more efficient, may leave slightly more entries than the threshold
</details>

<details open>
<summary><code>LIMIT count</code></summary>

Limits the number of entries to examine during trimming. Available since Redis 6.2.0. When not specified, Redis uses a default value of 100 * the number of entries in a macro node. Specifying 0 disables the limiting mechanism entirely.
</details>

<details open>
<summary><code>KEEPREF | DELREF | ACKED</code></summary>

Specifies how to handle consumer group references when trimming. If there are no consumer groups, these arguments have no effect. Available since Redis 8.2.

If no option is specified, `KEEPREF` is used by default. Unlike the `XDELEX` and `XACKDEL` commands where one of these options is required, here they are optional to maintain backward compatibility:

- `KEEPREF` (default): When trimming, removes entries from the stream according to the specified strategy (`MAXLEN` or `MINID`), regardless of whether they are referenced by any consumer groups, but preserves existing references to these entries in all consumer groups' PEL (Pending Entries List).
- `DELREF`: When trimming, removes entries from the stream according to the specified strategy and also removes all references to these entries from all consumer groups' PEL.
- `ACKED`: When trimming, only removes entries that were read and acknowledged by all consumer groups. Note that if the number of referenced entries is larger than `MAXLEN`, trimming will still stop at the limit.
</details>

For example, this trims the stream to exactly the latest 1000 items:

```
XTRIM mystream MAXLEN 1000
```

In this example, Redis evicts all entries that have an ID lower than 649085820-0:

```
XTRIM mystream MINID 649085820
```

By default, or when you provide the optional `=` argument, the command performs exact trimming.

Depending on the strategy, exact trimming means:

* `MAXLEN`: The trimmed stream's length will be exactly the minimum between its original length and the specified `threshold`.
* `MINID`: The oldest ID in the stream will be exactly the maximum between its original oldest ID and the specified `threshold`.

Nearly exact trimming
---

Because exact trimming may require additional effort from the Redis server, you can provide the optional `~` argument to make it more efficient.

For example:

```
XTRIM mystream MAXLEN ~ 1000
```

The `~` argument between the `MAXLEN` strategy and the `threshold` means that you are requesting to trim the stream so its length is **at least** the `threshold`, but possibly slightly more.
In this case, Redis stops trimming early when performance can be gained (for example, when a whole macro node in the data structure can't be removed).
This makes trimming much more efficient, and it is usually what you want, although after trimming, the stream may have a few tens of additional entries over the `threshold`.

Another way to control the amount of work done by the command when using `~` is the `LIMIT` clause.
When you use it, it specifies the maximum `count` of entries that will be evicted.
When you don't specify `LIMIT` and `count`, Redis implicitly uses the default value of 100 * the number of entries in a macro node as the `count`.
Specifying the value 0 as `count` disables the limiting mechanism entirely.

## Examples

{{% redis-cli %}}
XADD mystream * field1 A field2 B field3 C field4 D
XTRIM mystream MAXLEN 2
XRANGE mystream - +
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="xtrim-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): The number of entries deleted from the stream.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): The number of entries deleted from the stream.

{{< /multitabs >}}
