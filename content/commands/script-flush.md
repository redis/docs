---
acl_categories:
- '@slow'
- '@scripting'
arguments:
- arguments:
  - display_text: async
    name: async
    token: ASYNC
    type: pure-token
  - display_text: sync
    name: sync
    token: SYNC
    type: pure-token
  name: flush-type
  optional: true
  since: 6.2.0
  type: oneof
arity: -2
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
complexity: O(N) with N being the number of scripts in cache
description: Removes all server-side Lua scripts from the script cache.
group: scripting
hidden: false
hints:
- request_policy:all_nodes
- response_policy:all_succeeded
history:
- - 6.2.0
  - Added the `ASYNC` and `SYNC` flushing mode modifiers.
linkTitle: SCRIPT FLUSH
railroad_diagram: /images/railroad/script-flush.svg
since: 2.6.0
summary: Removes all server-side Lua scripts from the script cache.
syntax_fmt: SCRIPT FLUSH [ASYNC | SYNC]
title: SCRIPT FLUSH
---
Flush the Lua scripts cache.

By default, `SCRIPT FLUSH` will synchronously flush the cache.
Starting with Redis 6.2, setting the **lazyfree-lazy-user-flush** configuration directive to "yes" changes the default flush mode to asynchronous.

It is possible to use one of the following modifiers to dictate the flushing mode explicitly:

* `ASYNC`: flushes the cache asynchronously
* `SYNC`: flushes the cache synchronously

For more information about [`EVAL`]({{< relref "/commands/eval" >}}) scripts please refer to [Introduction to Eval Scripts]({{< relref "/develop/programmability/eval-intro" >}}).

## Behavior change history

*   `>= 6.2.0`: Default flush behavior now configurable by the **lazyfree-lazy-user-flush** configuration directive.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="script-flush-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
