---
acl_categories:
- '@slow'
- '@connection'
arity: -1
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
complexity: O(N) where N is the total number of Redis commands
description: Returns detailed information about all commands.
group: server
hidden: false
hints:
- nondeterministic_output_order
linkTitle: COMMAND
since: 2.8.13
summary: Returns detailed information about all commands.
syntax_fmt: COMMAND
syntax_str: ''
title: COMMAND
---
Return an array with details about every Redis command.

The `COMMAND` command is introspective.
Its reply describes all commands that the server can process.
Redis clients can call it to obtain the server's runtime capabilities during the handshake.

`COMMAND` also has several subcommands.
Please refer to its subcommands for further details.

**Cluster note:**
this command is especially beneficial for cluster-aware clients.
Such clients must identify the names of keys in commands to route requests to the correct shard.
Although most commands accept a single key as their first argument, there are many exceptions to this rule. 
You can call `COMMAND` and then keep the mapping between commands and their respective key specification rules cached in the client.

The reply it returns is an array with an element per command.
Each element that describes a Redis command is represented as an array by itself.

The command's array consists of a fixed number of elements.
The exact number of elements in the array depends on the server's version.

1. Name
1. Arity
1. Flags
1. First key
1. Last key
1. Step
1. [ACL categories][ta] (as of Redis 6.0)
1. [Tips][tb] (as of Redis 7.0)
1. [Key specifications][td] (as of Redis 7.0)
1. Subcommands (as of Redis 7.0)

## Name

This is the command's name in lowercase.

**Note:**
Redis command names are case-insensitive.

## Arity

Arity is the number of arguments a command expects.
It follows a simple pattern:

* A positive integer means a fixed number of arguments.
* A negative integer means a minimal number of arguments.

Command arity _always includes_ the command's name itself (and the subcommand when applicable).

Examples:

* [`GET`]({{< relref "/commands/get" >}})'s arity is _2_ since the command only accepts one argument and always has the format `GET _key_`.
* [`MGET`]({{< relref "/commands/mget" >}})'s arity is _-2_ since the command accepts at least one argument, but possibly multiple ones: `MGET _key1_ [key2] [key3] ...`.

## Flags

Command flags are an array. It can contain the following simple strings (status reply):

* **admin:** the command is an administrative command.
* **asking:** the command is allowed even during hash slot migration.
  This flag is relevant in Redis Cluster deployments.
* **blocking:** the command may block the requesting client.
* **denyoom**: the command is rejected if the server's memory usage is too high (see the _maxmemory_ configuration directive).
* **fast:** the command operates in constant or log(N) time.
  This flag is used for monitoring latency with the [`LATENCY`]({{< relref "/commands/latency" >}}) command.
* **loading:** the command is allowed while the database is loading.
* **movablekeys:** the _first key_, _last key_, and _step_ values don't determine all key positions.
  Clients need to use [`COMMAND GETKEYS`]({{< relref "/commands/command-getkeys" >}}) or [key specifications][td] in this case.
  See below for more details.
* **no_auth:** executing the command doesn't require authentication.
* **no_async_loading:** the command is denied during asynchronous loading (that is when a replica uses disk-less `SWAPDB SYNC`, and allows access to the old dataset).
* **no_mandatory_keys:** the command may accept key name arguments, but these aren't mandatory.
* **no_multi:** the command isn't allowed inside the context of a [transaction]({{< relref "/develop/reference/transactions" >}}).
* **noscript:** the command can't be called from [scripts]({{< relref "/develop/programmability/eval-intro" >}}) or [functions]({{< relref "/develop/programmability/functions-intro" >}}).
* **pubsub:** the command is related to [Redis Pub/Sub]({{< relref "/develop/interact/pubsub" >}}).
* **random**: the command returns random results, which is a concern with verbatim script replication.
  As of Redis 7.0, this flag is a [command tip][tb].
* **readonly:** the command doesn't modify data.
* **sort_for_script:** the command's output is sorted when called from a script.
* **skip_monitor:** the command is not shown in [`MONITOR`]({{< relref "/commands/monitor" >}})'s output.
* **skip_slowlog:** the command is not shown in [`SLOWLOG`]({{< relref "/commands/slowlog" >}})'s output.
  As of Redis 7.0, this flag is a [command tip][tb].
* **stale:** the command is allowed while a replica has stale data.
* **write:** the command may modify data.

### Movablekeys

Consider [`SORT`]({{< relref "/commands/sort" >}}):

```
1) 1) "sort"
   2) (integer) -2
   3) 1) write
      2) denyoom
      3) movablekeys
   4) (integer) 1
   5) (integer) 1
   6) (integer) 1
   ...
```

Some Redis commands have no predetermined key locations or are not easy to find.
For those commands, the _movablekeys_ flag indicates that the _first key_, _last key_, and _step_ values are insufficient to find all the keys.

Here are several examples of commands that have the _movablekeys_ flag:

* [`SORT`]({{< relref "/commands/sort" >}}): the optional _STORE_, _BY_, and _GET_ modifiers are followed by names of keys.
* [`ZUNION`]({{< relref "/commands/zunion" >}}): the _numkeys_ argument specifies the number key name arguments.
* [`MIGRATE`]({{< relref "/commands/migrate" >}}): the keys appear _KEYS_ keyword and only when the second argument is the empty string.

Redis Cluster clients need to use other measures, as follows, to locate the keys for such commands.

You can use the [`COMMAND GETKEYS`]({{< relref "/commands/command-getkeys" >}}) command and have your Redis server report all keys of a given command's invocation.

As of Redis 7.0, clients can use the [key specifications](#key-specifications) to identify the positions of key names.
The only commands that require using [`COMMAND GETKEYS`]({{< relref "/commands/command-getkeys" >}}) are [`SORT`]({{< relref "/commands/sort" >}}) and [`MIGRATE`]({{< relref "/commands/migrate" >}}) for clients that parse keys' specifications.

For more information, please refer to the [key specifications page][tr].

## First key

The position of the command's first key name argument.
For most commands, the first key's position is 1.
Position 0 is always the command name itself.

## Last key

The position of the command's last key name argument.
Redis commands usually accept one, two or multiple number of keys.

Commands that accept a single key have both _first key_ and _last key_ set to 1.

Commands that accept two key name arguments, e.g. [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}), [`SMOVE`]({{< relref "/commands/smove" >}}) and [`RENAME`]({{< relref "/commands/rename" >}}), have this value set to the position of their second key.

Multi-key commands that accept an arbitrary number of keys, such as [`MSET`]({{< relref "/commands/mset" >}}), use the value -1.

## Step

The step, or increment, between the _first key_ and the position of the next key.

Consider the following two examples:

```
1) 1) "mset"
   2) (integer) -3
   3) 1) write
      2) denyoom
   4) (integer) 1
   5) (integer) -1
   6) (integer) 2
   ...
```

```
1) 1) "mget"
   2) (integer) -2
   3) 1) readonly
      2) fast
   4) (integer) 1
   5) (integer) -1
   6) (integer) 1
   ...
```

The step count allows us to find keys' positions. 
For example [`MSET`]({{< relref "/commands/mset" >}}): Its syntax is `MSET _key1_ _val1_ [key2] [val2] [key3] [val3]...`, so the keys are at every other position (step value of _2_).
Unlike [`MGET`]({{< relref "/commands/mget" >}}), which uses a step value of _1_.

## ACL categories

This is an array of simple strings that are the ACL categories to which the command belongs.
Please refer to the [Access Control List][ta] page for more information.

## Command tips

Helpful information about the command.
To be used by clients/proxies.

Please check the [Command tips][tb] page for more information.

## Key specifications

This is an array consisting of the command's key specifications.
Each element in the array is a map describing a method for locating keys in the command's arguments.

For more information please check the [key specifications page][td].

## Subcommands

This is an array containing all of the command's subcommands, if any.
Some Redis commands have subcommands (e.g., the `REWRITE` subcommand of [`CONFIG`]({{< relref "/commands/config" >}})).
Each element in the array represents one subcommand and follows the same specifications as those of `COMMAND`'s reply.

[ta]: /operate/oss_and_stack/management/security/acl
[tb]: /develop/reference/command-tips.md
[td]: /develop/reference/key-specs.md
[tr]: /develop/reference/key-specs.md

## Examples

The following is `COMMAND`'s output for the [`GET`]({{< relref "/commands/get" >}}) command:

```
1)  1) "get"
    2) (integer) 2
    3) 1) readonly
       2) fast
    4) (integer) 1
    5) (integer) 1
    6) (integer) 1
    7) 1) @read
       2) @string
       3) @fast
    8) (empty array)
    9) 1) 1) "flags"
          2) 1) read
          3) "begin_search"
          4) 1) "type"
             2) "index"
             3) "spec"
             4) 1) "index"
                2) (integer) 1
          5) "find_keys"
          6) 1) "type"
             2) "range"
             3) "spec"
             4) 1) "lastkey"
                2) (integer) 0
                3) "keystep"
                4) (integer) 1
                5) "limit"
                6) (integer) 0
   10) (empty array)
...
```

## Return information

{{< multitabs id="command-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a nested list of command details. The order of the commands in the array is random.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a nested list of command details. The order of the commands in the array is random.

{{< /multitabs >}}
