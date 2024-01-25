---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: username
  multiple: true
  name: username
  type: string
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
- loading
- stale
complexity: O(1) amortized time considering the typical user.
description: Deletes ACL users, and terminates their connections.
group: server
hidden: false
hints:
- request_policy:all_nodes
- response_policy:all_succeeded
linkTitle: ACL DELUSER
since: 6.0.0
summary: Deletes ACL users, and terminates their connections.
syntax_fmt: ACL DELUSER username [username ...]
syntax_str: ''
title: ACL DELUSER
---
Delete all the specified ACL users and terminate all the connections that are
authenticated with such users. Note: the special `default` user cannot be
removed from the system, this is the default user that every new connection
is authenticated with. The list of users may include usernames that do not
exist, in such case no operation is performed for the non existing users.

## Examples

```
> ACL DELUSER antirez
1
```
