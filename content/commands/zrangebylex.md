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
- display_text: min
  name: min
  type: string
- display_text: max
  name: max
  type: string
- arguments:
  - display_text: offset
    name: offset
    type: integer
  - display_text: count
    name: count
    type: integer
  name: limit
  optional: true
  token: LIMIT
  type: block
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
- readonly
complexity: O(log(N)+M) with N being the number of elements in the sorted set and
  M the number of elements being returned. If M is constant (e.g. always asking for
  the first 10 elements with LIMIT), you can consider it O(log(N)).
deprecated_since: 6.2.0
description: Returns members in a sorted set within a lexicographical range.
doc_flags:
- deprecated
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
linkTitle: ZRANGEBYLEX
replaced_by: '[`ZRANGE`]({{< relref "/commands/zrange" >}}) with the `BYLEX` argument'
since: 2.8.9
summary: Returns members in a sorted set within a lexicographical range.
syntax_fmt: "ZRANGEBYLEX key min max [LIMIT\_offset count]"
syntax_str: "min max [LIMIT\_offset count]"
title: ZRANGEBYLEX
---
When all the elements in a sorted set are inserted with the same score, in order to force lexicographical ordering, this command returns all the elements in the sorted set at `key` with a value between `min` and `max`.

If the elements in the sorted set have different scores, the returned elements are unspecified.

The elements are considered to be ordered from lower to higher strings as compared byte-by-byte using the `memcmp()` C function. Longer strings are considered greater than shorter strings if the common part is identical.

The optional `LIMIT` argument can be used to only get a range of the matching
elements (similar to _SELECT LIMIT offset, count_ in SQL). A negative `count`
returns all elements from the `offset`.
Keep in mind that if `offset` is large, the sorted set needs to be traversed for
`offset` elements before getting to the elements to return, which can add up to
O(N) time complexity.

## How to specify intervals

Valid *start* and *stop* must start with `(` or `[`, in order to specify
if the range item is respectively exclusive or inclusive.
The special values of `+` or `-` for *start* and *stop* have the special
meaning or positively infinite and negatively infinite strings, so for
instance the command **ZRANGEBYLEX myzset - +** is guaranteed to return
all the elements in the sorted set, if all the elements have the same
score.

## Details on strings comparison

Strings are compared as binary array of bytes. Because of how the ASCII character
set is specified, this means that usually this also have the effect of comparing
normal ASCII characters in an obvious dictionary way. However this is not true
if non plain ASCII strings are used (for example utf8 strings).

However the user can apply a transformation to the encoded string so that
the first part of the element inserted in the sorted set will compare as the
user requires for the specific application. For example if I want to
add strings that will be compared in a case-insensitive way, but I still
want to retrieve the real case when querying, I can add strings in the
following way:

    ZADD autocomplete 0 foo:Foo 0 bar:BAR 0 zap:zap

Because of the first *normalized* part in every element (before the colon character), we are forcing a given comparison, however after the range is queries using `ZRANGEBYLEX` the application can display to the user the second part of the string, after the colon.

The binary nature of the comparison allows to use sorted sets as a general
purpose index, for example the first part of the element can be a 64 bit
big endian number: since big endian numbers have the most significant bytes
in the initial positions, the binary comparison will match the numerical
comparison of the numbers. This can be used in order to implement range
queries on 64 bit values. As in the example below, after the first 8 bytes
we can store the value of the element we are actually indexing.

## Examples

{{% redis-cli %}}
ZADD myzset 0 a 0 b 0 c 0 d 0 e 0 f 0 g
ZRANGEBYLEX myzset - [c
ZRANGEBYLEX myzset - (c
ZRANGEBYLEX myzset [aaa (g
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Deprecated as of Redis v6.2.0. |

## Return information

{{< multitabs id="zrangebylex-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of elements in the specified score range.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of elements in the specified score range.

{{< /multitabs >}}
