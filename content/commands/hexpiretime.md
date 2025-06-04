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
- arguments:
  - display_text: numfields
    name: numfields
    type: integer
  - display_text: field
    multiple: true
    name: field
    type: string
  name: fields
  token: FIELDS
  type: block
arity: -5
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
complexity: O(N) where N is the number of specified fields
description: Returns the expiration time of a hash field as a Unix timestamp, in seconds.
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
linkTitle: HEXPIRETIME
since: 7.4.0
summary: Returns the expiration time of a hash field as a Unix timestamp, in seconds.
syntax_fmt: "HEXPIRETIME key FIELDS\_numfields field [field ...]"
syntax_str: "FIELDS\_numfields field [field ...]"
title: HEXPIRETIME
---
Returns the absolute Unix timestamp in seconds since Unix epoch at which the given key's field(s) will expire.

See also the [`HPEXPIRETIME`]({{< relref "/commands/hpexpiretime" >}}) command, which returns the same information with millisecond resolution.

## Examples

```
redis> HSET mykey field1 "hello" field2 "world"
(integer) 2
redis> HEXPIRE mykey 300  FIELDS 2 field1 field2
1) (integer) 1
2) (integer) 1
redis> HEXPIRETIME mykey FIELDS 2 field1 field2
1) (integer) 1715705914
2) (integer) 1715705914
```

## Return information

{{< multitabs id="hexpiretime-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

* [Array reply](../../develop/reference/protocol-spec#arrays). For each field:
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if no such field exists in the provided hash key, or the provided key does not exist.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-1` if the field exists but has no associated expiration set.
    - [Integer reply](../../develop/reference/protocol-spec#integers): the expiration (Unix timestamp) in seconds.

-tab-sep-

* [Array reply](../../develop/reference/protocol-spec#arrays). For each field:
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if no such field exists in the provided hash key, or the provided key does not exist.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-1` if the field exists but has no associated expiration set.
    - [Integer reply](../../develop/reference/protocol-spec#integers): the expiration (Unix timestamp) in seconds.

{{< /multitabs >}}
