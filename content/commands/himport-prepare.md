---
acl_categories:
- '@hash'
- '@slow'
arguments:
- display_text: fieldset-name
  name: fieldset-name
  type: string
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
- denyoom
complexity: O(N*log(N)) where N is the number of fields.
description: Defines a session-local fieldset that maps a name to a sorted set of
  field names.
group: hash
hidden: false
hints:
- request_policy:all_shards
linkTitle: HIMPORT PREPARE
railroad_diagram: /images/railroad/himport-prepare.svg
since: 8.10.0
summary: Defines a session-local fieldset that maps a name to a sorted set of field
  names.
syntax_fmt: HIMPORT PREPARE fieldset-name field [field ...]
title: HIMPORT PREPARE
---
Defines a session-local fieldset that maps a name to an ordered list of field names, to be used by later [`HIMPORT SET`]({{< relref "/commands/himport-set" >}}) commands on the same connection.

## Required arguments

<details open><summary><code>fieldset-name</code></summary>

The name to give the fieldset. The fieldset is scoped to the current connection. Preparing a fieldset with a name that already exists on the connection replaces the previous definition.

</details>

<details open><summary><code>field [field ...]</code></summary>

One or more field names to store under the fieldset, in the order you intend to supply their values to [`HIMPORT SET`]({{< relref "/commands/himport-set" >}}). A field name must not appear more than once in the same fieldset.

</details>

## Examples

```shell
> HIMPORT PREPARE u name email age
OK
```

## Details

A fieldset is scoped to the client connection: it is not visible to other clients and is discarded when the connection closes or the client issues the [`RESET`]({{< relref "/commands/reset" >}}) command. A connection can prepare several fieldsets, each under its own name.

The command returns an error if the same field name is given more than once.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="himport-prepare-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}

## See also

[`HIMPORT SET`]({{< relref "commands/himport-set/" >}}) | [`HIMPORT DISCARD`]({{< relref "commands/himport-discard/" >}}) | [`HIMPORT DISCARDALL`]({{< relref "commands/himport-discardall/" >}})
