---
acl_categories:
- '@write'
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
- arguments:
  - display_text: min
    name: min
    token: MIN
    type: pure-token
  - display_text: max
    name: max
    token: MAX
    type: pure-token
  name: where
  type: oneof
- display_text: count
  name: count
  optional: true
  token: COUNT
  type: integer
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
- movablekeys
complexity: O(K) + O(M*log(N)) where K is the number of provided keys, N being the
  number of elements in the sorted set, and M being the number of elements popped.
description: Returns the highest- or lowest-scoring members from one or more sorted
  sets after removing them. Deletes the sorted set if the last member was popped.
group: sorted-set
hidden: false
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  delete: true
  find_keys:
    spec:
      firstkey: 1
      keynumidx: 0
      keystep: 1
    type: keynum
linkTitle: ZMPOP
railroad_diagram: /images/railroad/zmpop.svg
since: 7.0.0
summary: Returns the highest- or lowest-scoring members from one or more sorted sets
  after removing them. Deletes the sorted set if the last member was popped.
syntax_fmt: "ZMPOP numkeys key [key ...] <MIN | MAX> [COUNT\_count]"
syntax_str: "key [key ...] <MIN | MAX> [COUNT\_count]"
title: ZMPOP
---
Pops one or more elements, that are member-score pairs, from the first non-empty sorted set in the provided list of key names.

`ZMPOP` and [`BZMPOP`]({{< relref "/commands/bzmpop" >}}) are similar to the following, more limited, commands:

- [`ZPOPMIN`]({{< relref "/commands/zpopmin" >}}) or [`ZPOPMAX`]({{< relref "/commands/zpopmax" >}}) which take only one key, and can return multiple elements.
- [`BZPOPMIN`]({{< relref "/commands/bzpopmin" >}}) or [`BZPOPMAX`]({{< relref "/commands/bzpopmax" >}}) which take multiple keys, but return only one element from just one key.

See [`BZMPOP`]({{< relref "/commands/bzmpop" >}}) for the blocking variant of this command.

When the `MIN` modifier is used, the elements popped are those with the lowest scores from the first non-empty sorted set. The `MAX` modifier causes elements with the highest scores to be popped.
The optional `COUNT` can be used to specify the number of elements to pop, and is set to 1 by default.

The number of popped elements is the minimum from the sorted set's cardinality and `COUNT`'s value.

## Examples

{{% redis-cli %}}
ZMPOP 1 notsuchkey MIN
ZADD myzset 1 "one" 2 "two" 3 "three"
ZMPOP 1 myzset MIN
ZRANGE myzset 0 -1 WITHSCORES
ZMPOP 1 myzset MAX COUNT 10
ZADD myzset2 4 "four" 5 "five" 6 "six"
ZMPOP 2 myzset myzset2 MIN COUNT 10
ZRANGE myzset 0 -1 WITHSCORES
ZMPOP 2 myzset myzset2 MAX COUNT 10
ZRANGE myzset2 0 -1 WITHSCORES
EXISTS myzset myzset2
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zmpop-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): when no element could be popped.
* [Array reply](../../develop/reference/protocol-spec#arrays): A two-element array with the first element being the name of the key from which elements were popped, and the second element is an array of the popped elements. Every entry in the elements array is also an array that contains the member and its score.

-tab-sep-

One of the following:
* [Null reply](../../develop/reference/protocol-spec#nulls): when no element could be popped.
* [Array reply](../../develop/reference/protocol-spec#arrays): A two-element array with the first element being the name of the key from which elements were popped, and the second element is an array of the popped elements. Every entry in the elements array is also an array that contains the member and its score.

{{< /multitabs >}}
