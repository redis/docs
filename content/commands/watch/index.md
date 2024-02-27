---
acl_categories:
- '@fast'
- '@transaction'
arguments:
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
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
- noscript
- loading
- stale
- fast
- allow_busy
complexity: O(1) for every key.
description: Monitors changes to keys to determine the execution of a transaction.
group: transactions
hidden: false
key_specs:
- RO: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: -1
      limit: 0
    type: range
linkTitle: WATCH
since: 2.2.0
summary: Monitors changes to keys to determine the execution of a transaction.
syntax_fmt: WATCH key [key ...]
syntax_str: ''
title: WATCH
---
Marks the given keys to be watched for conditional execution of a
[transaction][tt].

[tt]: /develop/interact/transactions
