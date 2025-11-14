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

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="json-numincrby-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

With `$`-based path argument: [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) containing a JSON-encoded string with the new value(s), or [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not a number.

With `.`-based path argument: [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) representing the stringified new value, [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not a number, or [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) on error.

-tab-sep-

With `$`-based path argument (default): [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) or [null replies]({{< relref "/develop/reference/protocol-spec#nulls" >}}), where each element is the new value, or `null` if the matching value is not a number, or [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) on error.

With `.`-based path argument: [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) representing the stringified new value, [null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the matching value is not a number, or [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) on error.

{{< /multitabs >}}

## See also

[`JSON.ARRINDEX`]({{< relref "commands/json.arrindex/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
