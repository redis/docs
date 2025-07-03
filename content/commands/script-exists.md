---
acl_categories:
- '@slow'
- '@scripting'
arguments:
- display_text: sha1
  multiple: true
  name: sha1
  type: string
arity: -3
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
complexity: O(N) with N being the number of scripts to check (so checking a single
  script is an O(1) operation).
description: Determines whether server-side Lua scripts exist in the script cache.
group: scripting
hidden: false
hints:
- request_policy:all_shards
- response_policy:agg_logical_and
linkTitle: SCRIPT EXISTS
since: 2.6.0
summary: Determines whether server-side Lua scripts exist in the script cache.
syntax_fmt: SCRIPT EXISTS sha1 [sha1 ...]
syntax_str: ''
title: SCRIPT EXISTS
---
Returns information about the existence of the scripts in the script cache.

This command accepts one or more SHA1 digests and returns a list of ones or
zeros to signal if the scripts are already defined or not inside the script
cache.
This can be useful before a pipelining operation to ensure that scripts are
loaded (and if not, to load them using [`SCRIPT LOAD`]({{< relref "/commands/script-load" >}})) so that the pipelining
operation can be performed solely using [`EVALSHA`]({{< relref "/commands/evalsha" >}}) instead of [`EVAL`]({{< relref "/commands/eval" >}}) to save
bandwidth.

For more information about [`EVAL`]({{< relref "/commands/eval" >}}) scripts please refer to [Introduction to Eval Scripts]({{< relref "/develop/programmability/eval-intro" >}}).

## Return information

{{< multitabs id="script-exists-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): an array of integers that correspond to the specified SHA1 digest arguments.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): an array of integers that correspond to the specified SHA1 digest arguments.

{{< /multitabs >}}
