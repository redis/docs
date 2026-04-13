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
- name: value
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
description: Appends a string to JSON strings at the paths matching a given path expression
group: json
hidden: false
linkTitle: JSON.STRAPPEND
module: JSON
railroad_diagram: /images/railroad/json.strappend.svg
since: 1.0.0
stack_path: docs/data-types/json
summary: Appends a string to JSON strings at the paths matching a given path expression
syntax_fmt: JSON.STRAPPEND key [path] value
title: JSON.STRAPPEND
---
Appends a string to JSON strings at the paths matching a given path expression.

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is a Redis key storing a value of type JSON.

</details>

<details open><summary><code>value</code></summary> 

is a string to append to the JSON strings at the paths matching `path`.

{{% alert title="About using strings with JSON commands" color="warning" %}}
To specify a string as an array value to append, wrap the quoted string with an additional set of single quotes. Example: `'"silver"'`. For more detailed use, see [Examples](#examples).
{{% /alert %}}
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
redis> JSON.SET doc $ '{"a":"foo", "nested": {"a": "hello"}, "nested2": {"a": 31}}'
OK
redis> JSON.STRAPPEND doc $..a '"baz"'
1) (integer) 6
2) (integer) 8
3) (nil)
redis> JSON.GET doc $
"[{\"a\":\"foobaz\",\"nested\":{\"a\":\"hellobaz\"},\"nested2\":{\"a\":31}}]"
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="json-strappend-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

If `path` is a JSONPath expression:

- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if `key` does not exist.
- An empty [array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) if `path` has no matches.
- An [array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each array element corresponds to one match:
  - [`nil`]({{< relref "/develop/reference/protocol-spec#null-bulk-strings" >}}) if the match is not a string.
  - An [integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the new length of the string.

If `path` is a legacy path expression:

- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if `key` does not exist.
- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if `path` has no matches.
- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the first match is not a string.
- An [integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the new length of the string at the first match.

-tab-sep-

If `path` is a JSONPath expression:

- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if `key` does not exist.
- An empty [array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) if `path` has no matches.
- An [array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each array element corresponds to one match:
  - [`nil`]({{< relref "/develop/reference/protocol-spec#nulls" >}}) if the match is not a string.
  - An [integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the new length of the string.

If `path` is a legacy path expression:

- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if `key` does not exist.
- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if `path` has no matches.
- A [simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the first match is not a string.
- An [integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the new length of the string at the first match.

{{< /multitabs >}}

## See also

[`JSON.STRLEN`]({{< relref "commands/json.strlen/" >}}) | [`JSON.ARRAPPEND`]({{< relref "commands/json.arrappend/" >}})

## Related topics

* [The JSON data type]({{< relref "/develop/data-types/json/" >}})
* [JSONPath]({{< relref "/develop/data-types/json/path" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
