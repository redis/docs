---
acl_categories:
- '@slow'
- '@connection'
arguments:
- display_text: command-name
  multiple: true
  name: command-name
  optional: true
  type: string
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
- loading
- stale
complexity: O(N) where N is the number of commands to look up
description: Returns information about one, multiple or all commands.
group: server
hidden: false
hints:
- nondeterministic_output_order
history:
- - 7.0.0
  - Allowed to be called with no argument to get info on all commands.
linkTitle: COMMAND INFO
since: 2.8.13
summary: Returns information about one, multiple or all commands.
syntax_fmt: COMMAND INFO [command-name [command-name ...]]
syntax_str: ''
title: COMMAND INFO
---
Returns [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of details about multiple Redis commands.

Same result format as [`COMMAND`]({{< relref "/commands/command" >}}) except you can specify which commands
get returned.

If you request details about non-existing commands, their return
position will be nil.

## Examples

{{% redis-cli %}}
COMMAND INFO get set eval
COMMAND INFO foo evalsha config bar
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="command-info-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a nested list of command details.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a nested list of command details.

{{< /multitabs >}}
