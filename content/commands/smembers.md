---
acl_categories:
- '@read'
- '@set'
- '@slow'
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
complexity: O(N) where N is the set cardinality.
description: Returns all members of a set.
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
      lastkey: 0
      limit: 0
    type: range
linkTitle: SMEMBERS
railroad_diagram: /images/railroad/smembers.svg
since: 1.0.0
summary: Returns all members of a set.
syntax_fmt: SMEMBERS key
syntax_str: ''
title: SMEMBERS
---
Returns all the members of the set value stored at `key`.

This has the same effect as running [`SINTER`]({{< relref "/commands/sinter" >}}) with one argument `key`.

## Examples

{{< clients-example cmds_set smembers >}}
redis> SADD myset "Hello"
(integer) 1
redis> SADD myset "World"
(integer) 1
redis> SMEMBERS myset
1) "Hello"
2) "World"
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
SADD myset "Hello"
SADD myset "World"
SMEMBERS myset
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="smembers-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): an array with all the members of the set.

-tab-sep-

[Set reply](../../develop/reference/protocol-spec#sets): a set with all the members of the set.

{{< /multitabs >}}
