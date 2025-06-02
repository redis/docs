---
acl_categories:
- '@write'
- '@stream'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: group
  name: group
  type: string
- display_text: id
  multiple: true
  name: id
  type: string
arity: -4
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
- write
- fast
complexity: O(1) for each message ID processed.
description: Returns the number of messages that were successfully acknowledged by
  the consumer group member of a stream.
group: stream
hidden: false
key_specs:
- RW: true
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
  update: true
linkTitle: XACK
since: 5.0.0
summary: Returns the number of messages that were successfully acknowledged by the
  consumer group member of a stream.
syntax_fmt: XACK key group id [id ...]
syntax_str: group id [id ...]
title: XACK
---
The `XACK` command removes one or multiple messages from the
*Pending Entries List* (PEL) of a stream consumer group. A message is pending,
and as such stored inside the PEL, when it was delivered to some consumer,
normally as a side effect of calling [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}), or when a consumer took
ownership of a message calling [`XCLAIM`]({{< relref "/commands/xclaim" >}}). The pending message was delivered to
some consumer but the server is yet not sure it was processed at least once.
So new calls to [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) to grab the messages history for a consumer
(for instance using an ID of 0), will return such message.
Similarly the pending message will be listed by the [`XPENDING`]({{< relref "/commands/xpending" >}}) command,
that inspects the PEL.

Once a consumer *successfully* processes a message, it should call `XACK`
so that such message does not get processed again, and as a side effect,
the PEL entry about this message is also purged, releasing memory from the
Redis server.

## Examples

```
redis> XACK mystream mygroup 1526569495631-0
(integer) 1
```
