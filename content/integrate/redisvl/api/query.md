---
linkTitle: Query
title: Query
type: integration
---


Query classes in RedisVL provide a structured way to define simple or complex
queries for different use cases. Each query class wraps the `redis-py` Query module
[https://github.com/redis/redis-py/blob/master/redis/commands/search/query.py](https://github.com/redis/redis-py/blob/master/redis/commands/search/query.py) with extended functionality for ease-of-use.

## VectorQuery

### `class VectorQuery(vector, vector_field_name, return_fields=None, filter_expression=None, dtype='float32', num_results=10, return_score=True, dialect=2, sort_by=None, in_order=False)`

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

Return the parameters for the query.

* **Returns:**
  The parameters for the query.
* **Return type:**
  Dict[str, Any]

#### `property query: BaseQuery`

Return self as the query object.

## VectorRangeQuery

### `class VectorRangeQuery(vector, vector_field_name, return_fields=None, filter_expression=None, dtype='float32', distance_threshold=0.2, num_results=10, return_score=True, dialect=2, sort_by=None, in_order=False)`

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
  * **distance_threshold** (*str* *,* *float*) – The threshold for vector distance.
    A smaller threshold indicates a stricter semantic search.
    Defaults to 0.2.
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

* **Parameters:**
  **scorer** (*str*) – The scoring function to use
  (e.g. TFIDF.DOCNORM or BM25)
* **Return type:**
  *Query*

#### `set_distance_threshold(distance_threshold)`

Set the distance threshold for the query.

* **Parameters:**
  **distance_threshold** (*float*) – vector distance

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

#### `property distance_threshold: float`

Return the distance threshold for the query.

* **Returns:**
  The distance threshold for the query.
* **Return type:**
  float

#### `property filter: str | `[`FilterExpression`]({{< relref "filter/#filterexpression" >}})` `

The filter expression for the query.

#### `property params: Dict[str, Any]`

Return the parameters for the query.

* **Returns:**
  The parameters for the query.
* **Return type:**
  Dict[str, Any]

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
  * **in_order** (*bool* *,* *optional*) – Requires the terms in the field to have the same order as the terms in the query filter. Defaults to False.
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
  * **filter_expression** (*Optional* *[* *Union* *[* *str* *,* [*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]* *]*) – The filter expression to query with. Defaults to None.
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
