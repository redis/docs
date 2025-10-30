---
acl_categories:
- '@write'
- '@set'
- '@slow'
arguments:
- display_text: destination
  key_spec_index: 0
  name: destination
  type: key
- display_text: key
  key_spec_index: 1
  multiple: true
  name: key
  type: key
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
complexity: O(N) where N is the total number of elements in all given sets.
description: Stores the difference of multiple sets in a key.
group: set
hidden: false
key_specs:
- OW: true
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
- RO: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: -1
      limit: 0
    type: range
linkTitle: SDIFFSTORE
since: 1.0.0
summary: Stores the difference of multiple sets in a key.
syntax_fmt: SDIFFSTORE destination key [key ...]
syntax_str: key [key ...]
title: SDIFFSTORE
---
This command is equal to [`SDIFF`]({{< relref "/commands/sdiff" >}}), but instead of returning the resulting set, it
is stored in `destination`.

If `destination` already exists, it is overwritten.

## Examples

{{% redis-cli %}}
SADD key1 "a"
SADD key1 "b"
SADD key1 "c"
SADD key2 "c"
SADD key2 "d"
SADD key2 "e"
SDIFFSTORE key key1 key2
SMEMBERS key
{{% /redis-cli %}}

## Return information

{{< multitabs id="sdiffstore-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting set.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting set.

{{< /multitabs >}}
