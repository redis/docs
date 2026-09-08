---
acl_categories:
- '@read'
- '@sortedset'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: min
  name: min
  type: double
- display_text: max
  name: max
  type: double
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
- fast
complexity: O(log(N)) with N being the number of elements in the sorted set.
description: Returns the count of members in a sorted set that have scores within
  a range.
group: sorted-set
hidden: false
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
linkTitle: ZCOUNT
railroad_diagram: /images/railroad/zcount.svg
since: 2.0.0
summary: Returns the count of members in a sorted set that have scores within a range.
syntax_fmt: ZCOUNT key min max
title: ZCOUNT
---
Returns the number of elements in the sorted set at `key` with a score between
`min` and `max`.

The `min` and `max` arguments have the same semantic as described for
[`ZRANGEBYSCORE`]({{< relref "/commands/zrangebyscore" >}}).

Note: the command has a complexity of just O(log(N)) because it uses elements ranks (see [`ZRANK`]({{< relref "/commands/zrank" >}})) to get an idea of the range. Because of this there is no need to do a work proportional to the size of the range.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the sorted set.

</details>

<details open><summary><code>min</code></summary>

The minimum score. The bound is inclusive unless prefixed with `(`. Use `-inf` for no lower bound.

</details>

<details open><summary><code>max</code></summary>

The maximum score. The bound is inclusive unless prefixed with `(`. Use `+inf` for no upper bound.

</details>

## Examples

{{% redis-cli %}}
redis> ZADD myzset 1 "one"
(integer) 1
redis> ZADD myzset 2 "two"
(integer) 1
redis> ZADD myzset 3 "three"
(integer) 1
redis> ZCOUNT myzset -inf +inf
(integer) 3
redis> ZCOUNT myzset (1 3
(integer) 2
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zcount-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of members in the specified score range.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of members in the specified score range.

{{< /multitabs >}}
