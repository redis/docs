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
arity: 2
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
complexity: O(1)
description: Returns the number of members in a sorted set.
group: sorted-set
hidden: false
key_specs:
- RO: true
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
linkTitle: ZCARD
railroad_diagram: /images/railroad/zcard.svg
since: 1.2.0
summary: Returns the number of members in a sorted set.
syntax_fmt: ZCARD key
syntax_str: ''
title: ZCARD
---
Returns the sorted set cardinality (number of elements) of the sorted set stored
at `key`.

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZCARD myzset
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zcard-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the cardinality (number of members) of the sorted set, or 0 if the key doesn't exist.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the cardinality (number of members) of the sorted set, or 0 if the key doesn't exist.

{{< /multitabs >}}
