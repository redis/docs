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
description: Learn how to use vector fields and perform vector searches in Redis
linkTitle: Vectors
math: true
title: Vectors
weight: 14
---

Redis is commonly used as a [highly-performant vector database](https://redis.io/blog/benchmarking-results-for-vector-databases/). Vector fields enable you to perform semantic search based on vector embeddings in combination with text, numerical, geospatial, or tag metadata.

**Just looking to get started?** Checkout the vector [quickstart guide]({{< baseurl >}}/develop/get-started/vector-database) and the [Redis AI Resources](https://github.com/redis-developer/redis-ai-resources) repo for more assistance.


## Overview

1. [**Create a vector index**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#create-a-vector-index): Redis maintains a secondary index on top of your data with a defined schema (including vector fields and metadata). Redis supports [`FLAT`]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#flat-index) and [`HNSW`]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#hnsw-index) vector index types.
1. [**Store and update vectors**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#store-and-update-vectors): Redis stores vectors in objects as either Hash or JSON.
1. [**Search with vectors**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#search-with-vectors): Redis supports several advanced querying strategies with vector fields including [KNN]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#standard-vector-search) (standard k-nearest neighbor), [vector range queries]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#vector-range-queries), and [metadata filters]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#filters).
1. [**Configure vector queries at runtime**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#runtime-query-params).
1. [**Vector search examples**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#vector-search-examples): Explore several vector search examples that cover different use cases and techniques.

## Create a vector index

Redis maintains a secondary index on top of your data that has a defined schema. You can include one or more vector fields in your schema using the [`FT.CREATE`]({{< baseurl >}}/commands/ft.create/) command.

**Syntax**

```
FT.CREATE <index_name>
  ON <storage_type>
  PREFIX 1 <key_prefix>
  SCHEMA ... <field_name> VECTOR <algorithm> <index_attribute_count>
    [<index_attribute_name> <index_attribute_value> ...]
```

Refer to the full [indexing]({{< baseurl >}}/develop/interact/search-and-query/indexing/) documentation for additional fields, options, and noted limitations.

**Parameters**

| Parameter | Description |
|:----------|:------------|
| `index_name`      | Name of the index.  |
| `storage_type`    | Storage option (`HASH` or `JSON`).  |
| `prefix` (optional) | Key prefix that signals to the index which keys should be included. Defaults to all keys if omitted. |
| `field_name`      | Name of the vector field.  |
| `algorithm`       | Vector index algorithm (`FLAT` or `HNSW`).  |
| `index_attribute_count` | Number of vector field attributes.  |
| `index_attribute_name`  | Vector field attribute name.  |
| `index_attribute_value` | Vector field attribute value.  |


### FLAT index
Choose the FLAT index when you have small datasets (< 1M vectors) or when search accuracy is most important, even at the expense of additional latency.

**Required attributes**

| Attribute          | Description                              |
|--------------------|------------------------------------------|
| `TYPE`             | Vector type (`FLOAT16`, `FLOAT32`, `FLOAT64`).  |
| `DIM`              | Vector dimension. Must be a positive integer; identical for both document and query vectors.  |
| `DISTANCE_METRIC`  | Distance metric (`L2`, `IP`, `COSINE`).  |

**Optional attributes**

| Attribute          | Description                                      |
|--------------------|--------------------------------------------------|
| `INITIAL_CAP`      | Initial vector capacity in the index.            |
| `BLOCK_SIZE`       | Block size for memory allocation. Defaults to 1024.  |

**Example**

```
FT.CREATE my_index
  ON HASH
  PREFIX 1 docs:
  SCHEMA my_vector_field VECTOR FLAT 6
    TYPE FLOAT32
    DIM 1536
    DISTANCE_METRIC COSINE
```
In the example above, an index named `my_index` is created over hashes with the key prefix `docs:`, a `FLAT` vector field named `my_vector_field` with three index attributes (`TYPE`, `DIM`, and `DISTANCE_METRIC`).

### HNSW index

HNSW is an approximate nearest neighbors algorithm (ANN) that uses a multi-layered graph to make vector search more scalable.
- The lowest layer contains all data points, and each higher layer contains a subset, forming a hierarchy.
- At runtime, the search traverses the graph on each layer from top to bottom, finding the local minima before dropping to the subsequent layer.

Choose the HNSW index when you have larger datasets or when search performance and scalability are most important, even at the expense of lower search accuracy.

**Required attributes**

| Attribute          | Description                              |
|:-------------------|:-----------------------------------------|
| `TYPE`             | Vector type (`FLOAT16`, `FLOAT32`, `FLOAT64`). |
| `DIM`              | Vector dimension. *Must be a positive integer.* |
| `DISTANCE_METRIC`  | Distance metric (`L2`, `IP`, `COSINE`).  |

**Optional attributes**

HNSW supports a number of additional parameters to tune
the accuracy of the queries, while trading off performance. Read more about
them [here](https://arxiv.org/ftp/arxiv/papers/1603/1603.09320.pdf).

| Attribute          | Description                                                                
|:-------------------|:--------------------------------------------------------------------------------------------|
| `INITIAL_CAP`      | Initial vector capacity in the index.                                                           |
| `M`                | Max number of outgoing edges (connections) for each node in the graph per layer. On layer zero the max number of connections will be 2M. Higher values increase accuracy, but also increase memory usage and index build time. Defaults to 16.            |
| `EF_CONSTRUCTION`  | Max number of connected neighbors to consider during graph building. Higher values increase accuracy, but also increase index build time. Defaults to 200.                                      |
| `EF_RUNTIME`       | Max top candidates during KNN search. Higher values increase accuracy, but also increase search latency. Defaults to 10. |
| `EPSILON`          | Relative factor that sets the boundaries in which a range query may search for candidates. That is, vector candidates whose distance from the query vector is radius*(1 + EPSILON) are potentially scanned, allowing more extensive search and more accurate results (at the expense of runtime). Defaults to 0.01.                                             |

**Example**

```
FT.CREATE my_index
  ON HASH
  PREFIX 1 docs:
  SCHEMA my_vector_field VECTOR HNSW 16
    TYPE FLOAT64
    DIM 1536
    DISTANCE_METRIC COSINE
    M 40
    EF_CONSTRUCTION 250
    EF_RUNTIME 20
    EPSILON 0.8
```

### Distance metrics

Redis supports three popular distance metrics to measure the degree of similarity between two vectors $u$, $v$ $\in \mathbb{R}^n$ where $n$ is the length of the vectors:

| Distance metric | Description | Mathematical representation |
|:--------------- |:----------- |:--------------------------- |
| `L2` | Euclidean distance between two vectors. | $d(u, v) = \sqrt{ \displaystyle\sum_{i=1}^n{(u_i - v_i)^2}}$ |
| `IP` | Inner product of two vectors. | $d(u, v) = 1 -u\cdot v$ |
| `COSINE` | Cosine distance of two vectors. | $d(u, v) = 1 -\frac{u \cdot v}{\lVert u \rVert \lVert v  \rVert}$ |

The above metrics calculate distance between two vectors, where the smaller the value is, the closer the two vectors are in vector space.

## Store and update vectors

On index creation, the `<storage_type>` dictates how vector and metadata are structured and loaded into Redis.

### Hash
Store or update vectors and any metadata in [hashes]({{< baseurl >}}/develop/data-types/hashes/) with the [`HSET`]({{< baseurl >}}/commands/hset/) command.

**Example**
```
HSET docs:01 vector <vector_bytes> foo bar
```


{{% alert title="Tip" color="warning" %}}
Hashes expect all data to be represented as strings. Thus, `<vector_bytes>` represents a bytes version of the vector.
{{% /alert  %}}

A common way of converting vectors to bytes is through the Python [numpy](https://numpy.org/doc/stable/reference/generated/numpy.ndarray.tobytes.html) library and [redis-py](https://redis-py.readthedocs.io/en/stable/examples/search_vector_similarity_examples.html) client:

```py
import numpy as np
from redis import Redis

redis_client = Redis(host='localhost', port=6379)

# Create a FLOAT32 vector
vector = np.array([0.34, 0.63, -0.54, -0.69, 0.98, 0.61], dtype=np.float32)

# Convert vector to bytes
vector_bytes = vector.tobytes()

# Use redis client to store the vector bytes and metadata under a specified key
redis_client.hset('docs:01', mapping = {"vector": vector_bytes, "foo": "bar"})
```

{{% alert title="Tip" color="warning" %}}
Note that the vector blob size must match the vector field dimension and float type specified in the schema, otherwise the indexing will fail in the background.
{{% /alert  %}}

### JSON
Store or update vectors and any metadata in [JSON]({{< baseurl >}}/develop/data-types/json/) with the [`JSON.SET`]({{< baseurl >}}/commands/json.set/) command.

Unlike in hashes, vectors are stored in JSON documents as arrays (not as bytes).

**Example**
```
JSON.SET docs:01 $ '{"vector":[0.34,0.63,-0.54,-0.69,0.98,0.61], "foo": "bar"}'
```

One of the additional benefits of JSON is schema flexibility. As of v2.6.1, JSON supports multi-value indexing.
Thus, it is possible to index multiple vectors under the same JSONPath.

Here are some examples of multi-value indexing with vectors:

**Example**
```
JSON.SET key $ '{"vector":[[1,2,3,4], [5,6,7,8]]}'
JSON.SET key $ '{"item1":{"vector":[1,2,3,4]}, "item2":{"vector":[5,6,7,8]}}'
```

Additional information and examples are available in the [Indexing JSON documents]({{< baseurl >}}/develop/interact/search-and-query/indexing/#index-json-arrays-as-vector) section.

## Search with vectors
You can run vector search queries with the [`FT.SEARCH`]({{< baseurl >}}/commands/ft.search/) or [`FT.AGGREGATE`]({{< baseurl >}}/commands/ft.aggregate/) commands.

To use a vector similarity query with `FT.SEARCH`, you must always specify the `DIALECT 2` option. See the [dialects page]({{< relref "/develop/interact/search-and-query/advanced-concepts/dialects" >}}) for more information.

### Standard vector search

Standard vector search has the following common syntax:

**Syntax**

```
FT.SEARCH <index_name>
  <primary_filter_query>=>[KNN <top_k> @<vector_field> $<vector_blob_param> $<vector_query_params> AS <distance_field>]
  PARAMS <vector_query_params_count> [<vector_query_param_name> <vector_query_param_value> ...]
  SORTBY <distance_field>
  DIALECT 2
```
TODO ^^ Need to validate this query generalization

**Parameters**

| Parameter         | Description                                                                                       |
|:------------------|:--------------------------------------------------------------------------------------------------|
| `index_name`  | Name of the index.  |
| `primary_filter_query`  | Optional [filter]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#filters) criteria. Defaults to `*`.  |
| `top_k` | Number of nearest neighbors. Also commonly provided to the `LIMIT` param to truncate the number of results through pagination.  |
| `vector_field`  | Name of the vector field in the index.  |
| `vector_blob_param`  | The query vector as bytes and must be passed through the `PARAMS` section. The blob's byte size should match the vector field dimension and type.  |
| `vector_query_params` (optional) | An optional section for marking one or more vector query parameters passed through the `PARAMS` section. Valid parameters should be provided as key-value pairs. See which [runtime query params]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#runtime-query-params) are supported for each vector index type.  |
| `distance_field` (optional) | The optional distance field name used in the response and/or for sorting. By default, the distance field name is "`__<vector_field>_score`" and it can be used for sorting without using `AS <distance_field>` in the query.  |
| `vector_query_params_count` | The number of vector query params.  |
| `vector_query_param_name` | The name of the vector query param.  |
| `vector_query_param_value` | The value of the vector query param.  |

**Example**

```
FT.SEARCH my_index "(@title:Matrix @year:[2020 2022])=>[KNN 10 @my_vector_field $BLOB]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" DIALECT 2
```

**Use query attributes**

Alternatively, as of v2.6, `<vector_query_params> and `<distance_field>` name can be specified in runtime
[query attributes]({{< relref "/develop/interact/search-and-query/advanced-concepts/query_syntax" >}}#query-attributes) as well. Thus, the following format is also supported:

```
[KNN <top_k> @<vector_field> $<vector_blob_param>]=>{$yield_distance_as: <distance_field>}
```

### Vector range queries
Vector range queries allow you to filter the index using a `radius` parameter representing the semantic distance between an input query vector and indexed vector fields. This is useful in scenarios when you don't know the right value to use for `top_k`, but you know what distance threshold should be applied.

Vector range queries operate slightly different than standard vector queries:
- Vector range queries can appear *multiple times* in a query as a filter criteria.
- Vector range queries can be a part of the `<primary_filter_query>` in KNN vector search.

**Syntax**

```
FT.SEARCH <index_name>
  @<vector_field>:[VECTOR_RANGE (<radius> | $<radius_param>) $<vector_blob_param> $<vector_query_params>]
  PARAMS <vector_query_params_count> [<vector_query_param_name> <vector_query_param_value> ...]
  SORTBY <distance_field>
  DIALECT 2
```
| Parameter         | Description                                                                                       |
|:------------------|:--------------------------------------------------------------------------------------------------|
| `index_name`  | Name of the index.  |
| `vector_field`  | Name of the vector field in the index. |
| `radius` or `radius_param` | The maximum semantic distance allowed between the query vector and indexed vectors. You can provide the value directly in the query, passed to the `PARAMS` section, or as a query attribute.
| `vector_blob_param`  | The query vector as bytes and must be passed through the `PARAMS` section. The blob's byte size should match the vector field dimension and type. |
| `vector_query_params` (optional) | An optional section for marking one or more vector query parameters passed through the `PARAMS` section. Valid parameters should be provided as key-value pairs. See which [runtime query params]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#runtime-query-params) are supported for each vector index type.  |
| `vector_query_params_count` | The number of vector query params.  |
| `vector_query_param_name` | The name of the vector query param.  |
| `vector_query_param_value` | The value of the vector query param.  |


**Use query attributes**

Vector range queries clause can be followed by a query attributes section as follows: `@<vector_field>: [VECTOR_RANGE (<radius> | $<radius_param>) $<vector_blob_param>]=>{$<param>: (<value> | $<value_attribute>); ... }`, where the relevant params in that case are `$yield_distance_as` and `$epsilon`. Note that there is no default distance field name in range queries.

TODO ^^ need to clean this up a bit more and tighten the language.

---

### Filters

Redis supports vector search along with various filters to narrow the search space based on defined criteria. If your index contains searchable fields (for example, `TEXT`, `TAG`, `NUMERIC`, `GEO`, `GEOSHAPE`, and `VECTOR`), you can perform vector searches with filters.

**Supported filter types**

- [Exact Match Filters](https://redis.io/docs/develop/interact/search-and-query/query/exact-match/)
- [Numeric Range Filters](https://redis.io/docs/develop/interact/search-and-query/query/range/)
- [Full-text Search](https://redis.io/docs/develop/interact/search-and-query/query/full-text/)
- [Geospatial](https://redis.io/docs/develop/interact/search-and-query/query/geo-spatial/)

You can also [combine multiple queries](https://redis.io/docs/develop/interact/search-and-query/query/combined/) as a filter.

**Syntax**

Vector search queries with filters follow this basic structure:

```
FT.SEARCH <index_name> <primary_filter_query>=>[...]
```

where `<primary_filter_query>` defines document selection and filtering.

### How Filtering Works

Redis uses internal algorithms to optimize the filtering computation for vector search. The runtime algorithm is determined by heuristics that aim to minimize query latency, based on several factors derived from the query and the index.

**Batches mode**

- A batch of high-scoring documents from the vector index is retrieved. These documents are yielded ONLY if the `<primary_filter_query>` is satisfied. In other words, the document must contain a similar vector and meet the filter criteria.
- The iterative procedure terminates when `<top_k>` documents that pass the filter criteria are yielded, or after every vector in the index has been processed.
- The batch size is determined automatically by heuristics based on `<top_k>`, and the ratio between the expected number of documents in the index that pass the `<primary_filter_query>` and the vector index size.
- The goal is to minimize the total number of batches required to get the `<top_k>` results while preserving a small batch size as possible. Note that the batch size may change dynamically in each iteration based on the number of results that passed the filter in previous batches.

**Ad-hoc brute force mode**

- The score of *every* vector corresponding to a document that passes the filter is computed, and the `<top_k>` results are selected and returned.
- This approach is preferable when the number of documents passing the `<primary_filter_query>` is relatively small.
- The results of the KNN query will *always be accurate* in this mode, even if the underlying vector index algorithm is an approximate one.

The execution mode may switch from *batches* to *ad-hoc brute-force* during the run, based on updated estimations of relevant factors from one batch to another.


## Runtime query parameters

### Filter mode

By default, Redis selects the best filter mode to optimize query execution. You can override the auto-selected policy using these optional params:

| Parameter        | Description                                                                                                  | Options                     |
|:-----------------|:-------------------------------------------------------------------------------------------------------------|:----------------------------|
| `HYBRID_POLICY`  | Specifies the filter mode to use during vector search with filters (hybrid).                                 | `BATCHES`, `ADHOC_BF`       |
| `BATCH_SIZE`     | A fixed batch size to use in every iteration when the `BATCHES` policy is auto-selected or requested.        | Positive integer.            |


### Index-specific query parameters

**FLAT**

Currently, there are no runtime params available for FLAT indexes.

**HNSW**

Optional runtime params for HNSW indexes are:

| Parameter       | Description                                                                                               | Default value       |
|:----------------|:----------------------------------------------------------------------------------------------------------|:--------------------|
| `EF_RUNTIME`    | The maximum number of top candidates to hold during the KNN search. Higher values lead to more accurate results at the expense of a longer query runtime. | Value passed during index creation (default is 10). |
| `EPSILON`       | Relative factor that sets the boundaries for a vector range query. Vector candidates whose distance from the query vector is `radius * (1 + EPSILON)` are potentially scanned, allowing a more extensive search and more accurate results at the expense of runtime. | Value passed during index creation (default is 0.01). |



### Important notes

{{% alert title="Important notes" color="info" %}}

1. Although specifying `<top_k>` requested results in KNN search, the default `LIMIT` is 10, to get all the returned results, specify `LIMIT 0 <top_k>` in your search command. See examples below.

2. By default, the results are sorted by their document's score. To sort by some vector similarity score, use `SORTBY <distance_field>`. See examples below.

3. It is recommended to adjust the `<radius>` parameter in range queries to the corresponding vector field distance metric and to the data itself. In particular, recall that the distance between the vectors in an index whose distance metric is Cosine is bounded by `2`, while L2 distance between the vectors is not bounded. Hence, it is better to consider the distance between the vectors that are considered similar and choose `<radius>` accordingly.

{{% /alert %}}


## Vector search examples

Below are a number of examples to help you get started. If you want a more comprehensive walkthrough, visit the vector [quickstart guide]({{< baseurl >}}/develop/get-started/vector-database) and the [Redis AI Resources](https://github.com/redis-developer/redis-ai-resources) repo for more assistance.

### "Pure" KNN queries
Return the 10 nearest neighbor documents for which the vector stored under its `vector` field is the closest to the vector represented by the following 4-bytes blob:
```
FT.SEARCH idx "*=>[KNN 10 @vector $BLOB]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" DIALECT 2
```
Now, sort the results by their distance from the query vector:
```
FT.SEARCH idx "*=>[KNN 10 @vector $BLOB]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" SORTBY __vector_score DIALECT 2
```
Return the top 10 similar documents, use *query params* (see "params" section in [FT.SEARCH command]({{< baseurl >}}/commands/ft.search)) for specifying `K` and `EF_RUNTIME` parameter, and set `EF_RUNTIME` value to 150 (assuming `vector` is an HNSW index):
```
FT.SEARCH idx "*=>[KNN $K @vector $BLOB EF_RUNTIME $EF]" PARAMS 6 BLOB "\x12\xa9\xf5\x6c" K 10 EF 150 DIALECT 2
```
Similar to the previous queries, this time use a custom distance field name to sort by it:
```
FT.SEARCH idx "*=>[KNN $K @vector $BLOB AS my_scores]" PARAMS 4 BLOB "\x12\xa9\xf5\x6c" K 10 SORTBY my_scores DIALECT 2
```
Use [query attributes]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/query_syntax#query-attributes) syntax to specify optional parameters and the distance field name:
```
FT.SEARCH idx "*=>[KNN 10 @vector $BLOB]=>{$EF_RUNTIME: $EF; $YIELD_DISTANCE_AS: my_scores}" PARAMS 4 EF 150 BLOB "\x12\xa9\xf5\x6c" SORTBY my_scores DIALECT 2
```

Find additional Python examples for [`redis-py`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/00_redispy.ipynb) and [`redisvl`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/01_redisvl.ipynb).

### Pre-filter KNN queries (hybrid approach)

Among documents that have `'Dune'` in their `title` field and their `num` value is in the range `[2020, 2022]`, return the top 10 for which the vector stored in the `vector` field is the closest to the vector represented by the following 4-bytes blob:

```
FT.SEARCH idx "(@title:Dune @num:[2020 2022])=>[KNN $K @vector $BLOB AS my_scores]" PARAMS 4 BLOB "\x12\xa9\xf5\x6c" K 10 SORTBY my_scores DIALECT 2
```

Use a different filter for the hybrid approach: this example returns the top 10 results from the documents that contain a `'shirt'` tag  in the `type` field and optionally a `'blue'` tag in their `color` field. The results are sorted by the full-text scorer.

```
FT.SEARCH idx "(@type:{shirt} ~@color:{blue})=>[KNN $K @vector $BLOB]" PARAMS 4 BLOB "\x12\xa9\xf5\x6c" K 10 DIALECT 2
```

This example shows a pre-filter with KNN query in which the hybrid policy is set explicitly to "ad-hoc brute force" (rather than auto-selected):

```
FT.SEARCH idx "(@type:{shirt})=>[KNN $K @vector $BLOB HYBRID_POLICY ADHOC_BF]" PARAMS 4 BLOB "\x12\xa9\xf5\x6c" K 10 SORTBY __vec_scores DIALECT 2
```

This example shows a pre-filter with KNN query in which the hybrid policy is set explicitly to "batches", and the batch size is set explicitly to be 50 using a query parameter:

```
FT.SEARCH idx "(@type:{shirt})=>[KNN $K @vector $BLOB HYBRID_POLICY BATCHES BATCH_SIZE $B_SIZE]" PARAMS 6 BLOB "\x12\xa9\xf5\x6c" K 10 B_SIZE 50 DIALECT 2
```

Run the same query as above and use the query attributes syntax to specify optional parameters:

```
FT.SEARCH idx "(@type:{shirt})=>[KNN 10 @vector $BLOB]=>{$HYBRID_POLICY: BATCHES; $BATCH_SIZE: 50}" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" DIALECT 2
```

Find additional Python examples for [`redis-py`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/00_redispy.ipynb) and [`redisvl`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/01_redisvl.ipynb).


### Range queries

Return 100 documents for which the distance between its vector stored under the `vec` field to the specified query vector blob is at most 5 (in terms of `vec` field `DISTANCE_METRIC`):
```
FT.SEARCH idx "@vector:[VECTOR_RANGE $r $BLOB]" PARAMS 4 BLOB "\x12\xa9\xf5\x6c" r 5 LIMIT 0 100 DIALECT 2
```
Run the same query as above and set `EPSILON` parameter to `0.5` (assuming `vec` is HNSW index), yield the vector distance between `vec` and the query result in a field named `my_scores`, and sort the results by that distance.
```
FT.SEARCH idx "@vector:[VECTOR_RANGE 5 $BLOB]=>{$EPSILON:0.5; $YIELD_DISTANCE_AS: my_scores}" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" SORTBY my_scores LIMIT 0 100 DIALECT 2
```
Use the vector range query in a complex query: return all the documents that contain either `'shirt'` in their `type` tag with their `num` value in the range `[2020, 2022]` OR a vector stored in `vec` whose distance from the query vector is no more than `0.8`, then sort results by their vector distance, if it is in the range:
```
FT.SEARCH idx "(@type:{shirt} @num:[2020 2022]) | @vector:[VECTOR_RANGE 0.8 $BLOB]=>{$YIELD_DISTANCE_AS: my_scores}" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" SORTBY my_scores DIALECT 2
```

Find additional Python examples for [`redis-py`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/00_redispy.ipynb) and [`redisvl`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/01_redisvl.ipynb).

