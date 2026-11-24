---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: name
  name: name
  type: string
arity: 3
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
compatibility:
  software:
    standard: unsupported
    active_active: unsupported
  cloud:
    standard: unsupported
    active_active: unsupported
complexity: O(1)
description: Unloads a module.
group: server
hidden: false
linkTitle: MODULE UNLOAD
railroad_diagram: /images/railroad/module-unload.svg
since: 4.0.0
summary: Unloads a module.
syntax_fmt: MODULE UNLOAD name
title: MODULE UNLOAD
---
Unloads a module.

This command unloads the module specified by `name`. Note that the module's name
is reported by the [`MODULE LIST`](/content/commands/module-list.md) command, and may differ from the dynamic
library's filename.

Known limitations:

*   Modules that register custom data types can not be unloaded.

## Required arguments

<details open><summary><code>name</code></summary>

The name of the module to unload, as reported by `MODULE LIST`.

</details>

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="module-unload-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the module was unloaded.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the module was unloaded.

{{< /multitabs >}}
