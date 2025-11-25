---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: path
  name: path
  type: string
- arguments:
  - display_text: name
    name: name
    type: string
  - display_text: value
    name: value
    type: string
  multiple: true
  multiple_token: true
  name: configs
  optional: true
  token: CONFIG
  type: block
- display_text: args
  multiple: true
  name: args
  optional: true
  token: ARGS
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
- admin
- noscript
- no_async_loading
complexity: O(1)
description: Loads a module using extended parameters.
group: server
hidden: false
linkTitle: MODULE LOADEX
railroad_diagram: /images/railroad/module-loadex.svg
since: 7.0.0
summary: Loads a module using extended parameters.
syntax_fmt: "MODULE LOADEX path [CONFIG\_name value [CONFIG name value ...]]\n  [ARGS\_\
  args [args ...]]"
syntax_str: "[CONFIG\_name value [CONFIG name value ...]] [ARGS\_args [args ...]]"
title: MODULE LOADEX
---
Loads a module from a dynamic library at runtime with configuration directives.

This is an extended version of the [`MODULE LOAD`]({{< relref "/commands/module-load" >}}) command.

It loads and initializes the Redis module from the dynamic library specified by the `path` argument. The `path` should be the absolute path of the library, including the full filename.

You can use the optional `CONFIG` argument to provide the module with configuration directives.
Any additional arguments that follow the `ARGS` keyword are passed unmodified to the module.

**Note**: modules can also be loaded at server startup with `loadmodule`
configuration directive in `redis.conf`.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="module-loadex-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the module was loaded.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the module was loaded.

{{< /multitabs >}}
