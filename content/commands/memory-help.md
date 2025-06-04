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
linkTitle: MEMORY HELP
since: 4.0.0
summary: Returns helpful text about the different subcommands.
syntax_fmt: MEMORY HELP
syntax_str: ''
title: MEMORY HELP
---
The `MEMORY HELP` command returns a helpful text describing the different
subcommands.

## Return information

{{< multitabs id="memory-help-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions.

{{< /multitabs >}}
