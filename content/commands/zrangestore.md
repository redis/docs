---
acl_categories:
- '@write'
- '@sortedset'
- '@slow'
arguments:
- display_text: dst
  key_spec_index: 0
  name: dst
  type: key
- display_text: src
  key_spec_index: 1
  name: src
  type: key
- display_text: min
  name: min
  type: string
- display_text: max
  name: max
  type: string
- arguments:
  - display_text: byscore
    name: byscore
    token: BYSCORE
    type: pure-token
  - display_text: bylex
    name: bylex
    token: BYLEX
    type: pure-token
  name: sortby
  optional: true
  type: oneof
- display_text: rev
  name: rev
  optional: true
  token: REV
  type: pure-token
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
complexity: O(log(N)+M) with N being the number of elements in the sorted set and
  M the number of elements stored into the destination key.
description: Stores a range of members from sorted set in a key.
group: sorted-set
hidden: false
key_specs:
- OW: true
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
  update: true
- RO: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: ZRANGESTORE
railroad_diagram: /images/railroad/zrangestore.svg
since: 6.2.0
summary: Stores a range of members from sorted set in a key.
syntax_fmt: "ZRANGESTORE dst src min max [BYSCORE | BYLEX] [REV] [LIMIT\_offset\n\
  \  count]"
title: ZRANGESTORE
---
{{< note >}}
This command is affected by cross-slot operations. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


This command is like [`ZRANGE`]({{< relref "/commands/zrange" >}}), but stores the result in the `<dst>` destination key.

## Examples

{{% redis-cli %}}
ZADD srczset 1 "one" 2 "two" 3 "three" 4 "four"
ZRANGESTORE dstzset srczset 2 -1
ZRANGE dstzset 0 -1
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zrangestore-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting sorted set.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting sorted set.

{{< /multitabs >}}
