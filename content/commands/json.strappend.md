---
acl_categories:
- '@json'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- name: path
  optional: true
  type: string
- name: value
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
description: Appends a string to a JSON string value at path
group: json
hidden: false
linkTitle: JSON.STRAPPEND
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Appends a string to a JSON string value at path
syntax_fmt: JSON.STRAPPEND key [path] value
syntax_str: '[path] value'
title: JSON.STRAPPEND
---
Append the `json-string` values to the string at `path`

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to modify.
</details>

<details open><summary><code>value</code></summary> 

is value to append to one or more strings. 

{{% alert title="About using strings with JSON commands" color="warning" %}}
To specify a string as an array value to append, wrap the quoted string with an additional set of single quotes. Example: `'"silver"'`. For more detailed use, see [Examples](#examples).
{{% /alert %}}
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`.
</details>

## Examples

{{< highlight bash >}}
redis> JSON.SET doc $ '{"a":"foo", "nested": {"a": "hello"}, "nested2": {"a": 31}}'
OK
redis> JSON.STRAPPEND doc $..a '"baz"'
1) (integer) 6
2) (integer) 8
3) (nil)
redis> JSON.GET doc $
"[{\"a\":\"foobaz\",\"nested\":{\"a\":\"hellobaz\"},\"nested2\":{\"a\":31}}]"
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="json-strappend-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

With `$`-based path argument: [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the string's new length, or `null` if the matching value is not a string.

With `.`-based path argument: [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the string's new length, or [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not a string.

-tab-sep-

With `$`-based path argument (default): [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the string's new length, or `null` if the matching value is not a string.

With `.`-based path argument: [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the string's new length, or [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not a string.

{{< /multitabs >}}

## See also

`JSON.ARRAPEND` | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})

