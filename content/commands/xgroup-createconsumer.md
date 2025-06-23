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
- denyoom
complexity: O(1)
description: Creates a consumer in a consumer group.
group: stream
hidden: false
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
linkTitle: XGROUP CREATECONSUMER
since: 6.2.0
summary: Creates a consumer in a consumer group.
syntax_fmt: XGROUP CREATECONSUMER key group consumer
syntax_str: group consumer
title: XGROUP CREATECONSUMER
---
Create a consumer named `<consumername>` in the consumer group `<groupname>` of the stream that's stored at `<key>`.

Consumers are also created automatically whenever an operation, such as [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}), references a consumer that doesn't exist.
This is valid for [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) only when there is data in the stream.

## Return information

{{< multitabs id="xgroup-createconsumer-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of created consumers, either 0 or 1.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of created consumers, either 0 or 1.

{{< /multitabs >}}
