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

## Return

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with index names.

## Examples

```sql
FT._LIST
1) "idx"
2) "movies"
3) "imdb"
```