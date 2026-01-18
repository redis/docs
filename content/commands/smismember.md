---
acl_categories:
- '@read'
- '@set'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: member
  multiple: true
  name: member
  type: string
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
complexity: O(N) where N is the number of elements being checked for membership
description: Determines whether multiple members belong to a set.
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
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: SMISMEMBER
railroad_diagram: /images/railroad/smismember.svg
since: 6.2.0
summary: Determines whether multiple members belong to a set.
syntax_fmt: SMISMEMBER key member [member ...]
title: SMISMEMBER
---
Returns whether each `member` is a member of the set stored at `key`.

For every `member`, `1` is returned if the value is a member of the set, or `0` if the element is not a member of the set or if `key` does not exist.

## Examples

{{% redis-cli %}}
SADD myset "one"
SADD myset "one"
SMISMEMBER myset "one" "notamember"
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="smismember-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list representing the membership of the given elements, in the same order as they are requested.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list representing the membership of the given elements, in the same order as they are requested.

{{< /multitabs >}}
