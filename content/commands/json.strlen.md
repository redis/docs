---
acl_categories:
- '@json'
- '@read'
- '@slow'
arguments:
- name: key
  type: key
- name: path
  optional: true
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
complexity: O(1) when path is evaluated to a single value, O(N) when path is evaluated
  to multiple values, where N is the size of the key
description: Returns the length of the JSON String at path in key
group: json
hidden: false
linkTitle: JSON.STRLEN
module: JSON
railroad_diagram: /images/railroad/json.strlen.svg
since: 1.0.0
stack_path: docs/data-types/json
summary: Returns the length of the JSON String at path in key
syntax_fmt: JSON.STRLEN key [path]
syntax_str: '[path]'
title: JSON.STRLEN
---
Report the length of the JSON String at `path` in `key`

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to parse.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`, if not provided. Returns null if the `key` or `path` do not exist.
</details>

## Examples

{{< highlight bash >}}
redis> JSON.SET doc $ '{"a":"foo", "nested": {"a": "hello"}, "nested2": {"a": 31}}'
OK
redis> JSON.STRLEN doc $..a
1) (integer) 3
2) (integer) 5
3) (nil)
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="json-strlen-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

With `$`-based path argument: [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the string's length, or `null` if the matching value is not a string.

With `.`-based path argument: [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the string's length, or [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not a string.

-tab-sep-

With `$`-based path argument (default): [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the string's length, or `null` if the matching value is not a string.

With `.`-based path argument: [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the string's length, or [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not a string.

{{< /multitabs >}}

## See also

[`JSON.ARRLEN`]({{< relref "commands/json.arrlen/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
