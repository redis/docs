---
acl_categories:
- '@slow'
- '@scripting'
arguments:
- display_text: library-name-pattern
  name: library-name-pattern
  optional: true
  token: LIBRARYNAME
  type: string
- display_text: withcode
  name: withcode
  optional: true
  token: WITHCODE
  type: pure-token
arity: -2
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
command_flags:
- noscript
complexity: O(N) where N is the number of functions
description: Returns information about all libraries.
group: scripting
hidden: false
hints:
- nondeterministic_output_order
linkTitle: FUNCTION LIST
railroad_diagram: /images/railroad/function-list.svg
since: 7.0.0
summary: Returns information about all libraries.
syntax_fmt: "FUNCTION LIST [LIBRARYNAME\_library-name-pattern] [WITHCODE]"
title: FUNCTION LIST
---
Return information about loaded functions and libraries.

For more information see [Introduction to Redis Functions]({{< relref "/develop/programmability/functions-intro" >}}).

## Optional arguments

<details open><summary><code>LIBRARYNAME library-name-pattern</code></summary>

List only libraries whose names match the given pattern.

</details>

<details open><summary><code>WITHCODE</code></summary>

Include the source code of each library in the reply.

</details>

## Details

The following information is provided for each of the libraries in the response:

* `library_name:` the name of the library.
* `engine:` the engine of the library.
* `functions:` the list of functions in the library.
  Each function has the following fields:
  * `name:` the name of the function.
  * `description:` the function's description.
  * `flags:` an array of [function flags]({{< relref "develop/programmability/functions-intro#function-flags" >}}).
* `library_code:` the library's source code (when given the `WITHCODE` modifier).

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="function-list-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): information about loaded functions and libraries.

-tab-sep-

[Map reply](../../develop/reference/protocol-spec#maps): information about loaded functions and libraries.

{{< /multitabs >}}
