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
- display_text: unix-time-milliseconds
  name: unix-time-milliseconds
  type: unix-time
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
complexity: O(N) where N is the number of specified fields
description: Set expiration for hash fields using an absolute Unix timestamp (milliseconds)
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
linkTitle: HPEXPIREAT
railroad_diagram: /images/railroad/hpexpireat.svg
since: 7.4.0
summary: Set expiry for hash field using an absolute Unix timestamp (milliseconds)
syntax_fmt: "HPEXPIREAT key unix-time-milliseconds [NX | XX | GT | LT]\n  FIELDS\_\
  numfields field [field ...]"
title: HPEXPIREAT
---
`HPEXPIREAT` has the same effect and semantics as [`HEXPIREAT`]({{< relref "/commands/hexpireat" >}}), but the Unix time at
which the field will expire is specified in milliseconds since Unix epoch instead of seconds.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the hash.

</details>

<details open><summary><code>unix-time-milliseconds</code></summary>

The absolute Unix expiration timestamp, in milliseconds since Unix epoch. A timestamp in the past deletes the field immediately.

</details>

<details open><summary><code>FIELDS numfields field [field ...]</code></summary>

The hash fields to operate on. `numfields` is the number of fields, followed by that many field names.

</details>

## Optional arguments

The following options modify the command's behavior. They are mutually exclusive.

<details open><summary><code>NX</code></summary>

For each specified field, set expiration only when the field has no expiration.

</details>

<details open><summary><code>XX</code></summary>

For each specified field, set expiration only when the field has an existing expiration.

</details>

<details open><summary><code>GT</code></summary>

For each specified field, set expiration only when the new expiration is greater than the current one. A non-volatile key is treated as an infinite TTL for the purposes of `GT`.

</details>

<details open><summary><code>LT</code></summary>

For each specified field, set expiration only when the new expiration is less than the current one. A non-volatile key is treated as an infinite TTL for the purposes of `LT`.

</details>

## Examples

```
redis> HSET mykey field1 "hello" field2 "world"
(integer) 2
redis> HPEXPIREAT mykey 1715704971000 FIELDS 2 field1 field2
1) (integer) 1
2) (integer) 1
redis> HPTTL mykey FIELDS 2 field1 field2
1) (integer) 303340
2) (integer) 303340
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="hpexpireat-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays). For each field:
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if no such field exists in the provided hash key, or the provided key does not exist.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the specified NX, XX, GT, or LT condition has not been met.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the expiration time was set/updated.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `2` when `HEXPIRE` or `HPEXPIRE` is called with 0 seconds or milliseconds, or when `HEXPIREAT` or `HPEXPIREAT` is called with a past Unix time in seconds or milliseconds.
* [Simple error reply](../../develop/reference/protocol-spec#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the provided key exists but is not a hash.

-tab-sep-

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays). For each field:
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if no such field exists in the provided hash key, or the provided key does not exist.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the specified NX, XX, GT, or LT condition has not been met.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the expiration time was set/updated.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `2` when `HEXPIRE` or `HPEXPIRE` is called with 0 seconds or milliseconds, or when `HEXPIREAT` or `HPEXPIREAT` is called with a past Unix time in seconds or milliseconds.
* [Simple error reply](../../develop/reference/protocol-spec#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the provided key exists but is not a hash.

{{< /multitabs >}}
