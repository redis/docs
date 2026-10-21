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
railroad_diagram: /images/railroad/json.numincrby.svg
since: 1.0.0
stack_path: docs/data-types/json
summary: Increments the numeric value at path by a value
syntax_fmt: JSON.NUMINCRBY key path value
title: JSON.NUMINCRBY
---
Increment the number value stored at `path` by `value`

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

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="json-numincrby-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

With `$`-based path argument: [Bulk string reply](/content/develop/reference/protocol-spec.md#bulk-strings) containing a JSON array with one element per matching path: the new value, or `null` if the matching value is not a number. The array is empty if no path matches.

With `.`-based path argument: [Bulk string reply](/content/develop/reference/protocol-spec.md#bulk-strings) representing the stringified new value. If the path matches more than one number, the command updates all of them and returns the last new value. [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) if no matching value is a number.

With either path argument: [simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) if the key doesn't exist or the result is out of range.

-tab-sep-

The path syntax doesn't change the reply. [Array reply](/content/develop/reference/protocol-spec.md#arrays) with one element per matching path: an [integer reply](/content/develop/reference/protocol-spec.md#integers) or [double reply](/content/develop/reference/protocol-spec.md#doubles) containing the new value, or a [null reply](/content/develop/reference/protocol-spec.md#nulls) if the matching value is not a number. The array is empty if no path matches.

[Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) if the key doesn't exist or the result is out of range.

{{< /multitabs >}}

## See also

[`JSON.ARRINDEX`](/content/commands/json.arrindex.md) | [`JSON.ARRINSERT`](/content/commands/json.arrinsert.md) 

## Related topics

* [RedisJSON](/content/develop/data-types/json/_index.md)
* [Index and search JSON documents](/content/develop/ai/search-and-query/indexing/_index.md)
