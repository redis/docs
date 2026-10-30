---
acl_categories:
- '@slow'
- '@connection'
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
- noscript
- loading
- stale
compatibility:
  software:
    standard: supported
    active_active: supported
  cloud:
    standard: supported
    active_active: supported
  notes:
  - Because Redis Software clustering allows [multiple active proxies](/content/operate/rs/databases/configure/proxy-policy.md), `CLIENT ID` cannot guarantee incremental IDs between clients that connect to different nodes under multi proxy policies.
complexity: O(1)
description: Returns the unique client ID of the connection.
group: connection
hidden: false
linkTitle: CLIENT ID
railroad_diagram: /images/railroad/client-id.svg
since: 5.0.0
summary: Returns the unique client ID of the connection.
syntax_fmt: CLIENT ID
title: CLIENT ID
---
The command just returns the ID of the current connection. Every connection
ID has certain guarantees:

1. It is never repeated, so if `CLIENT ID` returns the same number, the caller can be sure that the underlying client did not disconnect and reconnect the connection, but it is still the same connection.
2. The ID is monotonically incremental. If the ID of a connection is greater than the ID of another connection, it is guaranteed that the second connection was established with the server at a later time.

This command is especially useful together with [`CLIENT UNBLOCK`](/content/commands/client-unblock.md) which was
introduced also in Redis 5 together with `CLIENT ID`. Check the [`CLIENT UNBLOCK`](/content/commands/client-unblock.md) command page for a pattern involving the two commands.

## Examples

{{% redis-cli %}}
redis> CLIENT ID
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="client-id-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the ID of the client.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the ID of the client.

{{< /multitabs >}}
