---
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
description: Introduction to Redis vector sets
linkTitle: Vector sets
title: Redis vector sets
weight: 55
---

Vector sets are a data type similar to sorted sets, but having string elements that are associated with a vector instead of a score.
Vector sets allow you to add items to a set, and then either:

* retrieve a subset of items that are the most similar to a specified vector, or
* retrieve a subset of items that are the most similar to the vector of an element that is already part of the vector set.

Vector sets also provide for optional [filtered search]({{< relref "/develop/data-types/vector-sets/filtered-search" >}}) capabilities. It is possible to associate attributes to all or to a subset of elements in a given vector set, and then, using the `FILTER` option of the [`VSIM`]({{< relref "/commands/vsim" >}}) command, ask for items similar to a given vector but also passing a filter specified as a simple mathematical expression. For example, `".year > 1950"`.

The following commands are available for vector sets:

- [VADD]({{< relref "/commands/vadd" >}})
- [VCARD]({{< relref "/commands/vcard" >}})
- [VDIM]({{< relref "/commands/vdim" >}})
- [VEMB]({{< relref "/commands/vemb" >}})
- [VGETATTR]({{< relref "/commands/vgetattr" >}})
- [VINFO]({{< relref "/commands/vinfo" >}})
- [VLINKS]({{< relref "/commands/vlinks" >}})
- [VRANDMEMBER]({{< relref "/commands/vrandmember" >}})
- [VREM]({{< relref "/commands/vrem" >}})
- [VSETATTR]({{< relref "/commands/vsetattr" >}})
- [VSIM]({{< relref "/commands/vsim" >}})