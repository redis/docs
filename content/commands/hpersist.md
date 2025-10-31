---
acl_categories:
- '@write'
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
- write
- fast
complexity: O(N) where N is the number of specified fields
description: Removes the expiration time for each specified field
group: hash
hidden: false
key_specs:
- RW: true
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
linkTitle: HPERSIST
since: 7.4.0
summary: Removes the expiration time for each specified field
syntax_fmt: "HPERSIST key FIELDS\_numfields field [field ...]"
syntax_str: "FIELDS\_numfields field [field ...]"
title: HPERSIST
---
Remove the existing expiration on a hash key's field(s), turning the field(s) from _volatile_ (a field
with expiration set) to _persistent_ (a field that will never expire as no TTL (time to live)
is associated).

## Examples

```
redis> HSET mykey field1 "hello" field2 "world"
(integer) 2
redis> HEXPIRE mykey 300 FIELDS 2 field1 field2
1) (integer) 1
2) (integer) 1
redis> HTTL mykey FIELDS 2 field1 field2
1) (integer) 283
2) (integer) 283
redis> HPERSIST mykey FIELDS 1 field2
1) (integer) 1
redis> HTTL mykey FIELDS 2 field1 field2
1) (integer) 268
2) (integer) -1
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="hpersist-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

* [Array reply](../../develop/reference/protocol-spec#arrays). For each field:
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if no such field exists in the provided hash key, or the provided key does not exist.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-1` if the field exists but has no associated expiration set.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `1` the expiration was removed.

-tab-sep-

* [Array reply](../../develop/reference/protocol-spec#arrays). For each field:
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if no such field exists in the provided hash key, or the provided key does not exist.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-1` if the field exists but has no associated expiration set.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `1` the expiration was removed.

{{< /multitabs >}}
