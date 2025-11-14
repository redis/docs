---
acl_categories:
- '@write'
- '@list'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: element
  multiple: true
  name: element
  type: string
arity: -3
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
complexity: O(1) for each element added, so O(N) to add N elements when the command
  is called with multiple arguments.
description: Prepends one or more elements to a list. Creates the key if it doesn't
  exist.
group: list
hidden: false
history:
- - 2.4.0
  - Accepts multiple `element` arguments.
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
linkTitle: LPUSH
railroad_diagram: /images/railroad/lpush.svg
since: 1.0.0
summary: Prepends one or more elements to a list. Creates the key if it doesn't exist.
syntax_fmt: LPUSH key element [element ...]
syntax_str: element [element ...]
title: LPUSH
---
Insert all the specified values at the head of the list stored at `key`.
If `key` does not exist, it is created as empty list before performing the push
operations.
When `key` holds a value that is not a list, an error is returned.

It is possible to push multiple elements using a single command call just
specifying multiple arguments at the end of the command.
Elements are inserted one after the other to the head of the list, from the
leftmost element to the rightmost element.
So for instance the command `LPUSH mylist a b c` will result into a list
containing `c` as first element, `b` as second element and `a` as third element.

## Examples
{{< clients-example cmds_list lpush >}}
redis> LPUSH mylist "world"
(integer) 1
redis> LPUSH mylist "hello"
(integer) 2
redis> LRANGE mylist 0 -1
1) "hello"
2) "world"
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
LPUSH mylist "world"
LPUSH mylist "hello"
LRANGE mylist 0 -1
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="lpush-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the length of the list after the push operation.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the length of the list after the push operation.

{{< /multitabs >}}
