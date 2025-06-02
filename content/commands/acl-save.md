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
