---
acl_categories:
- '@write'
- '@stream'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: group
  name: group
  type: string
- arguments:
  - display_text: id
    name: id
    type: string
  - display_text: new-id
    name: new-id
    token: $
    type: pure-token
  name: id-selector
  type: oneof
- display_text: entries-read
  name: entriesread
  optional: true
  token: ENTRIESREAD
  type: integer
arity: -5
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
complexity: O(1)
description: Sets the last-delivered ID of a consumer group.
group: stream
hidden: false
history:
- - 7.0.0
  - Added the optional `entries_read` argument.
key_specs:
- RW: true
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
  update: true
linkTitle: XGROUP SETID
since: 5.0.0
summary: Sets the last-delivered ID of a consumer group.
syntax_fmt: "XGROUP SETID key group <id | $> [ENTRIESREAD\_entries-read]"
syntax_str: "group <id | $> [ENTRIESREAD\_entries-read]"
title: XGROUP SETID
---
Set the **last delivered ID** for a consumer group.

Normally, a consumer group's last delivered ID is set when the group is created with [`XGROUP CREATE`]({{< relref "/commands/xgroup-create" >}}).
The `XGROUP SETID` command allows modifying the group's last delivered ID, without having to delete and recreate the group.
For instance if you want the consumers in a consumer group to re-process all the messages in a stream, you may want to set its next ID to 0:

    XGROUP SETID mystream mygroup 0

The optional `entries_read` argument can be specified to enable consumer group lag tracking for an arbitrary ID.
An arbitrary ID is any ID that isn't the ID of the stream's first entry, its last entry or the zero ("0-0") ID.
This can be useful you know exactly how many entries are between the arbitrary ID (excluding it) and the stream's last entry.
In such cases, the `entries_read` can be set to the stream's `entries_added` subtracted with the number of entries.

## Return information

{{< multitabs id="xgroup-setid-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
