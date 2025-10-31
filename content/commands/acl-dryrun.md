---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: username
  name: username
  type: string
- display_text: command
  name: command
  type: string
- display_text: arg
  multiple: true
  name: arg
  optional: true
  type: string
arity: -4
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
complexity: O(1).
description: Simulates the execution of a command by a user, without executing the
  command.
group: server
hidden: false
linkTitle: ACL DRYRUN
since: 7.0.0
summary: Simulates the execution of a command by a user, without executing the command.
syntax_fmt: ACL DRYRUN username command [arg [arg ...]]
syntax_str: command [arg [arg ...]]
title: ACL DRYRUN
---
Simulate the execution of a given command by a given user.
This command can be used to test the permissions of a given user without having to enable the user or cause the side effects of running the command.

## Examples

```
> ACL SETUSER VIRGINIA +SET ~*
"OK"
> ACL DRYRUN VIRGINIA SET foo bar
"OK"
> ACL DRYRUN VIRGINIA GET foo
"User VIRGINIA has no permissions to run the 'get' command"
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Might reply with "unknown user" for LDAP users even if `AUTH` succeeds. |

## Return information

{{< multitabs id="acl-dryrun-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

Any of the following:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` on success.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): an error describing why the user can't execute the command.

-tab-sep-

Any of the following:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` on success.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): an error describing why the user can't execute the command.

{{< /multitabs >}}
