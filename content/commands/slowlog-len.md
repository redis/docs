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
complexity: O(1)
description: Returns the number of entries in the slow log.
group: server
hidden: false
hints:
- request_policy:all_nodes
- response_policy:agg_sum
- nondeterministic_output
linkTitle: SLOWLOG LEN
since: 2.2.12
summary: Returns the number of entries in the slow log.
syntax_fmt: SLOWLOG LEN
syntax_str: ''
title: SLOWLOG LEN
---
This command returns the current number of entries in the slow log.

A new entry is added to the slow log whenever a command exceeds the execution time threshold defined by the `slowlog-log-slower-than` configuration directive.
The maximum number of entries in the slow log is governed by the `slowlog-max-len` configuration directive.
Once the slog log reaches its maximal size, the oldest entry is removed whenever a new entry is created.
The slow log can be cleared with the [`SLOWLOG RESET`]({{< relref "/commands/slowlog-reset" >}}) command.

## Return information

{{< multitabs id="slowlog-len-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of entries in the slow log.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of entries in the slow log.

{{< /multitabs >}}
