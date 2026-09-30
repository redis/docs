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
`HIMPORT` is a container command for session-based bulk hash import. Its subcommands let a client import many hashes that share the same field names efficiently by declaring those field names once and then sending only the values for each key.

The subcommands are:

- [`HIMPORT PREPARE`](/content/commands/himport-prepare.md) — define a session-local fieldset that names an ordered list of field names.
- [`HIMPORT SET`](/content/commands/himport-set.md) — create a hash from a prepared fieldset and a list of values.
- [`HIMPORT DISCARD`](/content/commands/himport-discard.md) — remove a single fieldset by name.
- [`HIMPORT DISCARDALL`](/content/commands/himport-discardall.md) — remove every fieldset held by the connection.

## Details

A *fieldset* is a named, ordered list of field names that is scoped to the client connection: it is not visible to other clients and is discarded when the connection closes or the client issues the [`RESET`](/content/commands/reset.md) command. A connection can prepare several fieldsets, each under its own name, and refer to them by name in later commands.

The typical workflow is to declare a fieldset once with [`HIMPORT PREPARE`](/content/commands/himport-prepare.md), then create many keys from it with [`HIMPORT SET`](/content/commands/himport-set.md), sending only the values each time:

```
HIMPORT PREPARE u name email age
HIMPORT SET user:1 u alice a@example.com 30
HIMPORT SET user:2 u bob b@example.com 25
```

Because every key created this way shares one fixed set of field names, `HIMPORT` reduces the network traffic and per-command work compared with running [`HSET`](/content/commands/hset.md) once per key. Redis also uses the shared field names as a hint to store the keys as [compact hashes](/content/develop/data-types/hashes.md#compact-hashes), an internal encoding that keeps a single copy of the field names and reduces memory when many keys share the same layout. This encoding does not change the behavior or replies of any existing hash command.
