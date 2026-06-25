---
acl_categories:
- '@slow'
- '@connection'
arguments:
- display_text: command
  name: command
  type: string
- display_text: arg
  multiple: true
  name: arg
  optional: true
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
- loading
- stale
complexity: O(N) where N is the number of arguments to the command
description: Extracts the key names from an arbitrary command.
group: server
hidden: false
linkTitle: COMMAND GETKEYS
railroad_diagram: /images/railroad/command-getkeys.svg
since: 2.8.13
summary: Extracts the key names from an arbitrary command.
syntax_fmt: COMMAND GETKEYS command [arg [arg ...]]
title: COMMAND GETKEYS
---

`COMMAND GETKEYS` is a helper command to let you find the keys
from the provided Redis `command`.


[`COMMAND`]({{< relref "/commands/command" >}}) describes how Redis identifies key names for each command, including `firstkey`, [key specifications]({{< relref "develop/reference/key-specs#logical-operation-flags" >}}), and `movablekeys`. For some commands, Redis can identify the keys only by parsing the full command. Use COMMAND GETKEYS or [`COMMAND GETKEYSANDFLAGS`]({{< relref "/commands/command-getkeysandflags" >}}) to get the key names directly from the Redis command parser.

## Required arguments

<details open><summary><code>command</code></summary>

The name of the command to analyze.

</details>

## Optional arguments

<details open><summary><code>arg [arg ...]</code></summary>

The arguments that would be passed to the command.

</details>

## Examples

{{% redis-cli %}}
COMMAND GETKEYS MSET a b c d e f
COMMAND GETKEYS EVAL "not consulted" 3 key1 key2 key3 arg1 arg2 arg3 argN
COMMAND GETKEYS SORT mylist ALPHA STORE outlist
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="command-getkeys-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): list of keys from the given command.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of keys from the given command.

{{< /multitabs >}}
