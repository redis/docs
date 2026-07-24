---
acl_categories:
- '@hash'
- '@slow'
arity: 2
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
description: Removes all session-local fieldsets for the connection.
group: hash
hidden: false
hints:
- request_policy:all_shards
linkTitle: HIMPORT DISCARDALL
railroad_diagram: /images/railroad/himport-discardall.svg
since: 8.10.0
summary: Removes all session-local fieldsets for the connection.
syntax_fmt: HIMPORT DISCARDALL
title: HIMPORT DISCARDALL
---
Removes every fieldset held by the current connection, discarding all definitions previously created with [`HIMPORT PREPARE`]({{< relref "/commands/himport-prepare" >}}).

## Examples

```shell
> HIMPORT PREPARE u name email age
OK
> HIMPORT PREPARE o id total
OK
> HIMPORT DISCARDALL
(integer) 2
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="himport-discardall-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of fieldsets removed.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of fieldsets removed.

{{< /multitabs >}}

## See also

[`HIMPORT PREPARE`]({{< relref "commands/himport-prepare/" >}}) | [`HIMPORT DISCARD`]({{< relref "commands/himport-discard/" >}})
