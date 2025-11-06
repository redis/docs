---
acl_categories:
- '@write'
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
- write
complexity: O(N) where N is the number of elements to be removed by the operation.
description: Removes elements from both ends a list. Deletes the list if all elements
  were trimmed.
group: list
hidden: false
key_specs:
- RW: true
  begin_search:
    spec:
      index: 1
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: LTRIM
railroad_diagram: /images/railroad/ltrim.svg
since: 1.0.0
summary: Removes elements from both ends a list. Deletes the list if all elements
  were trimmed.
syntax_fmt: LTRIM key start stop
syntax_str: start stop
title: LTRIM
---
Trim an existing list so that it will contain only the specified range of
elements specified.
Both `start` and `stop` are zero-based indexes, where `0` is the first element
of the list (the head), `1` the next element and so on.

For example: `LTRIM foobar 0 2` will modify the list stored at `foobar` so that
only the first three elements of the list will remain.

`start` and `end` can also be negative numbers indicating offsets from the end
of the list, where `-1` is the last element of the list, `-2` the penultimate
element and so on.

Out of range indexes will not produce an error: if `start` is larger than the
end of the list, or `start > end`, the result will be an empty list (which
causes `key` to be removed).
If `end` is larger than the end of the list, Redis will treat it like the last
element of the list.

A common use of `LTRIM` is together with [`LPUSH`]({{< relref "/commands/lpush" >}}) / [`RPUSH`]({{< relref "/commands/rpush" >}}).
For example:

```
LPUSH mylist someelement
LTRIM mylist 0 99
```

This pair of commands will push a new element on the list, while making sure
that the list will not grow larger than 100 elements.
This is very useful when using Redis to store logs for example.
It is important to note that when used in this way `LTRIM` is an O(1) operation
because in the average case just one element is removed from the tail of the
list.

## Examples

{{% redis-cli %}}
RPUSH mylist "one"
RPUSH mylist "two"
RPUSH mylist "three"
LTRIM mylist 1 -1
LRANGE mylist 0 -1
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="ltrim-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
