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
- display_text: count
  name: count
  optional: true
  since: 6.2.0
  type: integer
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
- fast
complexity: O(N) where N is the number of elements returned
description: Returns and removes the last elements of a list. Deletes the list if
  the last element was popped.
group: list
hidden: false
history:
- - 6.2.0
  - Added the `count` argument.
key_specs:
- RW: true
  access: true
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
linkTitle: RPOP
since: 1.0.0
summary: Returns and removes the last elements of a list. Deletes the list if the
  last element was popped.
syntax_fmt: RPOP key [count]
syntax_str: '[count]'
title: RPOP
---
Removes and returns the last elements of the list stored at `key`.

By default, the command pops a single element from the end of the list.
When provided with the optional `count` argument, the reply will consist of up
to `count` elements, depending on the list's length.

## Examples

{{< clients-example cmds_list rpop >}}
redis> RPUSH mylist "one" "two" "three" "four" "five"
(integer) 5
redis> RPOP mylist
"five"
redis> RPOP mylist 2
1) "four"
2) "three"
redis> LRANGE mylist 0 -1
1) "one"
2) "two"
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
RPUSH mylist "one" "two" "three" "four" "five"
RPOP mylist
RPOP mylist 2
LRANGE mylist 0 -1
{{% /redis-cli %}}

## Return information

{{< multitabs id="rpop-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): if the key does not exist.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): when called without the _count_ argument, the value of the last element.
* [Array reply](../../develop/reference/protocol-spec#arrays): when called with the _count_ argument, a list of popped elements.

-tab-sep-

One of the following:
* [Null reply](../../develop/reference/protocol-spec#nulls): if the key does not exist.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): when called without the _count_ argument, the value of the last element.
* [Array reply](../../develop/reference/protocol-spec#arrays): when called with the _count_ argument, a list of popped elements.

{{< /multitabs >}}
