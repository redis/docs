---
acl_categories:
- '@admin'
- '@search'
- '@slow'
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
- readonly
complexity: O(1)
description: Returns a list of all existing indexes
group: search
hidden: false
linkTitle: FT._LIST
module: Search
since: 2.0.0
stack_path: docs/interact/search-and-query
summary: Returns a list of all existing indexes
syntax_fmt: FT._LIST
syntax_str: ''
title: FT._LIST
---
Returns a list of all existing indexes.


{{% alert title="Temporary command" color="info" %}}
The prefix `_` in the command indicates, this is a temporary command.

In the future, a [`SCAN`]({{< relref "/commands/scan" >}}) type of command will be added, for use when a database
contains a large number of indices.
{{% /alert %}}

## Examples

```sql
FT._LIST
1) "idx"
2) "movies"
3) "imdb"
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> |  |

## Return information

{{< multitabs id="ft-_list-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of index names as [simple strings]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}).

-tab-sep-

[Set]({{< relref "/develop/reference/protocol-spec#sets" >}}) of index names as [simple strings]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}).

{{< /multitabs >}}
