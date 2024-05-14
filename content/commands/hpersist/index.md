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
- display_text: numfields
  name: numfields
  type: integer
- display_text: field
  multiple: true
  name: field
  type: string
arity: -4
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
complexity: O(N) where N is the number of arguments to the command
description: Removes the expiration time for each specified field
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
linkTitle: HPERSIST
since: 8.0.0
summary: Removes the expiration time for each specified field
syntax_fmt: HPERSIST key numfields field [field ...]
syntax_str: numfields field [field ...]
title: HPERSIST
---
Remove the existing expiration on a hash key's field(s), turning the field(s) from _volatile_ (a field
with expiration set) to _persistent_ (a field that will never expire as no TTL (time to live)
is associated).

## Examples

```
redis> HSET mykey field1 "hello" field2 "world"
(integer 2)
redis> HEXPIRE mykey 300 2 field1 field2
1) (integer) 1
2) (integer) 1
redis> HTTL mykey 2 field1 field2
1) (integer) 283
2) (integer) 283
redis> HPERSIST mykey 1 field2
1) (integer) 1
redis> HTTL mykey 2 field1 field2
1) (integer) 268
2) (integer) -1
```

## RESP2/RESP3 replies

One of the following:
* [Null reply]({{< relref "/develop/reference/protocol-spec" >}}#nulls) if the provided key does not exists.
* [Array reply]({{< relref "/develop/reference/protocol-spec" >}}#arrays). For each field:
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): `-2` if no such field exists in the provided hash key.
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): `-1` if the field exists but has no associated expiration set.
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): `1` the expiration was removed.
