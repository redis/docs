---
acl_categories:
- '@read'
- '@sortedset'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: member
  name: member
  type: string
- display_text: withscore
  name: withscore
  optional: true
  token: WITHSCORE
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
- fast
complexity: O(log(N))
description: Returns the index of a member in a sorted set ordered by descending scores.
group: sorted-set
hidden: false
history:
- - 7.2.0
  - Added the optional `WITHSCORE` argument.
key_specs:
- RO: true
  access: true
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
linkTitle: ZREVRANK
since: 2.0.0
summary: Returns the index of a member in a sorted set ordered by descending scores.
syntax_fmt: ZREVRANK key member [WITHSCORE]
syntax_str: member [WITHSCORE]
title: ZREVRANK
---
Returns the rank of `member` in the sorted set stored at `key`, with the scores
ordered from high to low.
The rank (or index) is 0-based, which means that the member with the highest
score has rank `0`.

The optional `WITHSCORE` argument supplements the command's reply with the score of the element returned.

Use [`ZRANK`]({{< relref "/commands/zrank" >}}) to get the rank of an element with the scores ordered from low to
high.

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZADD myzset 3 "three"
ZREVRANK myzset "one"
ZREVRANK myzset "four"
ZREVRANK myzset "three" WITHSCORE
ZREVRANK myzset "four" WITHSCORE
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zrevrank-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): if the key does not exist or the member does not exist in the sorted set.
* [Integer reply](../../develop/reference/protocol-spec#integers): The rank of the member when _WITHSCORE_ is not used.
* [Array reply](../../develop/reference/protocol-spec#arrays): The rank and score of the member when _WITHSCORE_ is used.

-tab-sep-

One of the following:
* [Null reply](../../develop/reference/protocol-spec#nulls): if the key does not exist or the member does not exist in the sorted set.
* [Integer reply](../../develop/reference/protocol-spec#integers): The rank of the member when _WITHSCORE_ is not used.
* [Array reply](../../develop/reference/protocol-spec#arrays): The rank and score of the member when _WITHSCORE_ is used.

{{< /multitabs >}}
