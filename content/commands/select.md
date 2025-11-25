---
acl_categories:
- '@fast'
- '@connection'
arguments:
- display_text: index
  name: index
  type: integer
arity: 2
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
- loading
- stale
- fast
complexity: O(1)
description: Changes the selected database.
group: connection
hidden: false
linkTitle: SELECT
railroad_diagram: /images/railroad/select.svg
since: 1.0.0
summary: Changes the selected database.
syntax_fmt: SELECT index
syntax_str: ''
title: SELECT
---
Select the Redis logical database having the specified zero-based numeric index.
New connections always use the database 0.

Selectable Redis databases are a form of namespacing: all databases are still persisted in the same RDB / AOF file. However different databases can have keys with the same name, and commands like [`FLUSHDB`]({{< relref "/commands/flushdb" >}}), [`SWAPDB`]({{< relref "/commands/swapdb" >}}) or [`RANDOMKEY`]({{< relref "/commands/randomkey" >}}) work on specific databases.

In practical terms, Redis databases should be used to separate different keys belonging to the same application (if needed), and not to use a single Redis instance for multiple unrelated applications.

When using Redis Cluster, the `SELECT` command cannot be used, since Redis Cluster only supports database zero. In the case of a Redis Cluster, having multiple databases would be useless and an unnecessary source of complexity. Commands operating atomically on a single database would not be possible with the Redis Cluster design and goals.

Since the currently selected database is a property of the connection, clients should track the currently selected database and re-select it on reconnection. While there is no command in order to query the selected database in the current connection, the [`CLIENT LIST`]({{< relref "/commands/client-list" >}}) output shows, for each client, the currently selected database.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | Redis Enterprise does not support shared databases due to potential negative performance impacts and blocks any related commands. The `SELECT` command is supported solely for compatibility with Redis Open Source but does not perform any operations in Redis Enterprise. |

## Return information

{{< multitabs id="select-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
