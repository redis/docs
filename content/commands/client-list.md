---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
- '@connection'
arguments:
- arguments:
  - display_text: normal
    name: normal
    token: NORMAL
    type: pure-token
  - display_text: master
    name: master
    token: MASTER
    type: pure-token
  - display_text: replica
    name: replica
    token: REPLICA
    type: pure-token
  - display_text: pubsub
    name: pubsub
    token: PUBSUB
    type: pure-token
  name: client-type
  optional: true
  since: 5.0.0
  token: TYPE
  type: oneof
- display_text: client-id
  multiple: true
  name: client-id
  optional: true
  since: 6.2.0
  token: ID
  type: integer
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
- admin
- noscript
- loading
- stale
complexity: O(N) where N is the number of client connections
description: Lists open connections.
group: connection
hidden: false
hints:
- nondeterministic_output
history:
- - 2.8.12
  - Added unique client `id` field.
- - 5.0.0
  - Added optional `TYPE` filter.
- - 6.0.0
  - Added `user` field.
- - 6.2.0
  - Added `argv-mem`, `tot-mem`, `laddr` and `redir` fields and the optional `ID`
    filter.
- - 7.0.0
  - Added `resp`, `multi-mem`, `rbs` and `rbp` fields.
- - 7.0.3
  - Added `ssub` field.
- - 7.2.0
  - Added `lib-name` and `lib-ver` fields.
- - 7.4.0
  - Added `watch` field.
- - 8.0.0
  - Added `io-thread` field.
linkTitle: CLIENT LIST
since: 2.4.0
summary: Lists open connections.
syntax_fmt: "CLIENT LIST [TYPE\_<NORMAL | MASTER | REPLICA | PUBSUB>]\n  [ID\_client-id\
  \ [client-id ...]]"
syntax_str: "[ID\_client-id [client-id ...]]"
title: CLIENT LIST
---
The `CLIENT LIST` command returns information and statistics about the client
connections server in a mostly human readable format.

You can use one of the optional subcommands to filter the list. The `TYPE type` subcommand filters the list by clients' type, where *type* is one of `normal`, `master`, `replica`, and `pubsub`. Note that clients blocked by the [`MONITOR`]({{< relref "/commands/monitor" >}}) command belong to the `normal` class.

The `ID` filter only returns entries for clients with IDs matching the `client-id` arguments.

Here is the meaning of the fields:

* `id`: a unique 64-bit client ID
* `addr`: address/port of the client
* `laddr`: address/port of local address client connected to (bind address)
* `fd`: file descriptor corresponding to the socket
* `name`: the name set by the client with [`CLIENT SETNAME`]({{< relref "/commands/client-setname" >}})
* `age`: total duration of the connection in seconds
* `idle`: idle time of the connection in seconds
* `flags`: client flags (see below)
* `db`: current database ID
* `sub`: number of channel subscriptions
* `psub`: number of pattern matching subscriptions
* `ssub`: number of shard channel subscriptions. Added in Redis 7.0.3
* `multi`: number of commands in a MULTI/EXEC context
* `watch`: number of keys this client is currently watching. Added in Redis 7.4
* `qbuf`: query buffer length (0 means no query pending)
* `qbuf-free`: free space of the query buffer (0 means the buffer is full)
* `argv-mem`: incomplete arguments for the next command (already extracted from query buffer)
* `multi-mem`: memory is used up by buffered multi commands. Added in Redis 7.0
* `obl`: output buffer length
* `oll`: output list length (replies are queued in this list when the buffer is full)
* `omem`: output buffer memory usage
* `tot-mem`: total memory consumed by this client in its various buffers
* `events`: file descriptor events (see below)
* `cmd`: last command played
* `user`: the authenticated username of the client
* `redir`: client id of current client tracking redirection
* `resp`: client RESP protocol version. Added in Redis 7.0
* `rbp`: peak size of the client's read buffer since the client connected. Added in Redis 7.0
* `rbs`: current size of the client's read buffer in bytes. Added in Redis 7.0
* `io-thread`: id of I/O thread assigned to the client. Added in Redis 8.0
* `tot-net-in`: total network input bytes read from this client.
* `tot-net-out`: total network output bytes sent to this client.
* `tot-cmds`: total count of commands this client executed.

The client flags can be a combination of:

```
A: connection to be closed ASAP
b: the client is waiting in a blocking operation
c: connection to be closed after writing entire reply
d: a watched keys has been modified - EXEC will fail
e: the client is excluded from the client eviction mechanism
g: the client is responsible for migrating slots (atomic slot migration)
i: the client is waiting for a VM I/O (deprecated)
M: the client is a master
N: no specific flag set
o: the client is responsible for importing slots (atomic slot migration)
O: the client is a client in MONITOR mode
P: the client is a Pub/Sub subscriber
r: the client is in readonly mode against a cluster node
S: the client is a replica node connection to this instance
u: the client is unblocked
U: the client is connected via a Unix domain socket
x: the client is in a MULTI/EXEC context
t: the client enabled keys tracking in order to perform client side caching
T: the client will not touch the LRU/LFU of the keys it accesses
R: the client tracking target client is invalid
B: the client enabled broadcast tracking mode
```

The file descriptor events can be:

```
r: the client socket is readable (event loop)
w: the client socket is writable (event loop)
```

## Notes

New fields are regularly added for debugging purpose. Some could be removed
in the future. A version safe Redis client using this command should parse
the output accordingly (i.e. handling gracefully missing fields, skipping
unknown fields).

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="client-list-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): information and statistics about client connections.

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): information and statistics about client connections.

{{< /multitabs >}}
