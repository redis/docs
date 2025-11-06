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
- no_multi
complexity: O(N) where N is the total number of keys in all databases
description: Synchronously saves the database(s) to disk.
group: server
hidden: false
linkTitle: SAVE
since: 1.0.0
summary: Synchronously saves the database(s) to disk.
syntax_fmt: SAVE
syntax_str: ''
title: SAVE
---
The `SAVE` commands performs a **synchronous** save of the dataset producing a
_point in time_ snapshot of all the data inside the Redis instance, in the form
of an RDB file.

You almost never want to call `SAVE` in production environments where it will
block all the other clients.
Instead usually [`BGSAVE`]({{< relref "/commands/bgsave" >}}) is used.
However in case of issues preventing Redis to create the background saving child
(for instance errors in the fork(2) system call), the `SAVE` command can be a
good last resort to perform the dump of the latest dataset.

See the [persistence documentation]({{< relref "/operate/oss_and_stack/management/persistence" >}}) for detailed information.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="save-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
