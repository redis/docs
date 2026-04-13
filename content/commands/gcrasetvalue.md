---
acl_categories:
- '@rate_limit'
- '@write'
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: tat
  type: integer
arity: 3
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
description: An internal command for recording a GCRA TAT value during AOF rewrite
  and replication.
group: rate_limit
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
  - ow
  - update
linkTitle: GCRASETVALUE
since: 8.8.0
summary: An internal command for recording a GCRA TAT value during AOF rewrite and
  replication.
syntax_fmt: GCRASETVALUE key tat
title: GCRASETVALUE
---
This is an internal command; it records a GCRA [theoretical arrival time (TAT)](https://en.wikipedia.org/wiki/Generic_cell_rate_algorithm#Virtual_scheduling_description) value during AOF rewrite and replication.

## Required arguments

<details open><summary><code>key</code></summary>

is the key associated with a specific rate limiting case.

</details>

<details open><summary><code>tat</code></summary>

is the expiration time, based on the generic cell rate algorithm's [theoretical arrival time (TAT)](https://en.wikipedia.org/wiki/Generic_cell_rate_algorithm#Virtual_scheduling_description).

</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

- A [simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) of `OK` indicating that the operation succeeded.
- A [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) indicating that the operation failed.

-tab-sep-

One of the following:

- A [simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) of `OK` indicating that the operation succeeded.
- A [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) indicating that the operation failed.

{{< /multitabs >}}
