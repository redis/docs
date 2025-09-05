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
description: Return the full list of items in the Top-K sketch
group: topk
hidden: false
linkTitle: TOPK.LIST
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Return the full list of items in the Top-K sketch
syntax_fmt: TOPK.LIST key [WITHCOUNT]
syntax_str: '[WITHCOUNT]'
title: TOPK.LIST
---
Return the full list of items in Top-K sketch.

## Parameters

* **key**: the name of the sketch.
* **WITHCOUNT**: the count of each element is also returned.

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


## Return information

k (or less) items in the given Top-k sketch. The list is sorted by decreased count estimation.

{{< multitabs id="topk-info-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) representing the names of items in the given sketch. If `WITHCOUNT` is requested, an [array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) and 
[integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) pairs, representing the names of the items in the sketch together with their counts.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, non-existant key, or key of the incorrect type.

-tab-sep-

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) representing the names of items in the given sketch. If `WITHCOUNT` is requested, an [array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) and 
[integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) pairs, representing the names of the items in the sketch together with their counts.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, non-existant key, or key of the incorrect type.

{{< /multitabs >}}