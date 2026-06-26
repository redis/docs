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
description: Returns the number of members of the difference between the first set
  and all successive sets.
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
linkTitle: SDIFFCARD
railroad_diagram: /images/railroad/sdiffcard.svg
since: 8.10.0
summary: Returns the number of members of the difference between the first set and
  all successive sets.
syntax_fmt: "SDIFFCARD numkeys key [key ...] [LIMIT\_limit]"
title: SDIFFCARD
---
{{< note >}}
This command's behavior varies in clustered Redis environments. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


Returns the cardinality of the difference between the first set and all the successive sets. This is the count-only counterpart of [`SDIFF`]({{< relref "/commands/sdiff" >}}): it returns just the number of elements in the difference, not the members themselves.

## Required arguments

<details open><summary><code>numkeys</code></summary>

The number of keys that follow.

</details>

<details open><summary><code>key [key ...]</code></summary>

One or more set keys. The result counts the members of the first set that are not present in any of the subsequent sets.

</details>

## Optional arguments

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
SDIFF key1 key2
SDIFFCARD 2 key1 key2
SDIFFCARD 2 key1 key2 LIMIT 1
{{% /redis-cli %}}

## Details

Keys that do not exist are considered to be empty sets.

When provided with the optional `LIMIT` argument (which defaults to `0`, meaning unlimited), if the difference cardinality reaches `limit` partway through the computation, the command stops and returns `limit` as the cardinality. This ensures a significant speedup for queries where the limit is lower than the actual difference cardinality.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="sdiffcard-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting difference.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting difference.

{{< /multitabs >}}

## See also

[`SDIFF`]({{< relref "commands/sdiff/" >}}) | [`SDIFFSTORE`]({{< relref "commands/sdiffstore/" >}})

## Related topics

- [Redis sets]({{< relref "/develop/data-types/sets" >}})
- [Multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}})

