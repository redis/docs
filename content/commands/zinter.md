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
complexity: O(N*K)+O(M*log(M)) worst case with N being the smallest input sorted set,
  K being the number of input sorted sets and M being the number of elements in the
  resulting sorted set.
description: Returns the intersect of multiple sorted sets.
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
linkTitle: ZINTER
railroad_diagram: /images/railroad/zinter.svg
since: 6.2.0
summary: Returns the intersect of multiple sorted sets.
syntax_fmt: "ZINTER numkeys key [key ...] [WEIGHTS\_weight [weight ...]]\n  [AGGREGATE\_\
  <SUM | MIN | MAX>] [WITHSCORES]"
syntax_str: "key [key ...] [WEIGHTS\_weight [weight ...]] [AGGREGATE\_<SUM | MIN |\
  \ MAX>] [WITHSCORES]"
title: ZINTER
---
This command is similar to [`ZINTERSTORE`]({{< relref "/commands/zinterstore" >}}), but instead of storing the resulting
sorted set, it is returned to the client.

For a description of the `WEIGHTS` and `AGGREGATE` options, see [`ZUNIONSTORE`]({{< relref "/commands/zunionstore" >}}).

## Examples

{{% redis-cli %}}
ZADD zset1 1 "one"
ZADD zset1 2 "two"
ZADD zset2 1 "one"
ZADD zset2 2 "two"
ZADD zset2 3 "three"
ZINTER 2 zset1 zset2
ZINTER 2 zset1 zset2 WITHSCORES
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zinter-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

* [Array reply](../../develop/reference/protocol-spec#arrays): the result of the intersection including, optionally, scores when the _WITHSCORES_ option is used.

-tab-sep-

* [Array reply](../../develop/reference/protocol-spec#arrays): the result of the intersection including, optionally, scores when the _WITHSCORES_ option is used.

{{< /multitabs >}}
