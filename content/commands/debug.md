---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
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
command_flags:
- admin
- noscript
- loading
- stale
compatibility:
  software:
    standard: unsupported
    active_active: unsupported
  cloud:
    standard: unsupported
    active_active: unsupported
complexity: Depends on subcommand.
description: A container for debugging commands.
doc_flags:
- syscmd
group: server
hidden: true
linkTitle: DEBUG
railroad_diagram: /images/railroad/debug.svg
since: 1.0.0
summary: A container for debugging commands.
syntax_fmt: DEBUG
title: DEBUG
---
The `DEBUG` command is an internal command.
It is meant to be used for developing and testing Redis.

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}
