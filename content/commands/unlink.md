---
acl_categories:
- '@keyspace'
- '@write'
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
- write
- fast
complexity: O(1) for each key removed regardless of its size. Then the command does
  O(N) work in a different thread in order to reclaim memory, where N is the number
  of allocations the deleted objects where composed of.
description: Asynchronously deletes one or more keys.
group: generic
hidden: false
hints:
- request_policy:multi_shard
- response_policy:agg_sum
key_specs:
- RM: true
  begin_search:
    spec:
      index: 1
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: -1
      limit: 0
    type: range
linkTitle: UNLINK
railroad_diagram: /images/railroad/unlink.svg
since: 4.0.0
summary: Asynchronously deletes one or more keys.
syntax_fmt: UNLINK key [key ...]
syntax_str: ''
title: UNLINK
---
This command is very similar to [`DEL`]({{< relref "/commands/del" >}}): it removes the specified keys.
Just like [`DEL`]({{< relref "/commands/del" >}}) a key is ignored if it does not exist. However the command
performs the actual memory reclaiming in a different thread, so it is not
blocking, while [`DEL`]({{< relref "/commands/del" >}}) is. This is where the command name comes from: the
command just **unlinks** the keys from the keyspace. The actual removal
will happen later asynchronously.

## Examples

{{% redis-cli %}}
SET key1 "Hello"
SET key2 "World"
UNLINK key1 key2 key3
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="unlink-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of keys that were unlinked.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of keys that were unlinked.

{{< /multitabs >}}
