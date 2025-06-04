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
arity: 4
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
complexity: O(N) where N is the number of entries in the group's pending entries list
  (PEL).
description: Destroys a consumer group.
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
linkTitle: XGROUP DESTROY
since: 5.0.0
summary: Destroys a consumer group.
syntax_fmt: XGROUP DESTROY key group
syntax_str: group
title: XGROUP DESTROY
---
The `XGROUP DESTROY` command completely destroys a consumer group.

The consumer group will be destroyed even if there are active consumers, and pending messages, so make sure to call this command only when really needed.

## Return information

{{< multitabs id="xgroup-destroy-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of destroyed consumer groups, either 0 or 1.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of destroyed consumer groups, either 0 or 1.

{{< /multitabs >}}
