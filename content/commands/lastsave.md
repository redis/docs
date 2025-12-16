---
acl_categories:
- '@admin'
- '@fast'
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
- loading
- stale
- fast
complexity: O(1)
description: Returns the Unix timestamp of the last successful save to disk.
group: server
hidden: false
hints:
- nondeterministic_output
linkTitle: LASTSAVE
railroad_diagram: /images/railroad/lastsave.svg
since: 1.0.0
summary: Returns the Unix timestamp of the last successful save to disk.
syntax_fmt: LASTSAVE
syntax_str: ''
title: LASTSAVE
---
Return the UNIX TIME of the last DB save executed with success.
A client may check if a [`BGSAVE`]({{< relref "/commands/bgsave" >}}) command succeeded reading the `LASTSAVE` value,
then issuing a [`BGSAVE`]({{< relref "/commands/bgsave" >}}) command and checking at regular intervals every N
seconds if `LASTSAVE` changed. Redis considers the database saved successfully at startup.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="lastsave-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): UNIX TIME of the last DB save executed with success.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): UNIX TIME of the last DB save executed with success.

{{< /multitabs >}}
