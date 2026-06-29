---
acl_categories:
- '@slow'
- '@scripting'
arguments:
- display_text: function
  name: function
  type: string
- display_text: numkeys
  name: numkeys
  type: integer
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  optional: true
  type: key
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
- noscript
- stale
- skip_monitor
- no_mandatory_keys
- movablekeys
complexity: Depends on the function that is executed.
description: Invokes a function.
group: scripting
hidden: false
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      firstkey: 1
      keynumidx: 0
      keystep: 1
    type: keynum
  notes: We cannot tell how the keys will be used so we assume the worst, RW and UPDATE
  update: true
linkTitle: FCALL
railroad_diagram: /images/railroad/fcall.svg
since: 7.0.0
summary: Invokes a function.
syntax_fmt: FCALL function numkeys [key [key ...]] [arg [arg ...]]
title: FCALL
---
Invoke a function.

Functions are loaded to the server with the [`FUNCTION LOAD`]({{< relref "/commands/function-load" >}}) command.
The first argument is the name of a loaded function.

The second argument is the number of input key name arguments, followed by all the keys accessed by the function.
In Lua, these input keys names are available to the function as a table that is the callback's first argument.

**Important:**
To ensure the correct execution of functions, both in standalone and clustered deployments, all the key names that a function accesses must be explicitly provided as input key arguments.
The function should only access keys whose names are given as input arguments.
Functions should never access keys with programmatically-generated names or based on the contents of data structures stored in the database.

Any additional input arguments should not represent names of keys.
These are regular arguments and are passed in a Lua table as the callback's second argument.

For more information please refer to the [Redis Programmability]({{< relref "/develop/programmability/" >}}) and [Introduction to Redis Functions]({{< relref "/develop/programmability/functions-intro" >}}) pages.

## Required arguments

<details open><summary><code>function</code></summary>

The name of the function to call.

</details>

<details open><summary><code>numkeys</code></summary>

The number of key names that follow. Arguments after the keys are passed as regular arguments.

</details>

## Optional arguments

<details open><summary><code>key [key ...]</code></summary>

The key names the function accesses, provided to it via the Lua  `KEYS` global variable. There must be exactly `numkeys` of them.

</details>

<details open><summary><code>arg [arg ...]</code></summary>

Additional arguments provided to the function via the Lua `ARGV` variable.

</details>

## Examples

The following example will create a library named `mylib` with a single function, `myfunc`, that returns the first argument it gets.

```
redis> FUNCTION LOAD "#!lua name=mylib \n redis.register_function('myfunc', function(keys, args) return args[1] end)"
"mylib"
redis> FCALL myfunc 0 hello
"hello"
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="fcall-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

The return value depends on the function that was executed.

-tab-sep-

The return value depends on the function that was executed.

{{< /multitabs >}}
