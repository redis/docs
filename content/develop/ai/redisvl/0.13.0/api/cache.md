---
linkTitle: LLM cache
title: LLM Cache
url: '/develop/ai/redisvl/0.13.0/api/cache/'
---


## SemanticCache

<a id="semantic-cache-api"></a>

# Embeddings Cache

## EmbeddingsCache

<a id="embeddings-cache-api"></a>

### `class EmbeddingsCache(name='embedcache', ttl=None, redis_client=None, async_redis_client=None, redis_url='redis://localhost:6379', connection_kwargs={})`

Bases: `BaseCache`

Embeddings Cache for storing embedding vectors with exact key matching.

Initialize an embeddings cache.

* **Parameters:**
  * **name** (*str*) – The name of the cache. Defaults to "embedcache".
  * **ttl** (*Optional* *[* *int* *]*) – The time-to-live for cached embeddings. Defaults to None.
  * **redis_client** (*Optional* *[* *SyncRedisClient* *]*) – Redis client instance. Defaults to None.
  * **redis_url** (*str*) – Redis URL for connection. Defaults to "redis://localhost:6379".
  * **connection_kwargs** (*Dict* *[* *str* *,* *Any* *]*) – Redis connection arguments. Defaults to {}.
  * **async_redis_client** (*Redis* *|* *RedisCluster* *|* *None*)
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

#### `async adrop(content, model_name)`

Async remove an embedding from the cache.

Asynchronously removes an embedding from the cache.

* **Parameters:**
  * **content** (*bytes* *|* *str*) – The content that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Return type:**
  None

```python
await cache.adrop(
    content="What is machine learning?",
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

#### `async aexists(content, model_name)`

Async check if an embedding exists.

Asynchronously checks if an embedding exists for the given content and model.

* **Parameters:**
  * **content** (*bytes* *|* *str*) – The content that was embedded.
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

#### `async aget(content, model_name)`

Async get embedding by content and model name.

Asynchronously retrieves a cached embedding for the given content and model name.
If found, refreshes the TTL of the entry.

* **Parameters:**
  * **content** (*bytes* *|* *str*) – The content that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  Embedding cache entry or None if not found.
* **Return type:**
  Optional[Dict[str, Any]]

```python
embedding_data = await cache.aget(
    content="What is machine learning?",
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

#### `async amdrop(contents, model_name)`

Async remove multiple embeddings from the cache by their contents and model name.

Asynchronously removes multiple embeddings in a single operation.

* **Parameters:**
  * **contents** (*Iterable* *[* *bytes* *|* *str* *]*) – Iterable of content that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Return type:**
  None

```python
# Remove multiple embeddings asynchronously
await cache.amdrop(
    contents=["What is machine learning?", "What is deep learning?"],
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

#### `async amexists(contents, model_name)`

Async check if multiple embeddings exist by their contents and model name.

Asynchronously checks existence of multiple embeddings in a single operation.

* **Parameters:**
  * **contents** (*Iterable* *[* *bytes* *|* *str* *]*) – Iterable of content that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  List of boolean values indicating whether each embedding exists.
* **Return type:**
  List[bool]

```python
# Check if multiple embeddings exist asynchronously
exists_results = await cache.amexists(
    contents=["What is machine learning?", "What is deep learning?"],
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

#### `async amget(contents, model_name)`

Async get multiple embeddings by their contents and model name.

Asynchronously retrieves multiple cached embeddings in a single operation.
If found, refreshes the TTL of each entry.

* **Parameters:**
  * **contents** (*Iterable* *[* *bytes* *|* *str* *]*) – Iterable of content that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  List of embedding cache entries or None for contents not found.
* **Return type:**
  List[Optional[Dict[str, Any]]]

```python
# Get multiple embeddings asynchronously
embedding_data = await cache.amget(
    contents=["What is machine learning?", "What is deep learning?"],
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
- ‘content’: The content that was embedded
- ‘model_name’: The name of the embedding model
- ‘embedding’: The embedding vector
- ‘metadata’: Optional metadata to store with the embedding

* **Parameters:**
  * **items** (*List* *[* *Dict* *[* *str* *,* *Any* *]* *]*) – List of dictionaries, each containing content, model_name, embedding, and optional metadata.
  * **ttl** (*int* *|* *None*) – Optional TTL override for these entries.
* **Returns:**
  List of Redis keys where the embeddings were stored.
* **Return type:**
  List[str]

```python
# Store multiple embeddings asynchronously
keys = await cache.amset([
    {
        "content": "What is ML?",
        "model_name": "text-embedding-ada-002",
        "embedding": [0.1, 0.2, 0.3],
        "metadata": {"source": "user"}
    },
    {
        "content": "What is AI?",
        "model_name": "text-embedding-ada-002",
        "embedding": [0.4, 0.5, 0.6],
        "metadata": {"source": "docs"}
    }
])
```

#### `async aset(content, model_name, embedding, metadata=None, ttl=None)`

Async store an embedding with its content and model name.

Asynchronously stores an embedding with its content and model name.

* **Parameters:**
  * **content** (*bytes* *|* *str*) – The content that was embedded.
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
    content="What is machine learning?",
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

#### `drop(content, model_name)`

Remove an embedding from the cache.

* **Parameters:**
  * **content** (*bytes* *|* *str*) – The content that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Return type:**
  None

```python
cache.drop(
    content="What is machine learning?",
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

#### `exists(content, model_name)`

Check if an embedding exists for the given content and model.

* **Parameters:**
  * **content** (*bytes* *|* *str*) – The content that was embedded.
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

#### `get(content, model_name)`

Get embedding by content and model name.

Retrieves a cached embedding for the given content and model name.
If found, refreshes the TTL of the entry.

* **Parameters:**
  * **content** (*bytes* *|* *str*) – The content that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  Embedding cache entry or None if not found.
* **Return type:**
  Optional[Dict[str, Any]]

```python
embedding_data = cache.get(
    content="What is machine learning?",
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

#### `mdrop(contents, model_name)`

Remove multiple embeddings from the cache by their contents and model name.

Efficiently removes multiple embeddings in a single operation.

* **Parameters:**
  * **contents** (*Iterable* *[* *bytes* *|* *str* *]*) – Iterable of content that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Return type:**
  None

```python
# Remove multiple embeddings
cache.mdrop(
    contents=["What is machine learning?", "What is deep learning?"],
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

#### `mexists(contents, model_name)`

Check if multiple embeddings exist by their contents and model name.

Efficiently checks existence of multiple embeddings in a single operation.

* **Parameters:**
  * **contents** (*Iterable* *[* *bytes* *|* *str* *]*) – Iterable of content that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  List of boolean values indicating whether each embedding exists.
* **Return type:**
  List[bool]

```python
# Check if multiple embeddings exist
exists_results = cache.mexists(
    contents=["What is machine learning?", "What is deep learning?"],
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

#### `mget(contents, model_name)`

Get multiple embeddings by their content and model name.

Efficiently retrieves multiple cached embeddings in a single operation.
If found, refreshes the TTL of each entry.

* **Parameters:**
  * **contents** (*Iterable* *[* *bytes* *|* *str* *]*) – Iterable of content that was embedded.
  * **model_name** (*str*) – The name of the embedding model.
* **Returns:**
  List of embedding cache entries or None for contents not found.
* **Return type:**
  List[Optional[Dict[str, Any]]]

```python
# Get multiple embeddings
embedding_data = cache.mget(
    contents=["What is machine learning?", "What is deep learning?"],
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
- ‘content’: The input that was embedded
- ‘model_name’: The name of the embedding model
- ‘embedding’: The embedding vector
- ‘metadata’: Optional metadata to store with the embedding

* **Parameters:**
  * **items** (*List* *[* *Dict* *[* *str* *,* *Any* *]* *]*) – List of dictionaries, each containing content, model_name, embedding, and optional metadata.
  * **ttl** (*int* *|* *None*) – Optional TTL override for these entries.
* **Returns:**
  List of Redis keys where the embeddings were stored.
* **Return type:**
  List[str]

```python
# Store multiple embeddings
keys = cache.mset([
    {
        "content": "What is ML?",
        "model_name": "text-embedding-ada-002",
        "embedding": [0.1, 0.2, 0.3],
        "metadata": {"source": "user"}
    },
    {
        "content": "What is AI?",
        "model_name": "text-embedding-ada-002",
        "embedding": [0.4, 0.5, 0.6],
        "metadata": {"source": "docs"}
    }
])
```

#### `set(content, model_name, embedding, metadata=None, ttl=None)`

Store an embedding with its content and model name.

* **Parameters:**
  * **content** (*Union* *[* *bytes* *,* *str* *]*) – The content to be embedded.
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
    content="What is machine learning?",
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
