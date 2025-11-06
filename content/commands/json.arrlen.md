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
complexity: O(1) where path is evaluated to a single value, O(N) where path is evaluated
  to multiple values, where N is the size of the key
description: Returns the length of the array at path
group: json
hidden: false
linkTitle: JSON.ARRLEN
module: JSON
railroad_diagram: /images/railroad/json.arrlen.svg
since: 1.0.0
stack_path: docs/data-types/json
summary: Returns the length of the array at path
syntax_fmt: JSON.ARRLEN key [path]
syntax_str: '[path]'
title: JSON.ARRLEN
---
Report the length of the JSON array at `path` in `key`

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

<details open>
<summary><b>Get lengths of JSON arrays in a document</b></summary>

Create a document for wireless earbuds.

{{< highlight bash >}}
redis> JSON.SET item:2 $ '{"name":"Wireless earbuds","description":"Wireless Bluetooth in-ear headphones","connection":{"wireless":true,"type":"Bluetooth"},"price":64.99,"stock":17,"colors":["black","white"], "max_level":[80, 100, 120]}'
OK
{{< / highlight >}}

Find lengths of arrays in all objects of the document.

{{< highlight bash >}}
redis> JSON.ARRLEN item:2 '$.[*]'
1) (nil)
2) (nil)
3) (nil)
4) (nil)
5) (nil)
6) (integer) 2
7) (integer) 3
{{< / highlight >}}

Return the length of the `max_level` array.

{{< highlight bash >}}
redis> JSON.ARRLEN item:2 '$..max_level'
1) (integer) 3
{{< / highlight >}}

Get all the maximum level values.

{{< highlight bash >}}
redis> JSON.GET item:2 '$..max_level'
"[[80,100,120]]"
{{< / highlight >}}

</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="json-arrlen-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

With `$`-based path argument: [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the array length, or `null` if the matching value is not an array.

With `.`-based path argument: [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the array length, or [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not an array.

-tab-sep-

With `$`-based path argument (default): [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the array length, or `null` if the matching value is not an array.

With `.`-based path argument: [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the array length, or [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not an array.

{{< /multitabs >}}

## See also

[`JSON.ARRINDEX`]({{< relref "commands/json.arrindex/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
