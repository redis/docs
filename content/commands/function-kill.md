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
compatibility:
  software:
    standard: supported
    active_active: supported
  cloud:
    standard: supported
    active_active: supported
complexity: O(1)
description: Terminates a function during execution.
group: scripting
hidden: false
hints:
- request_policy:all_shards
- response_policy:one_succeeded
linkTitle: FUNCTION KILL
railroad_diagram: /images/railroad/function-kill.svg
since: 7.0.0
summary: Terminates a function during execution.
syntax_fmt: FUNCTION KILL
title: FUNCTION KILL
---
Kill a function that is currently executing.

The `FUNCTION KILL` command can be used only on functions that did not modify the dataset during their execution (since stopping a read-only function does not violate the scripting engine's guaranteed atomicity).

For more information please refer to [Introduction to Redis Functions](/content/develop/programmability/functions-intro.md).

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="function-kill-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
