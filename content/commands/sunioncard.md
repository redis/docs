---
acl_categories:
- '@read'
- '@set'
- '@slow'
arguments:
- display_text: numkeys
  name: numkeys
  type: integer
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
- display_text: approx
  name: approx
  optional: true
  token: APPROX
  type: pure-token
- display_text: limit
  name: limit
  optional: true
  token: LIMIT
  type: integer
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
- movablekeys
complexity: O(N) where N is the total number of elements in all given sets.
description: Returns the number of members of the union of multiple sets.
group: set
hidden: false
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      firstkey: 1
      keynumidx: 0
      keystep: 1
    type: keynum
linkTitle: SUNIONCARD
railroad_diagram: /images/railroad/sunioncard.svg
since: 8.10.0
summary: Returns the number of members of the union of multiple sets.
syntax_fmt: "SUNIONCARD numkeys key [key ...] [APPROX] [LIMIT\_limit]"
title: SUNIONCARD
---
{{< note >}}
This command's behavior varies in clustered Redis environments. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


Returns the cardinality of the union of the given sets. This is the count-only counterpart of [`SUNION`]({{< relref "/commands/sunion" >}}): it returns just the number of distinct elements in the union, not the members themselves.

## Required arguments

<details open><summary><code>numkeys</code></summary>

The number of keys that follow.

</details>

<details open><summary><code>key [key ...]</code></summary>

One or more set keys to union.

</details>

## Optional arguments

<details open><summary><code>APPROX</code></summary>

Return an approximate cardinality instead of an exact count.

</details>

<details open><summary><code>LIMIT limit</code></summary>

Stop counting once the cardinality reaches `limit`. `0` (the default) means no limit.

</details>

## Examples

{{% redis-cli %}}
SADD key1 "a"
SADD key1 "b"
SADD key1 "c"
SADD key2 "c"
SADD key2 "d"
SADD key2 "e"
SUNION key1 key2
SUNIONCARD 2 key1 key2
SUNIONCARD 2 key1 key2 LIMIT 3
{{% /redis-cli %}}

## Details

Keys that do not exist are considered to be empty sets.

When provided with the optional `LIMIT` argument (which defaults to `0`, meaning unlimited), if the union cardinality reaches `limit` partway through the computation, the command stops and returns `limit` as the cardinality. This ensures a significant speedup for queries where the limit is lower than the actual union cardinality. `LIMIT` works in both exact and approximate modes.

### Approximate cardinality

By default, `SUNIONCARD` returns the exact union cardinality. With the `APPROX` option, it instead uses [HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}}) to estimate the cardinality with a standard error of about 0.81%, without materializing the full union. This is useful for very large unions, where computing an exact count is expensive in both time and memory.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="sunioncard-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting union.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting union.

{{< /multitabs >}}

## See also

[`SUNION`]({{< relref "commands/sunion/" >}}) | [`SUNIONSTORE`]({{< relref "commands/sunionstore/" >}}) | [`SINTERCARD`]({{< relref "commands/sintercard/" >}}) | [`SDIFFCARD`]({{< relref "commands/sdiffcard/" >}})

## Related topics

- [Redis sets]({{< relref "/develop/data-types/sets" >}})
- [Multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}})

