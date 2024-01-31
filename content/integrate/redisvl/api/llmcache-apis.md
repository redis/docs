---
linkTitle: LLMCache
title: LLMCache
type: integration
description: The LLMCache APIs
weight: 6
---

## SemanticCacheSchema Objects

```python
class SemanticCacheSchema(IndexSchema)
```

RedisVL index schema for the SemanticCache.


## SemanticCache Objects

```python
class SemanticCache(BaseLLMCache)
```

Semantic Cache for Large Language Models.


### \_\_init\_\_

```python
def __init__(name: str = "llmcache",
             prefix: Optional[str] = None,
             distance_threshold: float = 0.1,
             ttl: Optional[int] = None,
             vectorizer: BaseVectorizer = HFTextVectorizer(
                 model="sentence-transformers/all-mpnet-base-v2"),
             redis_url: str = "redis://localhost:6379",
             connection_args: Dict[str, Any] = {},
             **kwargs)
```

Semantic Cache for Large Language Models.

**Arguments**:

- `name` _str, optional_ - The name of the semantic cache search index.
  Defaults to "llmcache".
- `prefix` _Optional[str], optional_ - The prefix for Redis keys
  associated with the semantic cache search index. Defaults to
  None, and the index name will be used as the key prefix.
- `distance_threshold` _float, optional_ - Semantic threshold for the
  cache. Defaults to 0.1.
- `ttl` _Optional[int], optional_ - The time-to-live for records cached
  in Redis. Defaults to None.
- `vectorizer` _BaseVectorizer, optional_ - The vectorizer for the cache.
  Defaults to HFTextVectorizer.
- `redis_url` _str, optional_ - The redis url. Defaults to
  "redis://localhost:6379".
- `connection_args` _Dict[str, Any], optional_ - The connection arguments
  for the redis client. Defaults to None.
  

**Raises**:

- `TypeError` - If an invalid vectorizer is provided.
- `TypeError` - If the TTL value is not an int.
- `ValueError` - If the threshold is not between 0 and 1.
- `ValueError` - If the index name is not provided


### index

```python
@property
def index() -> SearchIndex
```

The underlying SearchIndex for the cache.

**Returns**:

- `SearchIndex` - The search index.


### distance\_threshold

```python
@property
def distance_threshold() -> float
```

The semantic distance threshold for the cache.

**Returns**:

- `float` - The semantic distance threshold.


### set\_threshold

```python
def set_threshold(distance_threshold: float) -> None
```

Sets the semantic distance threshold for the cache.

**Arguments**:

- `distance_threshold` _float_ - The semantic distance threshold for
  the cache.
  

**Raises**:

- `ValueError` - If the threshold is not between 0 and 1.


### set\_vectorizer

```python
def set_vectorizer(vectorizer: BaseVectorizer) -> None
```

Sets the vectorizer for the LLM cache.

Must be a valid subclass of BaseVectorizer and have equivalent
dimensions to the vector field defined in the schema.

**Arguments**:

- `vectorizer` _BaseVectorizer_ - The RedisVL vectorizer to use for
  vectorizing cache entries.
  

**Raises**:

- `TypeError` - If the vectorizer is not a valid type.
- `ValueError` - If the vector dimensions are mismatched.


### clear

```python
def clear() -> None
```

Clear the cache of all keys while preserving the index.


### delete

```python
def delete() -> None
```

Clear the semantic cache of all keys and remove the underlying search
index.


### check

```python
def check(prompt: Optional[str] = None,
          vector: Optional[List[float]] = None,
          num_results: int = 1,
          return_fields: Optional[List[str]] = None) -> List[Dict[str, Any]]
```

Checks the semantic cache for results similar to the specified prompt
or vector.

This method searches the cache using vector similarity with
either a raw text prompt (converted to a vector) or a provided vector as
input. It checks for semantically similar prompts and fetches the cached
LLM responses.

**Arguments**:

- `prompt` _Optional[str], optional_ - The text prompt to search for in
  the cache.
- `vector` _Optional[List[float]], optional_ - The vector representation
  of the prompt to search for in the cache.
- `num_results` _int, optional_ - The number of cached results to return.
  Defaults to 1.
- `return_fields` _Optional[List[str]], optional_ - The fields to include
  in each returned result. If None, defaults to all available
  fields in the cached entry.
  

**Returns**:

  List[Dict[str, Any]]: A list of dicts containing the requested
  return fields for each similar cached response.
  

**Raises**:

- `ValueError` - If neither a `prompt` nor a `vector` is specified.
- `TypeError` - If `return_fields` is not a list when provided.
  
  ```python
  response = cache.check(
  prompt="What is the captial city of France?"
  )
  ```


### store

```python
def store(prompt: str,
          response: str,
          vector: Optional[List[float]] = None,
          metadata: Optional[dict] = None) -> str
```

Stores the specified key-value pair in the cache along with metadata.

**Arguments**:

- `prompt` _str_ - The user prompt to cache.
- `response` _str_ - The LLM response to cache.
- `vector` _Optional[List[float]], optional_ - The prompt vector to
  cache. Defaults to None, and the prompt vector is generated on
  demand.
- `metadata` _Optional[dict], optional_ - The optional metadata to cache
  alongside the prompt and response. Defaults to None.
  

**Returns**:

- `str` - The Redis key for the entries added to the semantic cache.
  

**Raises**:

- `ValueError` - If neither prompt nor vector is specified.
- `TypeError` - If provided metadata is not a dictionary.
  
  ```python
  key = cache.store(
  prompt="What is the captial city of France?",
  response="Paris",
- `metadata={"city"` - "Paris", "country": "Fance"}
  )
  ```

## BaseLLMCache Objects

```python
class BaseLLMCache()
```


### ttl

```python
@property
def ttl() -> Optional[int]
```

The default TTL, in seconds, for entries in the cache.


### set\_ttl

```python
def set_ttl(ttl: Optional[int] = None)
```

Set the default TTL, in seconds, for entries in the cache.

**Arguments**:

- `ttl` _Optional[int], optional_ - The optional time-to-live expiration
  for the cache, in seconds.
  

**Raises**:

- `ValueError` - If the time-to-live value is not an integer.


### clear

```python
def clear() -> None
```

Clear the LLMCache of all keys in the index.


### store

```python
def store(prompt: str,
          response: str,
          vector: Optional[List[float]] = None,
          metadata: Optional[dict] = {}) -> str
```

Stores the specified key-value pair in the cache along with
metadata.


### hash\_input

```python
def hash_input(prompt: str)
```

Hashes the input using SHA256.


### serialize

```python
def serialize(metadata: Dict[str, Any]) -> str
```

Serlize the input into a string.


### deserialize

```python
def deserialize(metadata: str) -> Dict[str, Any]
```

Deserialize the input from a string.
