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
description: Learn how to use query attributes
linkTitle: Query attributes
title: Query attributes
weight: 22
---

## Query attributes

As of v1.2.0, you can apply specific query modifying attributes to specific clauses of the query.

The syntax is `(foo bar) => { $attribute: value; $attribute:value; ...}`:

```
(foo bar) => { $weight: 2.0; $slop: 1; $inorder: true; }
~(bar baz) => { $weight: 0.5; }
```

The supported attributes are:

1. **$weight**: determines the weight of the sub-query or token in the overall ranking on the result (default: 1.0).
2. **$slop**: determines the maximum allowed slop (space between terms) in the query clause (default: 0).
3. **$inorder**: whether or not the terms in a query clause must appear in the same order as in the query. This is usually set alongside with `$slop` (default: false).
4. **$phonetic**: whether or not to perform phonetic matching (default: true). Note: setting this attribute to true for fields which were not created as `PHONETIC` will produce an error.

As of v2.6.1, the query attributes syntax supports these additional attributes:

* **$yield_distance_as**: specifies the distance field name for clauses that yield some distance metric. This is used for later sorting and/or returning. It is currently supported for vector queries only (both KNN and range).
* **$shard_k_ratio**: controls how many results each shard retrieves relative to the requested top_k in cluster setups. Value range: 0.1 - 1.0 (default: 1.0). Only applicable to vector KNN queries in Redis cluster environments. See [Cluster-specific query parameters]({{< relref "develop/ai/search-and-query/vectors#cluster-specific-query-parameters" >}}) for detailed information.
* **vector query params**: pass optional parameters for [vector queries]({{< relref "develop/ai/search-and-query/vectors#querying-vector-fields" >}}) in key-value format.
