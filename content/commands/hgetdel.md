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
description: Returns the value of a field and deletes it from the hash.
group: hash
hidden: false
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: HGETDEL
since: 8.0.0
summary: Returns the value of a field and deletes it from the hash.
syntax_fmt: "HGETDEL key FIELDS\_numfields field [field ...]"
syntax_str: "FIELDS\_numfields field [field ...]"
title: HGETDEL
---
Get and delete the value of one or more fields of a given hash key. When the last field is deleted, the key will also be deleted.

## Example

```
redis> HSET mykey field1 "Hello" field2 "World" field3 "!"
(integer) 3
redis> HGETALL mykey
1) "field1"
2) "Hello"
3) "field2"
4) "World"
5) "field3"
6) "!"
redis> HGETDEL mykey FIELDS 2 field3 field4
1) "!"
2) (nil)
redis> HGETALL mykey
1) "field1"
2) "Hello"
3) "field2"
4) "World"
redis> HGETDEL mykey FIELDS 2 field1 field2
1) "Hello"
2) "World"
redis> KEYS *
(empty array)
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="hgetdel-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of deleted fields and their values or `nil` for fields that do not exist.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of deleted fields and their values or `nil` for fields that do not exist.

{{< /multitabs >}}
