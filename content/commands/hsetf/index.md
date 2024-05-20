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
- display_text: create key option
  name: create key option
  optional: true
  token: DC
  type: pure-token
- arguments:
  - display_text: dcf
    name: dcf
    token: DCF
    type: pure-token
  - display_text: dof
    name: dof
    token: DOF
    type: pure-token
  name: create option
  optional: true
  type: oneof
- arguments:
  - display_text: getnew
    name: getnew
    token: GETNEW
    type: pure-token
  - display_text: getold
    name: getold
    token: GETOLD
    type: pure-token
  name: return option
  optional: true
  type: oneof
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
  - display_text: keepttl
    name: keepttl
    token: KEEPTTL
    type: pure-token
  name: expiration
  optional: true
  type: oneof
- display_text: fvs
  name: fvs
  type: string
- display_text: count
  name: count
  type: integer
- arguments:
  - display_text: field
    name: field
    type: string
  - display_text: value
    name: value
    type: string
  multiple: true
  name: data
  type: block
arity: -6
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
description: For each specified field-value pair, set field to value and optionally set the field's remaining time to live or UNIX expiration timestamp in seconds or milliseconds
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
linkTitle: HSETF
since: 8.0.0
summary: For each specified field-value pair, set field to value and optionally set the field's remaining time to live or UNIX expiration timestamp in seconds or milliseconds
syntax_fmt: "HSETF key [DC] [DCF | DOF] [GETNEW | GETOLD] [NX | XX | GT | LT]\n  [EX\_\
  seconds | PX\_milliseconds | EXAT\_unix-time-seconds |\n  PXAT\_unix-time-milliseconds\
  \ | KEEPTTL] FVS count field value\n  [field value ...]"
syntax_str: "[DC] [DCF | DOF] [GETNEW | GETOLD] [NX | XX | GT | LT] [EX\_seconds |\
  \ PX\_milliseconds | EXAT\_unix-time-seconds | PXAT\_unix-time-milliseconds | KEEPTTL]\
  \ FVS count field value [field value ...]"
title: HSETF
---
For each specified field-value pair, set the field to the specified value and optionally set the field's remaining TTL (time to live) or its Unix expiration timestamp in seconds or milliseconds since Unix epoch. Optionally create the key and/or fields if they don't already exist.

Note: this command cannot set the expiration time of the hash key itself.

## Options

The `HSETF` command supports a set of options that modify its behavior. Except for `key`, the arguments may be specified in any order. When an optional argument is specified more than once, only the last occurrence is used.

* `key` -- if it already exists, it must be of type hash.
* `DC` -- when not specified and `key` does not exist, the key will be created. Otherwise, the key will not be created.
* `DCF` -- when DCF (“Don’t Create Fields”) is specified, for each specified field, if the field already exists, set the field's value and expiration time; ignore fields that do not exist.
* `DOF` -- when DOF (“Don’t Overwrite Fields”) is specified, for each specified field, if the field does not already exist, create the field and set its value and expiration time; ignore fields that already exist.
* `EX` *seconds* -- for each specified field, set the remaining TTL in seconds (a positive integer).
* `PX` *milliseconds* -- for each specified field, set the remaining TTL in milliseconds (a positive integer).
* `EXAT` *timestamp-seconds* -- for each specified field, set the specified Unix time at which the fields will expire, in seconds (a positive integer) since Unix epoch.
* `PXAT` *timestamp-milliseconds* -- for each specified field, set the specified Unix time at which the fields will expire, in milliseconds (a positive integer) since Unix epoch.
* `KEEPTTL` -- for each specified field, retain the previous expiration time. If the field is created and `KEEPTTL` is specified, the field is created with no expiration time or TTL.

When none of `EX`, `PX`, `EXAT`, `PXAT`, or `KEEPTTL` are specified, any previous expiration times associated with the fields are discarded.

`NX`, `XX`, `GT`, and `LT` can only be specified when `EX`, `PX`, `EXAT`, or `PXAT` is specified.

* `NX` -- for each specified field, set the expiration time only when the field has no expiration.
* `XX` -- for each specified field, set the expiration time only when the field has an existing expiration.
* `GT` -- for each specified field, set the expiration time only when the new expiration time is greater than the field's current expiration. A field with no expiration is treated as an infinite expiration. 
* `LT` -- for each specified field, set the expiration time only when the new expiration time is less than the field's current expiration. A field with no expiration is treated as an infinite expiration.
* count -- must be a positive integer and the number of field-value pairs must match the provided count.
    - all fields and values must be strings. When the same field is specified more than once, only the last value is used.

## Examples

```
redis> HSETF mykey FVS 2 field1 "hello" field2 "WORLD"
1) (integer) 1
2) (integer) 1
redis> HSETF mykey GETOLD EX 10 FVS 3 field1 "hello" field2 "world" field3 "yeah"
1) "hello"
2) "WORLD"
3) (nil)
redis> HSETF mykey DOF FVS 3 field1 "Hello" field2 "World" field4 "Nah"
1) (integer) 0
2) (integer) 0
3) (integer) 1
```

## RESP2/RESP3 replies

One of the following:
* [Simple error reply]({{< relref "/develop/reference/protocol-spec" >}}#simple-errors) when:
    - parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range
    - `key` exists but is not of type hash
    - `NX`, `XX`, `GT`, or `LT` is specified but none of `EX`, `PX`, `EXAT`, or `PXAT` is specified
    - `FVS` is not specified
    - `FVS` is specified more than once
* [Null reply]({{< relref "/develop/reference/protocol-spec" >}}#nulls) if the provided key does not exist and `DC` or `DCF` were not specified.
* [Array reply]({{< relref "/develop/reference/protocol-spec" >}}#arrays). For each field, either
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): `a + b`, where 
        - `a` is `1` if the field's value was set, or `0` if either DCF or DOF conditions were met
        - `b` is `2` if the field's expiration time was set or discarded, or 0 when other conditions were met:
            - `DCF` or `DOF` conditions met
            - `NX`, `XX`, `GT`, `LT` conditions not met
            - `KEEPTTL` was specified
            - if the field was created but none of `EX`, `PX`, `EXAT`, or `PXAT` were specified
    - When `GETNEW` is specified, either:
        - [String reply]({{< relref "/develop/reference/protocol-spec" >}}#simple-strings): the new value of the field or
        - [Nil reply]({{< relref "/develop/reference/protocol-spec">}}#nulls): if the field does not exist and `DCF` was specified.

        When the field exists and `DOF` is specified, the value is not changed and `GETNEW` replies with the old value.
    - When `GETOLD` is specified, either:
        - [String reply]({{< relref "/develop/reference/protocol-spec" >}}#simple-strings): the old value of the field or
        - [Nil reply]({{< relref "/develop/reference/protocol-spec">}}#nulls): if no such field existed before command execution.

    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): `-1` if the field exists but has no associated expiration set.
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): the TTL in milliseconds.