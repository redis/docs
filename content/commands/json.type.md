---
acl_categories:
- '@json'
- '@read'
- '@slow'
arguments:
- name: key
  type: key
- name: path
  optional: true
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
description: Returns the type of the JSON value at path
group: json
hidden: false
linkTitle: JSON.TYPE
module: JSON
railroad_diagram: /images/railroad/json.type.svg
since: 1.0.0
stack_path: docs/data-types/json
summary: Returns the type of the JSON value at path
syntax_fmt: JSON.TYPE key [path]
title: JSON.TYPE
---
Report the type of JSON value at `path`

The returned type is one of the following strings:

| Type | Description |
|:-----|:------------|
| `null` | A JSON null value. |
| `boolean` | A JSON `true` or `false` value. |
| `integer` | A number with no fractional part. |
| `number` | A number with a fractional part (a floating-point value). <sup>[1](#table-note-1)</sup>|
| `string` | A JSON string value. |
| `object` | A JSON object (a collection of key-value pairs). |
| `array` | A JSON array (an ordered list of values). |

1. <a name="table-note-1"></a>
A floating-point homogeneous array (FPHA) stored with the [`JSON.SET`]({{< relref "commands/json.set/" >}}) `FPHA` argument still reports as `array`, and its elements report as `number`. The FP type (`FP16`, `BF16`, `FP32`, or `FP64`) is an internal storage representation and is not exposed by `JSON.TYPE`.

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to parse.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`. Returns null if the `key` or `path` do not exist.

</details>

## Examples

{{< highlight bash >}}
redis> JSON.SET doc $ '{"a":2, "nested": {"a": true}, "foo": "bar"}'
OK
redis> JSON.TYPE doc $..foo
1) "string"
redis> JSON.TYPE doc $..a
1) "integer"
2) "boolean"
redis> JSON.TYPE doc $..dummy
(empty array)
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="json-type-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

With `$`-based path argument: [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}), where each element is the type of the matching value.

With `.`-based path argument: [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) representing the type of the matching value.

-tab-sep-

With `$`-based path argument (default): [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [array replies]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}), where each nested array contains the type of the matching value.

With `.`-based path argument: [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) representing the type of the matching value.

{{< /multitabs >}}

## See also

[`JSON.SET`]({{< relref "commands/json.set/" >}}) | [`JSON.ARRLEN`]({{< relref "commands/json.arrlen/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
