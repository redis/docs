---
acl_categories:
- '@json'
- '@read'
- '@slow'
arguments:
- multiple: true
  name: key
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
complexity: O(M*N) when path is evaluated to a single value where M is the number
  of keys and N is the size of the value, O(N1+N2+...+Nm) when path is evaluated to
  multiple values where m is the number of keys and Ni is the size of the i-th key
description: Returns the values at a path from one or more keys
group: json
hidden: false
linkTitle: JSON.MGET
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Returns the values at a path from one or more keys
syntax_fmt: JSON.MGET key [key ...] path
syntax_str: path
title: JSON.MGET
---
Return the values at `path` from multiple `key` arguments

{{% warning %}}
When cluster mode is enabled, all specified keys must reside on the same [hash slot](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/#key-distribution-model).

When the database has more than one shard, and the specified keys reside in different shards, Redis will not report a CROSSSLOT error (to avoid breaking changes) and the results may be partial.


{{% /warning %}}

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to parse. Returns `null` for nonexistent keys.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Returns `null` for nonexistent paths.

</details>

## Return

JSON.MGET returns an array of bulk string replies specified as the JSON serialization of the value at each key's path.
For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).

## Examples

<details open>
<summary><b>Return the values at <code>path</code> from multiple <code>key</code> arguments</b></summary>

Create two JSON documents.

{{< highlight bash >}}
redis> JSON.SET doc1 $ '{"a":1, "b": 2, "nested": {"a": 3}, "c": null}'
OK
redis> JSON.SET doc2 $ '{"a":4, "b": 5, "nested": {"a": 6}, "c": null}'
OK
{{< / highlight >}}

Get values from all arguments in the documents.

{{< highlight bash >}}
redis> JSON.MGET doc1 doc2 $..a
1) "[1,3]"
2) "[4,6]"
{{< / highlight >}}
</details>

## See also

[`JSON.SET`]({{< relref "commands/json.set/" >}}) | [`JSON.GET`]({{< relref "commands/json.get/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}})
