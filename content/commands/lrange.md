---
acl_categories:
- '@read'
- '@list'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: start
  name: start
  type: integer
- display_text: stop
  name: stop
  type: integer
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
complexity: O(S+N) where S is the distance of start offset from HEAD for small lists,
  from nearest end (HEAD or TAIL) for large lists; and N is the number of elements
  in the specified range.
description: Returns a range of elements from a list.
group: list
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
linkTitle: LRANGE
railroad_diagram: /images/railroad/lrange.svg
since: 1.0.0
summary: Returns a range of elements from a list.
syntax_fmt: LRANGE key start stop
syntax_str: start stop
title: LRANGE
---
Returns the specified elements of the list stored at `key`.
The offsets `start` and `stop` are zero-based indexes, with `0` being the first
element of the list (the head of the list), `1` being the next element and so
on.

These offsets can also be negative numbers indicating offsets starting at the
end of the list.
For example, `-1` is the last element of the list, `-2` the penultimate, and so
on.

## Consistency with range functions in various programming languages

Note that if you have a list of numbers from 0 to 100, `LRANGE list 0 10` will
return 11 elements, that is, the rightmost item is included.
This **may or may not** be consistent with behavior of range-related functions
in your programming language of choice (think Ruby's `Range.new`, `Array#slice`
or Python's `range()` function).

## Out-of-range indexes

Out of range indexes will not produce an error.
If `start` is larger than the end of the list, an empty list is returned.
If `stop` is larger than the actual end of the list, Redis will treat it like
the last element of the list.

## Examples

{{< clients-example cmds_list lrange >}}
redis> RPUSH mylist "one"
(integer) 1
redis> RPUSH mylist "two"
(integer) 2
redis> RPUSH mylist "three"
(integer) 3
redis> LRANGE mylist 0 0
1) "one"
redis> LRANGE mylist -3 2
1) "one"
2) "two"
3) "three"
redis> LRANGE mylist -100 100
1) "one"
2) "two"
3) "three"
redis> LRANGE mylist 5 10
(empty array)
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
RPUSH mylist "one"
RPUSH mylist "two"
RPUSH mylist "three"
LRANGE mylist 0 0
LRANGE mylist -3 2
LRANGE mylist -100 100
LRANGE mylist 5 10
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="lrange-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of elements in the specified range, or an empty array if the key doesn't exist.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of elements in the specified range, or an empty array if the key doesn't exist.

{{< /multitabs >}}
