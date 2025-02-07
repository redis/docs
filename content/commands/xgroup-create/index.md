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
- display_text: mkstream
  name: mkstream
  optional: true
  token: MKSTREAM
  type: pure-token
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
- denyoom
complexity: O(1)
description: Creates a consumer group.
group: stream
hidden: false
history:
- - 7.0.0
  - Added the `entries_read` named argument.
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
  insert: true
linkTitle: XGROUP CREATE
since: 5.0.0
summary: Creates a consumer group.
syntax_fmt: "XGROUP CREATE key group <id | $> [MKSTREAM]\n  [ENTRIESREAD\_entries-read]"
syntax_str: "group <id | $> [MKSTREAM] [ENTRIESREAD\_entries-read]"
title: XGROUP CREATE
---
Create a new consumer group uniquely identified by `<groupname>` for the stream stored at `<key>`

Every group has a unique name in a given stream. 
When a consumer group with the same name already exists, the command returns a `-BUSYGROUP` error.

The command's `<id>` argument specifies the last delivered entry in the stream from the new group's perspective.
The special ID `$` is the ID of the last entry in the stream, but you can substitute it with any valid ID.

For example, if you want the group's consumers to fetch the entire stream from the beginning, use zero as the starting ID for the consumer group:

    XGROUP CREATE mystream mygroup 0

By default, the `XGROUP CREATE` command expects that the target stream exists, and returns an error when it doesn't.
If a stream does not exist, you can create it automatically with length of 0 by using the optional `MKSTREAM` subcommand as the last argument after the `<id>`:

    XGROUP CREATE mystream mygroup $ MKSTREAM

To enable consumer group lag tracking, specify the optional `entries_read` named argument with an arbitrary ID.
An arbitrary ID is any ID that isn't the ID of the stream's first entry, last entry, or zero ("0-0") ID.
Use it to find out how many entries are between the arbitrary ID (excluding it) and the stream's last entry.
Set the `entries_read` the stream's `entries_added` subtracted by the number of entries.
