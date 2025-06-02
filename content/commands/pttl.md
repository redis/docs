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
description: Returns the expiration time in milliseconds of a key.
group: generic
hidden: false
hints:
- nondeterministic_output
history:
- - 2.8.0
  - Added the -2 reply.
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
linkTitle: PTTL
since: 2.6.0
summary: Returns the expiration time in milliseconds of a key.
syntax_fmt: PTTL key
syntax_str: ''
title: PTTL
---
Like [`TTL`]({{< relref "/commands/ttl" >}}) this command returns the remaining time to live of a key that has an
expire set, with the sole difference that [`TTL`]({{< relref "/commands/ttl" >}}) returns the amount of remaining
time in seconds while `PTTL` returns it in milliseconds.

In Redis 2.6 or older the command returns `-1` if the key does not exist or if the key exist but has no associated expire.

Starting with Redis 2.8 the return value in case of error changed:

* The command returns `-2` if the key does not exist.
* The command returns `-1` if the key exists but has no associated expire.

## Examples

{{% redis-cli %}}
SET mykey "Hello"
EXPIRE mykey 1
PTTL mykey
{{% /redis-cli %}}

