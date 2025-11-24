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
complexity: O(L + (N-K)log(N)) worst case where L is the total number of elements
  in all the sets, N is the size of the first set, and K is the size of the result
  set.
description: Returns the difference between multiple sorted sets.
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
linkTitle: ZDIFF
since: 6.2.0
summary: Returns the difference between multiple sorted sets.
syntax_fmt: ZDIFF numkeys key [key ...] [WITHSCORES]
syntax_str: key [key ...] [WITHSCORES]
title: ZDIFF
---
This command is similar to [`ZDIFFSTORE`]({{< relref "/commands/zdiffstore" >}}), but instead of storing the resulting
sorted set, it is returned to the client.

## Examples

{{% redis-cli %}}
ZADD zset1 1 "one"
ZADD zset1 2 "two"
ZADD zset1 3 "three"
ZADD zset2 1 "one"
ZADD zset2 2 "two"
ZDIFF 2 zset1 zset2
ZDIFF 2 zset1 zset2 WITHSCORES
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zdiff-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

* [Array reply](../../develop/reference/protocol-spec#arrays): the result of the difference including, optionally, scores when the _WITHSCORES_ option is used.

-tab-sep-

* [Array reply](../../develop/reference/protocol-spec#arrays): the result of the difference including, optionally, scores when the _WITHSCORES_ option is used.

{{< /multitabs >}}
