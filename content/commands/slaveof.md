---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- arguments:
  - arguments:
    - display_text: host
      name: host
      type: string
    - display_text: port
      name: port
      type: integer
    name: host-port
    type: block
  - arguments:
    - display_text: 'no'
      name: 'no'
      token: 'NO'
      type: pure-token
    - display_text: one
      name: one
      token: ONE
      type: pure-token
    name: no-one
    type: block
  name: args
  type: oneof
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
- admin
- noscript
- stale
- no_async_loading
complexity: O(1)
deprecated_since: 5.0.0
description: Sets a Redis server as a replica of another, or promotes it to being
  a master.
doc_flags:
- deprecated
group: server
hidden: false
linkTitle: SLAVEOF
railroad_diagram: /images/railroad/slaveof.svg
replaced_by: '`REPLICAOF`'
since: 1.0.0
summary: Sets a Redis server as a replica of another, or promotes it to being a master.
syntax_fmt: SLAVEOF <host port | NO ONE>
title: SLAVEOF
---
**A note about the word slave used in this man page and command name**: starting with Redis version 5, if not for backward compatibility, the Redis project no longer uses the word slave. Please use the new command [`REPLICAOF`]({{< relref "/commands/replicaof" >}}). The command `SLAVEOF` will continue to work for backward compatibility.

The `SLAVEOF` command can change the replication settings of a replica on the fly.
If a Redis server is already acting as replica, the command `SLAVEOF` NO ONE will
turn off the replication, turning the Redis server into a MASTER.
In the proper form `SLAVEOF` hostname port will make the server a replica of
another server listening at the specified hostname and port.

If a server is already a replica of some master, `SLAVEOF` hostname port will stop
the replication against the old server and start the synchronization against the
new one, discarding the old dataset.

The form `SLAVEOF` NO ONE will stop replication, turning the server into a
MASTER, but will not discard the replication.
So, if the old master stops working, it is possible to turn the replica into a
master and set the application to use this new master in read/write.
Later when the other Redis server is fixed, it can be reconfigured to work as a
replica.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | Deprecated as of Redis v5.0.0. |

## Return information

{{< multitabs id="slaveof-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
