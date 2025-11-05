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
description: Toggles a boolean value
group: json
hidden: false
linkTitle: JSON.TOGGLE
module: JSON
since: 2.0.0
stack_path: docs/data-types/json
summary: Toggles a boolean value
syntax_fmt: JSON.TOGGLE key path
syntax_str: path
title: JSON.TOGGLE
---
Toggle a Boolean value stored at `path`

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to modify.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`. 

</details>

## Examples

<details open>
<summary><b>Toggle a Boolean value stored at <code>path</code></b></summary>

Create a JSON document.

{{< highlight bash >}}
redis> JSON.SET doc $ '{"bool": true}'
OK
{{< / highlight >}}

Toggle the Boolean value.

{{< highlight bash >}}
redis> JSON.TOGGLE doc $.bool
1) (integer) 0
{{< / highlight >}}

Get the updated document.

{{< highlight bash >}}
redis> JSON.GET doc $
"[{\"bool\":false}]"
{{< / highlight >}}

Toggle the Boolean value.

{{< highlight bash >}}
redis> JSON.TOGGLE doc $.bool
1) (integer) 1
{{< / highlight >}}

Get the updated document.

{{< highlight bash >}}
redis> JSON.GET doc $
"[{\"bool\":true}]"
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="json-toggle-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

With `$`-based path argument: [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the new value (`0` if `false` or `1` if `true`), or `null` if the matching value is not Boolean.

With `.`-based path argument: [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the new value (`0` if `false` or `1` if `true`), or [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not Boolean.

-tab-sep-

With `$`-based path argument (default): [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the new value (`0` if `false` or `1` if `true`), or `null` if the matching value is not Boolean.

With `.`-based path argument: [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the new value (`0` if `false` or `1` if `true`), or [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not Boolean.

{{< /multitabs >}}

## See also

[`JSON.SET`]({{< relref "commands/json.set/" >}}) | [`JSON.GET`]({{< relref "commands/json.get/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})

