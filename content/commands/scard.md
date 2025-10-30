---
acl_categories:
- '@read'
- '@set'
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
description: Returns the number of members in a set.
group: set
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
linkTitle: SCARD
since: 1.0.0
summary: Returns the number of members in a set.
syntax_fmt: SCARD key
syntax_str: ''
title: SCARD
---
Returns the set cardinality (number of elements) of the set stored at `key`.

## Examples

{{% redis-cli %}}
SADD myset "Hello"
SADD myset "World"
SCARD myset
{{% /redis-cli %}}

## Return information

{{< multitabs id="scard-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the cardinality (number of elements) of the set, or `0` if the key does not exist.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): The cardinality (number of elements) of the set, or 0 if the key does not exist.

{{< /multitabs >}}
