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
- display_text: field
  name: field
  type: string
arity: 3
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
description: Returns the value of a field in a hash.
group: hash
hidden: false
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
linkTitle: HGET
since: 2.0.0
summary: Returns the value of a field in a hash.
syntax_fmt: HGET key field
syntax_str: field
title: HGET
---
Returns the value associated with `field` in the hash stored at `key`.

## Examples

{{< clients-example cmds_hash hget >}}
> HSET myhash field1 "foo"
(integer) 1
> HGET myhash field1
"foo"
> HGET myhash field2
(nil)
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
HSET myhash field1 "foo"
HGET myhash field1
HGET myhash field2
{{% /redis-cli %}}

## Return information

{{< multitabs id="hget-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): The value associated with the field.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): If the field is not present in the hash or key does not exist.

-tab-sep-

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): The value associated with the field.
* [Null reply](../../develop/reference/protocol-spec#nulls): If the field is not present in the hash or key does not exist.

{{< /multitabs >}}
