---
acl_categories:
- '@write'
- '@stream'
- '@slow'
- '@blocking'
arguments:
- arguments:
  - display_text: group
    name: group
    type: string
  - display_text: consumer
    name: consumer
    type: string
  name: group-block
  token: GROUP
  type: block
- display_text: count
  name: count
  optional: true
  token: COUNT
  type: integer
- display_text: milliseconds
  name: milliseconds
  optional: true
  token: BLOCK
  type: integer
- display_text: min-idle-time
  name: min-idle-time
  optional: true
  token: CLAIM
  type: integer
- display_text: noack
  name: noack
  optional: true
  token: NOACK
  type: pure-token
- arguments:
  - display_text: key
    key_spec_index: 0
    multiple: true
    name: key
    type: key
  - display_text: id
    multiple: true
    name: id
    type: string
  name: streams
  token: STREAMS
  type: block
arity: -7
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
- blocking
- movablekeys
complexity: 'For each stream mentioned: O(M) with M being the number of elements returned.
  If M is constant (e.g. always asking for the first 10 elements with COUNT), you
  can consider it O(1). On the other side when XREADGROUP blocks, XADD will pay the
  O(N) time in order to serve the N clients blocked on the stream getting new data.'
description: Returns new or historical messages from a stream for a consumer in a
  group. Blocks until a message is available otherwise.
group: stream
hidden: false
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      keyword: STREAMS
      startfrom: 4
    type: keyword
  find_keys:
    spec:
      keystep: 1
      lastkey: -1
      limit: 2
    type: range
linkTitle: XREADGROUP
railroad_diagram: /images/railroad/xreadgroup.svg
since: 5.0.0
summary: Returns new or historical messages from a stream for a consumer in a group.
  Blocks until a message is available otherwise.
syntax_fmt: "XREADGROUP GROUP\_group consumer [COUNT\_count] [BLOCK\_milliseconds]\n\
  \  [CLAIM\_min-idle-time] [NOACK] STREAMS\_key [key ...] id [id ...]"
title: XREADGROUP
---
The `XREADGROUP` command is a special version of the [`XREAD`]({{< relref "/commands/xread" >}}) command
with support for consumer groups. Probably you will have to understand the
[`XREAD`]({{< relref "/commands/xread" >}}) command before reading this page will makes sense.

Moreover, if you are new to streams, we recommend to read our
[introduction to Redis Streams]({{< relref "/develop/data-types/streams" >}}).
Make sure to understand the concept of consumer group in the introduction
so that following how this command works will be simpler.

## Consumer groups in 30 seconds

The difference between this command and the vanilla [`XREAD`]({{< relref "/commands/xread" >}}) is that this
one supports consumer groups.

Without consumer groups, just using [`XREAD`]({{< relref "/commands/xread" >}}), all the clients are served with all the entries arriving in a stream. Instead using consumer groups with `XREADGROUP`, it is possible to create groups of clients that consume different parts of the messages arriving in a given stream. If, for instance, the stream gets the new entries A, B, and C and there are two consumers reading via a consumer group, one client will get, for instance, the messages A and C, and the other the message B, and so forth.

Within a consumer group, a given consumer (that is, just a client consuming messages from the stream), has to identify with a unique *consumer name*. Which is just a string.

One of the guarantees of consumer groups is that a given consumer can only see the history of messages that were delivered to it, so a message has just a single owner. However there is a special feature called *message claiming* that allows other consumers to claim messages in case there is a non recoverable failure of some consumer. In order to implement such semantics, consumer groups require explicit acknowledgment of the messages successfully processed by the consumer, via the [`XACK`]({{< relref "/commands/xack" >}}) command. This is needed because the stream will track, for each consumer group, who is processing what message.

This is how to understand if you want to use a consumer group or not:

1. If you have a stream and multiple clients, and you want all the clients to get all the messages, you do not need a consumer group.
2. If you have a stream and multiple clients, and you want the stream to be *partitioned* or *sharded* across your clients, so that each client will get a sub set of the messages arriving in a stream, you need a consumer group.

## Differences between XREAD and XREADGROUP

From the point of view of the syntax, the commands are almost the same,
however `XREADGROUP` *requires* a special and mandatory option:

    GROUP <group-name> <consumer-name>

The group name is just the name of a consumer group associated to the stream.
The group is created using the [`XGROUP`]({{< relref "/commands/xgroup" >}}) command. The consumer name is the
string that is used by the client to identify itself inside the group.
The consumer is auto created inside the consumer group the first time it
is seen. Different clients should select a different consumer name.

When you read with `XREADGROUP`, the server will *remember* that a given
message was delivered to you: the message will be stored inside the
consumer group in what is called a Pending Entries List (PEL), that is
a list of message IDs delivered but not yet acknowledged.

The client will have to acknowledge the message processing using [`XACK`]({{< relref "/commands/xack" >}})
in order for the pending entry to be removed from the PEL. The PEL
can be inspected using the [`XPENDING`]({{< relref "/commands/xpending" >}}) command.

The `NOACK` subcommand can be used to avoid adding the message to the PEL in
cases where reliability is not a requirement and the occasional message loss
is acceptable. This is equivalent to acknowledging the message when it is read.
When used together with `CLAIM`, `NOACK` does not apply for retrieved pending entries.

The ID to specify in the **STREAMS** option when using `XREADGROUP` can
be one of the following two:

* When the special `>` id is specified without `CLAIM`, the consumer wants to receive only messages that were never delivered to any other consumer, hence, just new messages.
* When the special `>` id is specified with `CLAIM`, the consumer wants, in addition, to receive messages that have been delivered to some consumer and have been pending for at least min-idle-time milliseconds.
* Any other ID, that is, 0 or any other valid ID or incomplete ID (just the millisecond time part), will have the effect of returning entries that are pending for the consumer sending the command with IDs greater than the one provided. So basically if the ID is not `>`, then the command will just let the client access its pending entries: messages delivered to it, but not yet acknowledged. Note that in this case, `BLOCK`, `NOACK`, and `CLAIM` are ignored.

Like [`XREAD`]({{< relref "/commands/xread" >}}) the `XREADGROUP` command can be used in a blocking way. There
are no differences in this regard.

## The CLAIM option

When `CLAIM min-idle-time` is specified, Redis will first try to claim messages which have been pending for at least min-idle-time milliseconds from the consumer group of each specified stream key. The pending messages with the highest idle time would be claimed first. Note that the `CLAIM min-idle-time` condition may become true for some pending entries during the `BLOCK milliseconds` period (if specified).

If there are no such messages, Redis will continue as normal (consume incoming messages).

`CLAIM min-idle-time` is ignored if the specified id is not `>`.

### Reply extension for claimed entries

When `CLAIM min-idle-time` is used, additional information is provided for each pending entry retrieved (similar to the reply of [`XPENDING`]({{< relref "/commands/xpending" >}})). For each claimed pending entry, the reply includes:

1. Entry id
2. Field-value pairs
3. Milliseconds since the last time this entry was delivered
4. Number of times this entry was previously delivered

### Ordering guarantees

When using `CLAIM`, the following ordering guarantees apply:

- Idle pending entries are reported first, then incoming entries
- Idle pending entries are ordered by idle time (longer first)
- Incoming entries are ordered by the order they were appended to the stream (older first)

For example, if there are 20 idle pending entries and 200 incoming entries (in all the specified streams together):
- When calling `XREADGROUP ... CLAIM ...`, you would retrieve 220 entries in the reply
- When calling `XREADGROUP ... COUNT 100 ... CLAIM ...`, you would retrieve the 20 idle pending entries + 80 incoming entries in the reply

## What happens when a message is delivered to a consumer?

Two things:

1. If the message was never delivered to anyone, that is, if we are talking about a new message, then a PEL (Pending Entries List) is created.
2. If instead the message was already delivered to this consumer, and it is just re-fetching the same message again, then the *last delivery counter* is updated to the current time, and the *number of deliveries* is incremented by one. You can access those message properties using the [`XPENDING`]({{< relref "/commands/xpending" >}}) command.

## Usage example

Normally you use the command like that in order to get new messages and
process them. In pseudo-code:

```
WHILE true
    entries = XREADGROUP GROUP $GroupName $ConsumerName BLOCK 2000 COUNT 10 STREAMS mystream >
    if entries == nil
        puts "Timeout... try again"
        CONTINUE
    end

    FOREACH entries AS stream_entries
        FOREACH stream_entries as message
            process_message(message.id,message.fields)

            # ACK the message as processed
            XACK mystream $GroupName message.id
        END
    END
END
```

In this way the example consumer code will fetch only new messages, process
them, and acknowledge them via [`XACK`]({{< relref "/commands/xack" >}}). However the example code above is
not complete, because it does not handle recovering after a crash. What
will happen if we crash in the middle of processing messages, is that our
messages will remain in the pending entries list, so we can access our
history by giving `XREADGROUP` initially an ID of 0, and performing the same
loop. Once providing an ID of 0 the reply is an empty set of messages, we
know that we processed and acknowledged all the pending messages: we
can start to use `>` as ID, in order to get the new messages and rejoin the
consumers that are processing new things.

To see how the command actually replies, please check the [`XREAD`]({{< relref "/commands/xread" >}}) command page.

## What happens when a pending message is deleted?

Entries may be deleted from the stream due to trimming with [`XADD`]({{< relref "/commands/xadd" >}}) or [`XTRIM`]({{< relref "/commands/xtrim" >}}),
or explicit calls to [`XDEL`]({{< relref "/commands/xdel" >}}), [`XDELEX`]({{< relref "/commands/xdelex" >}}), or [`XACKDEL`]({{< relref "/commands/xackdel" >}}).

When an entry is trimmed with [`XADD`]({{< relref "/commands/xadd" >}}) or [`XTRIM`]({{< relref "/commands/xtrim" >}}) and `DELREF` or `ACKED` are not specified,
deleted with [`XDEL`]({{< relref "/commands/xdel" >}}), or deleted with [`XDELEX`]({{< relref "/commands/xdelex" >}}) or [`XACKDEL`]({{< relref "/commands/xackdel" >}}) 
and `DELREF` or `ACKED` are not specified, Redis doesn't prevent the deletion of entries that are present in the stream's PELs.
When this happens, the PELs retain the deleted entries' IDs, but the actual entry payload is no longer available.
Therefore, when reading such PEL entries, Redis will return a null value in place of their respective data.

Example:

```
> XADD mystream 1 myfield mydata
"1-0"
> XGROUP CREATE mystream mygroup 0
OK
> XREADGROUP GROUP mygroup myconsumer STREAMS mystream >
1) 1) "mystream"
   2) 1) 1) "1-0"
         2) 1) "myfield"
            2) "mydata"
> XDEL mystream 1-0
(integer) 1
> XREADGROUP GROUP mygroup myconsumer STREAMS mystream 0
1) 1) "mystream"
   2) 1) 1) "1-0"
         2) (nil)
```

Reading the [Redis Streams introduction]({{< relref "/develop/data-types/streams" >}}) is highly
suggested in order to understand more about the streams overall behavior
and semantics.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="xreadgroup-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): an array where each element is an array composed of a two elements containing the key name and the entries reported for that key. The entries reported are full stream entries, having IDs and the list of all the fields and values. Field and values are guaranteed to be reported in the same order they were added by `XADD`.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): if the _BLOCK_ option is given and a timeout occurs, or if there is no stream that can be served.

-tab-sep-

One of the following:
* [Map reply](../../develop/reference/protocol-spec#maps): A map of key-value elements where each element is composed of the key name and the entries reported for that key. The entries reported are full stream entries, having IDs and the list of all the fields and values. Field and values are guaranteed to be reported in the same order they were added by `XADD`.
* [Null reply](../../develop/reference/protocol-spec#nulls): if the _BLOCK_ option is given and a timeout occurs, or if there is no stream that can be served.

{{< /multitabs >}}
