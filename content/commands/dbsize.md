---
acl_categories:
- '@keyspace'
- '@read'
- '@fast'
arity: 1
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
- fast
complexity: O(1)
description: Returns the number of keys in the database.
group: server
hidden: false
hints:
- request_policy:all_shards
- response_policy:agg_sum
linkTitle: DBSIZE
since: 1.0.0
summary: Returns the number of keys in the database.
syntax_fmt: DBSIZE
syntax_str: ''
title: DBSIZE
---
Return the number of keys in the currently-selected database.
