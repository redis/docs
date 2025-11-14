---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: replicationid
  name: replicationid
  type: string
- display_text: offset
  name: offset
  type: integer
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
- no_async_loading
- no_multi
description: An internal command used in replication.
group: server
hidden: false
linkTitle: PSYNC
since: 2.8.0
summary: An internal command used in replication.
syntax_fmt: PSYNC replicationid offset
syntax_str: offset
title: PSYNC
---
Initiates a replication stream from the master.

The `PSYNC` command is called by Redis replicas for initiating a replication
stream from the master.

For more information about replication in Redis please check the
[replication page]({{< relref "/operate/oss_and_stack/management/replication" >}}).

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="psync-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

**Non-standard return value**, a bulk transfer of the data followed by `PING` and write requests from the master.

-tab-sep-

**Non-standard return value**, a bulk transfer of the data followed by `PING` and write requests from the master.

{{< /multitabs >}}
