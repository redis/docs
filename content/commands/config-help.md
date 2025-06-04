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
complexity: O(1)
description: Returns helpful text about the different subcommands.
group: server
hidden: true
linkTitle: CONFIG HELP
since: 5.0.0
summary: Returns helpful text about the different subcommands.
syntax_fmt: CONFIG HELP
syntax_str: ''
title: CONFIG HELP
---
The `CONFIG HELP` command returns a helpful text describing the different subcommands.

## Return information

{{< multitabs id="config-help-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions.

{{< /multitabs >}}
