---
acl_categories:
- '@slow'
- '@connection'
arguments:
- arguments:
  - display_text: 'yes'
    name: 'yes'
    token: 'YES'
    type: pure-token
  - display_text: 'no'
    name: 'no'
    token: 'NO'
    type: pure-token
  name: mode
  type: oneof
arity: 3
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
description: Instructs the server whether to track the keys in the next request.
group: connection
hidden: false
linkTitle: CLIENT CACHING
since: 6.0.0
summary: Instructs the server whether to track the keys in the next request.
syntax_fmt: CLIENT CACHING <YES | NO>
syntax_str: ''
title: CLIENT CACHING
---
This command controls the tracking of the keys in the next command executed
by the connection, when tracking is enabled in `OPTIN` or `OPTOUT` mode.
Please check the
[client side caching documentation]({{< relref "/develop/clients/client-side-caching" >}}) for
background information.

When tracking is enabled Redis, using the [`CLIENT TRACKING`]({{< relref "/commands/client-tracking" >}}) command, it is
possible to specify the `OPTIN` or `OPTOUT` options, so that keys
in read only commands are not automatically remembered by the server to
be invalidated later. When we are in `OPTIN` mode, we can enable the
tracking of the keys in the next command by calling `CLIENT CACHING yes`
immediately before it. Similarly when we are in `OPTOUT` mode, and keys
are normally tracked, we can avoid the keys in the next command to be
tracked using `CLIENT CACHING no`.

Basically the command sets a state in the connection, that is valid only
for the next command execution, that will modify the behavior of client
tracking.
