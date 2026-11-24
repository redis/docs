---
acl_categories:
- '@fast'
- '@connection'
arguments:
- display_text: message
  name: message
  type: string
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
- loading
- stale
- fast
compatibility:
  software:
    standard: supported
    active_active: supported
  cloud:
    standard: supported
    active_active: supported
complexity: O(1)
description: Returns the given string.
group: connection
hidden: false
linkTitle: ECHO
railroad_diagram: /images/railroad/echo.svg
since: 1.0.0
summary: Returns the given string.
syntax_fmt: ECHO message
title: ECHO
---
Returns `message`.

## Required arguments

<details open><summary><code>message</code></summary>

The message to echo back.

</details>

## Examples

{{% redis-cli %}}
redis> ECHO "Hello World!"
"Hello World!"
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="echo-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the given string.

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the given string.

{{< /multitabs >}}
