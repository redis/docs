---
acl_categories:
- '@keyspace'
- '@read'
- '@fast'
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
- fast
complexity: O(N) where N is the number of keys to check.
description: Determines whether one or more keys exist.
group: generic
hidden: false
hints:
- request_policy:multi_shard
- response_policy:agg_sum
history:
- - 3.0.3
  - Accepts multiple `key` arguments.
key_specs:
- RO: true
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
linkTitle: EXISTS
railroad_diagram: /images/railroad/exists.svg
since: 1.0.0
summary: Determines whether one or more keys exist.
syntax_fmt: EXISTS key [key ...]
syntax_str: ''
title: EXISTS
---
Returns if `key` exists.

The user should be aware that if the same existing key is mentioned in the arguments multiple times, it will be counted multiple times. So if `somekey` exists, `EXISTS somekey somekey` will return 2.

## Examples

{{< clients-example set="cmds_generic" step="exists" >}}
SET key1 "Hello"
EXISTS key1
EXISTS nosuchkey
SET key2 "World"
EXISTS key1 key2 nosuchkey
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
SET key1 "Hello"
EXISTS key1
EXISTS nosuchkey
SET key2 "World"
EXISTS key1 key2 nosuchkey
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="exists-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of keys that exist from those specified as arguments.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of keys that exist from those specified as arguments.

{{< /multitabs >}}
