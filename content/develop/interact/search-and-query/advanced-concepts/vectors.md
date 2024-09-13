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

Redis includes a [high-performance vector database](https://redis.io/blog/benchmarking-results-for-vector-databases/) that lets you perform semantic searches over vector embeddings. You can augment these searches with filtering over text, numerical, geospatial, and tag metadata.

To quickly get started, check out the [Redis vector quickstart guide]({{< baseurl >}}/develop/get-started/vector-database) and the [Redis AI Resources](https://github.com/redis-developer/redis-ai-resources) Github repo.


## Overview

1. [**Create a vector index**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#create-a-vector-index): Redis maintains a secondary index over your data with a defined schema (including vector fields and metadata). Redis supports [`FLAT`]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#flat-index) and [`HNSW`]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#hnsw-index) vector index types.
1. [**Store and update vectors**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#store-and-update-vectors): Redis stores vectors and metadata in hashes or JSON objects.
1. [**Search with vectors**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#search-with-vectors): Redis supports several advanced querying strategies with vector fields including k-nearest neighbor ([KNN]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#knn-vector-search)), [vector range queries]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#vector-range-queries), and [metadata filters]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#filters).
1. [**Configure vector queries at runtime**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#runtime-query-params).
1. [**Vector search examples**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#vector-search-examples): Explore several vector search examples that cover different use cases and techniques.

## Create a vector index

When you define the schema for an index, you can include one or more vector fields as shown below.

**Syntax**

```
FT.CREATE <index_name>
  ON <storage_type>
  PREFIX 1 <key_prefix>
  SCHEMA ... <field_name> VECTOR <algorithm> <index_attribute_count> <index_attribute_name> <index_attribute_value>
    [<index_attribute_name> <index_attribute_value> ...]
```

Refer to the full [indexing]({{< baseurl >}}/develop/interact/search-and-query/indexing/) documentation for additional fields, options, and noted limitations.

**Parameters**

| Parameter | Description |
|:----------|:------------|
| `index_name`      | Name of the index.  |
| `storage_type`    | Storage option (`HASH` or `JSON`).  |
| `prefix` (optional) | Key prefix used to select which keys should be indexed. Defaults to all keys if omitted. |
| `field_name`      | Name of the vector field.  |
| `algorithm`       | Vector index algorithm (`FLAT` or `HNSW`).  |
| `index_attribute_count` | Number of vector field attributes.  |
| `index_attribute_name`  | Vector field attribute name.  |
| `index_attribute_value` | Vector field attribute value.  |

### FLAT index

Choose the `FLAT` index when you have small datasets (< 1M vectors) or when perfect search accuracy is more important than search latency.

**Required attributes**

| Attribute          | Description                              |
|:-------------------|:-----------------------------------------|
| `TYPE`             | Vector type (`BFLOAT16`, `FLOAT16`, `FLOAT32`, `FLOAT64`). `BFLOAT16` and `FLOAT16` require v2.10 or later.  |
| `DIM`              | The width, or number of dimensions, of the vector embeddings stored in this field. In other words, the number of floating point elements comprising the vector. `DIM` must be a positive integer. The vector used to query this field must have the exact dimensions as the field itself.  |
| `DISTANCE_METRIC`  | Distance metric (`L2`, `IP`, `COSINE`).  |

**Example**

```
FT.CREATE documents
  ON HASH
  PREFIX 1 docs:
  SCHEMA doc_embedding VECTOR FLAT 6
    TYPE FLOAT32
    DIM 1536
    DISTANCE_METRIC COSINE
```
In the example above, an index named `documents` is created over hashes with the key prefix `docs:` and a `FLAT` vector field named `doc_embedding` with three index attributes: `TYPE`, `DIM`, and `DISTANCE_METRIC`.

### HNSW index

`HNSW`, or hierarchical navigable small world, is an approximate nearest neighbors algorithm that uses a multi-layered graph to make vector search more scalable.
- The lowest layer contains all data points, and each higher layer contains a subset, forming a hierarchy.
- At runtime, the search traverses the graph on each layer from top to bottom, finding the local minima before dropping to the subsequent layer.

Choose the `HNSW` index type when you have larger datasets (> 1M documents) or when search performance and scalability are more important than perfect search accuracy.

**Required attributes**

| Attribute          | Description                              |
|:-------------------|:-----------------------------------------|
| `TYPE`             | Vector type (`BFLOAT16`, `FLOAT16`, `FLOAT32`, `FLOAT64`). `BFLOAT16` and `FLOAT16` require v2.10 or later. |
| `DIM`              | The width, or number of dimensions, of the vector embeddings stored in this field. In other words, the number of floating point elements comprising the vector. `DIM` must be a positive integer. The vector used to query this field must have the exact dimensions as the field itself. |
| `DISTANCE_METRIC`  | Distance metric (`L2`, `IP`, `COSINE`). |

**Optional attributes**

[`HNSW`](https://arxiv.org/ftp/arxiv/papers/1603/1603.09320.pdf) supports a number of additional parameters to tune
the accuracy of the queries, while trading off performance.

| Attribute          | Description                                                                                 |
|:-------------------|:--------------------------------------------------------------------------------------------|
| `M`                | Max number of outgoing edges (connections) for each node in a graph layer. On layer zero, the max number of connections will be `2 * M`. Higher values increase accuracy, but also increase memory usage and index build time. The default is 16. |
| `EF_CONSTRUCTION`  | Max number of connected neighbors to consider during graph building. Higher values increase accuracy, but also increase index build time. The default is 200. |
| `EF_RUNTIME`       | Max top candidates during KNN search. Higher values increase accuracy, but also increase search latency. The default is 10. |
| `EPSILON`          | Relative factor that sets the boundaries in which a range query may search for candidates. That is, vector candidates whose distance from the query vector is `radius * (1 + EPSILON)` are potentially scanned, allowing more extensive search and more accurate results, at the expense of run time. The default is 0.01. |

**Example**

```
FT.CREATE documents
  ON HASH
  PREFIX 1 docs:
  SCHEMA doc_embedding VECTOR HNSW 10
    TYPE FLOAT64
    DIM 1536
    DISTANCE_METRIC COSINE
    M 40
    EF_CONSTRUCTION 250
```

In the example above, an index named `documents` is created over hashes with the key prefix `docs:` and an `HNSW` vector field named `doc_embedding` with five index attributes: `TYPE`, `DIM`, `DISTANCE_METRIC`, `M`, and `EF_CONSTRUCTION`.

### Distance metrics

Redis supports three popular distance metrics to measure the degree of similarity between two vectors $u$, $v$ $\in \mathbb{R}^n$, where $n$ is the length of the vectors:

| Distance metric | Description | Mathematical representation |
|:--------------- |:----------- |:--------------------------- |
| `L2` | Euclidean distance between two vectors. | $d(u, v) = \sqrt{ \displaystyle\sum_{i=1}^n{(u_i - v_i)^2}}$ |
| `IP` | Inner product of two vectors. | $d(u, v) = 1 -u\cdot v$ |
| `COSINE` | Cosine distance of two vectors. | $d(u, v) = 1 -\frac{u \cdot v}{\lVert u \rVert \lVert v  \rVert}$ |

The above metrics calculate distance between two vectors, where the smaller the value is, the closer the two vectors are in the vector space.

## Store and update vectors

On index creation, the `<storage_type>` dictates how vector and metadata are structured and loaded into Redis.

### Hash

Store or update vectors and any metadata in [hashes]({{< baseurl >}}/develop/data-types/hashes/) using the [`HSET`]({{< baseurl >}}/commands/hset/) command.

**Example**

```
HSET docs:01 doc_embedding <vector_bytes> category sports
```

{{% alert title="Tip" color="warning" %}}
Hash values are stored as binary-safe strings. The value `<vector_bytes>` represents the vector's underlying memory buffer.
{{% /alert  %}}

A common method for converting vectors to bytes uses the [redis-py](https://redis-py.readthedocs.io/en/stable/examples/search_vector_similarity_examples.html) client library and the Python [NumPy](https://numpy.org/doc/stable/reference/generated/numpy.ndarray.tobytes.html) library.

**Example**

```py
import numpy as np
from redis import Redis

redis_client = Redis(host='localhost', port=6379)

# Create a FLOAT32 vector
vector = np.array([0.34, 0.63, -0.54, -0.69, 0.98, 0.61], dtype=np.float32)

# Convert vector to bytes
vector_bytes = vector.tobytes()

# Use the Redis client to store the vector bytes and metadata at a specified key
redis_client.hset('docs:01', mapping = {"vector": vector_bytes, "category": "sports"})
```

{{% alert title="Tip" color="warning" %}}
The vector blob size must match the dimension and float type of the vector field specified in the index's schema; otherwise, indexing will fail.
{{% /alert  %}}

### JSON
You can store or update vectors and any associated metadata in [JSON]({{< baseurl >}}/develop/data-types/json/) using the [`JSON.SET`]({{< baseurl >}}/commands/json.set/) command.

To store vectors in Redis as JSON, you store the vector as a JSON array of floats. Note that this differs from vector storage in Redis hashes, which are instead stored as raw bytes.

**Example**

```
JSON.SET docs:01 $ '{"doc_embedding":[0.34,0.63,-0.54,-0.69,0.98,0.61], "category": "sports"}'
```

One of the benefits of JSON is schema flexibility. As of v2.6.1, JSON supports multi-value indexing.
This allows you to index multiple vectors under the same [JSONPath]({{< relref "/develop/data-types/json/path" >}}).

Here are some examples of multi-value indexing with vectors:

**Multi-value indexing example**

```
JSON.SET docs:01 $ '{"doc_embedding":[[1,2,3,4], [5,6,7,8]]}'
JSON.SET docs:01 $ '{"chunk1":{"doc_embedding":[1,2,3,4]}, "chunk2":{"doc_embedding":[5,6,7,8]}}'
```

Additional information and examples are available in the [Indexing JSON documents]({{< baseurl >}}/develop/interact/search-and-query/indexing/#index-json-arrays-as-vector) section.

## Search with vectors

You can run vector search queries with the [`FT.SEARCH`]({{< baseurl >}}/commands/ft.search/) or [`FT.AGGREGATE`]({{< baseurl >}}/commands/ft.aggregate/) commands.

To issue a vector search query with `FT.SEARCH`, you must set the `DIALECT` option to >= `2`. See the [dialects documentation]({{< relref "/develop/interact/search-and-query/advanced-concepts/dialects" >}}) for more information.

### KNN vector search

KNN vector search finds the top k nearest neighbors to a query vector. It has the following syntax:

**Syntax**

```
FT.SEARCH <index_name>
  <primary_filter_query>=>[KNN <top_k> @<vector_field> $<vector_blob_param> $<vector_query_params> AS <distance_field>]
  PARAMS <query_params_count> [$<vector_blob_param> <vector_blob> <query_param_name> <query_param_value> ...]
  SORTBY <distance_field>
  DIALECT 4
```
**Parameters**

| Parameter         | Description                                                                                       |
|:------------------|:--------------------------------------------------------------------------------------------------|
| `index_name`  | Name of the index.  |
| `primary_filter_query`  | [Filter]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#filters) criteria. Use `*` when no filters are required.  |
| `top_k` | Number of nearest neighbors to fetch from the index.  |
| `vector_field`  | Name of the vector field to search against.  |
| `vector_blob_param`  | The query vector, passed in as a blob of raw bytes. The blob's byte size must match the vector field's dimensions and type.  |
| `vector_query_params` (optional) | An optional section for marking one or more vector query parameters passed through the `PARAMS` section. Valid parameters should be provided as key-value pairs. See which [runtime query params]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#runtime-query-params) are supported for each vector index type.  |
| `distance_field` (optional) | The optional distance field name used in the response and/or for sorting. By default, the distance field name is `__<vector_field>_score` and it can be used for sorting without using `AS <distance_field>` in the query.  |
| `vector_query_params_count` | The number of vector query parameters.  |
| `vector_query_param_name` | The name of the vector query parameter.  |
| `vector_query_param_value` | The value of the vector query parameter.  |

**Example**

```
FT.SEARCH documents "*=>[KNN 10 @doc_embedding $BLOB]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" DIALECT 4
```

**Use query attributes**

Alternatively, as of v2.6, `<vector_query_params>` and `<distance_field>` name can be specified in runtime
[query attributes]({{< relref "/develop/interact/search-and-query/advanced-concepts/query_syntax" >}}#query-attributes) as shown below.

```
[KNN <top_k> @<vector_field> $<vector_blob_param>]=>{$yield_distance_as: <distance_field>}
```

### Vector range queries

Vector range queries allow you to filter the index using a `radius` parameter representing the semantic distance between an input query vector and indexed vector fields. This is useful in scenarios when you don't know exactly how many nearest (`top_k`) neighbors to fetch, but you do know how similar the results should be.

For example, imagine a fraud or anomaly detection scenario where you aren't sure if there are any matches in the vector index. You can issue a vector range query to quickly check if there are any records of interest in the index within the specified radius.

Vector range queries operate slightly different than KNN vector queries:
- Vector range queries can appear multiple times in a query as filter criteria.
- Vector range queries can be a part of the `<primary_filter_query>` in KNN vector search.

**Syntax**

```
FT.SEARCH <index_name>
  @<vector_field>:[VECTOR_RANGE (<radius> | $<radius_param>) $<vector_blob_param> $<vector_query_params>]
  PARAMS <vector_query_params_count> [<vector_query_param_name> <vector_query_param_value> ...]
  SORTBY <distance_field>
  DIALECT 4
```

| Parameter         | Description                                                                                       |
|:------------------|:--------------------------------------------------------------------------------------------------|
| `index_name`  | Name of the index.  |
| `vector_field`  | Name of the vector field in the index. |
| `radius` or `radius_param` | The maximum semantic distance allowed between the query vector and indexed vectors. You can provide the value directly in the query, passed to the `PARAMS` section, or as a query attribute.
| `vector_blob_param`  | The query vector, passed in as a blob of raw bytes. The blob's byte size must match the vector field's dimensions and type. |
| `vector_query_params` (optional) | An optional section for marking one or more vector query parameters passed through the `PARAMS` section. Valid parameters should be provided as key-value pairs. See which [runtime query params]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#runtime-query-params) are supported for each vector index type.  |
| `vector_query_params_count` | The number of vector query parameters.  |
| `vector_query_param_name` | The name of the vector query parameter.  |
| `vector_query_param_value` | The value of the vector query parameter.  |


**Use query attributes**

A vector range query clause can be followed by a query attributes section as follows:

```
@<vector_field>: [VECTOR_RANGE (<radius> | $<radius_param>) $<vector_blob_param>]=>{$<param>: (<value> |
    $<value_attribute>); ... }
```

where the relevant parameters in that case are `$yield_distance_as` and `$epsilon`. Note that there is no default distance field name in range queries.

### Filters

Redis supports vector searches that include filters to narrow the search space based on defined criteria. If your index contains searchable fields (for example, `TEXT`, `TAG`, `NUMERIC`, `GEO`, `GEOSHAPE`, and `VECTOR`), you can perform vector searches with filters.

**Supported filter types**

- [Exact match](https://redis.io/docs/develop/interact/search-and-query/query/exact-match/)
- [Numeric range](https://redis.io/docs/develop/interact/search-and-query/query/range/)
- [Full-text](https://redis.io/docs/develop/interact/search-and-query/query/full-text/)
- [Geospatial](https://redis.io/docs/develop/interact/search-and-query/query/geo-spatial/)

You can also [combine multiple queries](https://redis.io/docs/develop/interact/search-and-query/query/combined/) as a filter.

**Syntax**

Vector search queries with filters follow this basic structure:

```
FT.SEARCH <index_name> <primary_filter_query>=>[...]
```

where `<primary_filter_query>` defines document selection and filtering.

**Example**

```
FT.SEARCH documents "(@title:Sports @year:[2020 2022])=>[KNN 10 @doc_embedding $BLOB]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" DIALECT 4
```

### How filtering works

Redis uses internal algorithms to optimize the filtering computation for vector search.
The runtime algorithm is determined by heuristics that aim to minimize query latency based on several factors derived from the query and the index.

**Batches mode**

Batches mode works by paginating through small batches of nearest neighbors from the index:
- A batch of high-scoring documents from the vector index is retrieved. These documents are yielded only if the `<primary_filter_query>` is satisfied. In other words, the document must contain a similar vector and meet the filter criteria.
- The iterative procedure terminates when `<top_k>` documents that pass the filter criteria are yielded, or after every vector in the index has been processed.
- The batch size is determined automatically by heuristics based on `<top_k>` and the ratio between the expected number of documents in the index that pass the `<primary_filter_query>` and the vector index size.
- The goal is to minimize the total number of batches required to get the `<top_k>` results while preserving the smallest batch size possible. Note that the batch size may change dynamically in each iteration based on the number of results that pass the filter in previous batches.

**Ad-hoc brute force mode** 

- The score of every vector corresponding to a document that passes the filter is computed, and the `<top_k>` results are selected and returned.
- This approach is preferable when the number of documents passing the `<primary_filter_query>` is relatively small.
- The results of the KNN query will always be accurate in this mode, even if the underlying vector index algorithm is an approximate one.

The execution mode may switch from batch mode to ad-hoc brute-force mode during the run, based on updated estimations of relevant factors from one batch to another.


## Runtime query parameters

### Filter mode

By default, Redis selects the best filter mode to optimize query execution. You can override the auto-selected policy using these optional parameters:

| Parameter        | Description | Options |
|:-----------------|:------------|:--------|
| `HYBRID_POLICY`  | Specifies the filter mode to use during vector search with filters (hybrid). | `BATCHES` or `ADHOC_BF` |
| `BATCH_SIZE`     | A fixed batch size to use in every iteration when the `BATCHES` policy is auto-selected or requested. | Positive integer. |


### Index-specific query parameters

**FLAT**

Currently, there are no runtime parameters available for FLAT indexes.

**HNSW**

Optional runtime parameters for HNSW indexes are:

| Parameter       | Description                                                                                               | Default value       |
|:----------------|:----------------------------------------------------------------------------------------------------------|:--------------------|
| `EF_RUNTIME`    | The maximum number of top candidates to hold during the KNN search. Higher values lead to more accurate results at the expense of a longer query runtime. | The value passed during index creation. The default is 10. |
| `EPSILON`       | The relative factor that sets the boundaries for a vector range query. Vector candidates whose distance from the query vector is `radius * (1 + EPSILON)` are potentially scanned, allowing a more extensive search and more accurate results at the expense of runtime. | The value passed during index creation. The default is 0.01. |


### Important notes

{{% alert title="Important notes" color="info" %}}

1. When performing a KNN vector search, you specify `<top_k>` nearest neighbors. However, the default Redis query `LIMIT` parameter (used for pagination) is 10. In order to get `<top_k>` returned results, you must also specify `LIMIT 0 <top_k>` in your search command. See examples below.

2. By default, the results are sorted by their document's score. To sort by vector similarity score, use `SORTBY <distance_field>`. See examples below.

3. Depending on your chosen distance metric, the calculated distance between vectors in an index have different bounds. For example, `Cosine` distance is bounded by `2`, while `L2` distance is not bounded. When performing a vector range query, the best practice is to adjust the `<radius>` parameter based on your use case and required recall or precision metrics.

{{% /alert %}}


## Vector search examples

Below are a number of examples to help you get started. For more comprehensive walkthroughs, see the [Redis vector quickstart guide]({{< baseurl >}}/develop/get-started/vector-database) and the [Redis AI Resources](https://github.com/redis-developer/redis-ai-resources) Github repo.

### KNN vector search examples

Return the 10 nearest neighbor documents for which the `doc_embedding` vector field is the closest to the query vector represented by the following 4-byte blob:

```
FT.SEARCH documents "*=>[KNN 10 @doc_embedding $BLOB]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" SORTBY __vector_score DIALECT 4
```

Return the top 10 nearest neighbors and customize the `K` and `EF_RUNTIME` parameters using query parameters. See the "Optional arguments" section in [FT.SEARCH command]({{< baseurl >}}/commands/ft.search). Set the `EF_RUNTIME` value to 150, assuming `doc_embedding` is an `HNSW` index:

```
FT.SEARCH documents "*=>[KNN $K @doc_embedding $BLOB EF_RUNTIME $EF]" PARAMS 6 BLOB "\x12\xa9\xf5\x6c" K 10 EF 150 DIALECT 4
```

Assign a custom name to the distance field (`vector_distance`) and then sort using that name:

```
FT.SEARCH documents "*=>[KNN 10 @doc_embedding $BLOB AS vector_distance]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" SORTBY vector_distance DIALECT 4
```

Use [query attributes]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/query_syntax#query-attributes) syntax to specify optional parameters and the distance field name:

```
FT.SEARCH documents "*=>[KNN 10 @doc_embedding $BLOB]=>{$EF_RUNTIME: $EF; $YIELD_DISTANCE_AS: vector_distance}" PARAMS 4 EF 150 BLOB "\x12\xa9\xf5\x6c" SORTBY vector_distance DIALECT 4
```

To explore additional Python vector search examples, review recipes for the [`Redis Python`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/00_redispy.ipynb) client library and the [`Redis Vector Library`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/01_redisvl.ipynb).

### Filter examples

For these examples, assume you created an index named `movies` with records of different movies and their metadata.

Among the movies that have `'Dune'` in the `title` field and `year` between `[2020, 2022]`, return the top 10 nearest neighbors, sorted by `movie_distance`:

```
FT.SEARCH movies "(@title:Dune @year:[2020 2022])=>[KNN 10 @movie_embedding $BLOB AS movie_distance]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" SORTBY movie_distance DIALECT 4
```

Among the movies that have `action` as a category tag, but not `drama`, return the top 10 nearest neighbors, sorted by `movie_distance`:

```
FT.SEARCH movies "(@category:{action} ~@category:{drama})=>[KNN 10 @doc_embedding $BLOB AS movie_distance]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" SORTBY movie_distance DIALECT 4
```

Among the movies that have `drama` or `action` as a category tag, return the top 10 nearest neighbors and explicitly set the filter mode (hybrid policy) to "ad-hoc brute force" rather than it being auto-selected:

```
FT.SEARCH movies "(@category:{drama | action})=>[KNN 10 @doc_embedding $BLOB HYBRID_POLICY ADHOC_BF]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" SORTBY __vec_scores DIALECT 4
```

Among the movies that have `action` as a category tag, return the top 10 nearest neighbors and explicitly set the filter mode (hybrid policy) to "batches" and batch size 50 using a query parameter:

```
FT.SEARCH movies "(@category:{action})=>[KNN 10 @doc_embedding $BLOB HYBRID_POLICY BATCHES BATCH_SIZE $BATCH_SIZE]" PARAMS 4 BLOB "\x12\xa9\xf5\x6c" BATCH_SIZE 50 DIALECT 4
```

Run the same query as above and use the query attributes syntax to specify optional parameters:

```
FT.SEARCH movies "(@category:{action})=>[KNN 10 @doc_embedding $BLOB]=>{$HYBRID_POLICY: BATCHES; $BATCH_SIZE: 50}" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" DIALECT 4
```

To explore additional Python vector search examples, review recipes for the [`Redis Python`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/00_redispy.ipynb) client library and the [`Redis Vector Library`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/01_redisvl.ipynb).


### Range query examples

For these examples, assume you created an index named `products` with records of different products and metadata from an ecommerce site.

Return 100 products for which the distance between the `description_vector` field and the specified query vector blob is at most 5:

```
FT.SEARCH products "@description_vector:[VECTOR_RANGE 5 $BLOB]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" LIMIT 0 100 DIALECT 4
```

Run the same query as above and set the `EPSILON` parameter to `0.5`, assuming `description_vector` is HNSW index, yield the vector distance between `description_vector` and the query result in a field named `vector_distance`, and sort the results by that distance.

```
FT.SEARCH products "@description_vector:[VECTOR_RANGE 5 $BLOB]=>{$EPSILON:0.5; $YIELD_DISTANCE_AS: vector_distance}" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" SORTBY vector_distance LIMIT 0 100 DIALECT 4
```

Use the vector range query as a filter: return all the documents that contain either `'shirt'` in their `type` tag with their `year` value in the range `[2020, 2022]` or a vector stored in `description_vector` whose distance from the query vector is no more than `0.8`, then sort the results by their vector distance, if it is in the range:

```
FT.SEARCH products "(@type:{shirt} @year:[2020 2022]) | @description_vector:[VECTOR_RANGE 0.8 $BLOB]=>{$YIELD_DISTANCE_AS: vector_distance}" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" SORTBY vector_distance DIALECT 4
```

To explore additional Python vector search examples, review recipes for the [`Redis Python`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/00_redispy.ipynb) client library and the [`Redis Vector Library`](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/01_redisvl.ipynb).


## Next steps

Vector embeddings and vector search are not new concepts. Many of the largest companies have used
vectors to represent products in ecommerce catalogs or content in advertising pipelines for well over a decade.

With the emergence of Large Language Models (LLMs) and the proliferation of applications that require advanced information
retrieval techniques, Redis is well positioned to serve as your high performance query engine for semantic search and more.

Here are some additonal resources that apply vector search for different use cases:

- [Retrieval augmented generation from scratch](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/01_redisvl.ipynb)
- [Semantic caching](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/semantic-cache/semantic_caching_gemini.ipynb)
