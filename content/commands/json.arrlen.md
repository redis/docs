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

## Return

`JSON.ARRLEN` returns an [array]({{< relref "develop/reference/protocol-spec#resp-arrays" >}}) of integer replies, an integer for each matching value, each is the array's length, or `nil`, if the matching value is not an array.
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}). 

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

## See also

[`JSON.ARRINDEX`]({{< relref "commands/json.arrindex/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
