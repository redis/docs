---
linkTitle: Query
title: Query
---


Query classes in RedisVL provide a structured way to define simple or complex
queries for different use cases. Each query class wraps the `redis-py` Query module
[https://github.com/redis/redis-py/blob/master/redis/commands/search/query.py](https://github.com/redis/redis-py/blob/master/redis/commands/search/query.py) with extended functionality for ease-of-use.

## VectorQuery

### `class VectorQuery(vector, vector_field_name, return_fields=None, filter_expression=None, dtype='float32', num_results=10, return_score=True, dialect=2, sort_by=None, in_order=False, hybrid_policy=None, batch_size=None, ef_runtime=None, normalize_vector_distance=False)`

Bases: `BaseVectorQuery`, `BaseQuery`

A query for running a vector search along with an optional filter
expression.

* **Parameters:**
  * **vector** (*List* *[* *float* *]*) – The vector to perform the vector search with.
  * **vector_field_name** (*str*) – The name of the vector field to search
    against in the database.
  * **return_fields** (*List* *[* *str* *]*) – The declared fields to return with search
    results.
  * **filter_expression** (*Union* *[* *str* *,* [*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *,* *optional*) – A filter to apply
    along with the vector search. Defaults to None.
  * **dtype** (*str* *,* *optional*) – The dtype of the vector. Defaults to
    “float32”.
  * **num_results** (*int* *,* *optional*) – The top k results to return from the
    vector search. Defaults to 10.
  * **return_score** (*bool* *,* *optional*) – Whether to return the vector
    distance. Defaults to True.
  * **dialect** (*int* *,* *optional*) – The RediSearch query dialect.
    Defaults to 2.
  * **sort_by** (*Optional* *[* *str* *]*) – The field to order the results by. Defaults
    to None. Results will be ordered by vector distance.
  * **in_order** (*bool*) – Requires the terms in the field to have
    the same order as the terms in the query filter, regardless of
    the offsets between them. Defaults to False.
  * **hybrid_policy** (*Optional* *[* *str* *]*) – Controls how filters are applied during vector search.
    Options are “BATCHES” (paginates through small batches of nearest neighbors) or
    “ADHOC_BF” (computes scores for all vectors passing the filter).
    “BATCHES” mode is typically faster for queries with selective filters.
    “ADHOC_BF” mode is better when filters match a large portion of the dataset.
    Defaults to None, which lets Redis auto-select the optimal policy.
  * **batch_size** (*Optional* *[* *int* *]*) – When hybrid_policy is “BATCHES”, controls the number
    of vectors to fetch in each batch. Larger values may improve performance
    at the cost of memory usage. Only applies when hybrid_policy=”BATCHES”.
    Defaults to None, which lets Redis auto-select an appropriate batch size.
  * **ef_runtime** (*Optional* *[* *int* *]*) – Controls the size of the dynamic candidate list for HNSW
    algorithm at query time. Higher values improve recall at the expense of
    slower search performance. Defaults to None, which uses the index-defined value.
  * **normalize_vector_distance** (*bool*) – Redis supports 3 distance metrics: L2 (euclidean),
    IP (inner product), and COSINE. By default, L2 distance returns an unbounded value.
    COSINE distance returns a value between 0 and 2. IP returns a value determined by
    the magnitude of the vector. Setting this flag to true converts COSINE and L2 distance
    to a similarity score between 0 and 1. Note: setting this flag to true for IP will
    throw a warning since by definition COSINE similarity is normalized IP.
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

#### `NOTE`
Learn more about vector queries in Redis: [https://redis.io/docs/interact/search-and-query/search/vectors/#knn-search](https://redis.io/docs/interact/search-and-query/search/vectors/#knn-search)

#### `dialect(dialect)`

Add a dialect field to the query.

- **dialect** - dialect version to execute the query under

* **Parameters:**
  **dialect** (*int*)
* **Return type:**
  *Query*

#### `expander(expander)`

Add a expander field to the query.

- **expander** - the name of the expander

* **Parameters:**
  **expander** (*str*)
* **Return type:**
  *Query*

#### `in_order()`

Match only documents where the query terms appear in
the same order in the document.
i.e. for the query “hello world”, we do not match “world hello”

* **Return type:**
  *Query*

#### `language(language)`

Analyze the query as being in the specified language.

* **Parameters:**
  **language** (*str*) – The language (e.g. chinese or english)
* **Return type:**
  *Query*

#### `limit_fields(*fields)`

Limit the search to specific TEXT fields only.

- **fields**: A list of strings, case sensitive field names

from the defined schema.

* **Parameters:**
  **fields** (*List* *[* *str* *]*)
* **Return type:**
  *Query*

#### `limit_ids(*ids)`

Limit the results to a specific set of pre-known document
ids of any length.

* **Return type:**
  *Query*

#### `no_content()`

Set the query to only return ids and not the document content.

* **Return type:**
  *Query*

#### `no_stopwords()`

Prevent the query from being filtered for stopwords.
Only useful in very big queries that you are certain contain
no stopwords.

* **Return type:**
  *Query*

#### `paging(offset, num)`

Set the paging for the query (defaults to 0..10).

- **offset**: Paging offset for the results. Defaults to 0
- **num**: How many results do we want

* **Parameters:**
  * **offset** (*int*)
  * **num** (*int*)
* **Return type:**
  *Query*

#### `query_string()`

Return the query string of this query only.

* **Return type:**
  str

#### `return_fields(*fields)`

Add fields to return fields.

* **Return type:**
  *Query*

#### `scorer(scorer)`

Use a different scoring function to evaluate document relevance.
Default is TFIDF.

Since Redis 8.0 default was changed to BM25STD.

* **Parameters:**
  **scorer** (*str*) – The scoring function to use
  (e.g. TFIDF.DOCNORM or BM25)
* **Return type:**
  *Query*

#### `set_batch_size(batch_size)`

Set the batch size for the query.

* **Parameters:**
  **batch_size** (*int*) – The batch size to use when hybrid_policy is “BATCHES”.
* **Raises:**
  * **TypeError** – If batch_size is not an integer
  * **ValueError** – If batch_size is not positive

#### `set_ef_runtime(ef_runtime)`

Set the EF_RUNTIME parameter for the query.

* **Parameters:**
  **ef_runtime** (*int*) – The EF_RUNTIME value to use for HNSW algorithm.
  Higher values improve recall at the expense of slower search.
* **Raises:**
  * **TypeError** – If ef_runtime is not an integer
  * **ValueError** – If ef_runtime is not positive

#### `set_filter(filter_expression=None)`

Set the filter expression for the query.

* **Parameters:**
  **filter_expression** (*Optional* *[* *Union* *[* *str* *,* [*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *]* *,* *optional*) – The filter
  expression or query string to use on the query.
* **Raises:**
  **TypeError** – If filter_expression is not a valid FilterExpression or string.

#### `set_hybrid_policy(hybrid_policy)`

Set the hybrid policy for the query.

* **Parameters:**
  **hybrid_policy** (*str*) – The hybrid policy to use. Options are “BATCHES”
  or “ADHOC_BF”.
* **Raises:**
  **ValueError** – If hybrid_policy is not one of the valid options

#### `slop(slop)`

Allow a maximum of N intervening non matched terms between
phrase terms (0 means exact phrase).

* **Parameters:**
  **slop** (*int*)
* **Return type:**
  *Query*

#### `sort_by(field, asc=True)`

Add a sortby field to the query.

- **field** - the name of the field to sort by
- **asc** - when True, sorting will be done in asceding order

* **Parameters:**
  * **field** (*str*)
  * **asc** (*bool*)
* **Return type:**
  *Query*

#### `timeout(timeout)`

overrides the timeout parameter of the module

* **Parameters:**
  **timeout** (*float*)
* **Return type:**
  *Query*

#### `verbatim()`

Set the query to be verbatim, i.e. use no query expansion
or stemming.

* **Return type:**
  *Query*

#### `with_payloads()`

Ask the engine to return document payloads.

* **Return type:**
  *Query*

#### `with_scores()`

Ask the engine to return document search scores.

* **Return type:**
  *Query*

#### `property batch_size: int | None`

Return the batch size for the query.

* **Returns:**
  The batch size for the query.
* **Return type:**
  Optional[int]

#### `property ef_runtime: int | None`

Return the EF_RUNTIME parameter for the query.

* **Returns:**
  The EF_RUNTIME value for the query.
* **Return type:**
  Optional[int]

#### `property filter: str | `[`FilterExpression`]({{< relref "filter/#filterexpression" >}})` `

The filter expression for the query.

#### `property hybrid_policy: str | None`

Return the hybrid policy for the query.

* **Returns:**
  The hybrid policy for the query.
* **Return type:**
  Optional[str]

#### `property params: Dict[str, Any]`

Return the parameters for the query.

* **Returns:**
  The parameters for the query.
* **Return type:**
  Dict[str, Any]

#### `property query: BaseQuery`

Return self as the query object.

## VectorRangeQuery

### `class VectorRangeQuery(vector, vector_field_name, return_fields=None, filter_expression=None, dtype='float32', distance_threshold=0.2, epsilon=None, num_results=10, return_score=True, dialect=2, sort_by=None, in_order=False, hybrid_policy=None, batch_size=None, normalize_vector_distance=False)`

Bases: `BaseVectorQuery`, `BaseQuery`

A query for running a filtered vector search based on semantic
distance threshold.

* **Parameters:**
  * **vector** (*List* *[* *float* *]*) – The vector to perform the range query with.
  * **vector_field_name** (*str*) – The name of the vector field to search
    against in the database.
  * **return_fields** (*List* *[* *str* *]*) – The declared fields to return with search
    results.
  * **filter_expression** (*Union* *[* *str* *,* [*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *,* *optional*) – A filter to apply
    along with the range query. Defaults to None.
  * **dtype** (*str* *,* *optional*) – The dtype of the vector. Defaults to
    “float32”.
  * **distance_threshold** (*float*) – The threshold for vector distance.
    A smaller threshold indicates a stricter semantic search.
    Defaults to 0.2.
  * **epsilon** (*Optional* *[* *float* *]*) – The relative factor for vector range queries,
    setting boundaries for candidates within radius \* (1 + epsilon).
    This controls how extensive the search is beyond the specified radius.
    Higher values increase recall at the expense of performance.
    Defaults to None, which uses the index-defined epsilon (typically 0.01).
  * **num_results** (*int*) – The MAX number of results to return.
    Defaults to 10.
  * **return_score** (*bool* *,* *optional*) – Whether to return the vector
    distance. Defaults to True.
  * **dialect** (*int* *,* *optional*) – The RediSearch query dialect.
    Defaults to 2.
  * **sort_by** (*Optional* *[* *str* *]*) – The field to order the results by. Defaults
    to None. Results will be ordered by vector distance.
  * **in_order** (*bool*) – Requires the terms in the field to have
    the same order as the terms in the query filter, regardless of
    the offsets between them. Defaults to False.
  * **hybrid_policy** (*Optional* *[* *str* *]*) – Controls how filters are applied during vector search.
    Options are “BATCHES” (paginates through small batches of nearest neighbors) or
    “ADHOC_BF” (computes scores for all vectors passing the filter).
    “BATCHES” mode is typically faster for queries with selective filters.
    “ADHOC_BF” mode is better when filters match a large portion of the dataset.
    Defaults to None, which lets Redis auto-select the optimal policy.
  * **batch_size** (*Optional* *[* *int* *]*) – When hybrid_policy is “BATCHES”, controls the number
    of vectors to fetch in each batch. Larger values may improve performance
    at the cost of memory usage. Only applies when hybrid_policy=”BATCHES”.
    Defaults to None, which lets Redis auto-select an appropriate batch size.
  * **normalize_vector_distance** (*bool*) – Redis supports 3 distance metrics: L2 (euclidean),
    IP (inner product), and COSINE. By default, L2 distance returns an unbounded value.
    COSINE distance returns a value between 0 and 2. IP returns a value determined by
    the magnitude of the vector. Setting this flag to true converts COSINE and L2 distance
    to a similarity score between 0 and 1. Note: setting this flag to true for IP will
    throw a warning since by definition COSINE similarity is normalized IP.
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

#### `NOTE`
Learn more about vector range queries: [https://redis.io/docs/interact/search-and-query/search/vectors/#range-query](https://redis.io/docs/interact/search-and-query/search/vectors/#range-query)

#### `dialect(dialect)`

Add a dialect field to the query.

- **dialect** - dialect version to execute the query under

* **Parameters:**
  **dialect** (*int*)
* **Return type:**
  *Query*

#### `expander(expander)`

Add a expander field to the query.

- **expander** - the name of the expander

* **Parameters:**
  **expander** (*str*)
* **Return type:**
  *Query*

#### `in_order()`

Match only documents where the query terms appear in
the same order in the document.
i.e. for the query “hello world”, we do not match “world hello”

* **Return type:**
  *Query*

#### `language(language)`

Analyze the query as being in the specified language.

* **Parameters:**
  **language** (*str*) – The language (e.g. chinese or english)
* **Return type:**
  *Query*

#### `limit_fields(*fields)`

Limit the search to specific TEXT fields only.

- **fields**: A list of strings, case sensitive field names

from the defined schema.

* **Parameters:**
  **fields** (*List* *[* *str* *]*)
* **Return type:**
  *Query*

#### `limit_ids(*ids)`

Limit the results to a specific set of pre-known document
ids of any length.

* **Return type:**
  *Query*

#### `no_content()`

Set the query to only return ids and not the document content.

* **Return type:**
  *Query*

#### `no_stopwords()`

Prevent the query from being filtered for stopwords.
Only useful in very big queries that you are certain contain
no stopwords.

* **Return type:**
  *Query*

#### `paging(offset, num)`

Set the paging for the query (defaults to 0..10).

- **offset**: Paging offset for the results. Defaults to 0
- **num**: How many results do we want

* **Parameters:**
  * **offset** (*int*)
  * **num** (*int*)
* **Return type:**
  *Query*

#### `query_string()`

Return the query string of this query only.

* **Return type:**
  str

#### `return_fields(*fields)`

Add fields to return fields.

* **Return type:**
  *Query*

#### `scorer(scorer)`

Use a different scoring function to evaluate document relevance.
Default is TFIDF.

Since Redis 8.0 default was changed to BM25STD.

* **Parameters:**
  **scorer** (*str*) – The scoring function to use
  (e.g. TFIDF.DOCNORM or BM25)
* **Return type:**
  *Query*

#### `set_batch_size(batch_size)`

Set the batch size for the query.

* **Parameters:**
  **batch_size** (*int*) – The batch size to use when hybrid_policy is “BATCHES”.
* **Raises:**
  * **TypeError** – If batch_size is not an integer
  * **ValueError** – If batch_size is not positive

#### `set_distance_threshold(distance_threshold)`

Set the distance threshold for the query.

* **Parameters:**
  **distance_threshold** (*float*) – Vector distance threshold.
* **Raises:**
  * **TypeError** – If distance_threshold is not a float or int
  * **ValueError** – If distance_threshold is negative

#### `set_epsilon(epsilon)`

Set the epsilon parameter for the range query.

* **Parameters:**
  **epsilon** (*float*) – The relative factor for vector range queries,
  setting boundaries for candidates within radius \* (1 + epsilon).
* **Raises:**
  * **TypeError** – If epsilon is not a float or int
  * **ValueError** – If epsilon is negative

#### `set_filter(filter_expression=None)`

Set the filter expression for the query.

* **Parameters:**
  **filter_expression** (*Optional* *[* *Union* *[* *str* *,* [*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *]* *,* *optional*) – The filter
  expression or query string to use on the query.
* **Raises:**
  **TypeError** – If filter_expression is not a valid FilterExpression or string.

#### `set_hybrid_policy(hybrid_policy)`

Set the hybrid policy for the query.

* **Parameters:**
  **hybrid_policy** (*str*) – The hybrid policy to use. Options are “BATCHES”
  or “ADHOC_BF”.
* **Raises:**
  **ValueError** – If hybrid_policy is not one of the valid options

#### `slop(slop)`

Allow a maximum of N intervening non matched terms between
phrase terms (0 means exact phrase).

* **Parameters:**
  **slop** (*int*)
* **Return type:**
  *Query*

#### `sort_by(field, asc=True)`

Add a sortby field to the query.

- **field** - the name of the field to sort by
- **asc** - when True, sorting will be done in asceding order

* **Parameters:**
  * **field** (*str*)
  * **asc** (*bool*)
* **Return type:**
  *Query*

#### `timeout(timeout)`

overrides the timeout parameter of the module

* **Parameters:**
  **timeout** (*float*)
* **Return type:**
  *Query*

#### `verbatim()`

Set the query to be verbatim, i.e. use no query expansion
or stemming.

* **Return type:**
  *Query*

#### `with_payloads()`

Ask the engine to return document payloads.

* **Return type:**
  *Query*

#### `with_scores()`

Ask the engine to return document search scores.

* **Return type:**
  *Query*

#### `property batch_size: int | None`

Return the batch size for the query.

* **Returns:**
  The batch size for the query.
* **Return type:**
  Optional[int]

#### `property distance_threshold: float`

Return the distance threshold for the query.

* **Returns:**
  The distance threshold for the query.
* **Return type:**
  float

#### `property epsilon: float | None`

Return the epsilon for the query.

* **Returns:**
  The epsilon for the query, or None if not set.
* **Return type:**
  Optional[float]

#### `property filter: str | `[`FilterExpression`]({{< relref "filter/#filterexpression" >}})` `

The filter expression for the query.

#### `property hybrid_policy: str | None`

Return the hybrid policy for the query.

* **Returns:**
  The hybrid policy for the query.
* **Return type:**
  Optional[str]

#### `property params: Dict[str, Any]`

Return the parameters for the query.

* **Returns:**
  The parameters for the query.
* **Return type:**
  Dict[str, Any]

#### `property query: BaseQuery`

Return self as the query object.

## HybridQuery

### `class HybridQuery(text, text_field_name, vector, vector_field_name, text_scorer='BM25STD', filter_expression=None, alpha=0.7, dtype='float32', num_results=10, return_fields=None, stopwords='english', dialect=2)`

Bases: `AggregationQuery`

HybridQuery combines text and vector search in Redis.
It allows you to perform a hybrid search using both text and vector similarity.
It scores documents based on a weighted combination of text and vector similarity.

```python
from redisvl.query import HybridQuery
from redisvl.index import SearchIndex

index = SearchIndex.from_yaml("path/to/index.yaml")

query = HybridQuery(
    text="example text",
    text_field_name="text_field",
    vector=[0.1, 0.2, 0.3],
    vector_field_name="vector_field",
    text_scorer="BM25STD",
    filter_expression=None,
    alpha=0.7,
    dtype="float32",
    num_results=10,
    return_fields=["field1", "field2"],
    stopwords="english",
    dialect=2,
)

results = index.query(query)
```

Instantiates a HybridQuery object.

* **Parameters:**
  * **text** (*str*) – The text to search for.
  * **text_field_name** (*str*) – The text field name to search in.
  * **vector** (*Union* *[* *bytes* *,* *List* *[* *float* *]* *]*) – The vector to perform vector similarity search.
  * **vector_field_name** (*str*) – The vector field name to search in.
  * **text_scorer** (*str* *,* *optional*) – The text scorer to use. Options are {TFIDF, TFIDF.DOCNORM,
    BM25, DISMAX, DOCSCORE, BM25STD}. Defaults to “BM25STD”.
  * **filter_expression** (*Optional* *[*[*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *,* *optional*) – The filter expression to use.
    Defaults to None.
  * **alpha** (*float* *,* *optional*) – The weight of the vector similarity. Documents will be scored
    as: hybrid_score = (alpha) \* vector_score + (1-alpha) \* text_score.
    Defaults to 0.7.
  * **dtype** (*str* *,* *optional*) – The data type of the vector. Defaults to “float32”.
  * **num_results** (*int* *,* *optional*) – The number of results to return. Defaults to 10.
  * **return_fields** (*Optional* *[* *List* *[* *str* *]* *]* *,* *optional*) – The fields to return. Defaults to None.
  * **stopwords** (*Optional* *[* *Union* *[* *str* *,* *Set* *[* *str* *]* *]* *]* *,* *optional*) – The stopwords to remove from the
    provided text prior to searchuse. If a string such as “english” “german” is
    provided then a default set of stopwords for that language will be used. if a list,
    set, or tuple of strings is provided then those will be used as stopwords.
    Defaults to “english”. if set to “None” then no stopwords will be removed.
  * **dialect** (*int* *,* *optional*) – The Redis dialect version. Defaults to 2.
* **Raises:**
  * **ValueError** – If the text string is empty, or if the text string becomes empty after
        stopwords are removed.
  * **TypeError** – If the stopwords are not a set, list, or tuple of strings.

#### `add_scores()`

If set, includes the score as an ordinary field of the row.

* **Return type:**
  *AggregateRequest*

#### `apply(**kwexpr)`

Specify one or more projection expressions to add to each result

### `Parameters`

- **kwexpr**: One or more key-value pairs for a projection. The key is
  : the alias for the projection, and the value is the projection
    expression itself, for example apply(square_root=”sqrt(@foo)”)

* **Return type:**
  *AggregateRequest*

#### `dialect(dialect)`

Add a dialect field to the aggregate command.

- **dialect** - dialect version to execute the query under

* **Parameters:**
  **dialect** (*int*)
* **Return type:**
  *AggregateRequest*

#### `filter(expressions)`

Specify filter for post-query results using predicates relating to
values in the result set.

### `Parameters`

- **fields**: Fields to group by. This can either be a single string,
  : or a list of strings.

* **Parameters:**
  **expressions** (*str* *|* *List* *[* *str* *]*)
* **Return type:**
  *AggregateRequest*

#### `group_by(fields, *reducers)`

Specify by which fields to group the aggregation.

### `Parameters`

- **fields**: Fields to group by. This can either be a single string,
  : or a list of strings. both cases, the field should be specified as
    @field.
- **reducers**: One or more reducers. Reducers may be found in the
  : aggregation module.

* **Parameters:**
  * **fields** (*List* *[* *str* *]*)
  * **reducers** (*Reducer* *|* *List* *[* *Reducer* *]*)
* **Return type:**
  *AggregateRequest*

#### `limit(offset, num)`

Sets the limit for the most recent group or query.

If no group has been defined yet (via group_by()) then this sets
the limit for the initial pool of results from the query. Otherwise,
this limits the number of items operated on from the previous group.

Setting a limit on the initial search results may be useful when
attempting to execute an aggregation on a sample of a large data set.

### `Parameters`

- **offset**: Result offset from which to begin paging
- **num**: Number of results to return

Example of sorting the initial results:

``
AggregateRequest("@sale_amount:[10000, inf]")            .limit(0, 10)            .group_by("@state", r.count())
``

Will only group by the states found in the first 10 results of the
query @sale_amount:[10000, inf]. On the other hand,

``
AggregateRequest("@sale_amount:[10000, inf]")            .limit(0, 1000)            .group_by("@state", r.count()            .limit(0, 10)
``

Will group all the results matching the query, but only return the
first 10 groups.

If you only wish to return a *top-N* style query, consider using
sort_by() instead.

* **Parameters:**
  * **offset** (*int*)
  * **num** (*int*)
* **Return type:**
  *AggregateRequest*

#### `load(*fields)`

Indicate the fields to be returned in the response. These fields are
returned in addition to any others implicitly specified.

### `Parameters`

- **fields**: If fields not specified, all the fields will be loaded.

Otherwise, fields should be given in the format of @field.

* **Parameters:**
  **fields** (*List* *[* *str* *]*)
* **Return type:**
  *AggregateRequest*

#### `scorer(scorer)`

Use a different scoring function to evaluate document relevance.
Default is TFIDF.

* **Parameters:**
  **scorer** (*str*) – The scoring function to use
  (e.g. TFIDF.DOCNORM or BM25)
* **Return type:**
  *AggregateRequest*

#### `sort_by(*fields, **kwargs)`

Indicate how the results should be sorted. This can also be used for
*top-N* style queries

### `Parameters`

- **fields**: The fields by which to sort. This can be either a single
  : field or a list of fields. If you wish to specify order, you can
    use the Asc or Desc wrapper classes.
- **max**: Maximum number of results to return. This can be
  : used instead of LIMIT and is also faster.

Example of sorting by foo ascending and bar descending:

``
sort_by(Asc("@foo"), Desc("@bar"))
``

Return the top 10 customers:

``
AggregateRequest()            .group_by("@customer", r.sum("@paid").alias(FIELDNAME))            .sort_by(Desc("@paid"), max=10)
``

* **Parameters:**
  **fields** (*List* *[* *str* *]*)
* **Return type:**
  *AggregateRequest*

#### `with_schema()`

If set, the schema property will contain a list of [field, type]
entries in the result object.

* **Return type:**
  *AggregateRequest*

#### `property params: Dict[str, Any]`

Return the parameters for the aggregation.

* **Returns:**
  The parameters for the aggregation.
* **Return type:**
  Dict[str, Any]

#### `property stopwords: Set[str]`

Return the stopwords used in the query.
:returns: The stopwords used in the query.
:rtype: Set[str]

## TextQuery

### `class TextQuery(text, text_field_name, text_scorer='BM25STD', filter_expression=None, return_fields=None, num_results=10, return_score=True, dialect=2, sort_by=None, in_order=False, params=None, stopwords='english')`

Bases: `BaseQuery`

TextQuery is a query for running a full text search, along with an optional filter expression.

```python
from redisvl.query import TextQuery
from redisvl.index import SearchIndex

index = SearchIndex.from_yaml(index.yaml)

query = TextQuery(
    text="example text",
    text_field_name="text_field",
    text_scorer="BM25STD",
    filter_expression=None,
    num_results=10,
    return_fields=["field1", "field2"],
    stopwords="english",
    dialect=2,
)

results = index.query(query)
```

A query for running a full text search, along with an optional filter expression.

* **Parameters:**
  * **text** (*str*) – The text string to perform the text search with.
  * **text_field_name** (*str*) – The name of the document field to perform text search on.
  * **text_scorer** (*str* *,* *optional*) – The text scoring algorithm to use.
    Defaults to BM25STD. Options are {TFIDF, BM25STD, BM25, TFIDF.DOCNORM, DISMAX, DOCSCORE}.
    See [https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/scoring/](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/scoring/)
  * **filter_expression** (*Union* *[* *str* *,* [*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *,* *optional*) – A filter to apply
    along with the text search. Defaults to None.
  * **return_fields** (*List* *[* *str* *]*) – The declared fields to return with search
    results.
  * **num_results** (*int* *,* *optional*) – The top k results to return from the
    search. Defaults to 10.
  * **return_score** (*bool* *,* *optional*) – Whether to return the text score.
    Defaults to True.
  * **dialect** (*int* *,* *optional*) – The RediSearch query dialect.
    Defaults to 2.
  * **sort_by** (*Optional* *[* *str* *]*) – The field to order the results by. Defaults
    to None. Results will be ordered by text score.
  * **in_order** (*bool*) – Requires the terms in the field to have
    the same order as the terms in the query filter, regardless of
    the offsets between them. Defaults to False.
  * **params** (*Optional* *[* *Dict* *[* *str* *,* *Any* *]* *]* *,* *optional*) – The parameters for the query.
    Defaults to None.
  * **stopwords** (*Optional* *[* *Union* *[* *str* *,* *Set* *[* *str* *]* *]*) – The set of stop words to remove
    from the query text. If a language like ‘english’ or ‘spanish’ is provided
    a default set of stopwords for that language will be used. Users may specify
    their own stop words by providing a List or Set of words. if set to None,
    then no words will be removed. Defaults to ‘english’.
* **Raises:**
  * **ValueError** – if stopwords language string cannot be loaded.
  * **TypeError** – If stopwords is not a valid iterable set of strings.

#### `dialect(dialect)`

Add a dialect field to the query.

- **dialect** - dialect version to execute the query under

* **Parameters:**
  **dialect** (*int*)
* **Return type:**
  *Query*

#### `expander(expander)`

Add a expander field to the query.

- **expander** - the name of the expander

* **Parameters:**
  **expander** (*str*)
* **Return type:**
  *Query*

#### `in_order()`

Match only documents where the query terms appear in
the same order in the document.
i.e. for the query “hello world”, we do not match “world hello”

* **Return type:**
  *Query*

#### `language(language)`

Analyze the query as being in the specified language.

* **Parameters:**
  **language** (*str*) – The language (e.g. chinese or english)
* **Return type:**
  *Query*

#### `limit_fields(*fields)`

Limit the search to specific TEXT fields only.

- **fields**: A list of strings, case sensitive field names

from the defined schema.

* **Parameters:**
  **fields** (*List* *[* *str* *]*)
* **Return type:**
  *Query*

#### `limit_ids(*ids)`

Limit the results to a specific set of pre-known document
ids of any length.

* **Return type:**
  *Query*

#### `no_content()`

Set the query to only return ids and not the document content.

* **Return type:**
  *Query*

#### `no_stopwords()`

Prevent the query from being filtered for stopwords.
Only useful in very big queries that you are certain contain
no stopwords.

* **Return type:**
  *Query*

#### `paging(offset, num)`

Set the paging for the query (defaults to 0..10).

- **offset**: Paging offset for the results. Defaults to 0
- **num**: How many results do we want

* **Parameters:**
  * **offset** (*int*)
  * **num** (*int*)
* **Return type:**
  *Query*

#### `query_string()`

Return the query string of this query only.

* **Return type:**
  str

#### `return_fields(*fields)`

Add fields to return fields.

* **Return type:**
  *Query*

#### `scorer(scorer)`

Use a different scoring function to evaluate document relevance.
Default is TFIDF.

Since Redis 8.0 default was changed to BM25STD.

* **Parameters:**
  **scorer** (*str*) – The scoring function to use
  (e.g. TFIDF.DOCNORM or BM25)
* **Return type:**
  *Query*

#### `set_filter(filter_expression=None)`

Set the filter expression for the query.

* **Parameters:**
  **filter_expression** (*Optional* *[* *Union* *[* *str* *,* [*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *]* *,* *optional*) – The filter
  expression or query string to use on the query.
* **Raises:**
  **TypeError** – If filter_expression is not a valid FilterExpression or string.

#### `slop(slop)`

Allow a maximum of N intervening non matched terms between
phrase terms (0 means exact phrase).

* **Parameters:**
  **slop** (*int*)
* **Return type:**
  *Query*

#### `sort_by(field, asc=True)`

Add a sortby field to the query.

- **field** - the name of the field to sort by
- **asc** - when True, sorting will be done in asceding order

* **Parameters:**
  * **field** (*str*)
  * **asc** (*bool*)
* **Return type:**
  *Query*

#### `timeout(timeout)`

overrides the timeout parameter of the module

* **Parameters:**
  **timeout** (*float*)
* **Return type:**
  *Query*

#### `verbatim()`

Set the query to be verbatim, i.e. use no query expansion
or stemming.

* **Return type:**
  *Query*

#### `with_payloads()`

Ask the engine to return document payloads.

* **Return type:**
  *Query*

#### `with_scores()`

Ask the engine to return document search scores.

* **Return type:**
  *Query*

#### `property filter: str | `[`FilterExpression`]({{< relref "filter/#filterexpression" >}})` `

The filter expression for the query.

#### `property params: Dict[str, Any]`

Return the query parameters.

#### `property query: BaseQuery`

Return self as the query object.

## FilterQuery

### `class FilterQuery(filter_expression=None, return_fields=None, num_results=10, dialect=2, sort_by=None, in_order=False, params=None)`

Bases: `BaseQuery`

A query for running a filtered search with a filter expression.

* **Parameters:**
  * **filter_expression** (*Optional* *[* *Union* *[* *str* *,* [*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *]*) – The optional filter
    expression to query with. Defaults to ‘\*’.
  * **return_fields** (*Optional* *[* *List* *[* *str* *]* *]* *,* *optional*) – The fields to return.
  * **num_results** (*Optional* *[* *int* *]* *,* *optional*) – The number of results to return. Defaults to 10.
  * **dialect** (*int* *,* *optional*) – The query dialect. Defaults to 2.
  * **sort_by** (*Optional* *[* *str* *]* *,* *optional*) – The field to order the results by. Defaults to None.
  * **in_order** (*bool* *,* *optional*) – Requires the terms in the field to have the same order as the
    terms in the query filter. Defaults to False.
  * **params** (*Optional* *[* *Dict* *[* *str* *,* *Any* *]* *]* *,* *optional*) – The parameters for the query. Defaults to None.
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

#### `dialect(dialect)`

Add a dialect field to the query.

- **dialect** - dialect version to execute the query under

* **Parameters:**
  **dialect** (*int*)
* **Return type:**
  *Query*

#### `expander(expander)`

Add a expander field to the query.

- **expander** - the name of the expander

* **Parameters:**
  **expander** (*str*)
* **Return type:**
  *Query*

#### `in_order()`

Match only documents where the query terms appear in
the same order in the document.
i.e. for the query “hello world”, we do not match “world hello”

* **Return type:**
  *Query*

#### `language(language)`

Analyze the query as being in the specified language.

* **Parameters:**
  **language** (*str*) – The language (e.g. chinese or english)
* **Return type:**
  *Query*

#### `limit_fields(*fields)`

Limit the search to specific TEXT fields only.

- **fields**: A list of strings, case sensitive field names

from the defined schema.

* **Parameters:**
  **fields** (*List* *[* *str* *]*)
* **Return type:**
  *Query*

#### `limit_ids(*ids)`

Limit the results to a specific set of pre-known document
ids of any length.

* **Return type:**
  *Query*

#### `no_content()`

Set the query to only return ids and not the document content.

* **Return type:**
  *Query*

#### `no_stopwords()`

Prevent the query from being filtered for stopwords.
Only useful in very big queries that you are certain contain
no stopwords.

* **Return type:**
  *Query*

#### `paging(offset, num)`

Set the paging for the query (defaults to 0..10).

- **offset**: Paging offset for the results. Defaults to 0
- **num**: How many results do we want

* **Parameters:**
  * **offset** (*int*)
  * **num** (*int*)
* **Return type:**
  *Query*

#### `query_string()`

Return the query string of this query only.

* **Return type:**
  str

#### `return_fields(*fields)`

Add fields to return fields.

* **Return type:**
  *Query*

#### `scorer(scorer)`

Use a different scoring function to evaluate document relevance.
Default is TFIDF.

Since Redis 8.0 default was changed to BM25STD.

* **Parameters:**
  **scorer** (*str*) – The scoring function to use
  (e.g. TFIDF.DOCNORM or BM25)
* **Return type:**
  *Query*

#### `set_filter(filter_expression=None)`

Set the filter expression for the query.

* **Parameters:**
  **filter_expression** (*Optional* *[* *Union* *[* *str* *,* [*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *]* *,* *optional*) – The filter
  expression or query string to use on the query.
* **Raises:**
  **TypeError** – If filter_expression is not a valid FilterExpression or string.

#### `slop(slop)`

Allow a maximum of N intervening non matched terms between
phrase terms (0 means exact phrase).

* **Parameters:**
  **slop** (*int*)
* **Return type:**
  *Query*

#### `sort_by(field, asc=True)`

Add a sortby field to the query.

- **field** - the name of the field to sort by
- **asc** - when True, sorting will be done in asceding order

* **Parameters:**
  * **field** (*str*)
  * **asc** (*bool*)
* **Return type:**
  *Query*

#### `timeout(timeout)`

overrides the timeout parameter of the module

* **Parameters:**
  **timeout** (*float*)
* **Return type:**
  *Query*

#### `verbatim()`

Set the query to be verbatim, i.e. use no query expansion
or stemming.

* **Return type:**
  *Query*

#### `with_payloads()`

Ask the engine to return document payloads.

* **Return type:**
  *Query*

#### `with_scores()`

Ask the engine to return document search scores.

* **Return type:**
  *Query*

#### `property filter: str | `[`FilterExpression`]({{< relref "filter/#filterexpression" >}})` `

The filter expression for the query.

#### `property params: Dict[str, Any]`

Return the query parameters.

#### `property query: BaseQuery`

Return self as the query object.

## CountQuery

### `class CountQuery(filter_expression=None, dialect=2, params=None)`

Bases: `BaseQuery`

A query for a simple count operation provided some filter expression.

* **Parameters:**
  * **filter_expression** (*Optional* *[* *Union* *[* *str* *,* [*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *]*) – The filter expression to
    query with. Defaults to None.
  * **params** (*Optional* *[* *Dict* *[* *str* *,* *Any* *]* *]* *,* *optional*) – The parameters for the query. Defaults to None.
  * **dialect** (*int*)
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

```python
from redisvl.query import CountQuery
from redisvl.query.filter import Tag

t = Tag("brand") == "Nike"
query = CountQuery(filter_expression=t)

count = index.query(query)
```

#### `dialect(dialect)`

Add a dialect field to the query.

- **dialect** - dialect version to execute the query under

* **Parameters:**
  **dialect** (*int*)
* **Return type:**
  *Query*

#### `expander(expander)`

Add a expander field to the query.

- **expander** - the name of the expander

* **Parameters:**
  **expander** (*str*)
* **Return type:**
  *Query*

#### `in_order()`

Match only documents where the query terms appear in
the same order in the document.
i.e. for the query “hello world”, we do not match “world hello”

* **Return type:**
  *Query*

#### `language(language)`

Analyze the query as being in the specified language.

* **Parameters:**
  **language** (*str*) – The language (e.g. chinese or english)
* **Return type:**
  *Query*

#### `limit_fields(*fields)`

Limit the search to specific TEXT fields only.

- **fields**: A list of strings, case sensitive field names

from the defined schema.

* **Parameters:**
  **fields** (*List* *[* *str* *]*)
* **Return type:**
  *Query*

#### `limit_ids(*ids)`

Limit the results to a specific set of pre-known document
ids of any length.

* **Return type:**
  *Query*

#### `no_content()`

Set the query to only return ids and not the document content.

* **Return type:**
  *Query*

#### `no_stopwords()`

Prevent the query from being filtered for stopwords.
Only useful in very big queries that you are certain contain
no stopwords.

* **Return type:**
  *Query*

#### `paging(offset, num)`

Set the paging for the query (defaults to 0..10).

- **offset**: Paging offset for the results. Defaults to 0
- **num**: How many results do we want

* **Parameters:**
  * **offset** (*int*)
  * **num** (*int*)
* **Return type:**
  *Query*

#### `query_string()`

Return the query string of this query only.

* **Return type:**
  str

#### `return_fields(*fields)`

Add fields to return fields.

* **Return type:**
  *Query*

#### `scorer(scorer)`

Use a different scoring function to evaluate document relevance.
Default is TFIDF.

Since Redis 8.0 default was changed to BM25STD.

* **Parameters:**
  **scorer** (*str*) – The scoring function to use
  (e.g. TFIDF.DOCNORM or BM25)
* **Return type:**
  *Query*

#### `set_filter(filter_expression=None)`

Set the filter expression for the query.

* **Parameters:**
  **filter_expression** (*Optional* *[* *Union* *[* *str* *,* [*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *]* *,* *optional*) – The filter
  expression or query string to use on the query.
* **Raises:**
  **TypeError** – If filter_expression is not a valid FilterExpression or string.

#### `slop(slop)`

Allow a maximum of N intervening non matched terms between
phrase terms (0 means exact phrase).

* **Parameters:**
  **slop** (*int*)
* **Return type:**
  *Query*

#### `sort_by(field, asc=True)`

Add a sortby field to the query.

- **field** - the name of the field to sort by
- **asc** - when True, sorting will be done in asceding order

* **Parameters:**
  * **field** (*str*)
  * **asc** (*bool*)
* **Return type:**
  *Query*

#### `timeout(timeout)`

overrides the timeout parameter of the module

* **Parameters:**
  **timeout** (*float*)
* **Return type:**
  *Query*

#### `verbatim()`

Set the query to be verbatim, i.e. use no query expansion
or stemming.

* **Return type:**
  *Query*

#### `with_payloads()`

Ask the engine to return document payloads.

* **Return type:**
  *Query*

#### `with_scores()`

Ask the engine to return document search scores.

* **Return type:**
  *Query*

#### `property filter: str | `[`FilterExpression`]({{< relref "filter/#filterexpression" >}})` `

The filter expression for the query.

#### `property params: Dict[str, Any]`

Return the query parameters.

#### `property query: BaseQuery`

Return self as the query object.
