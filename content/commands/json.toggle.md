---
acl_categories:
- '@json'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- name: path
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
description: Toggles a boolean value
group: json
hidden: false
linkTitle: JSON.TOGGLE
module: JSON
since: 2.0.0
stack_path: docs/data-types/json
summary: Toggles a boolean value
syntax_fmt: JSON.TOGGLE key path
syntax_str: path
title: JSON.TOGGLE
---
Toggle a Boolean value stored at `path`

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to modify.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`. 

</details>

## Return

JSON.TOGGLE returns an array of integer replies for each path, the new value (`0` if `false` or `1` if `true`), or `nil` for JSON values matching the path that are not Boolean.
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).

## Examples

<details open>
<summary><b>Toggle a Boolean value stored at <code>path</code></b></summary>

Create a JSON document.

{{< highlight bash >}}
redis> JSON.SET doc $ '{"bool": true}'
OK
{{< / highlight >}}

Toggle the Boolean value.

{{< highlight bash >}}
redis> JSON.TOGGLE doc $.bool
1) (integer) 0
{{< / highlight >}}

Get the updated document.

{{< highlight bash >}}
redis> JSON.GET doc $
"[{\"bool\":false}]"
{{< / highlight >}}

Toggle the Boolean value.

{{< highlight bash >}}
redis> JSON.TOGGLE doc $.bool
1) (integer) 1
{{< / highlight >}}

Get the updated document.

{{< highlight bash >}}
redis> JSON.GET doc $
"[{\"bool\":true}]"
{{< / highlight >}}
</details>

## See also

[`JSON.SET`]({{< relref "commands/json.set/" >}}) | [`JSON.GET`]({{< relref "commands/json.get/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})

