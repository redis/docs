---
acl_categories:
- '@hash'
- '@slow'
arguments:
- display_text: fieldset-name
  name: fieldset-name
  type: string
arity: 3
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
complexity: O(N) where N is the number of session-local fieldsets.
description: Removes a single session-local fieldset by name.
group: hash
hidden: false
hints:
- request_policy:all_shards
linkTitle: HIMPORT DISCARD
railroad_diagram: /images/railroad/himport-discard.svg
since: 8.10.0
summary: Removes a single session-local fieldset by name.
syntax_fmt: HIMPORT DISCARD fieldset-name
title: HIMPORT DISCARD
---
Removes a single session-local fieldset, previously defined with [`HIMPORT PREPARE`]({{< relref "/commands/himport-prepare" >}}), from the current connection.

## Required arguments

<details open><summary><code>fieldset-name</code></summary>

The name of the fieldset to remove from the current connection.

</details>

## Examples

```shell
> HIMPORT PREPARE u name email age
OK
> HIMPORT DISCARD u
(integer) 1
> HIMPORT DISCARD u
(integer) 0
```

## Details

Discarding a fieldset only removes the fieldset itself; it does not affect any hashes already created from it with [`HIMPORT SET`]({{< relref "/commands/himport-set" >}}).

Use `HIMPORT DISCARD` to free up resources on the connection once a bulk-ingestion job that used a given fieldset has finished. If you don't discard it, the fieldset stays allocated on the connection until the connection closes or the client issues the [`RESET`]({{< relref "/commands/reset" >}}) command.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="himport-discard-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): `1` if the fieldset was removed, or `0` if no fieldset with that name existed on the connection.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): `1` if the fieldset was removed, or `0` if no fieldset with that name existed on the connection.

{{< /multitabs >}}

## See also

[`HIMPORT PREPARE`]({{< relref "commands/himport-prepare/" >}}) | [`HIMPORT DISCARDALL`]({{< relref "commands/himport-discardall/" >}})
