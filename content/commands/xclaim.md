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
- display_text: consumer
  name: consumer
  type: string
- display_text: min-idle-time
  name: min-idle-time
  type: string
- display_text: id
  multiple: true
  name: id
  type: string
- display_text: ms
  name: ms
  optional: true
  token: IDLE
  type: integer
- display_text: unix-time-milliseconds
  name: unix-time-milliseconds
  optional: true
  token: TIME
  type: unix-time
- display_text: count
  name: count
  optional: true
  token: RETRYCOUNT
  type: integer
- display_text: force
  name: force
  optional: true
  token: FORCE
  type: pure-token
- display_text: justid
  name: justid
  optional: true
  token: JUSTID
  type: pure-token
- display_text: lastid
  name: lastid
  optional: true
  token: LASTID
  type: string
arity: -6
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
command_flags:
- write
- fast
complexity: O(log N) with N being the number of messages in the PEL of the consumer
  group.
description: Changes, or acquires, ownership of a message in a consumer group, as
  if the message was delivered a consumer group member.
group: stream
hidden: false
hints:
- nondeterministic_output
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
linkTitle: XCLAIM
since: 5.0.0
summary: Changes, or acquires, ownership of a message in a consumer group, as if the
  message was delivered a consumer group member.
syntax_fmt: "XCLAIM key group consumer min-idle-time id [id ...] [IDLE\_ms]
  [TIME\_\
  unix-time-milliseconds] [RETRYCOUNT\_count] [FORCE] [JUSTID]
  [LASTID\_lastid]"
syntax_str: "group consumer min-idle-time id [id ...] [IDLE\_ms] [TIME\_unix-time-milliseconds]\
  \ [RETRYCOUNT\_count] [FORCE] [JUSTID] [LASTID\_lastid]"
title: XCLAIM
---
In the context of a stream consumer group, this command changes the ownership
of a pending message, so that the new owner is the consumer specified as the
command argument. Normally this is what happens:

1. There is a stream with an associated consumer group.
2. Some consumer A reads a message via [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) from a stream, in the context of that consumer group.
3. As a side effect a pending message entry is created in the Pending Entries List (PEL) of the consumer group: it means the message was delivered to a given consumer, but it was not yet acknowledged via [`XACK`]({{< relref "/commands/xack" >}}).
4. Then suddenly that consumer fails forever.
5. Other consumers may inspect the list of pending messages, that are stale for quite some time, using the [`XPENDING`]({{< relref "/commands/xpending" >}}) command. In order to continue processing such messages, they use `XCLAIM` to acquire the ownership of the message and continue. Consumers can also use the [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) command to automatically scan and claim stale pending messages.

This dynamic is clearly explained in the [Stream intro documentation]({{< relref "/develop/data-types/streams" >}}).

Note that the message is claimed only if its idle time is greater than the minimum idle time we specify when calling `XCLAIM`. Because as a side effect `XCLAIM` will also reset the idle time (since this is a new attempt at processing the message), two consumers trying to claim a message at the same time will never both succeed: only one will successfully claim the message. This avoids that we process a given message multiple times in a trivial way (yet multiple processing is possible and unavoidable in the general case).

Moreover, as a side effect, `XCLAIM` will increment the count of attempted deliveries of the message unless the `JUSTID` option has been specified (which only delivers the message ID, not the message itself). In this way messages that cannot be processed for some reason, for instance because the consumers crash attempting to process them, will start to have a larger counter and can be detected inside the system.

`XCLAIM` will not claim a message in the following cases:

1. The message doesn't exist in the group PEL (i.e. it was never read by any consumer)
2. The message exists in the group PEL but not in the stream itself (i.e. the message was read but never acknowledged, and then was deleted from the stream, either by trimming or by [`XDEL`]({{< relref "/commands/xdel" >}}))

In both cases the reply will not contain a corresponding entry to that message (i.e. the length of the reply array may be smaller than the number of IDs provided to `XCLAIM`).
In the latter case, the message will also be deleted from the PEL in which it was found. This feature was introduced in Redis 7.0.

## Command options

The command has multiple options, however most are mainly for internal use in
order to transfer the effects of `XCLAIM` or other commands to the AOF file
and to propagate the same effects to the replicas, and are unlikely to be
useful to normal users:

1. `IDLE <ms>`: Set the idle time (last time it was delivered) of the message. If IDLE is not specified, an IDLE of 0 is assumed, that is, the time count is reset because the message has now a new owner trying to process it.
2. `TIME <ms-unix-time>`: This is the same as IDLE but instead of a relative amount of milliseconds, it sets the idle time to a specific Unix time (in milliseconds). This is useful in order to rewrite the AOF file generating `XCLAIM` commands.
3. `RETRYCOUNT <count>`: Set the retry counter to the specified value. If not set, `XCLAIM` will increment the retry counter every time a message is delivered again.
4. `FORCE`: Creates the pending message entry in the PEL even if certain specified IDs are not already in the PEL assigned to a different client. However the message must be exist in the stream, otherwise the IDs of non existing messages are ignored.
5. `JUSTID`: Return just an array of IDs of messages successfully claimed, without returning the actual message. Using this option means the retry counter is not incremented.

## Examples

```
> XCLAIM mystream mygroup Alice 3600000 1526569498055-0
1) 1) 1526569498055-0
   2) 1) "message"
      2) "orange"
```

In the above example we claim the message with ID `1526569498055-0`, only if the message is idle for at least one hour without the original consumer or some other consumer making progresses (acknowledging or claiming it), and assigns the ownership to the consumer `Alice`.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="xclaim-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

Any of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): when the _JUSTID_ option is specified, an array of IDs of messages successfully claimed.
* [Array reply](../../develop/reference/protocol-spec#arrays): an array of stream entries, each of which contains an array of two elements, the entry ID and the entry data itself.

-tab-sep-

Any of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): when the _JUSTID_ option is specified, an array of IDs of messages successfully claimed.
* [Array reply](../../develop/reference/protocol-spec#arrays): an array of stream entries, each of which contains an array of two elements, the entry ID and the entry data itself.

{{< /multitabs >}}
