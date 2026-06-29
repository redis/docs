---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
- '@connection'
arguments:
- display_text: client-id
  name: client-id
  type: integer
- arguments:
  - display_text: timeout
    name: timeout
    token: TIMEOUT
    type: pure-token
  - display_text: error
    name: error
    token: ERROR
    type: pure-token
  name: unblock-type
  optional: true
  type: oneof
arity: -3
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
complexity: O(log N) where N is the number of client connections
description: Unblocks a client blocked by a blocking command from a different connection.
group: connection
hidden: false
linkTitle: CLIENT UNBLOCK
railroad_diagram: /images/railroad/client-unblock.svg
since: 5.0.0
summary: Unblocks a client blocked by a blocking command from a different connection.
syntax_fmt: CLIENT UNBLOCK client-id [TIMEOUT | ERROR]
title: CLIENT UNBLOCK
---
Use this command from one connection to unblock a client that is blocked by a blocking operation, such as [`BRPOP`]({{< relref "/commands/brpop" >}}), [`XREAD`]({{< relref "/commands/xread" >}}), or [`WAIT`]({{< relref "/commands/wait" >}}).

By default, Redis unblocks the client as if the blocked command timed out. You can pass an optional argument to choose the unblocking behavior: TIMEOUT, the default, or ERROR. If you specify ERROR, Redis unblocks the client and returns an error that indicates the client was force-unblocked.Specifically the client will receive the following error:

    -UNBLOCKED client unblocked via CLIENT UNBLOCK

The error text may change over time, but the error code will remain `-UNBLOCKED`.



## Required arguments

<details open><summary><code>client-id</code></summary>

The ID of the client to unblock.

</details>

## Optional arguments

<details open><summary><code>TIMEOUT | ERROR</code></summary>

How to unblock the client: as if its timeout expired (`TIMEOUT`, the default), or by returning an error (`ERROR`).

</details>

## Details

Use this command when you need to monitor many keys with a limited number of connections. For example, you might monitor multiple streams with XREAD without using more than N connections. If your consumer process needs to monitor another stream key, you can avoid opening another connection: unblock one of the connections in the pool, add the new key, and issue the blocking command again.

To use this pattern, create an additional control connection that sends CLIENT UNBLOCK when needed. Before you run a blocking operation on each monitored connection, run CLIENT ID to get that connection’s ID. When you need to add or remove a key, use the control connection to send CLIENT UNBLOCK for the connection that is running the blocking command. The blocking command returns, and you can then reissue it with the updated set of keys.

The following example uses Redis Streams, but you can apply the same pattern to other blocking operations.

```
Connection A (blocking connection):
> CLIENT ID
2934
> BRPOP key1 key2 key3 0
(client is blocked)

... Now we want to add a new key ...

Connection B (control connection):
> CLIENT UNBLOCK 2934
1

Connection A (blocking connection):
... BRPOP reply with timeout ...
NULL
> BRPOP key1 key2 key3 key4 0
(client is blocked again)
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="client-unblock-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the client was unblocked successfully.
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the client wasn't unblocked.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the client was unblocked successfully.
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the client wasn't unblocked.

{{< /multitabs >}}
