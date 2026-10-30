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
linkTitle: LATENCY HELP
railroad_diagram: /images/railroad/latency-help.svg
since: 2.8.13
summary: Returns helpful text about the different subcommands.
syntax_fmt: LATENCY HELP
title: LATENCY HELP
---
The `LATENCY HELP` command returns a helpful text describing the different
subcommands.

For more information refer to the [Latency Monitoring Framework page](/content/operate/oss_and_stack/management/optimization/latency-monitor.md).

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="latency-help-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sub-commands and their descriptions.

{{< /multitabs >}}
