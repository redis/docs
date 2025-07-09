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
description: Extracts the key names and access flags for an arbitrary command.
group: server
hidden: false
linkTitle: COMMAND GETKEYSANDFLAGS
since: 7.0.0
summary: Extracts the key names and access flags for an arbitrary command.
syntax_fmt: COMMAND GETKEYSANDFLAGS command [arg [arg ...]]
syntax_str: '[arg [arg ...]]'
title: COMMAND GETKEYSANDFLAGS
---
Returns [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of keys from a full Redis command and their usage flags.

`COMMAND GETKEYSANDFLAGS` is a helper command to let you find the keys from a full Redis command together with flags indicating what each key is used for.

[`COMMAND`]({{< relref "/commands/command" >}}) provides information on how to find the key names of each command (see `firstkey`, [key specifications]({{< relref "develop/reference/key-specs#logical-operation-flags" >}}), and `movablekeys`),
but in some cases it's not possible to find keys of certain commands and then the entire command must be parsed to discover some / all key names.
You can use [`COMMAND GETKEYS`]({{< relref "/commands/command-getkeys" >}}) or `COMMAND GETKEYSANDFLAGS` to discover key names directly from how Redis parses the commands.

Refer to [key specifications]({{< relref "develop/reference/key-specs#logical-operation-flags" >}}) for information about the meaning of the key flags.

## Examples

{{% redis-cli %}}
COMMAND GETKEYS MSET a b c d e f
COMMAND GETKEYS EVAL "not consulted" 3 key1 key2 key3 arg1 arg2 arg3 argN
COMMAND GETKEYSANDFLAGS LMOVE mylist1 mylist2 left left
{{% /redis-cli %}}

## Return information

{{< multitabs id="command-getkeysandflags-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of keys from the given command and their usage flags.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of keys from the given command and their usage flags.

{{< /multitabs >}}
