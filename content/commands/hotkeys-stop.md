---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
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
command_flags:
- admin
- noscript
complexity: O(1)
container: HOTKEYS
description: Stops hotkeys tracking.
function: hotkeysCommand
group: server
hidden: false
linkTitle: HOTKEYS STOP
railroad_diagram: /images/railroad/hotkeys-stop.svg
reply_schema:
  const: OK
since: 8.6.0
summary: Stops hotkeys tracking.
syntax_fmt: HOTKEYS STOP
title: HOTKEYS STOP
---
Stops hotkeys tracking but preserves the collected data.

After stopping, the tracking data remains available through [`HOTKEYS GET`]({{< relref "/commands/hotkeys-get" >}}) until [`HOTKEYS RESET`]({{< relref "/commands/hotkeys-reset" >}}) is called or a new tracking session is started.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}
One of the following:

- [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` when tracking is successfully stopped.
- [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): when tracking is not currently active.

-tab-sep-

One of the following:

- [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` when tracking is successfully stopped.
- [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): when tracking is not currently active.

{{< /multitabs >}}
