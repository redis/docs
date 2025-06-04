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
description: Returns all fields in a hash.
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
linkTitle: HKEYS
since: 2.0.0
summary: Returns all fields in a hash.
syntax_fmt: HKEYS key
syntax_str: ''
title: HKEYS
---
Returns all field names in the hash stored at `key`.

## Examples

{{% redis-cli %}}
HSET myhash field1 "Hello"
HSET myhash field2 "World"
HKEYS myhash
{{% /redis-cli %}}

## Return information

{{< multitabs id="hkeys-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of fields in the hash, or an empty list when the key does not exist

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of fields in the hash, or an empty list when the key does not exist.

{{< /multitabs >}}
