---
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
complexity: O(N) when path is evaluated to a single value, where N is the size of
  the value, O(N) when path is evaluated to multiple values, where N is the size of
  the key
description: Reports the size in bytes of a key
group: json
hidden: false
linkTitle: JSON.DEBUG MEMORY
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Reports the size in bytes of a key
syntax_fmt: JSON.DEBUG MEMORY key [path]
syntax_str: '[path]'
title: JSON.DEBUG MEMORY
---
Report a value's memory usage in bytes 

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to parse.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`. 
</details>

## Return

JSON.DEBUG MEMORY returns an integer reply specified as the value size in bytes.
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).

## Examples

<details open>
<summary><b>Report a value's memory usage in bytes</b></summary>

Create a JSON document.

{{< highlight bash >}}
redis> JSON.SET item:2 $ '{"name":"Wireless earbuds","description":"Wireless Bluetooth in-ear headphones","connection":{"wireless":true,"type":"Bluetooth"},"price":64.99,"stock":17,"colors":["black","white"], "max_level":[80, 100, 120]}'
OK
{{< / highlight >}}

Get the values' memory usage in bytes.

{{< highlight bash >}}
redis> JSON.DEBUG MEMORY item:2
(integer) 253
{{< / highlight >}}
</details>

## See also

[`JSON.SET`]({{< relref "commands/json.set/" >}}) | [`JSON.ARRLEN`]({{< relref "commands/json.arrlen/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}})

