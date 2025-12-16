---
acl_categories:
- '@read'
- '@set'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
arity: -2
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
complexity: O(N) where N is the total number of elements in all given sets.
description: Returns the difference of multiple sets.
group: set
hidden: false
hints:
- nondeterministic_output_order
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
      lastkey: -1
      limit: 0
    type: range
linkTitle: SDIFF
railroad_diagram: /images/railroad/sdiff.svg
since: 1.0.0
summary: Returns the difference of multiple sets.
syntax_fmt: SDIFF key [key ...]
title: SDIFF
---
Returns the members of the set resulting from the difference between the first
set and all the successive sets.

For example:

```
key1 = {a,b,c,d}
key2 = {c}
key3 = {a,c,e}
SDIFF key1 key2 key3 = {b,d}
```

Keys that do not exist are considered to be empty sets.

## Examples

{{% redis-cli %}}
SADD key1 "a"
SADD key1 "b"
SADD key1 "c"
SADD key2 "c"
SADD key2 "d"
SADD key2 "e"
SDIFF key1 key2
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="sdiff-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list with members of the resulting set.

-tab-sep-

[Set reply](../../develop/reference/protocol-spec#sets): a set with the members of the resulting set.

{{< /multitabs >}}
