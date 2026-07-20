---
acl_categories:
- '@write'
- '@hash'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: fieldset-name
  name: fieldset-name
  type: string
- display_text: value
  multiple: true
  name: value
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
complexity: O(N) where N is the number of fields in the fieldset.
description: Creates a fieldset-based hash from values supplied in the order matching
  a previously prepared fieldset.
group: hash
hidden: false
key_specs:
- OW: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
linkTitle: HIMPORT SET
railroad_diagram: /images/railroad/himport-set.svg
since: 8.10.0
summary: Creates a fieldset-based hash from values supplied in the order matching
  a previously prepared fieldset.
syntax_fmt: HIMPORT SET key fieldset-name value [value ...]
title: HIMPORT SET
---
Creates a hash from a fieldset previously defined with [`HIMPORT PREPARE`]({{< relref "/commands/himport-prepare" >}}), pairing the fieldset's field names with the supplied values by position.

## Required arguments

<details open><summary><code>key</code></summary>

The key to create. If the key already exists, it is overwritten.

</details>

<details open><summary><code>fieldset-name</code></summary>

The name of a fieldset previously defined with [`HIMPORT PREPARE`]({{< relref "/commands/himport-prepare" >}}) on the same connection.

</details>

<details open><summary><code>value [value ...]</code></summary>

The field values, given in the same order as the field names were declared in the fieldset. The number of values must equal the number of fields in the fieldset.

</details>

## Examples

```shell
> HIMPORT PREPARE u name email age
OK
> HIMPORT SET user:1 u alice a@example.com 30
OK
> HIMPORT SET user:2 u bob b@example.com 25
OK
> HGET user:1 name
"alice"
> HGET user:1 email
"a@example.com"
> HGET user:1 age
"30"
```

## Details

`HIMPORT SET` creates or overwrites `key` as a hash whose fields are the field names of the prepared fieldset, each paired with the value at the same position. The number of values must match the number of fields in the fieldset.

The command returns an error if the fieldset has not been prepared on the current connection, or if the number of values does not match the fieldset's field count.

Keys created this way behave exactly like any other hash and work with all existing hash commands. Because they share a fixed set of field names, Redis can store them with an internal encoding that keeps a single copy of the field names, reducing memory when many keys share the same layout.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="himport-set-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}

## See also

[`HIMPORT PREPARE`]({{< relref "commands/himport-prepare/" >}}) | [`HSET`]({{< relref "commands/hset/" >}}) | [`HIMPORT DISCARD`]({{< relref "commands/himport-discard/" >}})
