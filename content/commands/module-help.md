---
acl_categories:
- '@slow'
arity: 2
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
compatibility:
  software:
    standard: unsupported
    active_active: unsupported
  cloud:
    standard: unsupported
    active_active: unsupported
complexity: O(1)
description: Returns helpful text about the different subcommands.
group: server
hidden: true
linkTitle: MODULE HELP
railroad_diagram: /images/railroad/module-help.svg
since: 5.0.0
summary: Returns helpful text about the different subcommands.
syntax_fmt: MODULE HELP
title: MODULE HELP
---
The `MODULE HELP` command returns a helpful text describing the different subcommands.

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="module-help-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions

{{< /multitabs >}}
