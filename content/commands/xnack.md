---
acl_categories:
- '@stream'
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: group
  type: string
- arguments:
  - name: silent
    token: SILENT
    type: pure-token
  - name: fail
    token: FAIL
    type: pure-token
  - name: fatal
    token: FATAL
    type: pure-token
  name: mode
  type: oneof
- arguments:
  - name: numids
    type: integer
  - multiple: true
    name: id
    type: string
  name: ids
  token: IDS
  type: block
- name: count
  optional: true
  token: RETRYCOUNT
  type: integer
- name: force
  optional: true
  token: FORCE
  type: pure-token
arity: -7
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
- fast
complexity: O(1) for each message ID processed.
description: Releases pending messages back to the group's PEL without acknowledging
  them, making them available for re-delivery.
group: stream
hidden: false
key_specs:
- begin_search:
    index:
      pos: 1
  find_keys:
    range:
      lastkey: 0
      limit: 0
      step: 1
  flags:
  - RW
  - UPDATE
linkTitle: XNACK
since: 8.8.0
summary: Releases pending messages back to the group's PEL without acknowledging them,
  making them available for re-delivery.
syntax_fmt: "XNACK key group <SILENT | FAIL | FATAL> IDS\_numids id [id ...]\n  [RETRYCOUNT\_\
  count] [FORCE]"
title: XNACK
---

In the context of a stream consumer group, this command allows a consumer to explicitly release pending messages back to the group's Pending Entries List (PEL) without acknowledging them. Released messages become immediately available for re-delivery to other consumers in the group, eliminating the idle-timeout delay normally required for message recovery.

This is particularly useful in scenarios such as graceful consumer shutdown, consumer-side failures, resource constraints, or poison message detection. The command provides three different modes that control how the delivery counter is adjusted, giving consumers fine-grained control over retry semantics.

## Required arguments

<details open><summary><code>key</code></summary>

Name of the stream.

</details>

<details open><summary><code>group</code></summary>

Name of the consumer group.

</details>

<details open><summary><code>mode</code></summary>

Controls the delivery counter adjustment. Must be one of:

- **SILENT**: Decrements the delivery counter by 1, essentially "undoing" the delivery increment. Use this for an internal failure on the consumer side while processing the message or graceful shutdown where the delivery "didn't count".
- **FAIL**: Keeps the current delivery counter value unchanged. Use this when the current consumer failed to process this message (for example, due to memory constraints). The root cause may be the message or the consumer (it is unclear), so the best strategy would be to let another consumer try to process the message.
- **FATAL**: Sets the delivery counter to the maximum value (LLONG_MAX or ~9.22 X 10<sup>18</sup>), marking the message as permanently failed. Use this for invalid or suspected malicious messages.

</details>

<details open><summary><code>ids</code></summary>

Block of arguments that specifies the message IDs to release, where `numids` is the number of message IDs that follow, and `id [id ...]` represents the stream entry IDs to be released back to the group.

</details>

## Optional arguments

<details open><summary><code>RETRYCOUNT</code></summary>

Directly sets the delivery counter to the specified value, overriding the mode-based adjustment. This gives explicit control over the retry counter regardless of the mode selected. Note: this is an internal argument that should usually not be used by consumers.

</details>

<details open><summary><code>FORCE</code></summary>

Creates new unowned PEL entries for IDs that are not already in the group PEL. Each entry must exist in the stream. When `FORCE` creates an entry, the delivery counter is set to `0` (or to `RETRYCOUNT` if specified, or to `LLONG_MAX` if mode is `FATAL`). Note: this is an internal argument that should usually not be used by consumers.

</details>

## Examples

<details open>
<summary><strong>Basic usage with FAIL mode</strong></summary>

```
> XADD mystream * field value1
"1526569498055-0"
> XADD mystream * field value2
"1526569498056-0"
> XGROUP CREATE mystream mygroup 0
OK
> XREADGROUP GROUP mygroup consumer1 STREAMS mystream >
1) 1) "mystream"
   2) 1) 1) "1526569498055-0"
         2) 1) "field"
            2) "value1"
      2) 1) "1526569498056-0"
         2) 1) "field"
            2) "value2"
> XNACK mystream mygroup FAIL IDS 2 1526569498055-0 1526569498056-0
(integer) 2
```

After NACKing, the messages appear with empty consumer in XPENDING:

```
> XPENDING mystream mygroup - + 10
1) 1) "1526569498055-0"
   2) ""
   3) (integer) -1
   4) (integer) 1
2) 1) "1526569498056-0"
   2) ""
   3) (integer) -1
   4) (integer) 1
```

</details>

<details open>
<summary><strong>Using SILENT mode for graceful shutdown</strong></summary>

```
> XNACK mystream mygroup SILENT IDS 1 1526569498055-0
(integer) 1
```

With SILENT mode, the delivery counter is decremented, effectively "undoing" the delivery.

</details>

<details open>
<summary><strong>Using FATAL mode for poison messages</strong></summary>

```
> XNACK mystream mygroup FATAL IDS 1 1526569498055-0
(integer) 1
```

This marks the message as permanently failed by setting the delivery counter to maximum value.

</details>

## Behavior

When `XNACK` executes successfully, the entry:

* is marked as unowned (its last consumer is set to an empty string).
* is assigned a last delivery time of `0`.
* is placed at the end of the NACKed portion of the PEL.
* is available for immediate re-delivery via [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) CLAIM, [`XCLAIM`]({{< relref "/commands/xclaim" >}}), or [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}).

The head of the PEL is reserved for all NACKed messages, ordered as a FIFO list, followed by pending messages that were neither ACKed nor NACKed in their existing order.

NACKed messages are prioritized over other pending messages in the group's PEL, ensuring they are delivered before idle messages during claim operations.

## Notes

- `XNACK` will only process message IDs that exist in the consumer group's PEL. Messages that are not pending will be ignored and not counted in the return value.
- Released messages occupy a dedicated zone at the head of the PEL (called the *XNACKed portion of the PEL*), ensuring they are prioritized for re-delivery over other pending entries.
- Released messages have their delivery time set to 0, making them immediately claimable regardless of the `min-idle-time` parameter in claiming commands.
- Unlike [`XACK`]({{< relref "/commands/xack" >}}), this command does not remove messages from the PEL but instead makes them available for other consumers.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): The number of messages successfully released back to the group PEL. Messages that are not in the consumer group PEL will not be counted.

-tab-sep-

[Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): The number of messages successfully released back to the consumer group PEL. Messages that are not in the consumer group PEL will not be counted.

{{< /multitabs >}}

## See also

- [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}): Read messages from a consumer group
- [`XACK`]({{< relref "/commands/xack" >}}): Acknowledge processed messages
- [`XCLAIM`]({{< relref "/commands/xclaim" >}}): Claim pending messages from other consumers
- [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}): Automatically claim idle pending messages
- [`XPENDING`]({{< relref "/commands/xpending" >}}): Inspect pending messages in a consumer group
