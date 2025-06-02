---
acl_categories:
- '@slow'
- '@scripting'
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
- noscript
- allow_busy
complexity: O(1)
description: Terminates a server-side Lua script during execution.
group: scripting
hidden: false
hints:
- request_policy:all_shards
- response_policy:one_succeeded
linkTitle: SCRIPT KILL
since: 2.6.0
summary: Terminates a server-side Lua script during execution.
syntax_fmt: SCRIPT KILL
syntax_str: ''
title: SCRIPT KILL
---
Kills the currently executing [`EVAL`]({{< relref "/commands/eval" >}}) script, assuming no write operation was yet
performed by the script.

This command is mainly useful to kill a script that is running for too much
time(for instance, because it entered an infinite loop because of a bug).
The script will be killed, and the client currently blocked into EVAL will see
the command returning with an error.

If the script has already performed write operations, it can not be killed in this
way because it would violate Lua's script atomicity contract.
In such a case, only `SHUTDOWN NOSAVE` can kill the script, killing
the Redis process in a hard way and preventing it from persisting with half-written
information.

For more information about [`EVAL`]({{< relref "/commands/eval" >}}) scripts please refer to [Introduction to Eval Scripts]({{< relref "/develop/interact/programmability/eval-intro" >}}).
