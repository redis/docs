---
acl_categories:
- '@fast'
- '@connection'
arity: 1
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
- noscript
- loading
- stale
- fast
- no_auth
- allow_busy
complexity: O(1)
description: Resets the connection.
group: connection
hidden: false
linkTitle: RESET
railroad_diagram: /images/railroad/reset.svg
since: 6.2.0
summary: Resets the connection.
syntax_fmt: RESET
title: RESET
---
This command performs a full reset of the connection's server-side context, 
mimicking the effect of disconnecting and reconnecting again.

When the command is called from a regular client connection, it does the
following:

* Discards the current [`MULTI`](/content/commands/multi.md) transaction block, if one exists.
* Unwatches all keys [`WATCH`](/content/commands/watch.md)ed by the connection.
* Disables [`CLIENT TRACKING`](/content/commands/client-tracking.md), if in use.
* Sets the connection to [`READWRITE`](/content/commands/readwrite.md) mode.
* Cancels the connection's [`ASKING`](/content/commands/asking.md) mode, if previously set.
* Sets [`CLIENT REPLY`](/content/commands/client-reply.md) to `ON`.
* Sets the protocol version to RESP2.
* [`SELECT`](/content/commands/select.md)s database 0.
* Exits [`MONITOR`](/content/commands/monitor.md) mode, when applicable.
* Aborts Pub/Sub's subscription state ([`SUBSCRIBE`](/content/commands/subscribe.md) and [`PSUBSCRIBE`](/content/commands/psubscribe.md)), when
  appropriate.
* Deauthenticates the connection, requiring a call [`AUTH`](/content/commands/auth.md) to reauthenticate when
  authentication is enabled.
* Turns off `NO-EVICT` mode.
* Turns off `NO-TOUCH` mode.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="reset-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `RESET`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `RESET`.

{{< /multitabs >}}
