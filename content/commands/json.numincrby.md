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
description: Increments the numeric value at path by a value
group: json
hidden: false
linkTitle: JSON.NUMINCRBY
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Increments the numeric value at path by a value
syntax_fmt: JSON.NUMINCRBY key path value
syntax_str: path value
title: JSON.NUMINCRBY
---
Increment the number value stored at `path` by `number`

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to modify.
</details>

<details open><summary><code>path</code></summary> 

is JSONPath to specify.
</details>

<details open><summary><code>value</code></summary> 

is number value to increment. 
</details>

## Return 

JSON.NUMINCRBY returns a bulk string reply specified as a stringified new value for each path, or `nil`, if the matching JSON value is not a number. 
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}). 

## Examples

<details open>
<summary><b>Increment number values</b></summary>

Create a document.

{{< highlight bash >}}
redis> JSON.SET doc . '{"a":"b","b":[{"a":2}, {"a":5}, {"a":"c"}]}'
OK
{{< / highlight >}}

Increment a value of `a` object by 2. The command fails to find a number and returns `null`.

{{< highlight bash >}}
redis> JSON.NUMINCRBY doc $.a 2
"[null]"
{{< / highlight >}}

Recursively find and increment a value of all `a` objects. The command increments numbers it finds and returns `null` for nonnumber values.

{{< highlight bash >}}
redis> JSON.NUMINCRBY doc $..a 2
"[null,4,7,null]"
{{< / highlight >}}

</details>

## See also

[`JSON.ARRINDEX`]({{< relref "commands/json.arrindex/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}})
