---
linkTitle: Interactive demo
title: RedisVL queries interactive demo
weight: 3
---

RedisVL builds Redis queries from Python objects. This demo runs three of its query types on the restaurants of a food delivery app: a vector query that searches by meaning, a filter query, and a range query that limits the search to a distance threshold. For each query, it shows the RedisVL code, the `FT.SEARCH` command RedisVL sends, and the results.

The demo runs in your browser and doesn't connect to Redis or run an embedding model. Its results are the ones Redis returned for these queries, with descriptions embedded by `sentence-transformers/all-mpnet-base-v2`, and its code and commands are what RedisVL 0.27.1 builds. The restaurants are the same sample data as the [Context Retriever interactive demo]({{< relref "/develop/ai/context-engine/context-retriever/interactive-demo" >}}).

{{< redisvl-demo >}}

## What the demo shows

1. **Vector query.** A `VectorQuery` embeds a phrase and returns the nearest restaurants by cosine distance, even when their descriptions share no words with the phrase. With `Tag` and `Num` filters, it returns the nearest restaurants among those that pass the filters.
2. **Filter query.** A `FilterQuery` matches on the same filter expressions, with no vector.
3. **Range query.** A `VectorRangeQuery` returns every restaurant within a distance threshold, instead of a fixed number of nearest neighbors.

## Next steps

- Read about each [query type]({{< relref "/develop/ai/redisvl/concepts/queries" >}}) RedisVL supports.
- Follow the [query and filter data]({{< relref "/develop/ai/redisvl/user_guide/how_to_guides/complex_filtering" >}}) guide for text, geo, and timestamp filters.
