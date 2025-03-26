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
complexity: O(N) when path is evaluated to a single value, where N is the number of
  keys in the object, O(N) when path is evaluated to multiple values, where N is the
  size of the key
description: Returns the JSON keys of the object at path
group: json
hidden: false
linkTitle: JSON.OBJKEYS
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Returns the JSON keys of the object at path
syntax_fmt: JSON.OBJKEYS key [path]
syntax_str: '[path]'
title: JSON.OBJKEYS
---
Return the keys in the object that's referenced by `path`

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

JSON.OBJKEYS returns an array of array replies for each path, an array of the key names in the object as a bulk string reply, or `nil` if the matching JSON value is not an object. 
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).

## Examples

{{< highlight bash >}}
redis> JSON.SET doc $ '{"a":[3], "nested": {"a": {"b":2, "c": 1}}}'
OK
redis> JSON.OBJKEYS doc $..a
1) (nil)
2) 1) "b"
   2) "c"
{{< / highlight >}}

## See also

[`JSON.ARRINDEX`]({{< relref "commands/json.arrindex/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}})
