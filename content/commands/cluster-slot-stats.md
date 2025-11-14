---
arguments:
- arguments:
  - arguments:
    - name: start-slot
      type: integer
    - name: end-slot
      type: integer
    name: slotsrange
    token: SLOTSRANGE
    type: block
  - arguments:
    - name: metric
      type: string
    - name: limit
      optional: true
      token: LIMIT
      type: integer
    - arguments:
      - name: asc
        token: ASC
        type: pure-token
      - name: desc
        token: DESC
        type: pure-token
      name: order
      optional: true
      type: oneof
    name: orderby
    token: ORDERBY
    type: block
  name: filter
  type: oneof
arity: -4
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
- STALE
- LOADING
command_tips:
- NONDETERMINISTIC_OUTPUT
- REQUEST_POLICY:ALL_SHARDS
complexity: O(N) where N is the total number of slots based on arguments. O(N*log(N))
  with ORDERBY subcommand.
container: CLUSTER
description: Return an array of slot usage statistics for slots assigned to the current
  node.
function: clusterSlotStatsCommand
group: cluster
hidden: false
linkTitle: CLUSTER SLOT-STATS
reply_schema:
  description: Array of nested arrays, where the inner array element represents a
    slot and its respective usage statistics.
  items:
    description: Array of size 2, where 0th index represents (int) slot and 1st index
      represents (map) usage statistics.
    items:
    - description: Slot Number.
      type: integer
    - additionalProperties: false
      description: Map of slot usage statistics.
      properties:
        cpu-usec:
          type: integer
        key-count:
          type: integer
        network-bytes-in:
          type: integer
        network-bytes-out:
          type: integer
      type: object
    maxItems: 2
    minItems: 2
    type: array
  type: array
since: 8.2.0
summary: Return an array of slot usage statistics for slots assigned to the current
  node.
syntax_fmt: "CLUSTER SLOT-STATS <SLOTSRANGE\_start-slot end-slot | ORDERBY\_metric
\
  \  [LIMIT\_limit] [ASC | DESC]>"
syntax_str: ''
title: CLUSTER SLOT-STATS
---

Use this command to get an array of slot usage statistics for the slots assigned to the current shard. If you're working with a Redis cluster, this data helps you understand overall slot usage, spot hot or cold slots, plan slot migrations to balance load, or refine your application logic to better distribute keys.

## Options

`CLUSTER SLOT-STATS` has two mutually exclusive options:

* `ORDERBY`: Sorts the slot statistics by the specified metric. Use ASC or DESC to sort in ascending or descending order. If multiple slots have the same value, the command uses the slot number as a tiebreaker, sorted in ascending order.

* `SLOTSRANGE`: Limits the results to a specific, inclusive range of slots. Results are always sorted by slot number in ascending order.

The command reports on the following statistics:

* `KEY-COUNT`: Number of keys stored in the slot.
* `CPU-USEC`: CPU time (in microseconds) spent handling the slot.
* `NETWORK-BYTES-IN`: Total inbound network traffic (in bytes) received by the slot.
* `NETWORK-BYTES-OUT`: Total outbound network traffic (in bytes) sent from the slot.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="cmd-name-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): a nested list of slot usage statistics.
* [Simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) otherwise.

-tab-sep-

One of the following:

* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): a nested list of slot usage statistics.
* [Simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) otherwise.

{{< /multitabs >}}