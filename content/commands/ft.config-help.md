---
acl_categories:
- '@admin'
- '@search'
arguments:
- name: option
  type: string
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
- readonly
compatibility:
  software:
    general: unsupported
    flex: unsupported
  cloud:
    pro: unsupported
    essentials: unsupported
complexity: O(1)
description: Help description of runtime configuration options
group: search
hidden: true
linkTitle: FT.CONFIG HELP
module: Search
railroad_diagram: /images/railroad/ft.config-help.svg
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Help description of runtime configuration options
syntax_fmt: FT.CONFIG HELP option
title: FT.CONFIG HELP
---

Describe configuration options

[Examples](#examples)

## Required arguments

<details open>
<summary><code>option</code></summary> 

is name of the configuration option, or '*' for all. 
</details>

## Examples

<details open>
<summary><b>Get configuration details</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.CONFIG HELP TIMEOUT
1) 1) TIMEOUT
   2) Description
   3) Query (search) timeout
   4) Value
   5) "42"
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="ft-config-help-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array](/content/develop/reference/protocol-spec.md#arrays) of help information.

-tab-sep-

[Array](/content/develop/reference/protocol-spec.md#arrays) of help information.

{{< /multitabs >}}

## See also

[`FT.CONFIG SET`](/content/commands/ft.config-set.md) | [`FT.CONFIG GET`](/content/commands/ft.config-get.md) 

## Related topics

[RediSearch](/content/develop/ai/search-and-query/_index.md)