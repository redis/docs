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
description: Returns information about a function during execution.
group: scripting
hidden: false
hints:
- nondeterministic_output
- request_policy:all_shards
- response_policy:special
linkTitle: FUNCTION STATS
since: 7.0.0
summary: Returns information about a function during execution.
syntax_fmt: FUNCTION STATS
syntax_str: ''
title: FUNCTION STATS
---
Return information about the function that's currently running and information about the available execution engines.

The reply is map with two keys:

1. `running_script`: information about the running script.
  If there's no in-flight function, the server replies with a _nil_.
  Otherwise, this is a map with the following keys:
  * **name:** the name of the function.
  * **command:** the command and arguments used for invoking the function.
  * **duration_ms:** the function's runtime duration in milliseconds.
2. `engines`: this is a map of maps. Each entry in the map represent a single engine.
   Engine map contains statistics about the engine like number of functions and number of libraries.


You can use this command to inspect the invocation of a long-running function and decide whether kill it with the [`FUNCTION KILL`]({{< relref "/commands/function-kill" >}}) command.

For more information please refer to [Introduction to Redis Functions]({{< relref "/develop/interact/programmability/functions-intro" >}}).
