---
linkTitle: Query
title: Query
type: integration
description: The query APIs
weight: 3
---

## VectorQuery

<a id="query-api"></a>

### *class* VectorQuery(vector, vector_field_name, return_fields=None, filter_expression=None, dtype='float32', num_results=10, return_score=True, dialect=2)

A query for running a vector search along with an optional filter
expression.

* **Parameters:**
  * **vector** (*List* *[**float* *]*) – The vector to perform the vector search with.
  * **vector_field_name** (*str*) – The name of the vector field to search
    against in the database.
  * **return_fields** (*List* *[**str* *]*) – The declared fields to return with search
    results.
  * **filter_expression** ([*FilterExpression*](filter.md#redisvl.query.filter.FilterExpression) *,* *optional*) – A filter to apply
    along with the vector search. Defaults to None.
  * **dtype** (*str* *,* *optional*) – The dtype of the vector. Defaults to
    “float32”.
  * **num_results** (*int* *,* *optional*) – The top k results to return from the
    vector search. Defaults to 10.
  * **return_score** (*bool* *,* *optional*) – Whether to return the vector
    distance. Defaults to True.
  * **dialect** (*int* *,* *optional*) – The RediSearch query dialect.
    Defaults to 2.
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

{{< note >}}
Learn more about vector queries in Redis: [https://redis.io/docs/interact/search-and-query/search/vectors/#knn-search](https://redis.io/docs/interact/search-and-query/search/vectors/#knn-search)
{{< /note >}}

### get_filter()

Get the filter expression for the query.

* **Returns:**
  The filter for the query.
* **Return type:**
  [FilterExpression](filter.md#redisvl.query.filter.FilterExpression)

### set_filter(filter_expression=None)

Set the filter expression for the query.

* **Parameters:**
  **filter_expression** (*Optional* *[*[*FilterExpression*](filter.md#redisvl.query.filter.FilterExpression) *]* *,* *optional*) – The filter
  to apply to the query.
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

### set_paging(first, limit)

Set the paging parameters for the query to limit the number of
results.

* **Parameters:**
  * **first** (*int*) – The zero-indexed offset for which to fetch query results
  * **limit** (*int*) – The max number of results to include including the offset
* **Raises:**
  **TypeError** – If first or limit are NOT integers.

### *property* params *: Dict[str, Any]*

Return the parameters for the query.

* **Returns:**
  The parameters for the query.
* **Return type:**
  Dict[str, Any]

### *property* query *: Query*

Return a Redis-Py Query object representing the query.

* **Returns:**
  The Redis-Py query object.
* **Return type:**
  redis.commands.search.query.Query

## RangeQuery

### *class* RangeQuery(vector, vector_field_name, return_fields=None, filter_expression=None, dtype='float32', distance_threshold=0.2, num_results=10, return_score=True, dialect=2)

A query for running a filtered vector search based on semantic
distance threshold.

* **Parameters:**
  * **vector** (*List* *[**float* *]*) – The vector to perform the range query with.
  * **vector_field_name** (*str*) – The name of the vector field to search
    against in the database.
  * **return_fields** (*List* *[**str* *]*) – The declared fields to return with search
    results.
  * **filter_expression** ([*FilterExpression*](filter.md#redisvl.query.filter.FilterExpression) *,* *optional*) – A filter to apply
    along with the range query. Defaults to None.
  * **dtype** (*str* *,* *optional*) – The dtype of the vector. Defaults to
    “float32”.
  * **distance_threshold** (*str* *,* *float*) – The threshold for vector distance.
    A smaller threshold indicates a stricter semantic search.
    Defaults to 0.2.
  * **num_results** (*int*) – The MAX number of results to return.
    Defaults to 10.
  * **return_score** (*bool* *,* *optional*) – Whether to return the vector
    distance. Defaults to True.
  * **dialect** (*int* *,* *optional*) – The RediSearch query dialect.
    Defaults to 2.
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

{{< note >}}
Learn more about vector range queries: [https://redis.io/docs/interact/search-and-query/search/vectors/#range-query](https://redis.io/docs/interact/search-and-query/search/vectors/#range-query)
{{< /note >}}

### get_filter()

Get the filter expression for the query.

* **Returns:**
  The filter for the query.
* **Return type:**
  [FilterExpression](filter.md#redisvl.query.filter.FilterExpression)

### set_distance_threshold(distance_threshold)

Set the distance treshold for the query.

* **Parameters:**
  **distance_threshold** (*float*) – vector distance

### set_filter(filter_expression=None)

Set the filter expression for the query.

* **Parameters:**
  **filter_expression** (*Optional* *[*[*FilterExpression*](filter.md#redisvl.query.filter.FilterExpression) *]* *,* *optional*) – The filter
  to apply to the query.
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

### set_paging(first, limit)

Set the paging parameters for the query to limit the number of
results.

* **Parameters:**
  * **first** (*int*) – The zero-indexed offset for which to fetch query results
  * **limit** (*int*) – The max number of results to include including the offset
* **Raises:**
  **TypeError** – If first or limit are NOT integers.

### *property* distance_threshold *: float*

Return the distance threshold for the query.

* **Returns:**
  The distance threshold for the query.
* **Return type:**
  float

### *property* params *: Dict[str, Any]*

Return the parameters for the query.

* **Returns:**
  The parameters for the query.
* **Return type:**
  Dict[str, Any]

### *property* query *: Query*

Return a Redis-Py Query object representing the query.

* **Returns:**
  The Redis-Py query object.
* **Return type:**
  redis.commands.search.query.Query

## FilterQuery

### *class* FilterQuery(filter_expression, return_fields=None, num_results=10, dialect=2, params=None)

A query for a running a filtered search with a filter expression.

* **Parameters:**
  * **filter_expression** ([*FilterExpression*](filter.md#redisvl.query.filter.FilterExpression)) – The filter expression to
    query for.
  * **return_fields** (*Optional* *[**List* *[**str* *]* *]* *,* *optional*) – The fields to return.
  * **num_results** (*Optional* *[**int* *]* *,* *optional*) – The number of results to
    return. Defaults to 10.
  * **params** (*Optional* *[**Dict* *[**str* *,* *Any* *]* *]* *,* *optional*) – The parameters for the
    query. Defaults to None.
  * **dialect** (*int*) – 
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

```python
from redisvl.query import FilterQuery
from redisvl.query.filter import Tag

t = Tag("brand") == "Nike"
q = FilterQuery(return_fields=["brand", "price"], filter_expression=t)
```

### get_filter()

Get the filter expression for the query.

* **Returns:**
  The filter for the query.
* **Return type:**
  [FilterExpression](filter.md#redisvl.query.filter.FilterExpression)

### set_filter(filter_expression=None)

Set the filter expression for the query.

* **Parameters:**
  **filter_expression** (*Optional* *[*[*FilterExpression*](filter.md#redisvl.query.filter.FilterExpression) *]* *,* *optional*) – The filter
  to apply to the query.
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

### set_paging(first, limit)

Set the paging parameters for the query to limit the number of
results.

* **Parameters:**
  * **first** (*int*) – The zero-indexed offset for which to fetch query results
  * **limit** (*int*) – The max number of results to include including the offset
* **Raises:**
  **TypeError** – If first or limit are NOT integers.

### *property* query *: Query*

Return a Redis-Py Query object representing the query.

* **Returns:**
  The Redis-Py query object.
* **Return type:**
  redis.commands.search.query.Query

## CountQuery

### *class* CountQuery(filter_expression, dialect=2, params=None)

A query for a simple count operation provided some filter expression.

* **Parameters:**
  * **filter_expression** ([*FilterExpression*](filter.md#redisvl.query.filter.FilterExpression)) – The filter expression to query for.
  * **params** (*Optional* *[**Dict* *[**str* *,* *Any* *]* *]* *,* *optional*) – The parameters for the query. Defaults to None.
  * **dialect** (*int*) – 
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

```python
from redisvl.query import CountQuery
from redisvl.query.filter import Tag

t = Tag("brand") == "Nike"
query = CountQuery(filter_expression=t)

count = index.query(query)
```

### get_filter()

Get the filter expression for the query.

* **Returns:**
  The filter for the query.
* **Return type:**
  [FilterExpression](filter.md#redisvl.query.filter.FilterExpression)

### set_filter(filter_expression=None)

Set the filter expression for the query.

* **Parameters:**
  **filter_expression** (*Optional* *[*[*FilterExpression*](filter.md#redisvl.query.filter.FilterExpression) *]* *,* *optional*) – The filter
  to apply to the query.
* **Raises:**
  **TypeError** – If filter_expression is not of type redisvl.query.FilterExpression

### set_paging(first, limit)

Set the paging parameters for the query to limit the number of
results.

* **Parameters:**
  * **first** (*int*) – The zero-indexed offset for which to fetch query results
  * **limit** (*int*) – The max number of results to include including the offset
* **Raises:**
  **TypeError** – If first or limit are NOT integers.

### *property* params *: Dict[str, Any]*

The parameters for the query.

* **Returns:**
  The parameters for the query.
* **Return type:**
  Dict[str, Any]

### *property* query *: Query*

The loaded Redis-Py query.

* **Returns:**
  The Redis-Py query object.
* **Return type:**
  redis.commands.search.query.Query
