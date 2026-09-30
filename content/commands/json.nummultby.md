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
railroad_diagram: /images/railroad/json.nummultby.svg
since: 1.0.0
stack_path: docs/data-types/json
summary: Multiplies the numeric value at path by a value
syntax_fmt: JSON.NUMMULTBY key path value
title: JSON.NUMMULTBY
---
Multiply the number value stored at `path` by `value`

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

## Examples

{{< highlight bash >}}
redis> JSON.SET doc . '{"a":"b","b":[{"a":2}, {"a":5}, {"a":"c"}]}'
OK
redis> JSON.NUMMULTBY doc $.a 2
"[null]"
redis> JSON.NUMMULTBY doc $..a 2
"[null,4,10,null]"
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="json-nummultby-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

With `$`-based path argument: [Bulk string reply](/content/develop/reference/protocol-spec.md#bulk-strings) containing a JSON-encoded string with the new value(s), or [null reply](/content/develop/reference/protocol-spec.md#nulls) if the matching value is not a number.

With `.`-based path argument: [Bulk string reply](/content/develop/reference/protocol-spec.md#bulk-strings) representing the stringified new value, [null reply](/content/develop/reference/protocol-spec.md#nulls) if the matching value is not a number, or [simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) on error.

-tab-sep-

With `$`-based path argument (default): [Array reply](/content/develop/reference/protocol-spec.md#arrays) of [integer replies](/content/develop/reference/protocol-spec.md#integers) or [null replies](/content/develop/reference/protocol-spec.md#nulls), where each element is the new value, or `null` if the matching value is not a number, or [simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) on error.

With `.`-based path argument: [Bulk string reply](/content/develop/reference/protocol-spec.md#bulk-strings) representing the stringified new value, [null reply](/content/develop/reference/protocol-spec.md#nulls) if the matching value is not a number, or [simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) on error.

{{< /multitabs >}}

## See also

[`JSON.NUMINCRBY`](/content/commands/json.numincrby.md) | [`JSON.ARRINSERT`](/content/commands/json.arrinsert.md) 

## Related topics

* [RedisJSON](/content/develop/data-types/json/_index.md)
* [Index and search JSON documents](/content/develop/ai/search-and-query/indexing/_index.md)
