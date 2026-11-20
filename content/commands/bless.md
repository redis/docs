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
description: A container for key-blessing commands.
group: generic
hidden: true
linkTitle: BLESS
railroad_diagram: /images/railroad/bless.svg
since: 8.12.0
summary: A container for key-blessing commands.
syntax_fmt: BLESS
title: BLESS
---
This is a container command for commands that protect keys from eviction.

The `BLESS` command has the following subcommands:

* [`BLESS SET`]({{< relref "/commands/bless-set" >}}) protects a key from eviction.
* [`BLESS CLEAR`]({{< relref "/commands/bless-clear" >}}) removes eviction protection from a key.
* [`BLESS GET`]({{< relref "/commands/bless-get" >}}) returns a key's active protection flags.
* [`BLESS SCAN`]({{< relref "/commands/bless-scan" >}}) iterates the keys that carry a given protection flag.
