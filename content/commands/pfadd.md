---
acl_categories:
- '@write'
- '@hyperloglog'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: element
  multiple: true
  name: element
  optional: true
  type: string
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
- fast
complexity: O(1) to add every element.
description: Adds elements to a HyperLogLog key. Creates the key if it doesn't exist.
group: hyperloglog
hidden: false
key_specs:
- RW: true
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
linkTitle: PFADD
railroad_diagram: /images/railroad/pfadd.svg
since: 2.8.9
summary: Adds elements to a HyperLogLog key. Creates the key if it doesn't exist.
syntax_fmt: PFADD key [element [element ...]]
syntax_str: '[element [element ...]]'
title: PFADD
---
Adds all the element arguments to the HyperLogLog data structure stored at the variable name specified as first argument.

As a side effect of this command the HyperLogLog internals may be updated to reflect a different estimation of the number of unique items added so far (the cardinality of the set).

If the approximated cardinality estimated by the HyperLogLog changed after executing the command, `PFADD` returns 1, otherwise 0 is returned. The command automatically creates an empty HyperLogLog structure (that is, a Redis String of a specified length and with a given encoding) if the specified key does not exist.

To call the command without elements but just the variable name is valid, this will result into no operation performed if the variable already exists, or just the creation of the data structure if the key does not exist (in the latter case 1 is returned).

For an introduction to HyperLogLog data structure check the [`PFCOUNT`]({{< relref "/commands/pfcount" >}}) command page.

## Examples

{{% redis-cli %}}
PFADD hll a b c d e f g
PFCOUNT hll
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="pfadd-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if at least one HyperLogLog internal register was altered.
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if no HyperLogLog internal registers were altered.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if at least one HyperLogLog internal register was altered.
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if no HyperLogLog internal registers were altered.

{{< /multitabs >}}
