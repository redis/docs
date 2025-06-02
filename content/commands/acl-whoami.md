---
acl_categories:
- '@slow'
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
- noscript
- loading
- stale
complexity: O(1)
description: Returns the authenticated username of the current connection.
group: server
hidden: false
linkTitle: ACL WHOAMI
since: 6.0.0
summary: Returns the authenticated username of the current connection.
syntax_fmt: ACL WHOAMI
syntax_str: ''
title: ACL WHOAMI
---
Return the username the current connection is authenticated with.
New connections are authenticated with the "default" user. They
can change user using [`AUTH`]({{< relref "/commands/auth" >}}).

## Examples

```
> ACL WHOAMI
"default"
```
