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
