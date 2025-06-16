---
acl_categories:
- '@slow'
- '@connection'
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
group: connection
hidden: true
linkTitle: CLIENT HELP
since: 5.0.0
summary: Returns helpful text about the different subcommands.
syntax_fmt: CLIENT HELP
syntax_str: ''
title: CLIENT HELP
---
The `CLIENT HELP` command returns a helpful text describing the different subcommands.

## Return information

{{< multitabs id="client-help-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of subcommands and their descriptions.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of subcommands and their descriptions.

{{< /multitabs >}}
