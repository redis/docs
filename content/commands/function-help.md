---
acl_categories:
- '@slow'
- '@scripting'
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
    standard: supported
    active_active: supported
  cloud:
    standard: supported
    active_active: supported
complexity: O(1)
description: Returns helpful text about the different subcommands.
group: scripting
hidden: true
linkTitle: FUNCTION HELP
railroad_diagram: /images/railroad/function-help.svg
since: 7.0.0
summary: Returns helpful text about the different subcommands.
syntax_fmt: FUNCTION HELP
title: FUNCTION HELP
---
The `FUNCTION HELP` command returns a helpful text describing the different subcommands.

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="function-help-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions.

{{< /multitabs >}}
