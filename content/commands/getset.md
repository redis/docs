---
acl_categories:
- '@write'
- '@string'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: value
  name: value
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
- write
- denyoom
- fast
complexity: O(1)
deprecated_since: 6.2.0
description: Returns the previous string value of a key after setting it to a new
  value.
doc_flags:
- deprecated
group: string
hidden: false
key_specs:
- RW: true
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
  update: true
linkTitle: GETSET
replaced_by: '[`SET`]({{< relref "/commands/set" >}}) with the `GET` argument'
since: 1.0.0
summary: Returns the previous string value of a key after setting it to a new value.
syntax_fmt: GETSET key value
syntax_str: value
title: GETSET
---
Atomically sets `key` to `value` and returns the old value stored at `key`.
Returns an error when `key` exists but does not hold a string value.  Any 
previous time to live associated with the key is discarded on successful 
[`SET`]({{< relref "/commands/set" >}}) operation.

## Design pattern

`GETSET` can be used together with [`INCR`]({{< relref "/commands/incr" >}}) for counting with atomic reset.
For example: a process may call [`INCR`]({{< relref "/commands/incr" >}}) against the key `mycounter` every time
some event occurs, but from time to time we need to get the value of the counter
and reset it to zero atomically.
This can be done using `GETSET mycounter "0"`:

{{% redis-cli %}}
INCR mycounter
GETSET mycounter "0"
GET mycounter
{{% /redis-cli %}}


## Examples

{{% redis-cli %}}
SET mykey "Hello"
GETSET mykey "World"
GET mykey
{{% /redis-cli %}}

