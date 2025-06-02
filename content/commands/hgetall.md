---
acl_categories:
- '@read'
- '@hash'
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
complexity: O(N) where N is the size of the hash.
description: Returns all fields and values in a hash.
group: hash
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
linkTitle: HGETALL
since: 2.0.0
summary: Returns all fields and values in a hash.
syntax_fmt: HGETALL key
syntax_str: ''
title: HGETALL
---
Returns all fields and values of the hash stored at `key`.
In the returned value, every field name is followed by its value, so the length
of the reply is twice the size of the hash.

## Examples

{{< clients-example cmds_hash hgetall >}}
redis> HSET myhash field1 "Hello"
(integer) 1
redis> HSET myhash field2 "World"
(integer) 1
redis> HGETALL myhash
1) "field1"
2) "Hello"
3) "field2"
4) "World"
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
HSET myhash field1 "Hello"
HSET myhash field2 "World"
HGETALL myhash
{{% /redis-cli %}}

