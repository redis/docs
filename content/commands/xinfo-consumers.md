---
acl_categories:
- '@read'
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
- readonly
complexity: O(1)
description: Returns a list of the consumers in a consumer group.
group: stream
hidden: false
hints:
- nondeterministic_output
history:
- - 7.2.0
  - Added the `inactive` field, and changed the meaning of `idle`.
key_specs:
- RO: true
  access: true
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
linkTitle: XINFO CONSUMERS
railroad_diagram: /images/railroad/xinfo-consumers.svg
since: 5.0.0
summary: Returns a list of the consumers in a consumer group.
syntax_fmt: XINFO CONSUMERS key group
syntax_str: group
title: XINFO CONSUMERS
---
This command returns the list of consumers that belong to the `<groupname>` consumer group of the stream stored at `<key>`.

The following information is provided for each consumer in the group:

* **name**: the consumer's name
* **pending**: the number of entries in the PEL: pending messages for the consumer, which are messages that were delivered but are yet to be acknowledged
* **idle**: the number of milliseconds that have passed since the consumer's last attempted interaction (Examples: [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}), [`XCLAIM`]({{< relref "/commands/xclaim" >}}), [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}))
* **inactive**: the number of milliseconds that have passed since the consumer's last successful interaction (Examples: [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) that actually read some entries into the PEL, [`XCLAIM`]({{< relref "/commands/xclaim" >}})/[`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) that actually claimed some entries)

Note that before Redis 7.2.0, **idle** used to denote the time passed since last successful interaction.
In 7.2.0, **inactive** was added and **idle** was changed to denote the time passed since last attempted interaction.

## Examples

```
> XINFO CONSUMERS mystream mygroup
1) 1) name
   2) "Alice"
   3) pending
   4) (integer) 1
   5) idle
   6) (integer) 9104628
   7) inactive
   8) (integer) 18104698
2) 1) name
   2) "Bob"
   3) pending
   4) (integer) 1
   5) idle
   6) (integer) 83841983
   7) inactive
   8) (integer) 993841998
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="xinfo-consumers-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of consumers and their attributes.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of consumers and their attributes.

{{< /multitabs >}}
