---
acl_categories:
- '@write'
- '@hyperloglog'
- '@slow'
arguments:
- display_text: destkey
  key_spec_index: 0
  name: destkey
  type: key
- display_text: sourcekey
  key_spec_index: 1
  multiple: true
  name: sourcekey
  optional: true
  type: key
arity: -2
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
complexity: O(N) to merge N HyperLogLogs, but with high constant times.
description: Merges one or more HyperLogLog values into a single key.
group: hyperloglog
hidden: false
key_specs:
- RW: true
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
  insert: true
- RO: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: -1
      limit: 0
    type: range
linkTitle: PFMERGE
railroad_diagram: /images/railroad/pfmerge.svg
since: 2.8.9
summary: Merges one or more HyperLogLog values into a single key.
syntax_fmt: PFMERGE destkey [sourcekey [sourcekey ...]]
syntax_str: '[sourcekey [sourcekey ...]]'
title: PFMERGE
---
Merge multiple HyperLogLog values into a unique value that will approximate
the cardinality of the union of the observed Sets of the source HyperLogLog
structures.

The computed merged HyperLogLog is set to the destination variable, which is
created if does not exist (defaulting to an empty HyperLogLog).

If the destination variable exists, it is treated as one of the source sets 
and its cardinality will be included in the cardinality of the computed
HyperLogLog.

## Examples

{{% redis-cli %}}
PFADD hll1 foo bar zap a
PFADD hll2 a b c foo
PFMERGE hll3 hll1 hll2
PFCOUNT hll3
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="pfmerge-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
