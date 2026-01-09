---
acl_categories:
- '@write'
- '@set'
- '@slow'
arguments:
- display_text: destination
  key_spec_index: 0
  name: destination
  type: key
- display_text: key
  key_spec_index: 1
  multiple: true
  name: key
  type: key
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
- write
- denyoom
complexity: O(N*M) worst case where N is the cardinality of the smallest set and M
  is the number of sets.
description: Stores the intersect of multiple sets in a key.
group: set
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
      lastkey: -1
      limit: 0
    type: range
linkTitle: SINTERSTORE
railroad_diagram: /images/railroad/sinterstore.svg
since: 1.0.0
summary: Stores the intersect of multiple sets in a key.
syntax_fmt: SINTERSTORE destination key [key ...]
title: SINTERSTORE
---
{{< note >}}
This command is affected by cross-slot operations. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


This command is equal to [`SINTER`]({{< relref "/commands/sinter" >}}), but instead of returning the resulting set,
it is stored in `destination`.

If `destination` already exists, it is overwritten.

## Examples

{{% redis-cli %}}
SADD key1 "a"
SADD key1 "b"
SADD key1 "c"
SADD key2 "c"
SADD key2 "d"
SADD key2 "e"
SINTERSTORE key key1 key2
SMEMBERS key
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="sinterstore-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting set.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the result set.

{{< /multitabs >}}
