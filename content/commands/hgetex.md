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
  - display_text: seconds
    name: seconds
    token: EX
    type: integer
  - display_text: milliseconds
    name: milliseconds
    token: PX
    type: integer
  - display_text: unix-time-seconds
    name: unix-time-seconds
    token: EXAT
    type: unix-time
  - display_text: unix-time-milliseconds
    name: unix-time-milliseconds
    token: PXAT
    type: unix-time
  - display_text: persist
    name: persist
    token: PERSIST
    type: pure-token
  name: expiration
  optional: true
  type: oneof
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
description: Get the value of one or more fields of a given hash key, and optionally
  set their expiration.
group: hash
hidden: false
key_specs:
- RW: true
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
  notes: RW and UPDATE because it changes the TTL
  update: true
linkTitle: HGETEX
railroad_diagram: /images/railroad/hgetex.svg
since: 8.0.0
summary: Get the value of one or more fields of a given hash key, and optionally set
  their expiration.
syntax_fmt: "HGETEX key [EX\_seconds | PX\_milliseconds | EXAT\_unix-time-seconds\
  \ |\n  PXAT\_unix-time-milliseconds | PERSIST] FIELDS\_numfields field\n  [field\
  \ ...]"
syntax_str: "[EX\_seconds | PX\_milliseconds | EXAT\_unix-time-seconds | PXAT\_unix-time-milliseconds\
  \ | PERSIST] FIELDS\_numfields field [field ...]"
title: HGETEX
---

Get the value of one or more fields of a given hash key and optionally set their expiration time or time-to-live (TTL).

## Options

The `HGETEX` command supports a set of options:

* `EX seconds` -- Set the specified expiration time, in seconds.
* `PX milliseconds` -- Set the specified expiration time, in milliseconds.
* `EXAT unix-time-seconds` -- Set the specified Unix time at which the fields will expire, in seconds.
* `PXAT unix-time-milliseconds` -- Set the specified Unix time at which the fields will expire, in milliseconds.
* `PERSIST` -- Remove the TTL associated with the fields.

The `EX`, `PX`, `EXAT`, `PXAT`, and `PERSIST` options are mutually exclusive.

## Example

```
redis> HSET mykey field1 "Hello" field2 "World"
(integer) 2
redis> HGETEX mykey EX 120 FIELDS 1 field1
1) "Hello"
redis> HGETEX mykey EX 100 FIELDS 1 field2
1) "World"
redis> HTTL mykey FIELDS 2 field1 field2
1) (integer) 91
2) (integer) 85
redis> HTTL mykey FIELDS 3 field1 field2 field3 
1) (integer) 75
2) (integer) 68
3) (integer) -2
...
redis> HTTL mykey FIELDS 3 field1 field2 
1) (integer) -2
2) (integer) -2
redis> HGETALL mykey
(empty array)
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="hgetex-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

* [Array reply](../../develop/reference/protocol-spec#arrays): a list of values associated with the given fields, in the same order as they are requested.

-tab-sep-

* [Array reply](../../develop/reference/protocol-spec#arrays): a list of values associated with the given fields, in the same order as they are requested.

{{< /multitabs >}}
