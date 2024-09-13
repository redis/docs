---
acl_categories:
- '@keyspace'
- '@write'
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
- write
complexity: O(N) where N is the number of keys that will be removed. When a key to
  remove holds a value other than a string, the individual complexity for this key
  is O(M) where M is the number of elements in the list, set, sorted set or hash.
  Removing a single key that holds a string value is O(1).
description: Deletes one or more keys.
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
linkTitle: DEL
since: 1.0.0
summary: Deletes one or more keys.
syntax_fmt: DEL key [key ...]
syntax_str: ''
title: DEL
---
Removes the specified keys.
A key is ignored if it does not exist.

## Examples

{{< clients-example cmds_generic del >}}
> SET key1 "Hello"
"OK"
> SET key2 "World"
"OK"
> DEL key1 key2 key3
(integer) 2
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
SET key1 "Hello"
SET key2 "World"
DEL key1 key2 key3
{{% /redis-cli %}}

