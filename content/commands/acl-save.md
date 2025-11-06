---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arity: 2
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
complexity: O(N). Where N is the number of configured users.
description: Saves the effective ACL rules in the configured ACL file.
group: server
hidden: false
hints:
- request_policy:all_nodes
- response_policy:all_succeeded
linkTitle: ACL SAVE
railroad_diagram: /images/railroad/acl-save.svg
since: 6.0.0
summary: Saves the effective ACL rules in the configured ACL file.
syntax_fmt: ACL SAVE
syntax_str: ''
title: ACL SAVE
---
When Redis is configured to use an ACL file (with the `aclfile` configuration
option), this command will save the currently defined ACLs from the server memory to the ACL file.

## Examples

```
> ACL SAVE
+OK

> ACL SAVE
-ERR There was an error trying to save the ACLs. Please check the server logs for more information
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="acl-save-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.
The command may fail with an error for several reasons: if the file cannot be written or if the server is not configured to use an external ACL file.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.
The command may fail with an error for several reasons: if the file cannot be written or if the server is not configured to use an external ACL file.

{{< /multitabs >}}
