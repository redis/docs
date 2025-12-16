---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arity: 1
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
- no_async_loading
complexity: O(1)
description: Asynchronously rewrites the append-only file to disk.
group: server
hidden: false
linkTitle: BGREWRITEAOF
railroad_diagram: /images/railroad/bgrewriteaof.svg
since: 1.0.0
summary: Asynchronously rewrites the append-only file to disk.
syntax_fmt: BGREWRITEAOF
title: BGREWRITEAOF
---
Instruct Redis to start an [Append Only File]({{< relref "/operate/oss_and_stack/management/persistence" >}}#append-only-file) rewrite process.
The rewrite will create a small optimized version of the current Append Only
File.

If `BGREWRITEAOF` fails, no data gets lost as the old AOF will be untouched.

The rewrite will be only triggered by Redis if there is not already a background
process doing persistence.

Specifically:

* If a Redis child is creating a snapshot on disk, the AOF rewrite is _scheduled_ but not started until the saving child producing the RDB file terminates. In this case the `BGREWRITEAOF` will still return a positive status reply, but with an appropriate message.  You can check if an AOF rewrite is scheduled looking at the [`INFO`]({{< relref "/commands/info" >}}) command as of Redis 2.6 or successive versions.
* If an AOF rewrite is already in progress the command returns an error and no
  AOF rewrite will be scheduled for a later time.
* If the AOF rewrite could start, but the attempt at starting it fails (for instance because of an error in creating the child process), an error is returned to the caller.

Since Redis 2.4 the AOF rewrite is automatically triggered by Redis, however the
`BGREWRITEAOF` command can be used to trigger a rewrite at any time.

See the [persistence documentation]({{< relref "/operate/oss_and_stack/management/persistence" >}}) for detailed information.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="bgrewriteaof-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): a simple string reply indicating that the rewriting started or is about to start ASAP when the call is executed with success.
The command may reply with an error in certain cases, as documented above.

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): a simple string reply indicating that the rewriting started or is about to start ASAP when the call is executed with success.
The command may reply with an error in certain cases, as documented above.

{{< /multitabs >}}
