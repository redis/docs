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
  values, O(N) when path is evaluated to multiple values, where N is the size of the
  key
description: Clears all values from an array or an object and sets numeric values
  to `0`
group: json
hidden: false
linkTitle: JSON.CLEAR
module: JSON
since: 2.0.0
stack_path: docs/data-types/json
summary: Clears all values from an array or an object and sets numeric values to `0`
syntax_fmt: JSON.CLEAR key [path]
syntax_str: '[path]'
title: JSON.CLEAR
---
Clear container values (arrays/objects) and set numeric values to `0`

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to parse.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`. Nonexisting paths are ignored.
</details>

## Return

JSON.CLEAR returns an integer reply specifying the number of matching JSON arrays and objects cleared + number of matching JSON numerical values zeroed.
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).

{{% alert title="Note" color="warning" %}}
 
Already cleared values are ignored for empty containers and zero numbers.

{{% /alert %}}

## Examples

<details open>
<summary><b>Clear container values and set numeric values to <code>0</code></b></summary>

Create a JSON document.

{{< highlight bash >}}
redis> JSON.SET doc $ '{"obj":{"a":1, "b":2}, "arr":[1,2,3], "str": "foo", "bool": true, "int": 42, "float": 3.14}'
OK
{{< / highlight >}}

Clear all container values. This returns the number of objects with cleared values.

{{< highlight bash >}}
redis> JSON.CLEAR doc $.*
(integer) 4
{{< / highlight >}}

Get the updated document. Note that numeric values have been set to `0`.

{{< highlight bash >}}
redis> JSON.GET doc $
"[{\"obj\":{},\"arr\":[],\"str\":\"foo\",\"bool\":true,\"int\":0,\"float\":0}]"
{{< / highlight >}}
</details>

## See also

[`JSON.ARRINDEX`]({{< relref "commands/json.arrindex/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})

