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
- - 8.10.0
  - Added original command argument count to the reply.
linkTitle: SLOWLOG GET
railroad_diagram: /images/railroad/slowlog-get.svg
since: 2.2.12
summary: Returns the slow log's entries.
syntax_fmt: SLOWLOG GET [count]
title: SLOWLOG GET
---
The `SLOWLOG GET` command returns entries from the slow log in chronological order.

The Redis Slow Log is a system to log queries that exceeded a specified execution time.
The execution time does not include I/O operations like talking with the client, sending the reply and so forth, but just the time needed to actually execute the command (this is the only stage of command execution where the thread is blocked and can not serve other requests in the meantime).

A new entry is added to the slow log whenever a command exceeds the execution time threshold defined by the `slowlog-log-slower-than` configuration directive.
The maximum number of entries in the slow log is governed by the `slowlog-max-len` configuration directive.

By default the command returns latest ten entries in the log. The optional `count` argument limits the number of returned entries, so the command returns at most up to `count` entries, the special number -1 means return all entries.

Each entry from the slow log is comprised of the following seven values:

1. A unique progressive identifier for every slow log entry.
2. The unix timestamp at which the logged command was processed.
3. The amount of time needed for its execution, in microseconds.
4. The array composing the arguments of the command.
5. Client IP address and port.
6. Client name if set via the [`CLIENT SETNAME`]({{< relref "/commands/client-setname" >}}) command.
7. The total number of arguments in the command, including the command name. Added in Redis 8.10.

The logged argument array (value 4) is truncated when the command has more arguments than the `slowlog-max-argc` configuration directive allows (32 by default). In that case, the last logged element is replaced with a string of the form `... (N more arguments)`. The total argument count (value 7) always reflects the command's original argument count, captured before truncation, so it can be read directly without parsing that string.

The entry's unique ID can be used in order to avoid processing slow log entries multiple times (for instance you may have a script sending you an email alert for every new slow log entry).
The ID is never reset in the course of the Redis server execution, only a server
restart will reset it.

## Optional arguments

<details open><summary><code>count</code></summary>

The number of recent slow-log entries to return. `-1` returns all entries; the default is 10.

</details>

## Examples

The seventh element of each entry reports the command's total argument count. This is most useful for variadic commands whose logged argument list has been truncated. In the following example, the `slowlog-max-argc` limit is left at its default of 32 and a `SADD` command is issued with 33 arguments (the command name, the key, and 31 members):

```
redis> CONFIG SET slowlog-log-slower-than 0
OK
redis> SLOWLOG RESET
OK
redis> SADD myset 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33
(integer) 31
redis> SLOWLOG GET 1
1) 1) (integer) 12
   2) (integer) 1752422400
   3) (integer) 21
   4)  1) "SADD"
       2) "myset"
       3) "3"
       4) "4"
          ...
      32) "... (2 more arguments)"
   5) "127.0.0.1:52276"
   6) ""
   7) (integer) 33
```

The logged argument array (element 4) is truncated to 32 items, with the final item indicating how many more arguments were omitted. The argument count (element 7) still reports the original total of `33`.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts]({{<relref "/develop/programmability">}}). Also, the client IP address, port, and name are not returned by Redis Software. |

## Return information

{{< multitabs id="slowlog-get-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of slow log entries per the above format.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of slow log entries per the above format.

{{< /multitabs >}}
