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
railroad_diagram: /images/railroad/json.mget.svg
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

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="json-mget-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the JSON serialization of the value at the corresponding key's path, or `null` if the key or path doesn't exist.

-tab-sep-

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the JSON serialization of the value at the corresponding key's path, or `null` if the key or path doesn't exist.

{{< /multitabs >}}

## See also

[`JSON.SET`]({{< relref "commands/json.set/" >}}) | [`JSON.GET`]({{< relref "commands/json.get/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
