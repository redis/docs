---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
- '@connection'
arguments:
- display_text: timeout
  name: timeout
  type: integer
- arguments:
  - display_text: write
    name: write
    token: WRITE
    type: pure-token
  - display_text: all
    name: all
    token: ALL
    type: pure-token
  name: mode
  optional: true
  since: 6.2.0
  type: oneof
arity: -3
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
- loading
- stale
complexity: O(1)
description: Suspends commands processing.
group: connection
hidden: false
history:
- - 6.2.0
  - '`CLIENT PAUSE WRITE` mode added along with the `mode` option.'
linkTitle: CLIENT PAUSE
since: 3.0.0
summary: Suspends commands processing.
syntax_fmt: CLIENT PAUSE timeout [WRITE | ALL]
syntax_str: '[WRITE | ALL]'
title: CLIENT PAUSE
---
`CLIENT PAUSE` is a connections control command able to suspend all the Redis clients for the specified amount of time (in milliseconds).

The command performs the following actions:

* It stops processing all the pending commands from normal and pub/sub clients for the given mode. However interactions with replicas will continue normally. Note that clients are formally paused when they try to execute a command, so no work is taken on the server side for inactive clients.
* However it returns OK to the caller ASAP, so the `CLIENT PAUSE` command execution is not paused by itself.
* When the specified amount of time has elapsed, all the clients are unblocked: this will trigger the processing of all the commands accumulated in the query buffer of every client during the pause.

Client pause currently supports two modes:

* `ALL`: This is the default mode. All client commands are blocked.
* `WRITE`: Clients are only blocked if they attempt to execute a write command.

For the `WRITE` mode, some commands have special behavior:

* [`EVAL`]({{< relref "/commands/eval" >}})/[`EVALSHA`]({{< relref "/commands/evalsha" >}}): Will block client for all scripts.
* [`PUBLISH`]({{< relref "/commands/publish" >}}): Will block client.
* [`PFCOUNT`]({{< relref "/commands/pfcount" >}}): Will block client.
* [`WAIT`]({{< relref "/commands/wait" >}}): Acknowledgments will be delayed, so this command will appear blocked.

This command is useful as it makes able to switch clients from a Redis instance to another one in a controlled way. For example during an instance upgrade the system administrator could do the following:

* Pause the clients using `CLIENT PAUSE`
* Wait a few seconds to make sure the replicas processed the latest replication stream from the master.
* Turn one of the replicas into a master.
* Reconfigure clients to connect with the new master.

Since Redis 6.2, the recommended mode for client pause is `WRITE`. This mode will stop all replication traffic, can be
aborted with the [`CLIENT UNPAUSE`]({{< relref "/commands/client-unpause" >}}) command, and allows reconfiguring the old master without risking accepting writes after the
failover. This is also the mode used during cluster failover.

For versions before 6.2, it is possible to send `CLIENT PAUSE` in a MULTI/EXEC block together with the `INFO replication` command in order to get the current master offset at the time the clients are blocked. This way it is possible to wait for a specific offset in the replica side in order to make sure all the replication stream was processed.

Since Redis 3.2.10 / 4.0.0, this command also prevents keys to be evicted or
expired during the time clients are paused. This way the dataset is guaranteed
to be static not just from the point of view of clients not being able to write, but also from the point of view of internal operations.

## Behavior change history

*   `>= 3.2.0`: Client pause prevents client pause and key eviction as well.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="client-pause-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` or an error if the timeout is invalid.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` or an error if the timeout is invalid.

{{< /multitabs >}}
