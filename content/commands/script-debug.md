---
acl_categories:
- '@slow'
- '@scripting'
arguments:
- arguments:
  - display_text: 'yes'
    name: 'yes'
    token: 'YES'
    type: pure-token
  - display_text: sync
    name: sync
    token: SYNC
    type: pure-token
  - display_text: 'no'
    name: 'no'
    token: 'NO'
    type: pure-token
  name: mode
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
complexity: O(1)
description: Sets the debug mode of server-side Lua scripts.
group: scripting
hidden: false
linkTitle: SCRIPT DEBUG
railroad_diagram: /images/railroad/script-debug.svg
since: 3.2.0
summary: Sets the debug mode of server-side Lua scripts.
syntax_fmt: SCRIPT DEBUG <YES | SYNC | NO>
syntax_str: ''
title: SCRIPT DEBUG
---
Set the debug mode for subsequent scripts executed with [`EVAL`]({{< relref "/commands/eval" >}}). Redis includes a
complete Lua debugger, codename LDB, that can be used to make the task of
writing complex scripts much simpler. In debug mode Redis acts as a remote
debugging server and a client, such as `redis-cli`, can execute scripts step by
step, set breakpoints, inspect variables and more - for additional information
about LDB refer to the [Redis Lua debugger]({{< relref "/develop/programmability/lua-debugging" >}}) page.

**Important note:** avoid debugging Lua scripts using your Redis production
server. Use a development server instead.

LDB can be enabled in one of two modes: asynchronous or synchronous. In
asynchronous mode the server creates a forked debugging session that does not
block and all changes to the data are **rolled back** after the session
finishes, so debugging can be restarted using the same initial state. The
alternative synchronous debug mode blocks the server while the debugging session
is active and retains all changes to the data set once it ends.

* `YES`. Enable non-blocking asynchronous debugging of Lua scripts (changes are discarded).
* `SYNC`. Enable blocking synchronous debugging of Lua scripts (saves changes to data).
* `NO`. Disables scripts debug mode.

For more information about [`EVAL`]({{< relref "/commands/eval" >}}) scripts please refer to [Introduction to Eval Scripts]({{< relref "/develop/programmability/eval-intro" >}}).

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="script-debug-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
