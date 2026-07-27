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
railroad_diagram: /images/railroad/command-docs.svg
since: 7.0.0
summary: Returns documentary information about one, multiple or all commands.
syntax_fmt: COMMAND DOCS [command-name [command-name ...]]
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
    - array
    - bf
    - bitmap
    - cf
    - cluster
    - cms
    - connection
    - generic
    - geo
    - hash
    - hyperloglog
    - json
    - list
    - pubsub
    - scripting
    - search
    - server
    - set
    - sorted-set
    - stream
    - string
    - suggestion
    - tdigest
    - timeseries
    - topk
    - transactions
    - vector_set
* **complexity:** a short explanation about the command's time complexity.
* **doc_flags:** an array of documentation flags.
  Possible values are:
  - deprecated: the command is deprecated.
  - syscmd: a system command that isn't meant to be called by users.
* **deprecated_since:** the Redis version that deprecated the command (or for module commands, the module version)..
* **replaced_by:** the alternative for a deprecated command.
* **history:** an array of historical notes describing changes to the command's output or arguments. It should not contain information about behavioral changes.
  Each entry is an array itself, made up of two elements:
  1. The Redis version that the entry applies to.
  2. The description of the change.
* **arguments:** an array of maps that describe the command's arguments.
  Please refer to the [Redis command arguments][td] page for more information.

[td]: /develop/reference/command-arguments

## Optional arguments

<details open><summary><code>command-name [command-name ...]</code></summary>

One or more command names to return documentation for. If omitted, documentation for all commands is returned.

</details>

## Examples

{{% redis-cli %}}
redis> COMMAND DOCS SET
1) "set"
2)  1) "summary"
    2) "Sets the string value of a key, ignoring its type. The key is created if it doesn't exist."
    3) "since"
    4) "1.0.0"
    5) "group"
    6) "string"
    7) "complexity"
    8) "O(1)"
    9) "history"
   10) 1) 1) "2.6.12"
          2) "Added the `EX`, `PX`, `NX` and `XX` options."
       2) 1) "6.0.0"
          2) "Added the `KEEPTTL` option."
       3) 1) "6.2.0"
          2) "Added the `GET`, `EXAT` and `PXAT` option."
       4) 1) "7.0.0"
          2) "Allowed the `NX` and `GET` options to be used together."
       5) 1) "8.4.0"
          2) "Added 'IFEQ', 'IFNE', 'IFDEQ', 'IFDNE' options."
   11) "arguments"
   12) 1) 1) "name"
          2) "key"
          3) "type"
          4) "key"
          5) "display_text"
          6) "key"
          7) "key_spec_index"
          8) (integer) 0
       2) 1) "name"
          2) "value"
          3) "type"
          4) "string"
          5) "display_text"
          6) "value"
       3)  1) "name"
           2) "condition"
           3) "type"
           4) "oneof"
           5) "since"
           6) "2.6.12"
           7) "flags"
           8) 1) optional
           9) "arguments"
          10) 1) 1) "name"
                 2) "nx"
                 3) "type"
                 4) "pure-token"
                 5) "display_text"
                 6) "nx"
                 7) "token"
                 8) "NX"
              2) 1) "name"
                 2) "xx"
                 3) "type"
                 4) "pure-token"
                 5) "display_text"
                 6) "xx"
                 7) "token"
                 8) "XX"
              3)  1) "name"
                  2) "ifeq-value"
                  3) "type"
                  4) "string"
                  5) "display_text"
                  6) "ifeq-value"
                  7) "token"
                  8) "IFEQ"
                  9) "since"
                 10) "8.4.0"
              4)  1) "name"
                  2) "ifne-value"
                  3) "type"
                  4) "string"
                  5) "display_text"
                  6) "ifne-value"
                  7) "token"
                  8) "IFNE"
                  9) "since"
                 10) "8.4.0"
              5)  1) "name"
                  2) "ifdeq-digest"
                  3) "type"
                  4) "integer"
                  5) "display_text"
                  6) "ifdeq-digest"
                  7) "token"
                  8) "IFDEQ"
                  9) "since"
                 10) "8.4.0"
              6)  1) "name"
                  2) "ifdne-digest"
                  3) "type"
                  4) "integer"
                  5) "display_text"
                  6) "ifdne-digest"
                  7) "token"
                  8) "IFDNE"
                  9) "since"
                 10) "8.4.0"
       4)  1) "name"
           2) "get"
           3) "type"
           4) "pure-token"
           5) "display_text"
           6) "get"
           7) "token"
           8) "GET"
           9) "since"
          10) "6.2.0"
          11) "flags"
          12) 1) optional
       5) 1) "name"
          2) "expiration"
          3) "type"
          4) "oneof"
          5) "flags"
          6) 1) optional
          7) "arguments"
          8) 1)  1) "name"
                 2) "seconds"
                 3) "type"
                 4) "integer"
                 5) "display_text"
                 6) "seconds"
                 7) "token"
                 8) "EX"
                 9) "since"
                10) "2.6.12"
             2)  1) "name"
                 2) "milliseconds"
                 3) "type"
                 4) "integer"
                 5) "display_text"
                 6) "milliseconds"
                 7) "token"
                 8) "PX"
                 9) "since"
                10) "2.6.12"
             3)  1) "name"
                 2) "unix-time-seconds"
                 3) "type"
                 4) "unix-time"
                 5) "display_text"
                 6) "unix-time-seconds"
                 7) "token"
                 8) "EXAT"
                 9) "since"
                10) "6.2.0"
             4)  1) "name"
                 2) "unix-time-milliseconds"
                 3) "type"
                 4) "unix-time"
                 5) "display_text"
                 6) "unix-time-milliseconds"
                 7) "token"
                 8) "PXAT"
                 9) "since"
                10) "6.2.0"
             5)  1) "name"
                 2) "keepttl"
                 3) "type"
                 4) "pure-token"
                 5) "display_text"
                 6) "keepttl"
                 7) "token"
                 8) "KEEPTTL"
                 9) "since"
                10) "6.0.0"
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="command-docs-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a map, as a flattened array, where each key is a command name, and each value is the documentary information.

-tab-sep-

[Map reply](../../develop/reference/protocol-spec#maps): a map where each key is a command name, and each value is the documentary information.

{{< /multitabs >}}
