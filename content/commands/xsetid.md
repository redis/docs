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
- display_text: last-id
  name: last-id
  type: string
- display_text: entries-added
  name: entries-added
  optional: true
  since: 7.0.0
  token: ENTRIESADDED
  type: integer
- display_text: max-deleted-id
  name: max-deleted-id
  optional: true
  since: 7.0.0
  token: MAXDELETEDID
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
- denyoom
- fast
complexity: O(1)
description: An internal command for replicating stream values.
group: stream
hidden: false
history:
- - 7.0.0
  - Added the `entries_added` and `max_deleted_entry_id` arguments.
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
linkTitle: XSETID
since: 5.0.0
summary: An internal command for replicating stream values.
syntax_fmt: "XSETID key last-id [ENTRIESADDED\_entries-added]\n  [MAXDELETEDID\_max-deleted-id]"
syntax_str: "last-id [ENTRIESADDED\_entries-added] [MAXDELETEDID\_max-deleted-id]"
title: XSETID
---
The `XSETID` command is an internal command.
It is used by a Redis master to replicate the last delivered ID of streams.

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="xsetid-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
