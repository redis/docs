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
since: 7.0.0
summary: Returns information about all libraries.
syntax_fmt: "FUNCTION LIST [LIBRARYNAME\_library-name-pattern] [WITHCODE]"
syntax_str: '[WITHCODE]'
title: FUNCTION LIST
---
Return information about the functions and libraries.

You can use the optional `LIBRARYNAME` argument to specify a pattern for matching library names.
The optional `WITHCODE` modifier will cause the server to include the libraries source implementation in the reply.

The following information is provided for each of the libraries in the response:

* **library_name:** the name of the library.
* **engine:** the engine of the library.
* **functions:** the list of functions in the library.
  Each function has the following fields:
  * **name:** the name of the function.
  * **description:** the function's description.
  * **flags:** an array of [function flags]({{< relref "develop/interact/programmability/functions-intro#function-flags" >}}).
* **library_code:** the library's source code (when given the `WITHCODE` modifier).

For more information please refer to [Introduction to Redis Functions]({{< relref "/develop/interact/programmability/functions-intro" >}}).

## Return information

{{< multitabs id="function-list-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): information about functions and libraries.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): information about functions and libraries.

{{< /multitabs >}}
