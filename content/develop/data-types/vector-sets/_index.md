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

Vector sets are a data type similar to sorted sets, but instead of a score, vector set elements have a string representation of a vector.
Vector sets allow you to add items to a set, and then either:

* retrieve a subset of items that are the most similar to a specified vector, or
* retrieve a subset of items that are the most similar to the vector of an element that is already part of the vector set.

Vector sets also provide for optional [filtered search]({{< relref "/develop/data-types/vector-sets/filtered-search" >}}). You can associate attributes with all or some elements in a vector set, and then use the `FILTER` option of the [`VSIM`]({{< relref "/commands/vsim" >}}) command to retrieve items similar to a given vector while applying simple mathematical filters to those attributes. Here's a sample filter: `".year > 1950"`.

The following commands are available for vector sets:

- [VADD]({{< relref "/commands/vadd" >}}) - add an element to a vector set, creating a new set if it didn't already exist.
- [VCARD]({{< relref "/commands/vcard" >}}) - retrieve the number of elements in a vector set.
- [VDIM]({{< relref "/commands/vdim" >}}) - retrieve the dimension of the vectors in a vector set.
- [VEMB]({{< relref "/commands/vemb" >}}) - retrieve the approximate vector associated with a vector set element.
- [VGETATTR]({{< relref "/commands/vgetattr" >}}) - retrieve the attributes of a vector set element.
- [VINFO]({{< relref "/commands/vinfo" >}}) - retrieve metadata and internal details about a vector set, including size, dimensions, quantization type, and graph structure.
- [VLINKS]({{< relref "/commands/vlinks" >}}) - retrieve the neighbors of a specified element in a vector set; the connections for each layer of the HNSW graph.
- [VRANDMEMBER]({{< relref "/commands/vrandmember" >}}) - retrieve random elements of a vector set.
- [VREM]({{< relref "/commands/vrem" >}}) - remove an element from a vector set.
- [VSETATTR]({{< relref "/commands/vsetattr" >}}) - set or replace attributes on a vector set element.
- [VSIM]({{< relref "/commands/vsim" >}}) - retrieve elements similar to a given vector or element with optional filtering.
