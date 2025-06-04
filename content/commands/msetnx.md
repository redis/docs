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
description: Atomically modifies the string values of one or more keys only when all
  keys don't exist.
group: string
hidden: false
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
  insert: true
linkTitle: MSETNX
since: 1.0.1
summary: Atomically modifies the string values of one or more keys only when all keys
  don't exist.
syntax_fmt: MSETNX key value [key value ...]
syntax_str: ''
title: MSETNX
---
Sets the given keys to their respective values.
`MSETNX` will not perform any operation at all even if just a single key already
exists.

Because of this semantic `MSETNX` can be used in order to set different keys
representing different fields of a unique logic object in a way that ensures
that either all the fields or none at all are set.

`MSETNX` is atomic, so all given keys are set at once.
It is not possible for clients to see that some of the keys were updated while
others are unchanged.

## Examples

{{% redis-cli %}}
MSETNX key1 "Hello" key2 "there"
MSETNX key2 "new" key3 "world"
MGET key1 key2 key3
{{% /redis-cli %}}

## Return information

{{< multitabs id="msetnx-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if no key was set (at least one key already existed).
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if all the keys were set.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if no key was set (at least one key already existed).
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if all the keys were set.

{{< /multitabs >}}
