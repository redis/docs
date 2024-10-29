---
arguments:
- name: key
  type: key
- name: path
  type: string
- name: start
  type: integer
- name: stop
  type: integer
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
complexity: O(N) when path is evaluated to a single value where N is the size of the
  array, O(N) when path is evaluated to multiple values, where N is the size of the
  key
description: Trims the array at path to contain only the specified inclusive range
  of indices from start to stop
group: json
hidden: false
linkTitle: JSON.ARRTRIM
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Trims the array at path to contain only the specified inclusive range of
  indices from start to stop
syntax_fmt: JSON.ARRTRIM key path start stop
syntax_str: path start stop
title: JSON.ARRTRIM
---
Trim an array so that it contains only the specified inclusive range of elements

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to modify.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`.
</details>

<details open><summary><code>start</code></summary> 

is index of the first element to keep (previous elements are trimmed). Default is 0. 
</details>

<details open><summary><code>stop</code></summary> 

is the index of the last element to keep (following elements are trimmed), including the last element. Default is 0. Negative values are interpreted as starting from the end.
</details>

{{% alert title="About out-of-range indexes" color="warning" %}}

JSON.ARRTRIM is extremely forgiving, and using it with out-of-range indexes does not produce an error. Note a few differences between how RedisJSON v2.0 and legacy versions handle out-of-range indexes.

Behavior as of RedisJSON v2.0:

* If `start` is larger than the array's size or `start` > `stop`, returns 0 and an empty array. 
* If `start` is < 0, then start from the end of the array.
* If `stop` is larger than the end of the array, it is treated like the last element.
{{% /alert %}}

## Return

JSON.ARRTRIM returns an array of integer replies for each path, the array's new size, or `nil`, if the matching JSON value is not an array.
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}). 

## Examples

<details open>
<summary><b>Trim an array to a specific set of values</b></summary>

Create two headphone products with maximum sound levels.

{{< highlight bash >}}
redis> JSON.SET key $
"[[{\"name\":\"Healthy headphones\",\"description\":\"Wireless Bluetooth headphones with noise-cancelling technology\",\"connection\":{\"wireless\":true,\"type\":\"Bluetooth\"},\"price\":99.98,\"stock\":25,\"colors\":[\"black\",\"silver\"],\"max_level\":[60,70,80]},{\"name\":\"Noisy headphones\",\"description\":\"Wireless Bluetooth headphones with noise-cancelling technology\",\"connection\":{\"wireless\":true,\"type\":\"Bluetooth\"},\"price\":99.98,\"stock\":25,\"colors\":[\"black\",\"silver\"],\"max_level\":[85,90,100,120]}]]"
OK
{{< / highlight >}}

Add new sound level values to the second product.

{{< highlight bash >}}
redis> JSON.ARRAPPEND key $.[1].max_level 140 160 180 200 220 240 260 280
1) (integer) 12
{{< / highlight >}}

Get the updated array.

{{< highlight bash >}}
redis> JSON.GET key $.[1].max_level
"[[85,90,100,120,140,160,180,200,220,240,260,280]]"
{{< / highlight >}}

Keep only the values between the fifth and the ninth element, inclusive of that last element.

{{< highlight bash >}}
redis> JSON.ARRTRIM key $.[1].max_level 4 8
1) (integer) 5
{{< / highlight >}}

Get the updated array.

{{< highlight bash >}}
redis> JSON.GET key $.[1].max_level
"[[140,160,180,200,220]]"
{{< / highlight >}}
</details>

## See also

[`JSON.ARRINDEX`]({{< baseurl >}}/commands/json.arrindex/) | [`JSON.ARRINSERT`]({{< baseurl >}}/commands/json.arrinsert/) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}})

