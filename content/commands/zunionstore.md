---
acl_categories:
- '@write'
- '@sortedset'
- '@slow'
arguments:
- key_spec_index: 0
  name: destination
  type: key
- name: numkeys
  type: integer
- key_spec_index: 1
  multiple: true
  name: key
  type: key
- multiple: true
  name: weight
  optional: true
  token: WEIGHTS
  type: integer
- arguments:
  - name: sum
    token: SUM
    type: pure-token
  - name: min
    token: MIN
    type: pure-token
  - name: max
    token: MAX
    type: pure-token
  - name: count
    token: COUNT
    type: pure-token
  name: aggregate
  optional: true
  token: AGGREGATE
  type: oneof
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
- write
- denyoom
- movablekeys
complexity: O(N)+O(M log(M)) with N being the sum of the sizes of the input sorted
  sets, and M being the number of elements in the resulting sorted set.
description: Stores the union of multiple sorted sets in a key.
group: sorted-set
hidden: false
history:
- - 8.8.0
  - Added `COUNT` aggregate option.
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
  - OW
  - UPDATE
- begin_search:
    index:
      pos: 2
  find_keys:
    keynum:
      firstkey: 1
      keynumidx: 0
      step: 1
  flags:
  - RO
  - ACCESS
linkTitle: ZUNIONSTORE
railroad_diagram: /images/railroad/zunionstore.svg
since: 2.0.0
summary: Stores the union of multiple sorted sets in a key.
syntax_fmt: "ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS\_weight\n  [weight\
  \ ...]] [AGGREGATE\_<SUM | MIN | MAX | COUNT>]"
title: ZUNIONSTORE
---
{{< note >}}
This command's behavior varies in clustered Redis environments. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


Computes the union of `numkeys` sorted sets given by the specified keys, and
stores the result in `destination`.
It is mandatory to provide the number of input keys (`numkeys`) before passing
the input keys and the other (optional) arguments.

By default, the resulting score of an element is the sum of its scores in the
sorted sets where it exists.

Using the `WEIGHTS` option, it is possible to specify a multiplication factor for
each input sorted set. Each element's score is multiplied by its corresponding
weight before aggregation.
When `WEIGHTS` is not given, the multiplication factors default to `1`.

With the `AGGREGATE` option, it is possible to specify how the results of the
union are aggregated.
This option defaults to `SUM`, where the score of an element is summed across
the inputs where it exists.
When this option is set to either `MIN` or `MAX`, the resulting set will contain
the minimum or maximum score of an element across the inputs where it exists.
For `SUM`, `MIN`, and `MAX`, each element's score is multiplied by its
corresponding weight before aggregation.

When `AGGREGATE COUNT` is specified, the original element scores are ignored
entirely. The resulting score for each element is determined by which input sets
contain it, optionally scaled by `WEIGHTS`:

- Without `WEIGHTS`, each input set containing the element contributes `1` to
  its score — effectively counting set membership.
- With `WEIGHTS`, each input set containing the element contributes its
  corresponding weight, so the score becomes the sum of those weights.

This enables a common use case: counting set membership frequency directly at
the command level, without application-side workarounds.

If `destination` already exists, it is overwritten.

## Examples

{{% redis-cli %}}
ZADD zset1 1 "one"
ZADD zset1 2 "two"
ZADD zset2 1 "one"
ZADD zset2 2 "two"
ZADD zset2 3 "three"
ZUNIONSTORE out 2 zset1 zset2 WEIGHTS 2 3
ZRANGE out 0 -1 WITHSCORES
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zunionstore-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting sorted set.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting sorted set.

{{< /multitabs >}}
