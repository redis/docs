---
acl_categories:
- '@json'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- arguments:
  - name: path
    type: string
  - name: index
    optional: true
    type: integer
  name: path
  optional: true
  type: block
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
complexity: O(N) when path is evaluated to a single value where N is the size of the
  array and the specified index is not the last element, O(1) when path is evaluated
  to a single value and the specified index is the last element, or O(N) when path
  is evaluated to multiple values, where N is the size of the key
description: Removes and returns the element at the specified index in the array at
  path
group: json
hidden: false
linkTitle: JSON.ARRPOP
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Removes and returns the element at the specified index in the array at path
syntax_fmt: JSON.ARRPOP key [path [index]]
syntax_str: '[path [index]]'
title: JSON.ARRPOP
---
Remove and return an element from the index in the array

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to modify.
</details>

<details open><summary><code>index</code></summary> 

is position in the array to start popping from. Default is `-1`, meaning the last element. Out-of-range indexes round to their respective array ends. Popping an empty array returns null.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`.
</details>

## Examples

<details open>
<summary><b>Pop a value from an index and insert a new value</b></summary>

Create two headphone products with maximum sound levels.

{{< highlight bash >}}
redis> JSON.SET key $ '[{"name":"Healthy headphones","description":"Wireless Bluetooth headphones with noise-cancelling technology","connection":{"wireless":true,"type":"Bluetooth"},"price":99.98,"stock":25,"colors":["black","silver"],"max_level":[60,70,80]},{"name":"Noisy headphones","description":"Wireless Bluetooth headphones with noise-cancelling technology","connection":{"wireless":true,"type":"Bluetooth"},"price":99.98,"stock":25,"colors":["black","silver"],"max_level":[80,90,100,120]}]'
OK
{{< / highlight >}}

Get all maximum values for the second product.

{{< highlight bash >}}
redis> JSON.GET key $.[1].max_level
"[[80,90,100,120]]"
{{< / highlight >}}

Update the `max_level` field of the product: remove an unavailable value and add a newly available value.

{{< highlight bash >}}
redis> JSON.ARRPOP key $.[1].max_level 0
1) "80"
{{< / highlight >}}

Get the updated array.

{{< highlight bash >}}
redis> JSON.GET key $.[1].max_level
"[[90,100,120]]"
{{< / highlight >}}

Now insert a new lowest value.

{{< highlight bash >}}
redis> JSON.ARRINSERT key $.[1].max_level 0 85
1) (integer) 4
{{< / highlight >}}

Get the updated array.

{{< highlight bash >}}
redis> JSON.GET key $.[1].max_level
"[[85,90,100,120]]"
{{< / highlight >}}
</details>

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="json-arrpop-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the popped JSON value as a string, or `null` if the matching value is not an array.

-tab-sep-

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the popped JSON value as a string, or `null` if the matching value is not an array.

{{< /multitabs >}}

## See also

[`JSON.ARRAPPEND`]({{< relref "commands/json.arrappend/" >}}) | [`JSON.ARRINDEX`]({{< relref "commands/json.arrindex/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
