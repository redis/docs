---
acl_categories:
- '@keyspace'
- '@read'
- '@slow'
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
complexity: O(1) to access the key and additional O(N*M) to serialize it, where N
  is the number of Redis objects composing the value and M their average size. For
  small string values the time complexity is thus O(1)+O(1*M) where M is small, so
  simply O(1).
description: Returns a serialized representation of the value stored at a key.
group: generic
hidden: false
hints:
- nondeterministic_output
key_specs:
- RO: true
  access: true
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
linkTitle: DUMP
since: 2.6.0
summary: Returns a serialized representation of the value stored at a key.
syntax_fmt: DUMP key
syntax_str: ''
title: DUMP
---
Serialize the value stored at key in a Redis-specific format and return it to
the user.
The returned value can be synthesized back into a Redis key using the [`RESTORE`]({{< relref "/commands/restore" >}})
command.

The serialization format is opaque and non-standard, however it has a few
semantic characteristics:

* It contains a 64-bit checksum that is used to make sure errors will be
  detected.
  The [`RESTORE`]({{< relref "/commands/restore" >}}) command makes sure to check the checksum before synthesizing a
  key using the serialized value.
* Values are encoded in the same format used by RDB.
* An RDB version is encoded inside the serialized value, so that different Redis
  versions with incompatible RDB formats will refuse to process the serialized
  value.

The serialized value does NOT contain expire information.
In order to capture the time to live of the current value the [`PTTL`]({{< relref "/commands/pttl" >}}) command
should be used.

If `key` does not exist a nil bulk reply is returned.

## Examples

```
> SET mykey 10
OK
> DUMP mykey
"\x00\xc0\n\n\x00n\x9fWE\x0e\xaec\xbb"
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="dump-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): The serialized value of the key.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): the key does not exist.

-tab-sep-

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the serialized value of the key.
* [Null reply](../../develop/reference/protocol-spec#nulls): the key does not exist.

{{< /multitabs >}}
