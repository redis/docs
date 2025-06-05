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
complexity: O(1) when path is evaluated to a single value, O(N) when path is evaluated
  to multiple values, where N is the size of the key
description: Returns the length of the JSON String at path in key
group: json
hidden: false
linkTitle: JSON.STRLEN
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Returns the length of the JSON String at path in key
syntax_fmt: JSON.STRLEN key [path]
syntax_str: '[path]'
title: JSON.STRLEN
---
Report the length of the JSON String at `path` in `key`

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

JSON.STRLEN returns by recursive descent an array of integer replies for each path, the string's length, or `nil`, if the matching JSON value is not a string.
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}). 

## Examples

{{< highlight bash >}}
redis> JSON.SET doc $ '{"a":"foo", "nested": {"a": "hello"}, "nested2": {"a": 31}}'
OK
redis> JSON.STRLEN doc $..a
1) (integer) 3
2) (integer) 5
3) (nil)
{{< / highlight >}}

## See also

[`JSON.ARRLEN`]({{< relref "commands/json.arrlen/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}})
