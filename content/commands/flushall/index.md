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
- oss
- kubernetes
- clients
command_flags:
- write
complexity: O(N) where N is the total number of keys in all databases
description: Removes all keys from all databases.
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
linkTitle: FLUSHALL
since: 1.0.0
summary: Removes all keys from all databases.
syntax_fmt: FLUSHALL [ASYNC | SYNC]
syntax_str: ''
title: FLUSHALL
---
Delete all the keys of all the existing databases, not just the currently selected one.
This command never fails.

By default, `FLUSHALL` will synchronously flush all the databases.
Starting with Redis 6.2, setting the **lazyfree-lazy-user-flush** configuration directive to "yes" changes the default flush mode to asynchronous.

It is possible to use one of the following modifiers to dictate the flushing mode explicitly:

* `ASYNC`: flushes the databases asynchronously
* `SYNC`: flushes the databases synchronously

{{< clients-example cmds_servermgmt flushall >}}
FLUSHALL SYNC
{{< /clients-example >}}

## Notes

* An asynchronous `FLUSHALL` command only deletes keys that were present at the time the command was invoked. Keys created during an asynchronous flush will be unaffected.
* This command does not delete functions.
* Other than emptying all databases (similar to `FLUSHDB`), this command clears the RDB persistence file, aborts any snapshot that is in progress, and, if the `save` config is enabled, saves an empty RDB file.

## Behavior change history

*   `>= 6.2.0`: Default flush behavior now configurable by the **lazyfree-lazy-user-flush** configuration directive. 
