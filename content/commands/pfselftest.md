---
acl_categories:
- '@hyperloglog'
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
complexity: N/A
description: An internal command for testing HyperLogLog values.
doc_flags:
- syscmd
group: hyperloglog
hidden: false
linkTitle: PFSELFTEST
since: 2.8.9
summary: An internal command for testing HyperLogLog values.
syntax_fmt: PFSELFTEST
syntax_str: ''
title: PFSELFTEST
---
The `PFSELFTEST` command is an internal command.
It is meant to be used for developing and testing Redis.

## Return information

{{< multitabs id="pfselftest-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
