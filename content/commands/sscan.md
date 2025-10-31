---
acl_categories:
- '@read'
- '@set'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: cursor
  name: cursor
  type: integer
- display_text: pattern
  name: pattern
  optional: true
  token: MATCH
  type: pattern
- display_text: count
  name: count
  optional: true
  token: COUNT
  type: integer
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
- readonly
complexity: O(1) for every call. O(N) for a complete iteration, including enough command
  calls for the cursor to return back to 0. N is the number of elements inside the
  collection.
description: Iterates over members of a set.
group: set
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
linkTitle: SSCAN
since: 2.8.0
summary: Iterates over members of a set.
syntax_fmt: "SSCAN key cursor [MATCH\_pattern] [COUNT\_count]"
syntax_str: "cursor [MATCH\_pattern] [COUNT\_count]"
title: SSCAN
---
See [`SCAN`]({{< relref "/commands/scan" >}}) for `SSCAN` documentation.

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="sscan-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): specifically, an array with two elements:
* The first element is a [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) that represents an unsigned 64-bit number, the cursor.
* The second element is an [Array reply](../../develop/reference/protocol-spec#arrays) with the names of scanned members.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): specifically, an array with two elements:
* The first element is a [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) that represents an unsigned 64-bit number, the cursor.
* The second element is an [Array reply](../../develop/reference/protocol-spec#arrays) with the names of scanned members.

{{< /multitabs >}}
