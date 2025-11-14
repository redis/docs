---
acl_categories:
- '@write'
- '@slow'
- '@scripting'
arguments:
- display_text: replace
  name: replace
  optional: true
  token: REPLACE
  type: pure-token
- display_text: function-code
  name: function-code
  type: string
arity: -3
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
command_flags:
- write
- denyoom
- noscript
complexity: O(1) (considering compilation time is redundant)
description: Creates a library.
group: scripting
hidden: false
hints:
- request_policy:all_shards
- response_policy:all_succeeded
linkTitle: FUNCTION LOAD
since: 7.0.0
summary: Creates a library.
syntax_fmt: FUNCTION LOAD [REPLACE] function-code
syntax_str: function-code
title: FUNCTION LOAD
---
Load a library to Redis.

The command's gets a single mandatory parameter which is the source code that implements the library.
The library payload must start with Shebang statement that provides a metadata about the library (like the engine to use and the library name).
Shebang format: `#!<engine name> name=<library name>`. Currently engine name must be `lua`.

For the Lua engine, the implementation should declare one or more entry points to the library with the [`redis.register_function()` API]({{< relref "develop/programmability/lua-api#redis.register_function" >}}).
Once loaded, you can call the functions in the library with the [`FCALL`]({{< relref "/commands/fcall" >}}) (or [`FCALL_RO`]({{< relref "/commands/fcall_ro" >}}) when applicable) command.

When attempting to load a library with a name that already exists, the Redis server returns an error.
The `REPLACE` modifier changes this behavior and overwrites the existing library with the new contents.

The command will return an error in the following circumstances:

* An invalid _engine-name_ was provided.
* The library's name already exists without the `REPLACE` modifier.
* A function in the library is created with a name that already exists in another library (even when `REPLACE` is specified).
* The engine failed in creating the library's functions (due to a compilation error, for example).
* No functions were declared by the library.

For more information please refer to [Introduction to Redis Functions]({{< relref "/develop/programmability/functions-intro" >}}).

## Examples

The following example will create a library named `mylib` with a single function, `myfunc`, that returns the first argument it gets.

```
redis> FUNCTION LOAD "#!lua name=mylib \n redis.register_function('myfunc', function(keys, args) return args[1] end)"
mylib
redis> FCALL myfunc 0 hello
"hello"
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="function-load-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the library name that was loaded.

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the library name that was loaded.

{{< /multitabs >}}
