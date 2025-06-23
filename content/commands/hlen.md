---
acl_categories:
- '@read'
- '@hash'
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
description: Returns the number of fields in a hash.
group: hash
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
linkTitle: HLEN
since: 2.0.0
summary: Returns the number of fields in a hash.
syntax_fmt: HLEN key
syntax_str: ''
title: HLEN
---
Returns the number of fields contained in the hash stored at `key`.

## Examples

{{% redis-cli %}}
HSET myhash field1 "Hello"
HSET myhash field2 "World"
HLEN myhash
{{% /redis-cli %}}

## Return information

{{< multitabs id="hlen-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of fields in the hash, or 0 when the key does not exist.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of the fields in the hash, or 0 when the key does not exist.

{{< /multitabs >}}
