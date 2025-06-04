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
complexity: O(1)
description: Returns the given string.
group: connection
hidden: false
linkTitle: ECHO
since: 1.0.0
summary: Returns the given string.
syntax_fmt: ECHO message
syntax_str: ''
title: ECHO
---
Returns `message`.

## Examples

{{% redis-cli %}}
ECHO "Hello World!"
{{% /redis-cli %}}

## Return information

{{< multitabs id="echo-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the given string.

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the given string.

{{< /multitabs >}}
