---
acl_categories:
- '@stream'
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
group: stream
hidden: true
linkTitle: XGROUP HELP
since: 5.0.0
summary: Returns helpful text about the different subcommands.
syntax_fmt: XGROUP HELP
syntax_str: ''
title: XGROUP HELP
---
The `XGROUP HELP` command returns a helpful text describing the different subcommands.

## Return information

{{< multitabs id="xgroup-help-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions.

{{< /multitabs >}}
