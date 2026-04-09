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
description: Returns the number of keys in JSON objects located at the paths that match a given path expression
group: json
hidden: false
linkTitle: JSON.OBJLEN
module: JSON
railroad_diagram: /images/railroad/json.objlen.svg
since: 1.0.0
stack_path: docs/data-types/json
summary: Returns the number of keys in JSON objects located at the paths that match a given path expression
syntax_fmt: JSON.OBJLEN key [path]
title: JSON.OBJLEN
---
Returns the number of keys in JSON objects located at the paths that match a given path expression.

{{< note >}}
A JSON object is a structure within a JSON document that contains an unordered set of key-value pairs (also called name-value pairs). Do not confuse Redis keys with JSON object keys.
{{< /note >}}

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is a Redis key storing a value of type JSON.

</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is either 

- A JSONPath expression
  - The root "`$`", or any string that starts with "`$.`" or "`$[`".
  - Resolves to all matching locations in `key`.
- A legacy path expression 
  - Any string that does not match the JSONPath syntax above.
  - Allow the leading "`.`" to be omitted (for example, "`name`" and "`.name`" are equivalent).
  - Resolves to only the first matching location in `key`.

Default: "`.`" (legacy path pointing to the root of the document).

</details>

## Examples

{{< highlight bash >}}
redis> JSON.SET doc $ '{"a":[3], "nested": {"a": {"b":2, "c": 1}}}'
OK
redis> JSON.OBJLEN doc $..a
1) (nil)
2) (integer) 2
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="json-objlen-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

If `path` is a JSONPath expression:

- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if `key` does not exist.
- An empty [array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) if `path` has no matches.
- An [array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each array element corresponds to one match:
  - [`nil`]({{< relref "/develop/reference/protocol-spec#null-bulk-strings" >}}) if the match is not an object.
  - An [integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of keys in the object - if the match is an object.

If `path` is a legacy path expression:

- [`nil`]({{< relref "/develop/reference/protocol-spec#null-bulk-strings" >}}) if `key` does not exist.
- [`nil`]({{< relref "/develop/reference/protocol-spec#null-bulk-strings" >}}) if `path` has no matches.
- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the first match is not an object.
- An [integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of keys in the first match - if the first match is an object.

-tab-sep-

If `path` is a JSONpath expression:

- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if `key` does not exist.
- An empty [array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) if `path` has no matches.
- An [array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each array element corresponds to one match:
  - [`nil`]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the match is not an object.
  - An [integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of keys in the object - if the match is an object.

If `path` is a legacy path expression:

- [`nil`]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if `key` does not exist.
- [`nil`]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if `path` has no matches.
- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the first match is not an object.
- An [integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of keys in the first match - if the first match is an object.

{{< /multitabs >}}

## See also

[`JSON.OBJKEYS`]({{< relref "commands/json.objkeys/" >}})

## Related topics

* [The JSON data type]({{< relref "/develop/data-types/json/" >}})
* [JSONPath]({{< relref "/develop/data-types/json/path" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
