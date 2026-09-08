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
- display_text: end
  name: end
  type: string
- display_text: start
  name: start
  type: string
- display_text: count
  name: count
  optional: true
  token: COUNT
  type: integer
arity: -4
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
complexity: O(N) with N being the number of elements returned. If N is constant (e.g.
  always asking for the first 10 elements with COUNT), you can consider it O(1).
description: Returns the messages from a stream within a range of IDs in reverse order.
group: stream
hidden: false
history:
- - 6.2.0
  - Added exclusive ranges.
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
linkTitle: XREVRANGE
railroad_diagram: /images/railroad/xrevrange.svg
since: 5.0.0
summary: Returns the messages from a stream within a range of IDs in reverse order.
syntax_fmt: "XREVRANGE key end start [COUNT\_count]"
title: XREVRANGE
---
This command works like XRANGE, but returns entries in reverse order. Specify the end ID first, then the start ID. XREVRANGE returns the entries between those IDs, inclusive, starting from the end of the range.

So for example, to get all the elements from the higher ID to the lower
ID you can use:

    XREVRANGE somestream + -

Similarly to get just the last element added into the stream it is
enough to send:

    XREVRANGE somestream + - COUNT 1

## Required arguments

<details open><summary><code>key</code></summary>

The stream key.

</details>

<details open><summary><code>end</code></summary>

The end of the ID range, inclusive. Entries are returned in reverse order. Use `+` for the greatest ID.

</details>

<details open><summary><code>start</code></summary>

The start of the ID range, inclusive. Use `-` for the smallest ID.

</details>

## Optional arguments

<details open><summary><code>COUNT count</code></summary>

The maximum number of entries to return.

</details>

## Examples

{{% redis-cli %}}
redis> XADD writers * name Virginia surname Woolf
"1784722084747-0"
redis> XADD writers * name Jane surname Austen
"1784722084747-1"
redis> XADD writers * name Toni surname Morrison
"1784722084748-0"
redis> XADD writers * name Agatha surname Christie
"1784722084748-1"
redis> XADD writers * name Ngozi surname Adichie
"1784722084748-2"
redis> XLEN writers
(integer) 5
redis> XREVRANGE writers + - COUNT 1
1) 1) "1784722084748-2"
   2) 1) "name"
      2) "Ngozi"
      3) "surname"
      4) "Adichie"
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="xrevrange-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): The command returns the entries with IDs matching the specified range. The returned entries are complete, which means that the ID and all the fields they are composed of are returned. Moreover, the entries are returned with their fields and values in the same order as `XADD` added them.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): The command returns the entries with IDs matching the specified range. The returned entries are complete, which means that the ID and all the fields they are composed of are returned. Moreover, the entries are returned with their fields and values in the same order as `XADD` added them.

{{< /multitabs >}}
