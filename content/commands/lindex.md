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
- display_text: index
  name: index
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
- readonly
complexity: O(N) where N is the number of elements to traverse to get to the element
  at index. This makes asking for the first or the last element of the list O(1).
description: Returns an element from a list by its index.
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
linkTitle: LINDEX
railroad_diagram: /images/railroad/lindex.svg
since: 1.0.0
summary: Returns an element from a list by its index.
syntax_fmt: LINDEX key index
syntax_str: index
title: LINDEX
---
Returns the element at index `index` in the list stored at `key`.
The index is zero-based, so `0` means the first element, `1` the second element
and so on.
Negative indices can be used to designate elements starting at the tail of the
list.
Here, `-1` means the last element, `-2` means the penultimate and so forth.

When the value at `key` is not a list, an error is returned.

## Examples

{{% redis-cli %}}
LPUSH mylist "World"
LPUSH mylist "Hello"
LINDEX mylist 0
LINDEX mylist -1
LINDEX mylist 3
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="lindex-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): when _index_ is out of range.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the requested element.

-tab-sep-

One of the following:
* [Null reply](../../develop/reference/protocol-spec#nulls): when _index_ is out of range.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the requested element.

{{< /multitabs >}}
