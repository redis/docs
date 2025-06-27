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
complexity: O(1)
description: Help description of runtime configuration options
group: search
hidden: true
linkTitle: FT.CONFIG HELP
module: Search
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Help description of runtime configuration options
syntax: 'FT.CONFIG HELP option

  '
syntax_fmt: FT.CONFIG HELP option
syntax_str: ''
title: FT.CONFIG HELP
---

Describe configuration options

[Examples](#examples)

## Required arguments

<details open>
<summary><code>option</code></summary> 

is name of the configuration option, or '*' for all. 
</details>

## Return

FT.CONFIG HELP returns an array reply of the configuration name and value.

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

## See also

[`FT.CONFIG SET`]({{< relref "commands/ft.config-set/" >}}) | [`FT.CONFIG GET`]({{< relref "commands/ft.config-get/" >}}) 

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})