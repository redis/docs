---
acl_categories:
- '@topk'
- '@read'
- '@slow'
arguments:
- name: key
  type: key
- name: withcount
  optional: true
  token: WITHCOUNT
  type: pure-token
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
complexity: O(k*log(k)) where k is the value of top-k
description: Return full list of items in Top K list
group: topk
hidden: false
linkTitle: TOPK.LIST
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Return full list of items in Top K list
syntax_fmt: TOPK.LIST key [WITHCOUNT]
syntax_str: '[WITHCOUNT]'
title: TOPK.LIST
---
Return full list of items in Top K list.

### Parameters

* **key**: Name of sketch where item is counted.
* **WITHCOUNT**: Count of each element is returned.  

## Return

k (or less) items in Top K list.

The list is sorted by decreased count estimation.

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - the names of items in the TopK list.
If `WITHCOUNT` is requested, [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) and 
[Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) pairs of the names of items in the TopK list and their count.

## Examples

```
TOPK.LIST topk
1) foo
2) 42
3) bar
```

```
TOPK.LIST topk WITHCOUNT
1) foo
2) (integer) 12
3) 42
4) (integer) 7
5) bar
6) (integer) 2
```
