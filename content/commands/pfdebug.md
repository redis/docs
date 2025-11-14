---
acl_categories:
- '@write'
- '@hyperloglog'
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: subcommand
  name: subcommand
  type: string
- display_text: key
  key_spec_index: 0
  name: key
  type: key
arity: 3
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
- write
- denyoom
- admin
complexity: N/A
description: Internal commands for debugging HyperLogLog values.
doc_flags:
- syscmd
group: hyperloglog
hidden: false
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: PFDEBUG
since: 2.8.9
summary: Internal commands for debugging HyperLogLog values.
syntax_fmt: PFDEBUG subcommand key
syntax_str: key
title: PFDEBUG
---
The `PFDEBUG` command is an internal command.
It is meant to be used for developing and testing Redis.