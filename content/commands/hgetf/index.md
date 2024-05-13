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
  - display_text: nx
    name: nx
    token: NX
    type: pure-token
  - display_text: xx
    name: xx
    token: XX
    type: pure-token
  - display_text: gt
    name: gt
    token: GT
    type: pure-token
  - display_text: lt
    name: lt
    token: LT
    type: pure-token
  name: condition
  optional: true
  type: oneof
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
- display_text: fields
  name: fields
  type: string
- display_text: count
  name: count
  type: integer
- display_text: field
  multiple: true
  name: field
  type: string
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
- denyoom
- fast
complexity: O(N) where N is the number of arguments to the command
description: For each specified field, get its value and optionally set the field's remaining time to live or UNIX expiration timestamp in seconds or milliseconds
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
linkTitle: HGETF
since: 8.0.0
summary: For each specified field, get its value and optionally set the field's remaining time to live or UNIX expiration timestamp in seconds or milliseconds
syntax_fmt: "HGETF key [NX | XX | GT | LT] [EX\_seconds | PX\_milliseconds |\n  EXAT\_\
  unix-time-seconds | PXAT\_unix-time-milliseconds | PERSIST]\n  fields count field\
  \ [field ...]"
syntax_str: "[NX | XX | GT | LT] [EX\_seconds | PX\_milliseconds | EXAT\_unix-time-seconds\
  \ | PXAT\_unix-time-milliseconds | PERSIST] fields count field [field ...]"
title: HGETF
---
For each specified field, get its value and, optionally, set the its remaining TTL (time to live) or its UNIX expiration timestamp in seconds or milliseconds since Unix epoch.

## Options

The `HGETF` command supports a set of options that modify its behavior. Except for `key`, the arguments may be specified in any order. When an optional argument is specified more than once, only the last occurrence is used.

* `key` -- if it already exists, it must be of type hash.
* `EX` *seconds* -- for each specified field, set the remaining TTL in seconds (a positive integer).
* `PX` *milliseconds* -- for each specified field, set the remaining TTL in milliseconds (a positive integer).
* `EXAT` *timestamp-seconds* -- for each specified field, set the specified Unix time at which the fields will expire, in seconds (a positive integer) since Unix epoch.
* `PXAT` *timestamp-milliseconds* -- for each specified field, set the specified Unix time at which the fields will expire, in milliseconds (a positive integer) since Unix epoch.
* `PERSIST` -- remove the field's expiration time.

`NX`, `XX`, `GT`, and `LT` can only be specified when `EX`, `PX`, `EXAT`, or `PXAT` is specified.

* `NX` -- for each specified field, set the expiration time only when the field has no expiration.
* `XX` -- for each specified field, set the expiration time only when the field has an existing expiration.
* `GT` -- for each specified field, set the expiration time only when the new expiration time is greater than the field's current expiration. A field with no expiration is treated as an infinite expiration. 
* `LT` -- for each specified field, set the expiration time only when the new expiration time is less than the field's current expiration. A field with no expiration is treated as an infinite expiration.

* count -- must be a positive integer and the number of fields must match the provided count.
    - all fields must be strings.

## Examples

```
To be provided.
```

## RESP2/RESP3 replies

One of the following:
* [Simple error reply]({{< relref "/develop/reference/protocol-spec" >}}#simple-errors) when:
    - parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range
    - `key` exists but is not of type hash
    - `NX`, `XX`, `GT`, or `LT` is specified but `EX`, `PX`, `EXAT`, or `PXAT` is not specified
    - `FIELDS` is not specified
    - `FIELDS` is specified more than once
* [Null reply]({{< relref "/develop/reference/protocol-spec" >}}#nulls) if the provided key does not exist.
* [Array reply]({{< relref "/develop/reference/protocol-spec" >}}#arrays). For each field, either the string value of the field or nil if no such field exists.
