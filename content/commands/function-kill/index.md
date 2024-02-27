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
description: Terminates a function during execution.
group: scripting
hidden: false
hints:
- request_policy:all_shards
- response_policy:one_succeeded
linkTitle: FUNCTION KILL
since: 7.0.0
summary: Terminates a function during execution.
syntax_fmt: FUNCTION KILL
syntax_str: ''
title: FUNCTION KILL
---
Kill a function that is currently executing.


The `FUNCTION KILL` command can be used only on functions that did not modify the dataset during their execution (since stopping a read-only function does not violate the scripting engine's guaranteed atomicity).

For more information please refer to [Introduction to Redis Functions]({{< relref "/develop/interact/programmability/functions-intro" >}}).
