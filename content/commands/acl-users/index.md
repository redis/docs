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
description: Lists all ACL users.
group: server
hidden: false
linkTitle: ACL USERS
since: 6.0.0
summary: Lists all ACL users.
syntax_fmt: ACL USERS
syntax_str: ''
title: ACL USERS
---
The command shows a list of all the usernames of the currently configured
users in the Redis ACL system.

## Examples

```
> ACL USERS
1) "anna"
2) "antirez"
3) "default"
```
