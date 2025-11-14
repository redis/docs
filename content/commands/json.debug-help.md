---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
complexity: N/A
description: Shows helpful information
group: json
hidden: true
linkTitle: JSON.DEBUG HELP
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Shows helpful information
syntax_fmt: JSON.DEBUG HELP
syntax_str: ''
title: JSON.DEBUG HELP
---
Return helpful information about the [`JSON.DEBUG`]({{< relref "commands/json.debug/" >}}) command

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="json-debug-help-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) containing helpful messages about the JSON.DEBUG command.

-tab-sep-

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) containing helpful messages about the JSON.DEBUG command.

{{< /multitabs >}}

## See also

[`JSON.DEBUG`]({{< relref "commands/json.debug/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
