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
- oss
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
railroad_diagram: /images/railroad/function-load.svg
since: 7.0.0
summary: Creates a library.
syntax_fmt: FUNCTION LOAD [REPLACE] function-code
title: FUNCTION LOAD
---
Load a library to Redis.

The command takes one required parameter: the source code that implements the library. The library payload must start with a _shebang_ statement that provides the library metadata, including the engine to use and the library name.

Use this shebang format:

`#!<engine name> name=<library name>`.

Currently, `<engine name>` must be `lua`.

For the Lua engine, the implementation should declare one or more entry points to the library with the [`redis.register_function()`]({{< relref "develop/programmability/lua-api#redis.register_function" >}}) API.
Once loaded, you can call the functions in the library with the [`FCALL`]({{< relref "/commands/fcall" >}}) or [`FCALL_RO`]({{< relref "/commands/fcall_ro" >}}) commands, as appropriate.



For more information please refer to [Introduction to Redis Functions]({{< relref "/develop/programmability/functions-intro" >}}).

## Required arguments

<details open><summary><code>function-code</code></summary>

The library's source code. It must begin with a Shebang statement that declares the engine and library name, for example `#!lua name=mylib`.

</details>

## Optional arguments

<details open><summary><code>REPLACE</code></summary>

Replace an existing library that has the same name.

</details>

## Examples

The following example will create a library named `mylib` with a single function, `myfunc`, that returns the first argument it gets.

```
redis> FUNCTION LOAD "#!lua name=mylib \n redis.register_function('myfunc', function(keys, args) return args[1] end)"
mylib
redis> FCALL myfunc 0 hello
"hello"
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="function-load-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

- [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}): the library name that was loaded.
- [Simple error string]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in the following circumstances: an invalid engine-name was provided, 
the library's name already exists without the `REPLACE` modifier, 
a function in the library is created with a name that already exists in another library (even when `REPLACE` is specified), 
the engine failed in creating the library's functions (for example, because of a compilation error), or 
no functions were declared by the library.

-tab-sep-

One of the following:

- [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}): the library name that was loaded.
- [Simple error string]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in the following circumstances: an invalid engine-name was provided, 
the library's name already exists without the `REPLACE` modifier, 
a function in the library is created with a name that already exists in another library (even when `REPLACE` is specified), 
the engine failed in creating the library's functions (for example, because of a compilation error), or 
no functions were declared by the library.

{{< /multitabs >}}
