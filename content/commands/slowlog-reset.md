---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arity: 2
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
- loading
- stale
complexity: O(N) where N is the number of entries in the slowlog
description: Clears all entries from the slow log.
group: server
hidden: false
hints:
- request_policy:all_nodes
- response_policy:all_succeeded
linkTitle: SLOWLOG RESET
since: 2.2.12
summary: Clears all entries from the slow log.
syntax_fmt: SLOWLOG RESET
syntax_str: ''
title: SLOWLOG RESET
---
This command resets the slow log, clearing all entries in it.

Once deleted the information is lost forever.
