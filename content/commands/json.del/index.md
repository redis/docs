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
  deleted value, O(N) when path is evaluated to multiple values, where N is the size
  of the key
description: Deletes a value
group: json
hidden: false
linkTitle: JSON.DEL
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Deletes a value
syntax_fmt: JSON.DEL key [path]
syntax_str: '[path]'
title: JSON.DEL
---
Delete a value

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to modify.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`. Nonexisting paths are ignored.

{{% alert title="Note" color="warning" %}}
 
Deleting an object's root is equivalent to deleting the key from Redis.

{{% /alert %}}
</details>

## Return

JSON.DEL returns an integer reply specified as the number of paths deleted (0 or more).
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).

## Examples

<details open>
<summary><b>Delete a value</b></summary>

Create a JSON document.

{{< highlight bash >}}
redis> JSON.SET doc $ '{"a": 1, "nested": {"a": 2, "b": 3}}'
OK
{{< / highlight >}}

Delete specified values.

{{< highlight bash >}}
redis> JSON.DEL doc $..a
(integer) 2
{{< / highlight >}}

Get the updated document.

{{< highlight bash >}}
redis> JSON.GET doc $
"[{\"nested\":{\"b\":3}}]"
{{< / highlight >}}
</details>

## See also

[`JSON.SET`]({{< relref "commands/json.set/" >}}) | [`JSON.ARRLEN`]({{< relref "commands/json.arrlen/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}})



