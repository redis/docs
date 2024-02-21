---
linkTitle: Query
title: Query
type: integration
description: The query APIs
weight: 3
---

## BaseQuery Objects

```python
class BaseQuery()
```

### \_\_init\_\_

```python
def __init__(return_fields: Optional[List[str]] = None,
             num_results: int = 10,
             dialect: int = 2)
```

Base query class used to subclass many query types.

### set\_filter

```python
def set_filter(filter_expression: Optional[FilterExpression] = None)
```

Set the filter for the query.

**Arguments**:

- `filter_expression` _Optional[FilterExpression], optional_ - The filter
  to apply to the query.
  

**Raises**:

- `TypeError` - If filter_expression is not of type redisvl.query.FilterExpression

### get\_filter

```python
def get_filter() -> FilterExpression
```

Get the filter for the query.

**Returns**:

- `FilterExpression` - The filter for the query.

### set\_paging

```python
def set_paging(first: int, limit: int)
```

Set the paging parameters for the query to limit the results between
first and num_results.

**Arguments**:

- `first` _int_ - The zero-indexed offset for which to fetch query results
- `limit` _int_ - _description_
  

**Raises**:

- `TypeError` - _description_
- `TypeError` - _description_


## CountQuery Objects

```python
class CountQuery(BaseQuery)
```

### \_\_init\_\_

```python
def __init__(filter_expression: FilterExpression,
             dialect: int = 2,
             params: Optional[Dict[str, Any]] = None)
```

Query for a simple count operation provided some filter expression.

**Arguments**:

- `filter_expression` _FilterExpression_ - The filter expression to query for.
- `params` _Optional[Dict[str, Any]], optional_ - The parameters for the query. Defaults to None.
  

**Raises**:

- `TypeError` - If filter_expression is not of type redisvl.query.FilterExpression
  
  ```python
  from redisvl.query import CountQuery
  from redisvl.query.filter import Tag
  t = Tag("brand") == "Nike"
  q = CountQuery(filter_expression=t)
  count = index.query(q)
  ```

### query

```python
@property
def query() -> Query
```

The loaded Redis-Py query.

**Returns**:

- `redis.commands.search.query.Query` - The query object.

### params

```python
@property
def params() -> Dict[str, Any]
```

The parameters for the query.

**Returns**:

  Dict[str, Any]: The parameters for the query.


## FilterQuery Objects

```python
class FilterQuery(BaseQuery)
```

### \_\_init\_\_

```python
def __init__(filter_expression: FilterExpression,
             return_fields: Optional[List[str]] = None,
             num_results: int = 10,
             dialect: int = 2,
             params: Optional[Dict[str, Any]] = None)
```

Query for a filter expression.

**Arguments**:

- `filter_expression` _FilterExpression_ - The filter expression to
  query for.
- `return_fields` _Optional[List[str]], optional_ - The fields to return.
- `num_results` _Optional[int], optional_ - The number of results to
  return. Defaults to 10.
- `params` _Optional[Dict[str, Any]], optional_ - The parameters for the
  query. Defaults to None.
  

**Raises**:

- `TypeError` - If filter_expression is not of type redisvl.query.FilterExpression
  
  ```python
  from redisvl.query import FilterQuery
  from redisvl.query.filter import Tag
  t = Tag("brand") == "Nike"
  q = FilterQuery(return_fields=["brand", "price"], filter_expression=t)
  ```

### query

```python
@property
def query() -> Query
```

Return a Redis-Py Query object representing the query.

**Returns**:

- `redis.commands.search.query.Query` - The query object.


## VectorQuery Objects

```python
class VectorQuery(BaseVectorQuery)
```

### \_\_init\_\_

```python
def __init__(vector: Union[List[float], bytes],
             vector_field_name: str,
             return_fields: Optional[List[str]] = None,
             filter_expression: Optional[FilterExpression] = None,
             dtype: str = "float32",
             num_results: int = 10,
             return_score: bool = True,
             dialect: int = 2)
```

Query for vector fields.

Read more: https://redis.io/docs/interact/search-and-query/search/vectors/`knn`-search

**Arguments**:

- `vector` _List[float]_ - The vector to query for.
- `vector_field_name` _str_ - The name of the vector field.
- `return_fields` _List[str]_ - The fields to return.
- `filter_expression` _FilterExpression, optional_ - A filter to apply to the query. Defaults to None.
- `dtype` _str, optional_ - The dtype of the vector. Defaults to "float32".
- `num_results` _Optional[int], optional_ - The number of results to return. Defaults to 10.
- `return_score` _bool, optional_ - Whether to return the score. Defaults to True.
  

**Raises**:

- `TypeError` - If filter_expression is not of type redisvl.query.FilterExpression

### query

```python
@property
def query() -> Query
```

Return a Redis-Py Query object representing the query.

**Returns**:

- `redis.commands.search.query.Query` - The query object.

### params

```python
@property
def params() -> Dict[str, Any]
```

Return the parameters for the query.

**Returns**:

  Dict[str, Any]: The parameters for the query.


## RangeQuery Objects

```python
class RangeQuery(BaseVectorQuery)
```

### \_\_init\_\_

```python
def __init__(vector: Union[List[float], bytes],
             vector_field_name: str,
             return_fields: Optional[List[str]] = None,
             filter_expression: Optional[FilterExpression] = None,
             dtype: str = "float32",
             distance_threshold: float = 0.2,
             num_results: int = 10,
             return_score: bool = True,
             dialect: int = 2)
```

Vector query by distance range.

Range queries are for filtering vector search results
by the distance between a vector field value and a query
vector, in terms of the index distance metric.

Read more: https://redis.io/docs/interact/search-and-query/search/vectors/`range`-query

**Arguments**:

- `vector` _List[float]_ - The vector to query for.
- `vector_field_name` _str_ - The name of the vector field.
- `return_fields` _List[str]_ - The fields to return.
- `filter_expression` _FilterExpression, optional_ - A filter to apply to the query. Defaults to None.
- `dtype` _str, optional_ - The dtype of the vector. Defaults to "float32".
- `distance_threshold` _str, float_ - The threshold for vector distance. Defaults to 0.2.
- `num_results` _int_ - The MAX number of results to return. Defaults to 10.
- `return_score` _bool, optional_ - Whether to return the score. Defaults to True.
  

**Raises**:

- `TypeError` - If filter_expression is not of type redisvl.query.FilterExpression

### set\_distance\_threshold

```python
def set_distance_threshold(distance_threshold: float)
```

Set the distance treshold for the query.

**Arguments**:

- `distance_threshold` _float_ - vector distance

### distance\_threshold

```python
@property
def distance_threshold() -> float
```

Return the distance threshold for the query.

**Returns**:

- `float` - The distance threshold for the query.

### query

```python
@property
def query() -> Query
```

Return a Redis-Py Query object representing the query.

**Returns**:

- `redis.commands.search.query.Query` - The query object.

### params

```python
@property
def params() -> Dict[str, Any]
```

Return the parameters for the query.

**Returns**:

  Dict[str, Any]: The parameters for the query.

