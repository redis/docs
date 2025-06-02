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
description: Returns the expiration time in seconds of a key.
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
linkTitle: TTL
since: 1.0.0
summary: Returns the expiration time in seconds of a key.
syntax_fmt: TTL key
syntax_str: ''
title: TTL
---
Returns the remaining time to live of a key that has a timeout.
This introspection capability allows a Redis client to check how many seconds a
given key will continue to be part of the dataset.

In Redis 2.6 or older the command returns `-1` if the key does not exist or if the key exists but has no associated expire.

Starting with Redis 2.8 the return value in case of error changed:

* The command returns `-2` if the key does not exist.
* The command returns `-1` if the key exists but has no associated expire.

See also the [`PTTL`]({{< relref "/commands/pttl" >}}) command that returns the same information with milliseconds resolution (Only available in Redis 2.6 or greater).

## Examples

{{< clients-example cmds_generic ttl >}}
> SET mykey "Hello"
"OK"
> EXPIRE mykey 10
(integer) 1
> TTL mykey
(integer) 10
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
SET mykey "Hello"
EXPIRE mykey 10
TTL mykey
{{% /redis-cli %}}
