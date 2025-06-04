---
acl_categories:
- '@read'
- '@sortedset'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: max
  name: max
  type: string
- display_text: min
  name: min
  type: string
- arguments:
  - display_text: offset
    name: offset
    type: integer
  - display_text: count
    name: count
    type: integer
  name: limit
  optional: true
  token: LIMIT
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
complexity: O(log(N)+M) with N being the number of elements in the sorted set and
  M the number of elements being returned. If M is constant (e.g. always asking for
  the first 10 elements with LIMIT), you can consider it O(log(N)).
deprecated_since: 6.2.0
description: Returns members in a sorted set within a lexicographical range in reverse
  order.
doc_flags:
- deprecated
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
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: ZREVRANGEBYLEX
replaced_by: '[`ZRANGE`]({{< relref "/commands/zrange" >}}) with the `REV` and `BYLEX`
  arguments'
since: 2.8.9
summary: Returns members in a sorted set within a lexicographical range in reverse
  order.
syntax_fmt: "ZREVRANGEBYLEX key max min [LIMIT\_offset count]"
syntax_str: "max min [LIMIT\_offset count]"
title: ZREVRANGEBYLEX
---
When all the elements in a sorted set are inserted with the same score, in order to force lexicographical ordering, this command returns all the elements in the sorted set at `key` with a value between `max` and `min`.

Apart from the reversed ordering, `ZREVRANGEBYLEX` is similar to [`ZRANGEBYLEX`]({{< relref "/commands/zrangebylex" >}}).

## Examples

{{% redis-cli %}}
ZADD myzset 0 a 0 b 0 c 0 d 0 e 0 f 0 g
ZREVRANGEBYLEX myzset [c -
ZREVRANGEBYLEX myzset (c -
ZREVRANGEBYLEX myzset (g [aaa
{{% /redis-cli %}}

