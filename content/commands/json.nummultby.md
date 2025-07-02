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
- name: value
  type: double
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
deprecated_since: '2.0'
description: Multiplies the numeric value at path by a value
group: json
hidden: false
linkTitle: JSON.NUMMULTBY
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Multiplies the numeric value at path by a value
syntax_fmt: JSON.NUMMULTBY key path value
syntax_str: path value
title: JSON.NUMMULTBY
---
Multiply the number value stored at `path` by `number`

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to modify.
</details>

<details open><summary><code>value</code></summary> 

is number value to multiply. 
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`.
</details>

## Return

JSON.NUMMULTBY returns a bulk string reply specified as a stringified new values for each path, or `nil` element if the matching JSON value is not a number.
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).

## Examples

{{< highlight bash >}}
redis> JSON.SET doc . '{"a":"b","b":[{"a":2}, {"a":5}, {"a":"c"}]}'
OK
redis> JSON.NUMMULTBY doc $.a 2
"[null]"
redis> JSON.NUMMULTBY doc $..a 2
"[null,4,10,null]"
{{< / highlight >}}

## See also

[`JSON.NUMINCRBY`]({{< relref "commands/json.numincrby/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
