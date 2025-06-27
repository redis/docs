---
acl_categories:
- '@json'
- '@write'
- '@slow'
arguments:
- arguments:
  - name: key
    type: key
  - name: path
    type: string
  - name: value
    type: string
  multiple: true
  name: triplet
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
complexity: O(K*(M+N)) where k is the number of keys in the command, when path is
  evaluated to a single value where M is the size of the original value (if it exists)
  and N is the size of the new value, or O(K*(M+N)) when path is evaluated to multiple
  values where M is the size of the key and N is the size of the new value * the number
  of original values in the key
description: Sets or updates the JSON value of one or more keys
group: json
hidden: false
linkTitle: JSON.MSET
module: JSON
since: 2.6.0
stack_path: docs/data-types/json
summary: Sets or updates the JSON value of one or more keys
syntax_fmt: JSON.MSET key path value [key path value ...]
syntax_str: ''
title: JSON.MSET
---
Set or update one or more JSON values according to the specified `key`-`path`-`value` triplets

`JSON.MSET` is atomic, hence, all given additions or updates are either applied or not. It is not possible for clients to see that some of the keys were updated while others are unchanged.

A JSON value is a hierarchical structure. If you change a value in a specific path - nested values are affected.

{{% warning %}}
When cluster mode is enabled, all specified keys must reside on the same [hash slot](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/#key-distribution-model).
{{% /warning %}}

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary>

is key to modify.
</details>

<details open><summary><code>path</code></summary>

is JSONPath to specify. For new Redis keys the `path` must be the root. For existing keys, when the entire `path` exists, the value that it contains is replaced with the `json` value. For existing keys, when the `path` exists, except for the last element, a new child is added with the `json` value.

</details>

<details open><summary><code>value</code></summary>

is value to set at the specified path
</details>

## Return value

JSET.MSET returns a simple string reply: `OK` if executed correctly or `error` if fails to set the new values

For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).

## Examples

<details open>
<summary><b>Add a new values in multiple keys</b></summary>

{{< highlight bash >}}
redis> JSON.MSET doc1 $ '{"a":1}' doc2 $ '{"f":{"a":2}}' doc3 $ '{"f1":{"a":0},"f2":{"a":0}}'
OK
redis> JSON.MSET doc1 $ '{"a":2}' doc2 $.f.a '3' doc3 $ '{"f1":{"a":1},"f2":{"a":2}}'
OK
redis> JSON.GET doc1 $
"[{\"a\":2}]"
redis> JSON.GET doc2 $
"[{\"f\":{\"a\":3}}]"
redis> JSON.GET doc3
"{\"f1\":{\"a\":1},\"f2\":{\"a\":2}}"
{{< / highlight >}}
</details>

## See also

[`JSON.SET`]({{< relref "commands/json.set/" >}}) | [`JSON.MGET`]({{< relref "commands/json.mget/" >}}) | [`JSON.GET`]({{< relref "commands/json.get/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
