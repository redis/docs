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
compatibility:
  software:
    standard: supported
    active_active: supported
  cloud:
    standard: supported
    active_active: supported
  notes:
  - Not supported for [scripts](/content/develop/programmability/_index.md).
complexity: O(1)
description: Returns the authenticated username of the current connection.
group: server
hidden: false
linkTitle: ACL WHOAMI
railroad_diagram: /images/railroad/acl-whoami.svg
since: 6.0.0
summary: Returns the authenticated username of the current connection.
syntax_fmt: ACL WHOAMI
title: ACL WHOAMI
---
Return the username the current connection is authenticated with.
New connections are authenticated with the "default" user. They
can change user using [`AUTH`](/content/commands/auth.md).

## Examples

```
> ACL WHOAMI
"default"
```

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="acl-whoami-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the username of the current connection.

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the username of the current connection.

{{< /multitabs >}}
