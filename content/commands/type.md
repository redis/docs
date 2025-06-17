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
description: Determines the type of value stored at a key.
group: generic
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
linkTitle: TYPE
since: 1.0.0
summary: Determines the type of value stored at a key.
syntax_fmt: TYPE key
syntax_str: ''
title: TYPE
---
Returns the string representation of the type of the value stored at `key`.
The different types that can be returned are: `string`, `list`, `set`, `zset`,
`hash`, `stream`, and `vectorset`.

## Examples

{{% redis-cli %}}
SET key1 "value"
LPUSH key2 "value"
SADD key3 "value"
TYPE key1
TYPE key2
TYPE key3
{{% /redis-cli %}}

## Return information

{{< multitabs id="type-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): the type of _key_, or `none` when _key_ doesn't exist.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): the type of _key_, or `none` when _key_ doesn't exist.

{{< /multitabs >}}
