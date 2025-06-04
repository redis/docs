---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
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
- admin
- noscript
- loading
- stale
- allow_busy
complexity: O(1)
description: An internal command for configuring the replication stream.
doc_flags:
- syscmd
group: server
hidden: false
linkTitle: REPLCONF
since: 3.0.0
summary: An internal command for configuring the replication stream.
syntax_fmt: REPLCONF
syntax_str: ''
title: REPLCONF
---
The `REPLCONF` command is an internal command.
It is used by a Redis master to configure a connected replica.

## Return information

{{< multitabs id="replconf-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
