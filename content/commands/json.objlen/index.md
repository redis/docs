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
complexity: O(1) when path is evaluated to a single value, O(N) when path is evaluated
  to multiple values, where N is the size of the key
description: Returns the number of keys of the object at path
group: json
hidden: false
linkTitle: JSON.OBJLEN
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Returns the number of keys of the object at path
syntax_fmt: JSON.OBJLEN key [path]
syntax_str: '[path]'
title: JSON.OBJLEN
---
Report the number of keys in the JSON object at `path` in `key`

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to parse. Returns `null` for nonexistent keys.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`. Returns `null` for nonexistant path.

</details>

## Return

JSON.OBJLEN returns an array of integer replies for each path specified as the number of keys in the object or `nil`, if the matching JSON value is not an object.
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).

## Examples

{{< highlight bash >}}
redis> JSON.SET doc $ '{"a":[3], "nested": {"a": {"b":2, "c": 1}}}'
OK
redis> JSON.OBJLEN doc $..a
1) (nil)
2) (integer) 2
{{< / highlight >}}

## See also

[`JSON.ARRINDEX`]({{< relref "commands/json.arrindex/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}})
