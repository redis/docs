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
compatibility:
  software:
    general: supported
    flex: supported
  cloud:
    pro: supported
    essentials: supported
complexity: O(1)
description: Returns a list of all existing indexes
group: search
hidden: false
linkTitle: FT._LIST
module: Search
railroad_diagram: /images/railroad/ft._list.svg
since: 2.0.0
stack_path: docs/interact/search-and-query
summary: Returns a list of all existing indexes
syntax_fmt: FT._LIST
title: FT._LIST
---
Returns a list of all existing indexes.

> [!NOTE] Temporary command
> The prefix `_` in the command indicates, this is a temporary command.
>
> In the future, a [`SCAN`](/content/commands/scan.md) type of command will be added, for use when a database
> contains a large number of indices.

## Examples

```sql
FT._LIST
1) "idx"
2) "movies"
3) "imdb"
```

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="ft-_list-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array](/content/develop/reference/protocol-spec.md#arrays) of index names as [simple strings](/content/develop/reference/protocol-spec.md#simple-strings).

-tab-sep-

[Set](/content/develop/reference/protocol-spec.md#sets) of index names as [simple strings](/content/develop/reference/protocol-spec.md#simple-strings).

{{< /multitabs >}}
