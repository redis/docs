---
acl_categories:
- '@slow'
- '@connection'
arguments:
- display_text: connection-name
  name: connection-name
  type: string
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
description: Sets the connection name.
group: connection
hidden: false
hints:
- request_policy:all_nodes
- response_policy:all_succeeded
linkTitle: CLIENT SETNAME
since: 2.6.9
summary: Sets the connection name.
syntax_fmt: CLIENT SETNAME connection-name
syntax_str: ''
title: CLIENT SETNAME
---
The `CLIENT SETNAME` command assigns a name to the current connection.

The assigned name is displayed in the output of [`CLIENT LIST`]({{< relref "/commands/client-list" >}}) so that it is possible to identify the client that performed a given connection.

For instance when Redis is used in order to implement a queue, producers and consumers of messages may want to set the name of the connection according to their role.

There is no limit to the length of the name that can be assigned if not the usual limits of the Redis string type (512 MB). However it is not possible to use spaces in the connection name as this would violate the format of the [`CLIENT LIST`]({{< relref "/commands/client-list" >}}) reply.

It is possible to entirely remove the connection name setting it to the empty string, that is not a valid connection name since it serves to this specific purpose.

The connection name can be inspected using [`CLIENT GETNAME`]({{< relref "/commands/client-getname" >}}).

Every new connection starts without an assigned name.

Tip: setting names to connections is a good way to debug connection leaks due to bugs in the application using Redis.
