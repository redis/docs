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

