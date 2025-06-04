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
