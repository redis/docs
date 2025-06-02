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
- display_text: consumer
  name: consumer
  type: string
arity: 5
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
description: Deletes a consumer from a consumer group.
group: stream
hidden: false
key_specs:
- RW: true
  begin_search:
    spec:
      index: 2
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: XGROUP DELCONSUMER
since: 5.0.0
summary: Deletes a consumer from a consumer group.
syntax_fmt: XGROUP DELCONSUMER key group consumer
syntax_str: group consumer
title: XGROUP DELCONSUMER
---
The `XGROUP DELCONSUMER` command deletes a consumer from the consumer group.

Sometimes it may be useful to remove old consumers since they are no longer used.

Note, however, that any pending messages that the consumer had will become unclaimable after it was deleted.
It is strongly recommended, therefore, that any pending messages are claimed or acknowledged prior to deleting the consumer from the group.
