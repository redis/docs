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
- kubernetes
- clients
command_flags:
- admin
- noscript
- loading
- stale
complexity: Depends on subcommand.
description: A container for debugging commands.
doc_flags:
- syscmd
group: server
hidden: true
linkTitle: DEBUG
since: 1.0.0
summary: A container for debugging commands.
syntax_fmt: DEBUG
syntax_str: ''
title: DEBUG
---
The `DEBUG` command is an internal command.
It is meant to be used for developing and testing Redis.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
