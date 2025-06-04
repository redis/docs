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
description: An internal command used in replication.
group: server
hidden: false
linkTitle: SYNC
since: 1.0.0
summary: An internal command used in replication.
syntax_fmt: SYNC
syntax_str: ''
title: SYNC
---
Initiates a replication stream from the master.

The `SYNC` command is called by Redis replicas for initiating a replication
stream from the master. It has been replaced in newer versions of Redis by
 [`PSYNC`]({{< relref "/commands/psync" >}}).

For more information about replication in Redis please check the
[replication page][tr].

[tr]: /operate/oss_and_stack/management/replication

## Return information

{{< multitabs id="sync-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

**Non-standard return value**, a bulk transfer of the data followed by `PING` and write requests from the master.

-tab-sep-

**Non-standard return value**, a bulk transfer of the data followed by `PING` and write requests from the master.

{{< /multitabs >}}
