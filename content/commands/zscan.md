---
acl_categories:
- '@read'
- '@sortedset'
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
- kubernetes
- clients
command_flags:
- readonly
complexity: O(1) for every call. O(N) for a complete iteration, including enough command
  calls for the cursor to return back to 0. N is the number of elements inside the
  collection.
description: Iterates over members and scores of a sorted set.
group: sorted-set
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
linkTitle: ZSCAN
since: 2.8.0
summary: Iterates over members and scores of a sorted set.
syntax_fmt: "ZSCAN key cursor [MATCH\_pattern] [COUNT\_count]"
syntax_str: "cursor [MATCH\_pattern] [COUNT\_count]"
title: ZSCAN
---
See [`SCAN`]({{< relref "/commands/scan" >}}) for `ZSCAN` documentation.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zscan-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): cursor and scan response in array form.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): cursor and scan response in array form.

{{< /multitabs >}}
