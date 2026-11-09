---
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
compatibility:
  software:
    general: supported
  cloud:
    pro: supported
    essentials: supported
complexity: N/A
description: Shows helpful information
group: json
hidden: true
linkTitle: JSON.DEBUG HELP
module: JSON
railroad_diagram: /images/railroad/json.debug-help.svg
since: 1.0.0
stack_path: docs/data-types/json
summary: Shows helpful information
syntax_fmt: JSON.DEBUG HELP
title: JSON.DEBUG HELP
---
Return helpful information about the [`JSON.DEBUG`](/content/commands/json.debug.md) command

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="json-debug-help-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](/content/develop/reference/protocol-spec.md#arrays) of [bulk string replies](/content/develop/reference/protocol-spec.md#bulk-strings) containing helpful messages about the JSON.DEBUG command.

-tab-sep-

[Array reply](/content/develop/reference/protocol-spec.md#arrays) of [bulk string replies](/content/develop/reference/protocol-spec.md#bulk-strings) containing helpful messages about the JSON.DEBUG command.

{{< /multitabs >}}

## See also

[`JSON.DEBUG`](/content/commands/json.debug.md) 

## Related topics

* [RedisJSON](/content/develop/data-types/json/_index.md)
* [Index and search JSON documents](/content/develop/ai/search-and-query/indexing/_index.md)
