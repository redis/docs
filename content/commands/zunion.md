---
acl_categories:
- '@read'
- '@sortedset'
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
- display_text: weight
  multiple: true
  name: weight
  optional: true
  token: WEIGHTS
  type: integer
- arguments:
  - display_text: sum
    name: sum
    token: SUM
    type: pure-token
  - display_text: min
    name: min
    token: MIN
    type: pure-token
  - display_text: max
    name: max
    token: MAX
    type: pure-token
  name: aggregate
  optional: true
  token: AGGREGATE
  type: oneof
- display_text: withscores
  name: withscores
  optional: true
  token: WITHSCORES
  type: pure-token
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
complexity: O(N)+O(M*log(M)) with N being the sum of the sizes of the input sorted
  sets, and M being the number of elements in the resulting sorted set.
description: Returns the union of multiple sorted sets.
group: sorted-set
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
linkTitle: ZUNION
railroad_diagram: /images/railroad/zunion.svg
since: 6.2.0
summary: Returns the union of multiple sorted sets.
syntax_fmt: "ZUNION numkeys key [key ...] [WEIGHTS\_weight [weight ...]]\n  [AGGREGATE\_\
  <SUM | MIN | MAX>] [WITHSCORES]"
title: ZUNION
---
{{< note >}}
This command is affected by cross-slot operations. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


This command is similar to [`ZUNIONSTORE`]({{< relref "/commands/zunionstore" >}}), but instead of storing the resulting
sorted set, it is returned to the client.

For a description of the `WEIGHTS` and `AGGREGATE` options, see [`ZUNIONSTORE`]({{< relref "/commands/zunionstore" >}}).

## Examples

{{% redis-cli %}}
ZADD zset1 1 "one"
ZADD zset1 2 "two"
ZADD zset2 1 "one"
ZADD zset2 2 "two"
ZADD zset2 3 "three"
ZUNION 2 zset1 zset2
ZUNION 2 zset1 zset2 WITHSCORES
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zunion-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): the result of the union with, optionally, their scores when _WITHSCORES_ is used.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): the result of the union with, optionally, their scores when _WITHSCORES_ is used.

{{< /multitabs >}}
