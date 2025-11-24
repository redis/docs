---
acl_categories:
- '@read'
- '@stream'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
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
- readonly
- fast
complexity: O(1)
description: Return the number of messages in a stream.
group: stream
hidden: false
key_specs:
- RO: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: XLEN
since: 5.0.0
summary: Return the number of messages in a stream.
syntax_fmt: XLEN key
syntax_str: ''
title: XLEN
---
Returns the number of entries inside a stream. If the specified key does not
exist the command returns zero, as if the stream was empty.
However note that unlike other Redis types, zero-length streams are
possible, so you should call [`TYPE`]({{< relref "/commands/type" >}}) or [`EXISTS`]({{< relref "/commands/exists" >}}) in order to check if
a key exists or not.

Streams are not auto-deleted once they have no entries inside (for instance
after an [`XDEL`]({{< relref "/commands/xdel" >}}) call), because the stream may have consumer groups
associated with it.

## Examples

{{% redis-cli %}}
XADD mystream * item 1
XADD mystream * item 2
XADD mystream * item 3
XLEN mystream
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="xlen-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of entries of the stream at _key_.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of entries of the stream at _key_.

{{< /multitabs >}}
