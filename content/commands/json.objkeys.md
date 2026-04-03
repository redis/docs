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
complexity: O(N) when path is evaluated to a single value, where N is the number of
  keys in the object, O(N) when path is evaluated to multiple values, where N is the
  size of the key
description: Returns the key names of JSON objects located at the paths that match a given path expression
group: json
hidden: false
linkTitle: JSON.OBJKEYS
module: JSON
railroad_diagram: /images/railroad/json.objkeys.svg
since: 1.0.0
stack_path: docs/data-types/json
summary: Returns the key names of JSON objects located at the paths that match a given path expression
syntax_fmt: JSON.OBJKEYS key [path]
title: JSON.OBJKEYS
---
Returns the key names of JSON objects located at the paths that match a given path expression.

{{< note >}}
A JSON object is an unordered set of key-value (also called name-value) pairs. Do not confuse "Redis keys" with "Object keys".
{{< /note >}}

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is the name of a Redis key that holds the JSON document to query.

</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is either 

- A JSONPath expression ("`$`", starts with "`$.`", or starts with "`$[`").
- A legacy path expression (any string that is not a JSONPath expression).

A JSONPath expression resolves to all matching locations within the JSON document.

A legacy path expression resolves to the first matching location within the JSON document.

Default is "`.`".

</details>

## Examples

{{< highlight bash >}}
redis> JSON.SET doc $ '{"a":[3], "nested": {"a": {"b":2, "c": 1}}}'
OK
redis> JSON.OBJKEYS doc $..a
1) (nil)
2) 1) "b"
   2) "c"
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="json-objkeys-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

If `path` is a JSONpath expression:

- a [Simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if `key` does not exist
- an empty [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) if `path` has no matches
- an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each array element corresponds to one match:
  - `null` if the match is not an object
  - an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of ([Bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})) containing the object's key names if the match is an object

If `path` is a legacy path expression:

- `null` if `key` does not exist
- `null` if `path` has no matches
- a [Simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the first match is not an object
- an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of ([Bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})) containing the object's key names of the first match

-tab-sep-

If `path` is a JSONpath expression:

- a [Simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if `key` does not exist
- an empty [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) if `path` has no matches
- an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each array element corresponds to one match:
  - `null` if the match is not an object
  - an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of ([Bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})) containing the object's key names if the match is an object

If `path` is a legacy path expression:

- `null` if `key` does not exist
- `null` if `path` has no matches
- a [Simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the first match is not an object
- an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of ([Bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})) containing the object's key names of the first match

{{< /multitabs >}}

## See also

[`JSON.ARRINDEX`]({{< relref "commands/json.arrindex/" >}}) | [`JSON.ARRINSERT`]({{< relref "commands/json.arrinsert/" >}}) 

## Related topics

* [The JSON data type]({{< relref "/develop/data-types/json/" >}})
* [JSONPath]({{< relref "/develop/data-types/json/path" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
