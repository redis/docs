---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: count
  name: count
  optional: true
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
- loading
- stale
complexity: O(N) where N is the number of entries returned
description: Returns the slow log's entries.
group: server
hidden: false
hints:
- request_policy:all_nodes
- nondeterministic_output
history:
- - 4.0.0
  - Added client IP address, port and name to the reply.
linkTitle: SLOWLOG GET
since: 2.2.12
summary: Returns the slow log's entries.
syntax_fmt: SLOWLOG GET [count]
syntax_str: ''
title: SLOWLOG GET
---
The `SLOWLOG GET` command returns entries from the slow log in chronological order.

The Redis Slow Log is a system to log queries that exceeded a specified execution time.
The execution time does not include I/O operations like talking with the client, sending the reply and so forth, but just the time needed to actually execute the command (this is the only stage of command execution where the thread is blocked and can not serve other requests in the meantime).

A new entry is added to the slow log whenever a command exceeds the execution time threshold defined by the `slowlog-log-slower-than` configuration directive.
The maximum number of entries in the slow log is governed by the `slowlog-max-len` configuration directive.

By default the command returns latest ten entries in the log. The optional `count` argument limits the number of returned entries, so the command returns at most up to `count` entries, the special number -1 means return all entries.

Each entry from the slow log is comprised of the following six values:

1. A unique progressive identifier for every slow log entry.
2. The unix timestamp at which the logged command was processed.
3. The amount of time needed for its execution, in microseconds.
4. The array composing the arguments of the command.
5. Client IP address and port.
6. Client name if set via the [`CLIENT SETNAME`]({{< relref "/commands/client-setname" >}}) command.

The entry's unique ID can be used in order to avoid processing slow log entries multiple times (for instance you may have a script sending you an email alert for every new slow log entry).
The ID is never reset in the course of the Redis server execution, only a server
restart will reset it.

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts]({{<relref "/develop/programmability">}}). |

## Return information

{{< multitabs id="slowlog-get-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of slow log entries per the above format.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of slow log entries per the above format.

{{< /multitabs >}}
