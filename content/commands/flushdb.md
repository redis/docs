---
acl_categories:
- '@keyspace'
- '@write'
- '@slow'
- '@dangerous'
arguments:
- arguments:
  - display_text: async
    name: async
    since: 4.0.0
    token: ASYNC
    type: pure-token
  - display_text: sync
    name: sync
    since: 6.2.0
    token: SYNC
    type: pure-token
  name: flush-type
  optional: true
  type: oneof
arity: -1
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
- write
complexity: O(N) where N is the number of keys in the selected database
description: Remove all keys from the current database.
group: server
hidden: false
hints:
- request_policy:all_shards
- response_policy:all_succeeded
history:
- - 4.0.0
  - Added the `ASYNC` flushing mode modifier.
- - 6.2.0
  - Added the `SYNC` flushing mode modifier.
linkTitle: FLUSHDB
since: 1.0.0
summary: Remove all keys from the current database.
syntax_fmt: FLUSHDB [ASYNC | SYNC]
syntax_str: ''
title: FLUSHDB
---
Delete all the keys of the currently selected DB.
This command never fails.

By default, `FLUSHDB` will synchronously flush all keys from the database.
Starting with Redis 6.2, setting the **lazyfree-lazy-user-flush** configuration directive to "yes" changes the default flush mode to asynchronous.

It is possible to use one of the following modifiers to dictate the flushing mode explicitly:

* `ASYNC`: flushes the database asynchronously
* `SYNC`: flushes the database synchronously

## Notes

* An asynchronous `FLUSHDB` command only deletes keys that were present at the time the command was invoked. Keys created during an asynchronous flush will be unaffected.
* This command does not delete functions.
* When using Redis Cluster, this command is identical to `FLUSHALL` since a Redis Cluster supports only one database with an ID of zero.

## Behavior change history

*   `>= 6.2.0`: Default flush behavior now configurable by the **lazyfree-lazy-user-flush** configuration directive.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active\*</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | \*Can use the [Active-Active flush API request]({{< relref "/operate/rs/references/rest-api/requests/crdbs/flush" >}}). |

## Return information

{{< multitabs id="flushdb-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
