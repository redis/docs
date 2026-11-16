---
acl_categories:
- '@keyspace'
- '@read'
- '@fast'
arity: 1
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
- fast
compatibility:
  software:
    standard: supported
    active_active: supported
  cloud:
    standard: supported
    active_active: supported
complexity: O(1)
description: Returns the number of keys in the database.
group: server
hidden: false
hints:
- request_policy:all_shards
- response_policy:agg_sum
linkTitle: DBSIZE
railroad_diagram: /images/railroad/dbsize.svg
since: 1.0.0
summary: Returns the number of keys in the database.
syntax_fmt: DBSIZE
title: DBSIZE
---
> [!NOTE]
> This command's behavior varies in clustered Redis environments. See the [multi-key operations](/content/develop/using-commands/multi-key-operations.md) page for more information.


Return the number of keys in the currently-selected database.

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="dbsize-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of keys in the currently-selected database.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of keys in the currently-selected database.

{{< /multitabs >}}
