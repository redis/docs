---
acl_categories:
- '@fast'
- '@connection'
arguments:
- display_text: message
  name: message
  optional: true
  type: string
arity: -1
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
- fast
complexity: O(1)
description: Returns the server's liveliness response.
group: connection
hidden: false
hints:
- request_policy:all_shards
- response_policy:all_succeeded
linkTitle: PING
since: 1.0.0
summary: Returns the server's liveliness response.
syntax_fmt: PING [message]
syntax_str: ''
title: PING
---
Returns `PONG` if no argument is provided, otherwise return a copy of the
argument as a bulk.
This command is useful for:
1. Testing whether a connection is still alive.
1. Verifying the server's ability to serve data - an error is returned when this isn't the case (e.g., during load from persistence or accessing a stale replica).
1. Measuring latency.

If the client is subscribed to a channel or a pattern, it will instead return a
multi-bulk with a "pong" in the first position and an empty bulk in the second
position, unless an argument is provided in which case it returns a copy
of the argument.

## Examples

{{% redis-cli %}}
PING

PING "hello world"
{{% /redis-cli %}}

