---
acl_categories:
- '@keyspace'
- '@read'
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
description: Returns the expiration time of a key as a Unix milliseconds timestamp.
group: generic
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
linkTitle: PEXPIRETIME
since: 7.0.0
summary: Returns the expiration time of a key as a Unix milliseconds timestamp.
syntax_fmt: PEXPIRETIME key
syntax_str: ''
title: PEXPIRETIME
---
`PEXPIRETIME` has the same semantic as [`EXPIRETIME`]({{< relref "/commands/expiretime" >}}), but returns the absolute Unix expiration timestamp in milliseconds instead of seconds.

## Examples

{{% redis-cli %}}
SET mykey "Hello"
PEXPIREAT mykey 33177117420000
PEXPIRETIME mykey
{{% /redis-cli %}}

