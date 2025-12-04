---
acl_categories:
- '@write'
- '@stream'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: nomkstream
  name: nomkstream
  optional: true
  since: 6.2.0
  token: NOMKSTREAM
  type: pure-token
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
  optional: true
  type: block
- arguments:
  - display_text: auto-id
    name: auto-id
    token: '*'
    type: pure-token
  - display_text: id
    name: id
    type: string
  name: id-selector
  type: oneof
- arguments:
  - display_text: field
    name: field
    type: string
  - display_text: value
    name: value
    type: string
  multiple: true
  name: data
  type: block
arity: -5
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
- denyoom
- fast
complexity: O(1) when adding a new entry, O(N) when trimming where N being the number
  of entries evicted.
description: Appends a new message to a stream. Creates the key if it doesn't exist.
group: stream
hidden: false
hints:
- nondeterministic_output
history:
- - 6.2.0
  - Added the `NOMKSTREAM` option, `MINID` trimming strategy and the `LIMIT` option.
- - 7.0.0
  - Added support for the `<ms>-*` explicit ID form.
key_specs:
- RW: true
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
  notes: UPDATE instead of INSERT because of the optional trimming feature
  update: true
linkTitle: XADD
railroad_diagram: /images/railroad/xadd.svg
since: 5.0.0
summary: Appends a new message to a stream. Creates the key if it doesn't exist.
syntax_fmt: "XADD key [NOMKSTREAM] [KEEPREF | DELREF | ACKED] [<MAXLEN | MINID> [= | ~] threshold\n  [LIMIT\_\
  count]] <* | id> field value [field value ...]"
syntax_str: "[NOMKSTREAM] [KEEPREF | DELREF | ACKED] [<MAXLEN | MINID> [= | ~] threshold [LIMIT\_count]] <* |\
  \ id> field value [field value ...]"
title: XADD
---

Appends the specified stream entry to the stream at the specified `key`.
If the key does not exist, `XADD` will create a new key with the given stream value as a side effect of running this command.
You can turn off key creation with the `NOMKSTREAM` option.

## Required arguments

<details open>
<summary><code>key</code></summary>

The name of the stream key.
</details>

<details open>
<summary><code>id</code></summary>

The stream entry ID. Use `*` to auto-generate a unique ID, or specify a well-formed ID in the format `<ms>-<seq>` (for example, `1526919030474-55`).
</details>

<details open>
<summary><code>field value [field value ...]</code></summary>

One or more field-value pairs that make up the stream entry. You must provide at least one field-value pair.
</details>

## Optional arguments

<details open>
<summary><code>NOMKSTREAM</code></summary>

Prevents the creation of a new stream if the key does not exist. Available since Redis 6.2.0.
</details>

<details open>
<summary><code>KEEPREF | DELREF | ACKED</code></summary>

Specifies how to handle consumer group references when trimming. If there are no consumer groups, these arguments have no effect. Available since Redis 8.2.

If no option is specified, `KEEPREF` is used by default. Unlike the `XDELEX` and `XACKDEL` commands where one of these options is required, here they are optional to maintain backward compatibility:

- `KEEPREF` (default): When trimming, removes entries from the stream according to the specified strategy (`MAXLEN` or `MINID`), regardless of whether they are referenced by any consumer groups, but preserves existing references to these entries in all consumer groups' PEL (Pending Entries List).
- `DELREF`: When trimming, removes entries from the stream according to the specified strategy and also removes all references to these entries from all consumer groups' PEL.
- `ACKED`: When trimming, only removes entries that were read and acknowledged by all consumer groups. Note that if the number of referenced entries is larger than `MAXLEN`, trimming will still stop at the limit.
</details>

<details open>
<summary><code>MAXLEN | MINID [= | ~] threshold [LIMIT count]></code></summary>

Trims the stream to maintain a specific size or remove old entries:

<details open>
<summary><code>MAXLEN | MINID</code></summary>

The trimming strategy:
- `MAXLEN`: Evicts entries as long as the stream's length exceeds the specified threshold
- `MINID`: Evicts entries with IDs lower than the specified threshold (available since Redis 6.2.0)
</details>

<details open>
<summary><code>= | ~</code></summary>

The trimming operator:
- `=`: Exact trimming (default) - trims to the exact threshold
- `~`: Approximate trimming - more efficient, may leave slightly more entries than the threshold
</details>

<details open>
<summary><code>threshold</code></summary>

The trimming threshold:
- For `MAXLEN`: `threshold` is a non-negative integer specifying the maximum number of entries that may remain in the stream after trimming. Redis enforces this by removing the oldest entries - that is, the entries with the lowest stream IDs - so that only the newest entries are kept.
- For `MINID`: `threshold` is a stream ID. All entries whose IDs are less than `threshold` are trimmed. All entries with IDs greater than or equal to `threshold` are kept.
</details>

<details open>
<summary><code>LIMIT count</code></summary>

Limits the number of entries to examine during trimming. Available since Redis 6.2.0. When not specified, Redis uses a default value of 100 * the number of entries in a macro node. Specifying 0 disables the limiting mechanism entirely.
</details>

</details>
  
Each entry consists of a list of field-value pairs.
Redis stores the field-value pairs in the same order you provide them.
Commands that read the stream, such as [`XRANGE`]({{< relref "/commands/xrange" >}}) or [`XREAD`]({{< relref "/commands/xread" >}}), return the fields and values in exactly the same order you added them with `XADD`.

{{< note >}}
`XADD` is the only Redis command that can add data to a stream. However,
other commands, such as [`XDEL`]({{< relref "/commands/xdel" >}}) and [`XTRIM`]({{< relref "/commands/xtrim" >}}), can
remove data from a stream.
{{< /note >}}

## Specifying a Stream ID as an argument

A stream entry ID identifies a specific entry inside a stream.

`XADD` auto-generates a unique ID for you if you specify the `*` character (asterisk) as the ID argument. However, you can also specify a well-formed ID to add the new entry with that exact ID, though this is useful only in rare cases.

Specify IDs using two numbers separated by a `-` character:

    1526919030474-55

Both numbers are 64-bit integers. When Redis auto-generates an ID, the
first part is the Unix time in milliseconds of the Redis instance generating
the ID. The second part is a sequence number used to
distinguish IDs generated in the same millisecond.

You can also specify an incomplete ID that consists only of the milliseconds part, which Redis interprets as a zero value for the sequence part.
To have only the sequence part automatically generated, specify the milliseconds part followed by the `-` separator and the `*` character:

```
> XADD mystream 1526919030474-55 message "Hello,"
"1526919030474-55"
> XADD mystream 1526919030474-* message " World!"
"1526919030474-56"
```

Redis guarantees that IDs are always incremental: the ID of any entry you insert will be greater than any previous ID, so entries are totally ordered inside a stream. To guarantee this property, if the current top ID in the stream has a time greater than the current local time of the instance, Redis uses the top entry time instead and increments the sequence part of the ID. This may happen when, for instance, the local clock jumps backward, or after a failover when the new master has a different absolute time.

When you specify an explicit ID to `XADD`, the minimum valid ID is `0-1`, and you *must* specify an ID that is greater than any other ID currently inside the stream, otherwise the command fails and returns an error. Specifying explicit IDs is usually useful only if you have another system generating unique IDs (for instance an SQL table) and you want the Redis stream IDs to match those from your other system.

## Capped streams

`XADD` incorporates the same semantics as the [`XTRIM`]({{< relref "/commands/xtrim" >}}) command - refer to its documentation page for more information.
This allows you to add new entries and keep the stream's size in check with a single call to `XADD`, effectively capping the stream with an arbitrary threshold.
Although exact trimming is possible and is the default, due to the internal representation of streams, it is more efficient to add an entry and trim the stream with `XADD` using **almost exact** trimming (the `~` argument).

For example, calling `XADD` in the following form:

    XADD mystream MAXLEN ~ 1000 * ... entry fields here ...

This adds a new entry but also evicts old entries so that the stream contains only 1000 entries, or at most a few tens more.

## Additional information about streams

For more information about Redis streams, see the
[introduction to Redis Streams document]({{< relref "/develop/data-types/streams" >}}).

## Examples

{{% redis-cli %}}
XADD mystream * name Sara surname OConnor
XADD mystream * field1 value1 field2 value2 field3 value3
XLEN mystream
XRANGE mystream - +
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="xadd-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): The ID of the added entry. The ID is the one automatically generated if an asterisk (`*`) is passed as the _id_ argument, otherwise the command just returns the same ID specified by the user during insertion.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): if the NOMKSTREAM option is given and the key doesn't exist.

-tab-sep-

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): The ID of the added entry. The ID is the one automatically generated if an asterisk (`*`) is passed as the _id_ argument, otherwise the command just returns the same ID specified by the user during insertion.
* [Null reply](../../develop/reference/protocol-spec#nulls): if the NOMKSTREAM option is given and the key doesn't exist.

{{< /multitabs >}}
