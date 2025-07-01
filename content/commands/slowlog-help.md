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
description: Show helpful text about the different subcommands
group: server
hidden: true
linkTitle: SLOWLOG HELP
since: 6.2.0
summary: Show helpful text about the different subcommands
syntax_fmt: SLOWLOG HELP
syntax_str: ''
title: SLOWLOG HELP
---
The `SLOWLOG HELP` command returns a helpful text describing the different subcommands.

## Return information

{{< multitabs id="slowlog-help-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions.

{{< /multitabs >}}
