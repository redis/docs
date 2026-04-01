---
linkTitle: LLM cache
title: LLM Cache
url: '/develop/ai/redisvl/0.6.0/api/cache/'
---


## SemanticCache

<a id="semantic-cache-api"></a>

### `class SemanticCache(name='llmcache', distance_threshold=0.1, ttl=None, vectorizer=None, filterable_fields=None, redis_client=None, redis_url='redis://localhost:6379', connection_kwargs={}, overwrite=False, **kwargs)`

Bases: `BaseLLMCache`

Semantic Cache for Large Language Models.

Semantic Cache for Large Language Models.

* **Parameters:**
  * **name** (*str* *,* *optional*) – The name of the semantic cache search index.
    Defaults to "llmcache".
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

#### `async aclear()`

Async clear the cache of all keys.

* **Return type:**
  None

#### `async adelete()`

Async delete the cache and its index entirely.

* **Return type:**
  None

#### `async adisconnect()`

Asynchronously disconnect from Redis and search index.

Closes all Redis connections and index connections.

#### `async adrop(ids=None, keys=None)`

Async drop specific entries from the cache by ID or Redis key.

* **Parameters:**
  * **ids** (*Optional* *[* *List* *[* *str* *]* *]*) – List of entry IDs to remove from the cache.
    Entry IDs are the unique identifiers without the cache prefix.
  * **keys** (*Optional* *[* *List* *[* *str* *]* *]*) – List of full Redis keys to remove from the cache.
    Keys are the complete Redis keys including the cache prefix.
* **Return type:**
  None

#### `NOTE`
At least one of ids or keys must be provided.

* **Raises:**
  **ValueError** – If neither ids nor keys is provided.
* **Parameters:**
  * **ids** (*List* *[* *str* *]*  *|* *None*)
  * **keys** (*List* *[* *str* *]*  *|* *None*)
* **Return type:**
  None

#### `async aexpire(key, ttl=None)`

Asynchronously set or refresh the expiration time for a key in the cache.

* **Parameters:**
  * **key** (*str*) – The Redis key to set the expiration on.
  * **ttl** (*Optional* *[* *int* *]* *,* *optional*) – The time-to-live in seconds. If None,
    uses the default TTL configured for this cache instance.
    Defaults to None.
* **Return type:**
  None

#### `NOTE`
If neither the provided TTL nor the default TTL is set (both are None),
this method will have no effect.

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

Clear the cache of all keys.

* **Return type:**
  None

#### `delete()`

Delete the cache and its index entirely.

* **Return type:**
  None

#### `disconnect()`

Disconnect from Redis and search index.

Closes all Redis connections and index connections.

#### `drop(ids=None, keys=None)`

Drop specific entries from the cache by ID or Redis key.

* **Parameters:**
  * **ids** (*Optional* *[* *List* *[* *str* *]* *]*) – List of entry IDs to remove from the cache.
    Entry IDs are the unique identifiers without the cache prefix.
  * **keys** (*Optional* *[* *List* *[* *str* *]* *]*) – List of full Redis keys to remove from the cache.
    Keys are the complete Redis keys including the cache prefix.
* **Return type:**
  None

#### `NOTE`
At least one of ids or keys must be provided.

* **Raises:**
  **ValueError** – If neither ids nor keys is provided.
* **Parameters:**
  * **ids** (*List* *[* *str* *]*  *|* *None*)
  * **keys** (*List* *[* *str* *]*  *|* *None*)
* **Return type:**
  None

#### `expire(key, ttl=None)`

Set or refresh the expiration time for a key in the cache.

* **Parameters:**
  * **key** (*str*) – The Redis key to set the expiration on.
  * **ttl** (*Optional* *[* *int* *]* *,* *optional*) – The time-to-live in seconds. If None,
    uses the default TTL configured for this cache instance.
    Defaults to None.
* **Return type:**
  None

#### `NOTE`
If neither the provided TTL nor the default TTL is set (both are None),
this method will have no effect.

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
* **Return type:**
  None

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

# Embeddings Cache

## EmbeddingsCache

<a id="embeddings-cache-api"></a>

### `class EmbeddingsCache(name='embedcache', ttl=None, redis_client=None, redis_url='redis://localhost:6379', connection_kwargs={})`

Bases: `BaseCache`

Embeddings Cache for storing embedding vectors with exact key matching.

Initialize an embeddings cache.

* **Parameters:**
  * **name** (*str*) – The name of the cache. Defaults to "embedcache".
  * **ttl** (*Optional* *[* *int* *]*) – The time-to-live for cached embeddings. Defaults to None.
  * **redis_client** (*Optional* *[* *Redis* *]*) – Redis client instance. Defaults to None.
  * **redis_url** (*str*) – Redis URL for connection. Defaults to "redis://localhost:6379".
  * **connection_kwargs** (*Dict* *[* *str* *,* *Any* *]*) – Redis connection arguments. Defaults to {}.
* **Raises:**
  **ValueError** – If vector dimensions are invalid

```python
cache = EmbeddingsCache(
    name="my_embeddings_cache",
    ttl=3600,  # 1 hour
    redis_url="redis://localhost:6379"
)
```

#### `async aclear()`

Async clear the cache of all keys.

* **Return type:**
  None

#### `async adisconnect()`

Async disconnect from Redis.

* **Return type:**
  None

#### `async adrop(text, model_name)`

Async remove an embedding from the cache.

Asynchronously removes an embedding from the cache.

* **Parameters:**
  * **text** (*str*) – The text input that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Return type:**
  None

```python
await cache.adrop(
    text="What is machine learning?",
    model_name="text-embedding-ada-002"
)
```

#### `async adrop_by_key(key)`

Async remove an embedding from the cache by its Redis key.

Asynchronously removes an embedding from the cache by its Redis key.

* **Parameters:**
  **key** (*str*) – The full Redis key for the embedding.
* **Return type:**
  None

```python
await cache.adrop_by_key("embedcache:1234567890abcdef")
```

#### `async aexists(text, model_name)`

Async check if an embedding exists.

Asynchronously checks if an embedding exists for the given text and model.

* **Parameters:**
  * **text** (*str*) – The text input that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  True if the embedding exists in the cache, False otherwise.
* **Return type:**
  bool

```python
if await cache.aexists("What is machine learning?", "text-embedding-ada-002"):
    print("Embedding is in cache")
```

#### `async aexists_by_key(key)`

Async check if an embedding exists for the given Redis key.

Asynchronously checks if an embedding exists for the given Redis key.

* **Parameters:**
  **key** (*str*) – The full Redis key for the embedding.
* **Returns:**
  True if the embedding exists in the cache, False otherwise.
* **Return type:**
  bool

```python
if await cache.aexists_by_key("embedcache:1234567890abcdef"):
    print("Embedding is in cache")
```

#### `async aexpire(key, ttl=None)`

Asynchronously set or refresh the expiration time for a key in the cache.

* **Parameters:**
  * **key** (*str*) – The Redis key to set the expiration on.
  * **ttl** (*Optional* *[* *int* *]* *,* *optional*) – The time-to-live in seconds. If None,
    uses the default TTL configured for this cache instance.
    Defaults to None.
* **Return type:**
  None

#### `NOTE`
If neither the provided TTL nor the default TTL is set (both are None),
this method will have no effect.

#### `async aget(text, model_name)`

Async get embedding by text and model name.

Asynchronously retrieves a cached embedding for the given text and model name.
If found, refreshes the TTL of the entry.

* **Parameters:**
  * **text** (*str*) – The text input that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  Embedding cache entry or None if not found.
* **Return type:**
  Optional[Dict[str, Any]]

```python
embedding_data = await cache.aget(
    text="What is machine learning?",
    model_name="text-embedding-ada-002"
)
```

#### `async aget_by_key(key)`

Async get embedding by its full Redis key.

Asynchronously retrieves a cached embedding for the given Redis key.
If found, refreshes the TTL of the entry.

* **Parameters:**
  **key** (*str*) – The full Redis key for the embedding.
* **Returns:**
  Embedding cache entry or None if not found.
* **Return type:**
  Optional[Dict[str, Any]]

```python
embedding_data = await cache.aget_by_key("embedcache:1234567890abcdef")
```

#### `async amdrop(texts, model_name)`

Async remove multiple embeddings from the cache by their texts and model name.

Asynchronously removes multiple embeddings in a single operation.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text inputs that were embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Return type:**
  None

```python
# Remove multiple embeddings asynchronously
await cache.amdrop(
    texts=["What is machine learning?", "What is deep learning?"],
    model_name="text-embedding-ada-002"
)
```

#### `async amdrop_by_keys(keys)`

Async remove multiple embeddings from the cache by their Redis keys.

Asynchronously removes multiple embeddings in a single operation.

* **Parameters:**
  **keys** (*List* *[* *str* *]*) – List of Redis keys to remove.
* **Return type:**
  None

```python
# Remove multiple embeddings asynchronously
await cache.amdrop_by_keys(["embedcache:key1", "embedcache:key2"])
```

#### `async amexists(texts, model_name)`

Async check if multiple embeddings exist by their texts and model name.

Asynchronously checks existence of multiple embeddings in a single operation.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text inputs that were embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  List of boolean values indicating whether each embedding exists.
* **Return type:**
  List[bool]

```python
# Check if multiple embeddings exist asynchronously
exists_results = await cache.amexists(
    texts=["What is machine learning?", "What is deep learning?"],
    model_name="text-embedding-ada-002"
)
```

#### `async amexists_by_keys(keys)`

Async check if multiple embeddings exist by their Redis keys.

Asynchronously checks existence of multiple keys in a single operation.

* **Parameters:**
  **keys** (*List* *[* *str* *]*) – List of Redis keys to check.
* **Returns:**
  List of boolean values indicating whether each key exists.
  The order matches the input keys order.
* **Return type:**
  List[bool]

```python
# Check if multiple keys exist asynchronously
exists_results = await cache.amexists_by_keys(["embedcache:key1", "embedcache:key2"])
```

#### `async amget(texts, model_name)`

Async get multiple embeddings by their texts and model name.

Asynchronously retrieves multiple cached embeddings in a single operation.
If found, refreshes the TTL of each entry.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text inputs that were embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  List of embedding cache entries or None for texts not found.
* **Return type:**
  List[Optional[Dict[str, Any]]]

```python
# Get multiple embeddings asynchronously
embedding_data = await cache.amget(
    texts=["What is machine learning?", "What is deep learning?"],
    model_name="text-embedding-ada-002"
)
```

#### `async amget_by_keys(keys)`

Async get multiple embeddings by their Redis keys.

Asynchronously retrieves multiple cached embeddings in a single network roundtrip.
If found, refreshes the TTL of each entry.

* **Parameters:**
  **keys** (*List* *[* *str* *]*) – List of Redis keys to retrieve.
* **Returns:**
  List of embedding cache entries or None for keys not found.
  The order matches the input keys order.
* **Return type:**
  List[Optional[Dict[str, Any]]]

```python
# Get multiple embeddings asynchronously
embedding_data = await cache.amget_by_keys([
    "embedcache:key1",
    "embedcache:key2"
])
```

#### `async amset(items, ttl=None)`

Async store multiple embeddings in a batch operation.

Each item in the input list should be a dictionary with the following fields:
- ‘text’: The text input that was embedded
- ‘model_name’: The name of the embedding model
- ‘embedding’: The embedding vector
- ‘metadata’: Optional metadata to store with the embedding

* **Parameters:**
  * **items** (*List* *[* *Dict* *[* *str* *,* *Any* *]* *]*) – List of dictionaries, each containing text, model_name, embedding, and optional metadata.
  * **ttl** (*int* *|* *None*) – Optional TTL override for these entries.
* **Returns:**
  List of Redis keys where the embeddings were stored.
* **Return type:**
  List[str]

```python
# Store multiple embeddings asynchronously
keys = await cache.amset([
    {
        "text": "What is ML?",
        "model_name": "text-embedding-ada-002",
        "embedding": [0.1, 0.2, 0.3],
        "metadata": {"source": "user"}
    },
    {
        "text": "What is AI?",
        "model_name": "text-embedding-ada-002",
        "embedding": [0.4, 0.5, 0.6],
        "metadata": {"source": "docs"}
    }
])
```

#### `async aset(text, model_name, embedding, metadata=None, ttl=None)`

Async store an embedding with its text and model name.

Asynchronously stores an embedding with its text and model name.

* **Parameters:**
  * **text** (*str*) – The text input that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
  * **embedding** (*List* *[* *float* *]*) – The embedding vector to store.
  * **metadata** (*Optional* *[* *Dict* *[* *str* *,* *Any* *]* *]*) – Optional metadata to store with the embedding.
  * **ttl** (*Optional* *[* *int* *]*) – Optional TTL override for this specific entry.
* **Returns:**
  The Redis key where the embedding was stored.
* **Return type:**
  str

```python
key = await cache.aset(
    text="What is machine learning?",
    model_name="text-embedding-ada-002",
    embedding=[0.1, 0.2, 0.3, ...],
    metadata={"source": "user_query"}
)
```

#### `clear()`

Clear the cache of all keys.

* **Return type:**
  None

#### `disconnect()`

Disconnect from Redis.

* **Return type:**
  None

#### `drop(text, model_name)`

Remove an embedding from the cache.

* **Parameters:**
  * **text** (*str*) – The text input that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Return type:**
  None

```python
cache.drop(
    text="What is machine learning?",
    model_name="text-embedding-ada-002"
)
```

#### `drop_by_key(key)`

Remove an embedding from the cache by its Redis key.

* **Parameters:**
  **key** (*str*) – The full Redis key for the embedding.
* **Return type:**
  None

```python
cache.drop_by_key("embedcache:1234567890abcdef")
```

#### `exists(text, model_name)`

Check if an embedding exists for the given text and model.

* **Parameters:**
  * **text** (*str*) – The text input that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  True if the embedding exists in the cache, False otherwise.
* **Return type:**
  bool

```python
if cache.exists("What is machine learning?", "text-embedding-ada-002"):
    print("Embedding is in cache")
```

#### `exists_by_key(key)`

Check if an embedding exists for the given Redis key.

* **Parameters:**
  **key** (*str*) – The full Redis key for the embedding.
* **Returns:**
  True if the embedding exists in the cache, False otherwise.
* **Return type:**
  bool

```python
if cache.exists_by_key("embedcache:1234567890abcdef"):
    print("Embedding is in cache")
```

#### `expire(key, ttl=None)`

Set or refresh the expiration time for a key in the cache.

* **Parameters:**
  * **key** (*str*) – The Redis key to set the expiration on.
  * **ttl** (*Optional* *[* *int* *]* *,* *optional*) – The time-to-live in seconds. If None,
    uses the default TTL configured for this cache instance.
    Defaults to None.
* **Return type:**
  None

#### `NOTE`
If neither the provided TTL nor the default TTL is set (both are None),
this method will have no effect.

#### `get(text, model_name)`

Get embedding by text and model name.

Retrieves a cached embedding for the given text and model name.
If found, refreshes the TTL of the entry.

* **Parameters:**
  * **text** (*str*) – The text input that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  Embedding cache entry or None if not found.
* **Return type:**
  Optional[Dict[str, Any]]

```python
embedding_data = cache.get(
    text="What is machine learning?",
    model_name="text-embedding-ada-002"
)
```

#### `get_by_key(key)`

Get embedding by its full Redis key.

Retrieves a cached embedding for the given Redis key.
If found, refreshes the TTL of the entry.

* **Parameters:**
  **key** (*str*) – The full Redis key for the embedding.
* **Returns:**
  Embedding cache entry or None if not found.
* **Return type:**
  Optional[Dict[str, Any]]

```python
embedding_data = cache.get_by_key("embedcache:1234567890abcdef")
```

#### `mdrop(texts, model_name)`

Remove multiple embeddings from the cache by their texts and model name.

Efficiently removes multiple embeddings in a single operation.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text inputs that were embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Return type:**
  None

```python
# Remove multiple embeddings
cache.mdrop(
    texts=["What is machine learning?", "What is deep learning?"],
    model_name="text-embedding-ada-002"
)
```

#### `mdrop_by_keys(keys)`

Remove multiple embeddings from the cache by their Redis keys.

Efficiently removes multiple embeddings in a single operation.

* **Parameters:**
  **keys** (*List* *[* *str* *]*) – List of Redis keys to remove.
* **Return type:**
  None

```python
# Remove multiple embeddings
cache.mdrop_by_keys(["embedcache:key1", "embedcache:key2"])
```

#### `mexists(texts, model_name)`

Check if multiple embeddings exist by their texts and model name.

Efficiently checks existence of multiple embeddings in a single operation.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text inputs that were embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  List of boolean values indicating whether each embedding exists.
* **Return type:**
  List[bool]

```python
# Check if multiple embeddings exist
exists_results = cache.mexists(
    texts=["What is machine learning?", "What is deep learning?"],
    model_name="text-embedding-ada-002"
)
```

#### `mexists_by_keys(keys)`

Check if multiple embeddings exist by their Redis keys.

Efficiently checks existence of multiple keys in a single operation.

* **Parameters:**
  **keys** (*List* *[* *str* *]*) – List of Redis keys to check.
* **Returns:**
  List of boolean values indicating whether each key exists.
  The order matches the input keys order.
* **Return type:**
  List[bool]

```python
# Check if multiple keys exist
exists_results = cache.mexists_by_keys(["embedcache:key1", "embedcache:key2"])
```

#### `mget(texts, model_name)`

Get multiple embeddings by their texts and model name.

Efficiently retrieves multiple cached embeddings in a single operation.
If found, refreshes the TTL of each entry.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text inputs that were embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  List of embedding cache entries or None for texts not found.
* **Return type:**
  List[Optional[Dict[str, Any]]]

```python
# Get multiple embeddings
embedding_data = cache.mget(
    texts=["What is machine learning?", "What is deep learning?"],
    model_name="text-embedding-ada-002"
)
```

#### `mget_by_keys(keys)`

Get multiple embeddings by their Redis keys.

Efficiently retrieves multiple cached embeddings in a single network roundtrip.
If found, refreshes the TTL of each entry.

* **Parameters:**
  **keys** (*List* *[* *str* *]*) – List of Redis keys to retrieve.
* **Returns:**
  List of embedding cache entries or None for keys not found.
  The order matches the input keys order.
* **Return type:**
  List[Optional[Dict[str, Any]]]

```python
# Get multiple embeddings
embedding_data = cache.mget_by_keys([
    "embedcache:key1",
    "embedcache:key2"
])
```

#### `mset(items, ttl=None)`

Store multiple embeddings in a batch operation.

Each item in the input list should be a dictionary with the following fields:
- ‘text’: The text input that was embedded
- ‘model_name’: The name of the embedding model
- ‘embedding’: The embedding vector
- ‘metadata’: Optional metadata to store with the embedding

* **Parameters:**
  * **items** (*List* *[* *Dict* *[* *str* *,* *Any* *]* *]*) – List of dictionaries, each containing text, model_name, embedding, and optional metadata.
  * **ttl** (*int* *|* *None*) – Optional TTL override for these entries.
* **Returns:**
  List of Redis keys where the embeddings were stored.
* **Return type:**
  List[str]

```python
# Store multiple embeddings
keys = cache.mset([
    {
        "text": "What is ML?",
        "model_name": "text-embedding-ada-002",
        "embedding": [0.1, 0.2, 0.3],
        "metadata": {"source": "user"}
    },
    {
        "text": "What is AI?",
        "model_name": "text-embedding-ada-002",
        "embedding": [0.4, 0.5, 0.6],
        "metadata": {"source": "docs"}
    }
])
```

#### `set(text, model_name, embedding, metadata=None, ttl=None)`

Store an embedding with its text and model name.

* **Parameters:**
  * **text** (*str*) – The text input that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
  * **embedding** (*List* *[* *float* *]*) – The embedding vector to store.
  * **metadata** (*Optional* *[* *Dict* *[* *str* *,* *Any* *]* *]*) – Optional metadata to store with the embedding.
  * **ttl** (*Optional* *[* *int* *]*) – Optional TTL override for this specific entry.
* **Returns:**
  The Redis key where the embedding was stored.
* **Return type:**
  str

```python
key = cache.set(
    text="What is machine learning?",
    model_name="text-embedding-ada-002",
    embedding=[0.1, 0.2, 0.3, ...],
    metadata={"source": "user_query"}
)
```

#### `set_ttl(ttl=None)`

Set the default TTL, in seconds, for entries in the cache.

* **Parameters:**
  **ttl** (*Optional* *[* *int* *]* *,* *optional*) – The optional time-to-live expiration
  for the cache, in seconds.
* **Raises:**
  **ValueError** – If the time-to-live value is not an integer.
* **Return type:**
  None

#### `property ttl: int | None`

The default TTL, in seconds, for entries in the cache.
