---
linkTitle: LLM cache
title: LLM Cache
type: integration
---


## SemanticCache

<a id="semantic-cache-api"></a>

### `class SemanticCache(name='llmcache', distance_threshold=0.1, ttl=None, vectorizer=None, filterable_fields=None, redis_client=None, redis_url='redis://localhost:6379', connection_kwargs={}, overwrite=False, **kwargs)`

Bases: `BaseLLMCache`

Semantic Cache for Large Language Models.

Semantic Cache for Large Language Models.

* **Parameters:**
  * **name** (*str* *,* *optional*) – The name of the semantic cache search index.
    Defaults to “llmcache”.
  * **distance_threshold** (*float* *,* *optional*) – Semantic threshold for the
    cache. Defaults to 0.1.
  * **ttl** (*Optional* *[* *int* *]* *,* *optional*) – The time-to-live for records cached
    in Redis. Defaults to None.
  * **vectorizer** (*Optional* *[* *BaseVectorizer* *]* *,* *optional*) – The vectorizer for the cache.
    Defaults to HFTextVectorizer.
  * **filterable_fields** (*Optional* *[* *List* *[* *Dict* *[* *str* *,* *Any* *]* *]* *]*) – An optional list of RedisVL fields
    that can be used to customize cache retrieval with filters.
  * **redis_client** (*Optional* *[* *Redis* *]* *,* *optional*) – A redis client connection instance.
    Defaults to None.
  * **redis_url** (*str* *,* *optional*) – The redis url. Defaults to redis://localhost:6379.
  * **connection_kwargs** (*Dict* *[* *str* *,* *Any* *]*) – The connection arguments
    for the redis client. Defaults to empty {}.
  * **overwrite** (*bool*) – Whether or not to force overwrite the schema for
    the semantic cache index. Defaults to false.
* **Raises:**
  * **TypeError** – If an invalid vectorizer is provided.
  * **TypeError** – If the TTL value is not an int.
  * **ValueError** – If the threshold is not between 0 and 1.
  * **ValueError** – If existing schema does not match new schema and overwrite is False.

#### `async acheck(prompt=None, vector=None, num_results=1, return_fields=None, filter_expression=None, distance_threshold=None)`

Async check the semantic cache for results similar to the specified prompt
or vector.

This method searches the cache using vector similarity with
either a raw text prompt (converted to a vector) or a provided vector as
input. It checks for semantically similar prompts and fetches the cached
LLM responses.

* **Parameters:**
  * **prompt** (*Optional* *[* *str* *]* *,* *optional*) – The text prompt to search for in
    the cache.
  * **vector** (*Optional* *[* *List* *[* *float* *]* *]* *,* *optional*) – The vector representation
    of the prompt to search for in the cache.
  * **num_results** (*int* *,* *optional*) – The number of cached results to return.
    Defaults to 1.
  * **return_fields** (*Optional* *[* *List* *[* *str* *]* *]* *,* *optional*) – The fields to include
    in each returned result. If None, defaults to all available
    fields in the cached entry.
  * **filter_expression** (*Optional* *[*[*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]*) – Optional filter expression
    that can be used to filter cache results. Defaults to None and
    the full cache will be searched.
  * **distance_threshold** (*Optional* *[* *float* *]*) – The threshold for semantic
    vector distance.
* **Returns:**
  A list of dicts containing the requested
  : return fields for each similar cached response.
* **Return type:**
  List[Dict[str, Any]]
* **Raises:**
  * **ValueError** – If neither a prompt nor a vector is specified.
  * **ValueError** – if ‘vector’ has incorrect dimensions.
  * **TypeError** – If return_fields is not a list when provided.

```python
response = await cache.acheck(
    prompt="What is the captial city of France?"
)
```

#### `async adrop(ids=None, keys=None)`

Async expire specific entries from the cache by id or specific
Redis key.

* **Parameters:**
  * **ids** (*Optional* *[* *str* *]*) – The document ID or IDs to remove from the cache.
  * **keys** (*Optional* *[* *str* *]*) – The Redis keys to remove from the cache.
* **Return type:**
  None

#### `async astore(prompt, response, vector=None, metadata=None, filters=None, ttl=None)`

Async stores the specified key-value pair in the cache along with metadata.

* **Parameters:**
  * **prompt** (*str*) – The user prompt to cache.
  * **response** (*str*) – The LLM response to cache.
  * **vector** (*Optional* *[* *List* *[* *float* *]* *]* *,* *optional*) – The prompt vector to
    cache. Defaults to None, and the prompt vector is generated on
    demand.
  * **metadata** (*Optional* *[* *Dict* *[* *str* *,* *Any* *]* *]* *,* *optional*) – The optional metadata to cache
    alongside the prompt and response. Defaults to None.
  * **filters** (*Optional* *[* *Dict* *[* *str* *,* *Any* *]* *]*) – The optional tag to assign to the cache entry.
    Defaults to None.
  * **ttl** (*Optional* *[* *int* *]*) – The optional TTL override to use on this individual cache
    entry. Defaults to the global TTL setting.
* **Returns:**
  The Redis key for the entries added to the semantic cache.
* **Return type:**
  str
* **Raises:**
  * **ValueError** – If neither prompt nor vector is specified.
  * **ValueError** – if vector has incorrect dimensions.
  * **TypeError** – If provided metadata is not a dictionary.

```python
key = await cache.astore(
    prompt="What is the captial city of France?",
    response="Paris",
    metadata={"city": "Paris", "country": "France"}
)
```

#### `async aupdate(key, **kwargs)`

Async update specific fields within an existing cache entry. If no fields
are passed, then only the document TTL is refreshed.

* **Parameters:**
  **key** (*str*) – the key of the document to update using kwargs.
* **Raises:**
  * **ValueError if an incorrect mapping is provided as a kwarg.** – 
  * **TypeError if metadata is provided and not** **of** **type dict.** – 
* **Return type:**
  None

```python
key = await cache.astore('this is a prompt', 'this is a response')
await cache.aupdate(
    key,
    metadata={"hit_count": 1, "model_name": "Llama-2-7b"}
)
```

#### `check(prompt=None, vector=None, num_results=1, return_fields=None, filter_expression=None, distance_threshold=None)`

Checks the semantic cache for results similar to the specified prompt
or vector.

This method searches the cache using vector similarity with
either a raw text prompt (converted to a vector) or a provided vector as
input. It checks for semantically similar prompts and fetches the cached
LLM responses.

* **Parameters:**
  * **prompt** (*Optional* *[* *str* *]* *,* *optional*) – The text prompt to search for in
    the cache.
  * **vector** (*Optional* *[* *List* *[* *float* *]* *]* *,* *optional*) – The vector representation
    of the prompt to search for in the cache.
  * **num_results** (*int* *,* *optional*) – The number of cached results to return.
    Defaults to 1.
  * **return_fields** (*Optional* *[* *List* *[* *str* *]* *]* *,* *optional*) – The fields to include
    in each returned result. If None, defaults to all available
    fields in the cached entry.
  * **filter_expression** (*Optional* *[*[*FilterExpression*]({{< relref "filter/#filterexpression" >}}) *]*) – Optional filter expression
    that can be used to filter cache results. Defaults to None and
    the full cache will be searched.
  * **distance_threshold** (*Optional* *[* *float* *]*) – The threshold for semantic
    vector distance.
* **Returns:**
  A list of dicts containing the requested
  : return fields for each similar cached response.
* **Return type:**
  List[Dict[str, Any]]
* **Raises:**
  * **ValueError** – If neither a prompt nor a vector is specified.
  * **ValueError** – if ‘vector’ has incorrect dimensions.
  * **TypeError** – If return_fields is not a list when provided.

```python
response = cache.check(
    prompt="What is the captial city of France?"
)
```

#### `clear()`

Clear the cache of all keys while preserving the index.

* **Return type:**
  None

#### `delete()`

Clear the semantic cache of all keys and remove the underlying search
index.

* **Return type:**
  None

#### `drop(ids=None, keys=None)`

Manually expire specific entries from the cache by id or specific
Redis key.

* **Parameters:**
  * **ids** (*Optional* *[* *str* *]*) – The document ID or IDs to remove from the cache.
  * **keys** (*Optional* *[* *str* *]*) – The Redis keys to remove from the cache.
* **Return type:**
  None

#### `set_threshold(distance_threshold)`

Sets the semantic distance threshold for the cache.

* **Parameters:**
  **distance_threshold** (*float*) – The semantic distance threshold for
  the cache.
* **Raises:**
  **ValueError** – If the threshold is not between 0 and 1.
* **Return type:**
  None

#### `set_ttl(ttl=None)`

Set the default TTL, in seconds, for entries in the cache.

* **Parameters:**
  **ttl** (*Optional* *[* *int* *]* *,* *optional*) – The optional time-to-live expiration
  for the cache, in seconds.
* **Raises:**
  **ValueError** – If the time-to-live value is not an integer.

#### `store(prompt, response, vector=None, metadata=None, filters=None, ttl=None)`

Stores the specified key-value pair in the cache along with metadata.

* **Parameters:**
  * **prompt** (*str*) – The user prompt to cache.
  * **response** (*str*) – The LLM response to cache.
  * **vector** (*Optional* *[* *List* *[* *float* *]* *]* *,* *optional*) – The prompt vector to
    cache. Defaults to None, and the prompt vector is generated on
    demand.
  * **metadata** (*Optional* *[* *Dict* *[* *str* *,* *Any* *]* *]* *,* *optional*) – The optional metadata to cache
    alongside the prompt and response. Defaults to None.
  * **filters** (*Optional* *[* *Dict* *[* *str* *,* *Any* *]* *]*) – The optional tag to assign to the cache entry.
    Defaults to None.
  * **ttl** (*Optional* *[* *int* *]*) – The optional TTL override to use on this individual cache
    entry. Defaults to the global TTL setting.
* **Returns:**
  The Redis key for the entries added to the semantic cache.
* **Return type:**
  str
* **Raises:**
  * **ValueError** – If neither prompt nor vector is specified.
  * **ValueError** – if vector has incorrect dimensions.
  * **TypeError** – If provided metadata is not a dictionary.

```python
key = cache.store(
    prompt="What is the captial city of France?",
    response="Paris",
    metadata={"city": "Paris", "country": "France"}
)
```

#### `update(key, **kwargs)`

Update specific fields within an existing cache entry. If no fields
are passed, then only the document TTL is refreshed.

* **Parameters:**
  **key** (*str*) – the key of the document to update using kwargs.
* **Raises:**
  * **ValueError if an incorrect mapping is provided as a kwarg.** – 
  * **TypeError if metadata is provided and not** **of** **type dict.** – 
* **Return type:**
  None

```python
key = cache.store('this is a prompt', 'this is a response')
cache.update(key, metadata={"hit_count": 1, "model_name": "Llama-2-7b"})
)
```

#### `property aindex: `[`AsyncSearchIndex`]({{< relref "searchindex/#asyncsearchindex" >}})`  | None`

The underlying AsyncSearchIndex for the cache.

* **Returns:**
  The async search index.
* **Return type:**
  [AsyncSearchIndex]({{< relref "searchindex/#asyncsearchindex" >}})

#### `property distance_threshold: float`

The semantic distance threshold for the cache.

* **Returns:**
  The semantic distance threshold.
* **Return type:**
  float

#### `property index: `[`SearchIndex`]({{< relref "searchindex/#searchindex" >}})` `

The underlying SearchIndex for the cache.

* **Returns:**
  The search index.
* **Return type:**
  [SearchIndex]({{< relref "searchindex/#searchindex" >}})

#### `property ttl: int | None`

The default TTL, in seconds, for entries in the cache.
