---
acl_categories:
- '@write'
- '@slow'
- '@scripting'
arguments:
- arguments:
  - display_text: async
    name: async
    token: ASYNC
    type: pure-token
  - display_text: sync
    name: sync
    token: SYNC
    type: pure-token
  name: flush-type
  optional: true
  type: oneof
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
- write
- noscript
complexity: O(N) where N is the number of functions deleted
description: Deletes all libraries and functions.
group: scripting
hidden: false
hints:
- request_policy:all_shards
- response_policy:all_succeeded
linkTitle: FUNCTION FLUSH
since: 7.0.0
summary: Deletes all libraries and functions.
syntax_fmt: FUNCTION FLUSH [ASYNC | SYNC]
syntax_str: ''
title: FUNCTION FLUSH
---
Deletes all the libraries.

Unless called with the optional mode argument, the `lazyfree-lazy-user-flush` configuration directive sets the effective behavior. Valid modes are:

* `ASYNC`: Asynchronously flush the libraries.
* `SYNC`: Synchronously flush the libraries.

For more information please refer to [Introduction to Redis Functions]({{< relref "/develop/interact/programmability/functions-intro" >}}).
