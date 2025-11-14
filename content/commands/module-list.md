---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arity: 2
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
command_flags:
- admin
- noscript
complexity: O(N) where N is the number of loaded modules.
description: Returns all loaded modules.
group: server
hidden: false
hints:
- nondeterministic_output_order
linkTitle: MODULE LIST
since: 4.0.0
summary: Returns all loaded modules.
syntax_fmt: MODULE LIST
syntax_str: ''
title: MODULE LIST
---
Returns information about the modules loaded to the server.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="module-list-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): list of loaded modules. Each element in the list represents a represents a module, and is in itself a list of property names and their values. The following properties is reported for each loaded module:
* name: the name of the module.
* ver: the version of the module.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): list of loaded modules. Each element in the list represents a represents a module, and is a [Map reply](../../develop/reference/protocol-spec#maps) of property names and their values. The following properties is reported for each loaded module:
* name: the name of the module.
* ver: the version of the module.

{{< /multitabs >}}
