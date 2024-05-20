---
acl_categories:
- '@slow'
arity: -2
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
complexity: Depends on subcommand.
description: A container for slow log commands.
group: server
hidden: true
linkTitle: SLOWLOG
since: 2.2.12
summary: A container for slow log commands.
syntax_fmt: SLOWLOG
syntax_str: ''
title: SLOWLOG
---
The Redis Slow Log is a system to log queries that exceeded a specified execution time.
The execution time does not include I/O operations like talking with the client, sending the reply and so forth, but just the time needed to actually execute the command (this is the only stage of command execution where the thread is blocked and can not serve other requests in the meantime).

A new entry is added to the slow log whenever a command exceeds the execution time threshold defined by the `slowlog-log-slower-than` configuration directive.

The maximum number of entries in the slow log is governed by the `slowlog-max-len` configuration directive.
This is a container command for slow log management commands.

See [`SLOWLOG GET`]({{< relref "/commands/slowlog-get" >}}) for a description of what's stored in the Redis Slow Log. To see the list of available commands use the [`SLOWLOG HELP`]({{< relref "/commands/slowlog-help" >}}) command.
