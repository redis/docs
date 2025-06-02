---
acl_categories:
- '@slow'
- '@connection'
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
description: Returns the name of the connection.
group: connection
hidden: false
linkTitle: CLIENT GETNAME
since: 2.6.9
summary: Returns the name of the connection.
syntax_fmt: CLIENT GETNAME
syntax_str: ''
title: CLIENT GETNAME
---
The `CLIENT GETNAME` returns the name of the current connection as set by [`CLIENT SETNAME`]({{< relref "/commands/client-setname" >}}). Since every new connection starts without an associated name, if no name was assigned a null bulk reply is returned.
