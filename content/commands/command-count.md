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
description: Returns a count of commands.
group: server
hidden: false
linkTitle: COMMAND COUNT
railroad_diagram: /images/railroad/command-count.svg
since: 2.8.13
summary: Returns a count of commands.
syntax_fmt: COMMAND COUNT
syntax_str: ''
title: COMMAND COUNT
---
Returns [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) of number of total commands in this Redis server.

## Examples

{{% redis-cli %}}
COMMAND COUNT
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="command-count-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of commands returned by `COMMAND`.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of commands returned by `COMMAND`.

{{< /multitabs >}}
