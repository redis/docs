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
description: Returns the TTL in seconds of a hash field.
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
linkTitle: HTTL
since: 7.4.0
summary: Returns the TTL in seconds of a hash field.
syntax_fmt: "HTTL key FIELDS\_numfields field [field ...]"
syntax_str: "FIELDS\_numfields field [field ...]"
title: HTTL
---
Returns the remaining TTL (time to live) of a hash key's field(s) that have a set expiration.
This introspection capability allows you to check how many seconds a
given hash field will continue to be part of the hash key.

See also the [`HPTTL`]({{< relref "/commands/hpttl" >}}) command that returns the same information with millisecond resolution.

## Example

```
redis> HTTL no-key FIELDS 3 field1 field2 field3
(nil)
redis> HSET mykey field1 "hello" field2 "world"
(integer) 2
redis> HEXPIRE mykey 300 FIELDS 2 field1 field3
1) (integer) 1
2) (integer) -2
redis> HTTL mykey FIELDS 3 field1 field2 field3
1) (integer) 283
2) (integer) -1
3) (integer) -2
```

