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
description: Configures a server as replica of another, or promotes it to a master.
group: server
hidden: false
linkTitle: REPLICAOF
since: 5.0.0
summary: Configures a server as replica of another, or promotes it to a master.
syntax_fmt: REPLICAOF <host port | NO ONE>
syntax_str: ''
title: REPLICAOF
---
The `REPLICAOF` command can change the replication settings of a replica on the fly.

If a Redis server is already acting as replica, the command `REPLICAOF` NO ONE will turn off the replication, turning the Redis server into a MASTER.  In the proper form `REPLICAOF` hostname port will make the server a replica of another server listening at the specified hostname and port.

If a server is already a replica of some master, `REPLICAOF` hostname port will stop the replication against the old server and start the synchronization against the new one, discarding the old dataset.

The form `REPLICAOF` NO ONE will stop replication, turning the server into a MASTER, but will not discard the already replicated data. So, if the old master stops working, it is possible to turn the replica into a master and set the application to use this new master in read/write. Later when the other Redis server is fixed, it can be reconfigured to work as a replica.

## Examples

```
> REPLICAOF NO ONE
"OK"

> REPLICAOF 127.0.0.1 6799
"OK"
```
