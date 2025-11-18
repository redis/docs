---
acl_categories:
- '@read'
- '@sortedset'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: start
  name: start
  type: string
- display_text: stop
  name: stop
  type: string
- arguments:
  - display_text: byscore
    name: byscore
    token: BYSCORE
    type: pure-token
  - display_text: bylex
    name: bylex
    token: BYLEX
    type: pure-token
  name: sortby
  optional: true
  since: 6.2.0
  type: oneof
- display_text: rev
  name: rev
  optional: true
  since: 6.2.0
  token: REV
  type: pure-token
- arguments:
  - display_text: offset
    name: offset
    type: integer
  - display_text: count
    name: count
    type: integer
  name: limit
  optional: true
  since: 6.2.0
  token: LIMIT
  type: block
- display_text: withscores
  name: withscores
  optional: true
  token: WITHSCORES
  type: pure-token
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
complexity: O(log(N)+M) with N being the number of elements in the sorted set and
  M the number of elements returned.
description: Returns members in a sorted set within a range of indexes.
group: sorted-set
hidden: false
history:
- - 6.2.0
  - Added the `REV`, `BYSCORE`, `BYLEX` and `LIMIT` options.
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
linkTitle: ZRANGE
railroad_diagram: /images/railroad/zrange.svg
since: 1.2.0
summary: Returns members in a sorted set within a range of indexes.
syntax_fmt: "ZRANGE key start stop [BYSCORE | BYLEX] [REV] [LIMIT\_offset count]\n\
  \  [WITHSCORES]"
syntax_str: "start stop [BYSCORE | BYLEX] [REV] [LIMIT\_offset count] [WITHSCORES]"
title: ZRANGE
---
Returns the specified range of elements in the sorted set stored at `<key>`.

`ZRANGE` can perform different types of range queries: by index (rank), by the score, or by lexicographical order.

Starting with Redis 6.2.0, this command can replace the following commands: [`ZREVRANGE`]({{< relref "/commands/zrevrange" >}}), [`ZRANGEBYSCORE`]({{< relref "/commands/zrangebyscore" >}}), [`ZREVRANGEBYSCORE`]({{< relref "/commands/zrevrangebyscore" >}}), [`ZRANGEBYLEX`]({{< relref "/commands/zrangebylex" >}}) and [`ZREVRANGEBYLEX`]({{< relref "/commands/zrevrangebylex" >}}).

## Common behavior and options

The order of elements is from the lowest to the highest score. Elements with the same score are ordered lexicographically.

The optional `REV` argument reverses the ordering, so elements are ordered from highest to lowest score, and score ties are resolved by reverse lexicographical ordering.

The optional `LIMIT` argument can be used to obtain a sub-range from the matching elements (similar to _SELECT LIMIT offset, count_ in SQL).
A negative `<count>` returns all elements from the `<offset>`. Keep in mind that if `<offset>` is large, the sorted set needs to be traversed for `<offset>` elements before getting to the elements to return, which can add up to O(N) time complexity.

The optional `WITHSCORES` argument supplements the command's reply with the scores of elements returned. The returned list contains `value1,score1,...,valueN,scoreN` instead of `value1,...,valueN`. Client libraries are free to return a more appropriate data type (suggestion: an array with (value, score) arrays/tuples).

## Index ranges

By default, the command performs an index range query. The `<start>` and `<stop>` arguments represent zero-based indexes, where `0` is the first element, `1` is the next element, and so on. These arguments specify an **inclusive range**, so for example, `ZRANGE myzset 0 1` will return both the first and the second element of the sorted set.

The indexes can also be negative numbers indicating offsets from the end of the sorted set, with `-1` being the last element of the sorted set, `-2` the penultimate element, and so on.

Out of range indexes do not produce an error.

If `<start>` is greater than either the end index of the sorted set or `<stop>`, an empty list is returned.

If `<stop>` is greater than the end index of the sorted set, Redis will use the last element of the sorted set.

## Score ranges

When the `BYSCORE` option is provided, the command behaves like [`ZRANGEBYSCORE`]({{< relref "/commands/zrangebyscore" >}}) and returns the range of elements from the sorted set having scores equal or between `<start>` and `<stop>`.

`<start>` and `<stop>` can be `-inf` and `+inf`, denoting the negative and positive infinities, respectively. This means that you are not required to know the highest or lowest score in the sorted set to get all elements from or up to a certain score.

By default, the score intervals specified by `<start>` and `<stop>` are closed (inclusive).
It is possible to specify an open interval (exclusive) by prefixing the score
with the character `(`.

For example:

```
ZRANGE zset (1 5 BYSCORE
```

Will return all elements with `1 < score <= 5` while:

```
ZRANGE zset (5 (10 BYSCORE
```

Will return all the elements with `5 < score < 10` (5 and 10 excluded).

## Reverse ranges

Using the `REV` option reverses the sorted set, with index 0 as the element with the highest score.

By default, `<start>` must be less than or equal to `<stop>` to return anything.
However, if the `BYSCORE`, or `BYLEX` options are selected, the `<start>` is the highest score to consider, and `<stop>` is the lowest score to consider, therefore `<start>` must be greater than or equal to `<stop>` in order to return anything.

For example:

```
ZRANGE zset 5 10 REV
```

Will return the elements between index 5 and 10 in the reversed index.

```
ZRANGE zset 10 5 REV BYSCORE
```

Will return all elements with scores less than 10 and greater than 5.

## Lexicographical ranges

When the `BYLEX` option is used, the command behaves like [`ZRANGEBYLEX`]({{< relref "/commands/zrangebylex" >}}) and returns the range of elements from the sorted set between the `<start>` and `<stop>` lexicographical closed range intervals.

Note that lexicographical ordering relies on all elements having the same score. The reply is unspecified when the elements have different scores.

Valid `<start>` and `<stop>` must start with `(` or `[`, in order to specify
whether the range interval is exclusive or inclusive, respectively.

The special values of `+` or `-` for `<start>` and `<stop>` mean positive and negative infinite strings, respectively, so for instance the command `ZRANGE myzset - + BYLEX` is guaranteed to return all the elements in the sorted set, providing that all the elements have the same score.

The `REV` options reverses the order of the `<start>` and `<stop>` elements, where `<start>` must be lexicographically greater than `<stop>` to produce a non-empty result.

### Lexicographical comparison of strings

Strings are compared as a binary array of bytes. Because of how the ASCII character set is specified, this means that usually this also have the effect of comparing normal ASCII characters in an obvious dictionary way. However, this is not true if non-plain ASCII strings are used (for example, utf8 strings).

However, the user can apply a transformation to the encoded string so that the first part of the element inserted in the sorted set will compare as the user requires for the specific application. For example, if I want to
add strings that will be compared in a case-insensitive way, but I still
want to retrieve the real case when querying, I can add strings in the
following way:

    ZADD autocomplete 0 foo:Foo 0 bar:BAR 0 zap:zap

Because of the first *normalized* part in every element (before the colon character), we are forcing a given comparison. However, after the range is queried using `ZRANGE ... BYLEX`, the application can display to the user the second part of the string, after the colon.

The binary nature of the comparison allows to use sorted sets as a general purpose index, for example, the first part of the element can be a 64-bit big-endian number. Since big-endian numbers have the most significant bytes in the initial positions, the binary comparison will match the numerical comparison of the numbers. This can be used in order to implement range queries on 64-bit values. As in the example below, after the first 8 bytes, we can store the value of the element we are indexing.

## Examples

{{< clients-example cmds_sorted_set zrange1 >}}
> ZADD myzset 1 "one" 2 "two" 3 "three"
(integer) 3
> ZRANGE myzset 0 -1
1) "one"
2) "two"
3) "three"
> ZRANGE myzset 2 3
1) "three"
> ZRANGE myzset -2 -1
1) "two"
2) "three"
{{< /clients-example >}}

The following example using `WITHSCORES` shows how the command returns always an array, but this time, populated with *element_1*, *score_1*, *element_2*, *score_2*, ..., *element_N*, *score_N*.

{{< clients-example cmds_sorted_set zrange2 >}}
> ZADD myzset 1 "one" 2 "two" 3 "three"
(integer) 3
> ZRANGE myzset 0 1 WITHSCORES
1) "one"
2) "1"
3) "two"
4) "2"
{{< /clients-example >}}

This example shows how to query the sorted set by score, excluding the value `1` and up to infinity, returning only the second element of the result:

{{< clients-example cmds_sorted_set zrange3 >}}
> ZADD myzset 1 "one" 2 "two" 3 "three"
(integer) 3
> ZRANGE myzset (1 +inf BYSCORE LIMIT 1 1
1) "three"
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
ZADD myzset 1 "one" 2 "two" 3 "three"
ZRANGE myzset 0 -1
ZRANGE myzset 2 3
ZRANGE myzset -2 -1
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zrange-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of members in the specified range with, optionally, their scores when the _WITHSCORES_ option is given.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of members in the specified range with, optionally, their scores when the _WITHSCORES_ option is given.

{{< /multitabs >}}
