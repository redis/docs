---
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
- LOADING
- STALE
complexity: O(1)
container: HOTKEYS
description: Returns helpful text about HOTKEYS commands and parameters.
function: hotkeysCommand
group: server
hidden: false
linkTitle: HOTKEYS HELP
reply_schema:
  description: Helpful text about subcommands.
  items:
    type: string
  type: array
since: 8.6.1
summary: Returns helpful text about HOTKEYS commands and parameters.
syntax_fmt: HOTKEYS HELP
title: HOTKEYS HELP
---

Returns helpful text about `HOTKEYS` commands and parameters.

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

Returns an [array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with the list of `HOTKEYS` subcommands and their descriptions.

-tab-sep-

Returns an [array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with the list of `HOTKEYS` subcommands and their descriptions.

{{< /multitabs >}}
