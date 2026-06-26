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
title: EXISTS
---
{{< note >}}
This command's behavior varies in clustered Redis environments. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


Returns the number of keys that exist.

If you specify the same existing key multiple times, `EXISTS` counts it each time. For example, if `somekey` exists, `EXISTS somekey somekey` returns `2`.

## Required arguments

<details open><summary><code>key [key ...]</code></summary>

One or more keys to check for existence. A repeated key is counted once per occurrence.

</details>

## Examples

{{< clients-example set="cmds_generic" step="exists" description="Foundational: Check if one or more keys exist using EXISTS (returns count of existing keys, useful for conditional logic)" difficulty="beginner" >}}
SET key1 "Hello"
"OK"
EXISTS key1
(integer) 1
EXISTS nosuchkey
(integer) 0
SET key2 "World"
"OK"
EXISTS key1 key2 nosuchkey
(integer) 2
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

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
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
