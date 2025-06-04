---
acl_categories:
- '@read'
- '@list'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
arity: 2
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
complexity: O(1)
description: Returns the length of a list.
group: list
hidden: false
key_specs:
- RO: true
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
linkTitle: LLEN
since: 1.0.0
summary: Returns the length of a list.
syntax_fmt: LLEN key
syntax_str: ''
title: LLEN
---
Returns the length of the list stored at `key`.
If `key` does not exist, it is interpreted as an empty list and `0` is returned.
An error is returned when the value stored at `key` is not a list.

## Examples

{{< clients-example cmds_list llen >}}
redis> LPUSH mylist "World"
(integer) 1
redis> LPUSH mylist "Hello"
(integer) 2
redis> LLEN mylist
(integer) 2
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
LPUSH mylist "World"
LPUSH mylist "Hello"
LLEN mylist
{{% /redis-cli %}}

## Return information

{{< multitabs id="llen-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the length of the list.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the length of the list.

{{< /multitabs >}}
