---
acl_categories:
- '@slow'
- '@connection'
arguments:
- arguments:
  - display_text: 'on'
    name: 'on'
    token: 'ON'
    type: pure-token
  - display_text: 'off'
    name: 'off'
    token: 'OFF'
    type: pure-token
  name: enabled
  type: oneof
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
command_flags:
- noscript
- loading
- stale
complexity: O(1)
description: Controls whether commands sent by the client affect the LRU/LFU of accessed
  keys.
group: connection
hidden: false
linkTitle: CLIENT NO-TOUCH
since: 7.2.0
summary: Controls whether commands sent by the client affect the LRU/LFU of accessed
  keys.
syntax_fmt: CLIENT NO-TOUCH <ON | OFF>
syntax_str: ''
title: CLIENT NO-TOUCH
---
The `CLIENT NO-TOUCH` command controls whether commands sent by the client will alter the LRU/LFU of the keys they access.

When turned on, the current client will not change LFU/LRU stats, unless it sends the [`TOUCH`]({{< relref "/commands/touch" >}}) command.

When turned off, the client touches LFU/LRU stats just as a normal client.

## Return information

{{< multitabs id="client-no-touch-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if the command was successful.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: wrong number of or invalid arguments.

-tab-sep-

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if the command was successful.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: wrong number of or invalid arguments.

{{< /multitabs >}}
