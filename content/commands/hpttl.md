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
description: Returns the TTL in milliseconds of a hash field.
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
linkTitle: HPTTL
since: 7.4.0
summary: Returns the TTL in milliseconds of a hash field.
syntax_fmt: "HPTTL key FIELDS\_numfields field [field ...]"
syntax_str: "FIELDS\_numfields field [field ...]"
title: HPTTL
---
Like [`HTTL`]({{< relref "/commands/httl" >}}), this command returns the remaining TTL (time to live) of a field that has an
expiration set, but in milliseconds instead of seconds.

## Example

```
redis> HPTTL no-key FIELDS 3 field1 field2 field3
(nil)
redis> HSET mykey field1 "hello" field2 "world"
(integer) 2
redis> HEXPIRE mykey 300 FIELDS 2 field1 field3
1) (integer) 1
2) (integer) -2
redis> HPTTL mykey FIELDS 3 field1 field2 field3
1) (integer) 292202
2) (integer) -1
3) (integer) -2
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="hpttl-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

* [Array reply](../../develop/reference/protocol-spec#arrays). For each field:
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if no such field exists in the provided hash key, or the provided key does not exist.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-1` if the field exists but has no associated expiration set.
    - [Integer reply](../../develop/reference/protocol-spec#integers): the TTL in milliseconds.

-tab-sep-

* [Array reply](../../develop/reference/protocol-spec#arrays). For each field:
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if no such field exists in the provided hash key, or the provided key does not exist.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-1` if the field exists but has no associated expiration set.
    - [Integer reply](../../develop/reference/protocol-spec#integers): the TTL in milliseconds.

{{< /multitabs >}}
