---
acl_categories:
- '@read'
- '@hash'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: cursor
  name: cursor
  type: integer
- display_text: pattern
  name: pattern
  optional: true
  token: MATCH
  type: pattern
- display_text: count
  name: count
  optional: true
  token: COUNT
  type: integer
- display_text: novalues
  name: novalues
  optional: true
  token: NOVALUES
  type: pure-token
arity: -3
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
- readonly
complexity: O(1) for every call. O(N) for a complete iteration, including enough command
  calls for the cursor to return back to 0. N is the number of elements inside the
  collection.
description: Iterates over fields and values of a hash.
group: hash
hidden: false
hints:
- nondeterministic_output
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: HSCAN
since: 2.8.0
summary: Iterates over fields and values of a hash.
syntax_fmt: "HSCAN key cursor [MATCH\_pattern] [COUNT\_count] [NOVALUES]"
syntax_str: "cursor [MATCH\_pattern] [COUNT\_count] [NOVALUES]"
title: HSCAN
---
See [`SCAN`]({{< relref "/commands/scan" >}}) for `HSCAN` documentation.
