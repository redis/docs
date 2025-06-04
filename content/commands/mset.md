---
acl_categories:
- '@write'
- '@string'
- '@slow'
arguments:
- arguments:
  - display_text: key
    key_spec_index: 0
    name: key
    type: key
  - display_text: value
    name: value
    type: string
  multiple: true
  name: data
  type: block
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
complexity: O(N) where N is the number of keys to set.
description: Atomically creates or modifies the string values of one or more keys.
group: string
hidden: false
hints:
- request_policy:multi_shard
- response_policy:all_succeeded
key_specs:
- OW: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 2
      lastkey: -1
      limit: 0
    type: range
  update: true
linkTitle: MSET
since: 1.0.1
summary: Atomically creates or modifies the string values of one or more keys.
syntax_fmt: MSET key value [key value ...]
syntax_str: ''
title: MSET
---
Sets the given keys to their respective values.
`MSET` replaces existing values with new values, just as regular [`SET`]({{< relref "/commands/set" >}}).
See [`MSETNX`]({{< relref "/commands/msetnx" >}}) if you don't want to overwrite existing values.

`MSET` is atomic, so all given keys are set at once.
It is not possible for clients to see that some of the keys were updated while
others are unchanged.

## Examples

{{% redis-cli %}}
MSET key1 "Hello" key2 "World"
GET key1
GET key2
{{% /redis-cli %}}

