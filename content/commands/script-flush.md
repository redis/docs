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
since: 2.6.0
summary: Removes all server-side Lua scripts from the script cache.
syntax_fmt: SCRIPT FLUSH [ASYNC | SYNC]
syntax_str: ''
title: SCRIPT FLUSH
---
Flush the Lua scripts cache.

By default, `SCRIPT FLUSH` will synchronously flush the cache.
Starting with Redis 6.2, setting the **lazyfree-lazy-user-flush** configuration directive to "yes" changes the default flush mode to asynchronous.

It is possible to use one of the following modifiers to dictate the flushing mode explicitly:

* `ASYNC`: flushes the cache asynchronously
* `SYNC`: flushes the cache synchronously

For more information about [`EVAL`]({{< relref "/commands/eval" >}}) scripts please refer to [Introduction to Eval Scripts]({{< relref "/develop/interact/programmability/eval-intro" >}}).

## Behavior change history

*   `>= 6.2.0`: Default flush behavior now configurable by the **lazyfree-lazy-user-flush** configuration directive. 