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
railroad_diagram: /images/railroad/script-exists.svg
since: 2.6.0
summary: Determines whether server-side Lua scripts exist in the script cache.
syntax_fmt: SCRIPT EXISTS sha1 [sha1 ...]
title: SCRIPT EXISTS
---
Returns information about the existence of the scripts in the script cache.

This command accepts one or more SHA1 digests and returns a list of 1 and 0 values to indicate whether each script exists in the script cache. Before you run a pipeline, use this command to check whether Redis has loaded the scripts you need. For missing scripts, use [`SCRIPT LOAD`]({{< relref "/commands/script-load" >}}); then use [`EVALSHA`]({{< relref "/commands/evalsha" >}}) instead of [`EVAL`]({{< relref "/commands/eval" >}}) in the pipeline to save bandwidth.

For more information about [`EVAL`]({{< relref "/commands/eval" >}}) scripts see [Introduction to Eval Scripts]({{< relref "/develop/programmability/eval-intro" >}}).

## Required arguments

<details open><summary><code>sha1 [sha1 ...]</code></summary>

One or more SHA1 digests to look up in the script cache.

</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="script-exists-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): an array of integers that correspond to the specified SHA1 digest arguments.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): an array of integers that correspond to the specified SHA1 digest arguments.

{{< /multitabs >}}
