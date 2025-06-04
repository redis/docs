---
acl_categories:
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
- loading
- stale
- fast
complexity: O(1)
description: Returns the server time.
group: server
hidden: false
hints:
- nondeterministic_output
linkTitle: TIME
since: 2.6.0
summary: Returns the server time.
syntax_fmt: TIME
syntax_str: ''
title: TIME
---
The `TIME` command returns the current server time as a two items lists: a Unix
timestamp and the amount of microseconds already elapsed in the current second.
Basically the interface is very similar to the one of the `gettimeofday` system
call.

## Examples

{{% redis-cli %}}
TIME
TIME
{{% /redis-cli %}}

## Return information

{{< multitabs id="time-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): specifically, a two-element array consisting of the Unix timestamp in seconds and the microseconds' count.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): specifically, a two-element array consisting of the Unix timestamp in seconds and the microseconds' count.

{{< /multitabs >}}
