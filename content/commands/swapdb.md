---
acl_categories:
- '@keyspace'
- '@write'
- '@fast'
- '@dangerous'
arguments:
- display_text: index1
  name: index1
  type: integer
- display_text: index2
  name: index2
  type: integer
arity: 3
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
- write
- fast
complexity: O(N) where N is the count of clients watching or blocking on keys from
  both databases.
description: Swaps two Redis databases.
group: server
hidden: false
linkTitle: SWAPDB
since: 4.0.0
summary: Swaps two Redis databases.
syntax_fmt: SWAPDB index1 index2
syntax_str: index2
title: SWAPDB
---
This command swaps two Redis databases, so that immediately all the
clients connected to a given database will see the data of the other database, and
the other way around. Example:

    SWAPDB 0 1

This will swap database 0 with database 1. All the clients connected with database 0 will immediately see the new data, exactly like all the clients connected with database 1 will see the data that was formerly of database 0.

## Examples

```
SWAPDB 0 1
```
