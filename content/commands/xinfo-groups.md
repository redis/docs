---
acl_categories:
- '@read'
- '@stream'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
arity: 3
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
complexity: O(1)
description: Returns a list of the consumer groups of a stream.
group: stream
hidden: false
history:
- - 7.0.0
  - Added the `entries-read` and `lag` fields
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: XINFO GROUPS
since: 5.0.0
summary: Returns a list of the consumer groups of a stream.
syntax_fmt: XINFO GROUPS key
syntax_str: ''
title: XINFO GROUPS
---
This command returns the list of all consumer groups of the stream stored at `<key>`.

By default, only the following information is provided for each of the groups:

* **name**: the consumer group's name
* **consumers**: the number of consumers in the group
* **pending**: the length of the group's pending entries list (PEL), which are messages that were delivered but are yet to be acknowledged
* **last-delivered-id**: the ID of the last entry delivered to the group's consumers
* **entries-read**: the logical "read counter" of the last entry delivered to the group's consumers
* **lag**: the number of entries in the stream that are still waiting to be delivered to the group's consumers, or a NULL when that number can't be determined.

### Consumer group lag

The lag of a given consumer group is the number of entries in the range between the group's `entries_read` and the stream's `entries_added`.
Put differently, it is the number of entries that are yet to be delivered to the group's consumers.

The values and trends of this metric are helpful in making scaling decisions about the consumer group.
You can address high lag values by adding more consumers to the group, whereas low values may indicate that you can remove consumers from the group to scale it down.

Redis reports the lag of a consumer group by keeping two counters: the number of all entries added to the stream and the number of logical reads made by the consumer group.
The lag is the difference between these two.

The stream's counter (the `entries_added` field of the [`XINFO STREAM`]({{< relref "/commands/xinfo-stream" >}}) command) is incremented by one with every [`XADD`]({{< relref "/commands/xadd" >}}) and counts all of the entries added to the stream during its lifetime.

The consumer group's counter, `entries_read`, is the logical counter of entries the group had read.
It is important to note that this counter is only a heuristic rather than an accurate counter, and therefore the use of the term "logical".
The counter attempts to reflect the number of entries that the group **should have read** to get to its current `last-delivered-id`.
The `entries_read` counter is accurate only in a perfect world, where a consumer group starts at the stream's first entry and processes all of its entries (i.e., no entries deleted before processing).

There are two special cases in which this mechanism is unable to report the lag:

1. A consumer group is created or set with an arbitrary last delivered ID (the [`XGROUP CREATE`]({{< relref "/commands/xgroup-create" >}}) and [`XGROUP SETID`]({{< relref "/commands/xgroup-setid" >}}) commands, respectively).
    An arbitrary ID is any ID that isn't the ID of the stream's first entry, its last entry or the zero ("0-0") ID.
2. One or more entries between the group's `last-delivered-id` and the stream's `last-generated-id` were deleted (with [`XDEL`]({{< relref "/commands/xdel" >}}) or a trimming operation).

In both cases, the group's read counter is considered invalid, and the returned value is set to NULL to signal that the lag isn't currently available.

However, the lag is only temporarily unavailable.
It is restored automatically during regular operation as consumers keep processing messages.
Once the consumer group delivers the last message in the stream to its members, it will be set with the correct logical read counter, and tracking its lag can be resumed.

## Examples

```
> XINFO GROUPS mystream
1)  1) "name"
    2) "mygroup"
    3) "consumers"
    4) (integer) 2
    5) "pending"
    6) (integer) 2
    7) "last-delivered-id"
    8) "1638126030001-0"
    9) "entries-read"
   10) (integer) 2
   11) "lag"
   12) (integer) 0
2)  1) "name"
    2) "some-other-group"
    3) "consumers"
    4) (integer) 1
    5) "pending"
    6) (integer) 0
    7) "last-delivered-id"
    8) "1638126028070-0"
    9) "entries-read"
   10) (integer) 1
   11) "lag"
   12) (integer) 1
```

## Return information

{{< multitabs id="xinfo-groups-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of consumer groups.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of consumer groups.

{{< /multitabs >}}
