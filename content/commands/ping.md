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
compatibility:
  software:
    standard: supported
    active_active: supported
  cloud:
    standard: supported
    active_active: supported
complexity: O(1)
description: Returns the server's liveliness response.
group: connection
hidden: false
hints:
- request_policy:all_shards
- response_policy:all_succeeded
linkTitle: PING
railroad_diagram: /images/railroad/ping.svg
since: 1.0.0
summary: Returns the server's liveliness response.
syntax_fmt: PING [message]
title: PING
---

This command returns the simple string `PONG` if no argument is provided, otherwise it returns a copy of the
provided `message` as a bulk string.

This command is useful for:
1. Testing whether a connection is still alive.
1. Verifying the server's ability to serve data - an error is returned when this isn't the case (for example, during load from persistence data or accessing a stale replica).
1. Measuring latency.

If a RESP2 client is subscribed to a channel, pattern, or shard channel, PING returns a
two-element array instead. The first element is the bulk string `pong` (lowercase). The
second is a copy of `message` if you provide one, or an empty bulk string if you don't.
RESP3 clients get the standard reply whether or not they're subscribed.

## Optional arguments

<details open><summary><code>message</code></summary>

A message to return instead of `PONG`.

</details>

## Examples

{{% redis-cli %}}
redis> PING
PONG
redis> PING "hello world"
"hello world"
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="ping-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

Any of the following:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `PONG` when no argument is provided.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the provided argument.
* [Array reply](../../develop/reference/protocol-spec#arrays): "`pong`" and either the provided argument or an empty bulk string, when the client is in subscribed mode.

-tab-sep-

Any of the following:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `PONG` when no argument is provided.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the provided argument.

{{< /multitabs >}}
