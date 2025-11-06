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
- display_text: id
  multiple: true
  name: id
  type: string
arity: -3
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
complexity: O(1) for each single item to delete in the stream, regardless of the stream
  size.
description: Returns the number of messages after removing them from a stream.
group: stream
hidden: false
key_specs:
- RW: true
  begin_search:
    spec:
      index: 1
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: XDEL
railroad_diagram: /images/railroad/xdel.svg
since: 5.0.0
summary: Returns the number of messages after removing them from a stream.
syntax_fmt: XDEL key id [id ...]
syntax_str: id [id ...]
title: XDEL
---
Removes the specified entries from a stream, and returns the number of entries
deleted.  This number may be less than the number of IDs passed to the command in
the case where some of the specified IDs do not exist in the stream.

Normally you may think at a Redis stream as an append-only data structure,
however Redis streams are represented in memory, so we are also able to 
delete entries. This may be useful, for instance, in order to comply with
certain privacy policies.

## Understanding the low level details of entries deletion

Redis streams are represented in a way that makes them memory efficient:
a radix tree is used in order to index macro-nodes that pack linearly tens
of stream entries. Normally what happens when you delete an entry from a stream
is that the entry is not *really* evicted, it just gets marked as deleted.

Eventually if all the entries in a macro-node are marked as deleted, the whole
node is destroyed and the memory reclaimed. This means that if you delete
a large amount of entries from a stream, for instance more than 50% of the
entries appended to the stream, the memory usage per entry may increment, since
what happens is that the stream will become fragmented. However the stream
performance will remain the same.

In future versions of Redis it is possible that we'll trigger a node garbage
collection in case a given macro-node reaches a given amount of deleted
entries. Currently with the usage we anticipate for this data structure, it is
not a good idea to add such complexity.

## Examples

```
> XADD mystream * a 1
1538561698944-0
> XADD mystream * b 2
1538561700640-0
> XADD mystream * c 3
1538561701744-0
> XDEL mystream 1538561700640-0
(integer) 1
127.0.0.1:6379> XRANGE mystream - +
1) 1) 1538561698944-0
   2) 1) "a"
      2) "1"
2) 1) 1538561701744-0
   2) 1) "c"
      2) "3"
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="xdel-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of entries that were deleted.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of entries that were deleted.

{{< /multitabs >}}
