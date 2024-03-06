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
description: Returns documentary information about one, multiple or all commands.
group: server
hidden: false
hints:
- nondeterministic_output_order
linkTitle: COMMAND DOCS
since: 7.0.0
summary: Returns documentary information about one, multiple or all commands.
syntax_fmt: COMMAND DOCS [command-name [command-name ...]]
syntax_str: ''
title: COMMAND DOCS
---
Return documentary information about commands.

By default, the reply includes all of the server's commands.
You can use the optional _command-name_ argument to specify the names of one or more commands.

The reply includes a map for each returned command.
The following keys may be included in the mapped reply:

* **summary:** short command description.
* **since:** the Redis version that added the command (or for module commands, the module version).
* **group:** the functional group to which the command belongs.
  Possible values are:
  - _bitmap_
  - _cluster_
  - _connection_
  - _generic_
  - _geo_
  - _hash_
  - _hyperloglog_
  - _list_
  - _module_
  - _pubsub_
  - _scripting_
  - _sentinel_
  - _server_
  - _set_
  - _sorted-set_
  - _stream_
  - _string_
  - _transactions_
* **complexity:** a short explanation about the command's time complexity.
* **doc_flags:** an array of documentation flags.
  Possible values are:
  - _deprecated:_ the command is deprecated.
  - _syscmd:_ a system command that isn't meant to be called by users.
* **deprecated_since:** the Redis version that deprecated the command (or for module commands, the module version)..
* **replaced_by:** the alternative for a deprecated command.
* **history:** an array of historical notes describing changes to the command's output or arguments. It should not contain information about behavioral changes.
  Each entry is an array itself, made up of two elements:
  1. The Redis version that the entry applies to.
  2. The description of the change.
* **arguments:** an array of maps that describe the command's arguments.
  Please refer to the [Redis command arguments][td] page for more information.

[td]: /develop/reference/command-arguments

## Examples

{{% redis-cli %}}
COMMAND DOCS SET
{{% /redis-cli %}}

