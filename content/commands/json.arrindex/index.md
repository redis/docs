---
acl_categories:
- '@json'
- '@read'
- '@slow'
arguments:
- name: key
  type: key
- name: path
  type: string
- name: value
  type: string
- arguments:
  - name: start
    type: integer
  - name: stop
    optional: true
    type: integer
  name: range
  optional: true
  type: block
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
description: Returns the index of the first occurrence of a JSON scalar value in the
  array at path
group: json
hidden: false
linkTitle: JSON.ARRINDEX
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Returns the index of the first occurrence of a JSON scalar value in the array
  at path
syntax_fmt: JSON.ARRINDEX key path value [start [stop]]
syntax_str: path value [start [stop]]
title: JSON.ARRINDEX
---
Search for the first occurrence of a JSON value in an array

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to parse.
</details>

<details open><summary><code>path</code></summary> 

is JSONPath to specify.
</details>

<details open><summary><code>value</code></summary> 

is value to find its index in one or more arrays. 

{{% alert title="About using strings with JSON commands" color="warning" %}}
To specify a string as an array value to index, wrap the quoted string with an additional set of single quotes. Example: `'"silver"'`. For more detailed use, see [Examples](#examples).
{{% /alert %}}
</details>

## Optional arguments

<details open><summary><code>start</code></summary> 

is inclusive start value to specify in a slice of the array to search. Default is `0`. 
</details>


<details open><summary><code>stop</code></summary> 

is exclusive stop value to specify in a slice of the array to search, including the last element. Default is `0`. Negative values are interpreted as starting from the end.
</details>

{{% alert title="About out-of-range indexes" color="warning" %}}

Out-of-range indexes round to the array's start and end. An inverse index range (such as the range from 1 to 0) returns unfound or `-1`.
{{% /alert %}}

## Return value 

`JSON.ARRINDEX` returns an [array]({{< baseurl >}}/develop/reference/protocol-spec#resp-arrays) of integer replies for each path, the first position in the array of each JSON value that matches the path, `-1` if unfound in the array, or `nil`, if the matching JSON value is not an array.
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}). 

## Examples

<details open>
<summary><b>Find the specific place of a color in a list of product colors</b></summary>

Create a document for noise-cancelling headphones in black and silver colors.

{{< highlight bash >}}
redis> JSON.SET item:1 $ '{"name":"Noise-cancelling Bluetooth headphones","description":"Wireless Bluetooth headphones with noise-cancelling technology","connection":{"wireless":true,"type":"Bluetooth"},"price":99.98,"stock":25,"colors":["black","silver"]}'
OK
{{< / highlight >}}

Add color `blue` to the end of the `colors` array. `JSON.ARRAPEND` returns the array's new size.

{{< highlight bash >}}
redis> JSON.ARRAPPEND item:1 $.colors '"blue"'
1) (integer) 3
{{< / highlight >}}

Return the new length of the `colors` array.

{{< highlight bash >}}
redis> JSON.GET item:1
"{\"name\":\"Noise-cancelling Bluetooth headphones\",\"description\":\"Wireless Bluetooth headphones with noise-cancelling technology\",\"connection\":{\"wireless\":true,\"type\":\"Bluetooth\"},\"price\":99.98,\"stock\":25,\"colors\":[\"black\",\"silver\",\"blue\"]}"
{{< / highlight >}}

Get the list of colors for the product.

{{< highlight bash >}}
redis> JSON.GET item:1 '$.colors[*]'
"[\"black\",\"silver\",\"blue\"]"
{{< / highlight >}}

Insert two more colors after the second color. You now have five colors.

{{< highlight bash >}}
redis> JSON.ARRINSERT item:1 $.colors 2 '"yellow"' '"gold"'
1) (integer) 5
{{< / highlight >}}

Get the updated list of colors.

{{< highlight bash >}}
redis> JSON.GET item:1 $.colors
"[[\"black\",\"silver\",\"yellow\",\"gold\",\"blue\"]]"
{{< / highlight >}}

Find the place where color `silver` is located.

{{< highlight bash >}}
redis> JSON.ARRINDEX item:1 $..colors '"silver"'
1) (integer) 1
{{< / highlight >}}
</details>

## See also

[`JSON.ARRAPPEND`]({{< baseurl >}}/commands/json.arrappend/) | [`JSON.ARRINSERT`]({{< baseurl >}}/commands/json.arrinsert/) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}})

