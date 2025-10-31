---
acl_categories:
- '@json'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- name: path
  optional: true
  type: string
- multiple: true
  name: value
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
description: Append one or more JSON values into the array at path after the last
  element in it.
group: json
hidden: false
linkTitle: JSON.ARRAPPEND
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Append one or more JSON values into the array at path after the last element
  in it.
syntax_fmt: JSON.ARRAPPEND key path value [value ...]
syntax_str: 'path value [value ...]'
title: JSON.ARRAPPEND
---
Append the JSON values into the array at `path` after the last element in it.

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is the key to modify.
</details>

<details open><summary><code>path</code></summary>

is the JSONPath to specify.
</details>

<details open><summary><code>value</code></summary> 

is one or more values to append to one or more arrays. 

{{% alert title="About using strings with JSON commands" color="warning" %}}
To specify a string as an array value to append, wrap the quoted string with an additional set of single quotes. Example: `'"silver"'`. For more detailed use, see [Examples](#examples).
{{% /alert %}}
</details>

## Examples

<details open>
<summary><b>Add a new color to a list of product colors</b></summary>

Create a document for noise-cancelling headphones in black and silver colors.

{{< highlight bash >}}
redis> JSON.SET item:1 $ '{"name":"Noise-cancelling Bluetooth headphones","description":"Wireless Bluetooth headphones with noise-cancelling technology","connection":{"wireless":true,"type":"Bluetooth"},"price":99.98,"stock":25,"colors":["black","silver"]}'
OK
{{< / highlight >}}

Add `blue` to the end of the `colors` array. `JSON.ARRAPPEND` returns the new length of the `colors` array.

{{< highlight bash >}}
redis> JSON.ARRAPPEND item:1 $.colors '"blue"'
1) (integer) 3
{{< / highlight >}}

Get the updated value of the `colors` array.

{{< highlight bash >}}
redis> JSON.GET item:1 $.colors
"[[\"black\",\"silver\",\"blue\"]]"
{{< / highlight >}}

</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="json-arrappend-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

With `$`-based path argument: [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the array's new length, or `null` if the matching value is not an array.

With `.`-based path argument: [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the array's new length, or [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not an array.

-tab-sep-

With `$`-based path argument (default): [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the array's new length, or `null` if the matching value is not an array.

With `.`-based path argument: [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the array's new length, or [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not an array.

{{< /multitabs >}}

## See also

[`JSON.ARRINDEX`]({{< relref "commands/json.arrindex/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
