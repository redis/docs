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
since: 6.2.0
summary: Resets the connection.
syntax_fmt: RESET
syntax_str: ''
title: RESET
---
This command performs a full reset of the connection's server-side context, 
mimicking the effect of disconnecting and reconnecting again.

When the command is called from a regular client connection, it does the
following:

* Discards the current [`MULTI`]({{< relref "/commands/multi" >}}) transaction block, if one exists.
* Unwatches all keys [`WATCH`]({{< relref "/commands/watch" >}})ed by the connection.
* Disables [`CLIENT TRACKING`]({{< relref "/commands/client-tracking" >}}), if in use.
* Sets the connection to [`READWRITE`]({{< relref "/commands/readwrite" >}}) mode.
* Cancels the connection's [`ASKING`]({{< relref "/commands/asking" >}}) mode, if previously set.
* Sets [`CLIENT REPLY`]({{< relref "/commands/client-reply" >}}) to `ON`.
* Sets the protocol version to RESP2.
* [`SELECT`]({{< relref "/commands/select" >}})s database 0.
* Exits [`MONITOR`]({{< relref "/commands/monitor" >}}) mode, when applicable.
* Aborts Pub/Sub's subscription state ([`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) and [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}})), when
  appropriate.
* Deauthenticates the connection, requiring a call [`AUTH`]({{< relref "/commands/auth" >}}) to reauthenticate when
  authentication is enabled.
* Turns off `NO-EVICT` mode.
* Turns off `NO-TOUCH` mode.
