---
acl_categories:
- '@hash'
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
description: A container for session-based hash import commands using fieldsets.
group: hash
hidden: false
linkTitle: HIMPORT
railroad_diagram: /images/railroad/himport.svg
since: 8.10.0
summary: A container for session-based hash import commands using fieldsets.
syntax_fmt: HIMPORT
title: HIMPORT
---
`HIMPORT` is a container command for session-based bulk hash import. Its subcommands let a client import many similarly-shaped hashes efficiently by declaring the shared field names once and then sending only the values for each key.

The subcommands are:

- [`HIMPORT PREPARE`]({{< relref "/commands/himport-prepare" >}}) — define a session-local fieldset that names an ordered list of field names.
- [`HIMPORT SET`]({{< relref "/commands/himport-set" >}}) — create a hash from a prepared fieldset and a list of values.
- [`HIMPORT DISCARD`]({{< relref "/commands/himport-discard" >}}) — remove a single fieldset by name.
- [`HIMPORT DISCARDALL`]({{< relref "/commands/himport-discardall" >}}) — remove every fieldset held by the connection.

## Details

A *fieldset* is a named, ordered list of field names that is scoped to the client connection: it is not visible to other clients and is discarded when the connection closes or the client issues the [`RESET`]({{< relref "/commands/reset" >}}) command. A connection can prepare several fieldsets, each under its own name, and refer to them by name in later commands.

The typical workflow is to declare a fieldset once with [`HIMPORT PREPARE`]({{< relref "/commands/himport-prepare" >}}), then create many keys from it with [`HIMPORT SET`]({{< relref "/commands/himport-set" >}}), sending only the values each time:

```shell
HIMPORT PREPARE u name email age
HIMPORT SET user:1 u alice a@example.com 30
HIMPORT SET user:2 u bob b@example.com 25
```

Because every key created this way shares one fixed set of field names, `HIMPORT` reduces the network traffic and per-command work compared with running [`HSET`]({{< relref "/commands/hset" >}}) once per key. Redis also uses the shared field names as a hint to store the keys with an internal encoding that keeps a single copy of the field names, which reduces memory when many keys share the same layout. This encoding is internal and does not change the behavior or replies of any existing hash command.
