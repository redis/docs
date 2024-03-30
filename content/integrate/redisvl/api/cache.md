---
description: The LLMCache APIs
linkTitle: LLMCache
title: LLMCache
type: integration
weight: 7
---

## SemanticCache

<a id="semantic-cache-api"></a>

### *class* SemanticCache(name='llmcache', prefix=None, distance_threshold=0.1, ttl=None, vectorizer=HFTextVectorizer(model='sentence-transformers/all-mpnet-base-v2', dims=768, client=SentenceTransformer(   (0): Transformer({'max_seq_length': 384, 'do_lower_case': False}) with Transformer model: MPNetModel    (1): Pooling({'word_embedding_dimension': 768, 'pooling_mode_cls_token': False, 'pooling_mode_mean_tokens': True, 'pooling_mode_max_tokens': False, 'pooling_mode_mean_sqrt_len_tokens': False, 'pooling_mode_weightedmean_tokens': False, 'pooling_mode_lasttoken': False})   (2): Normalize() )), redis_client=None, redis_url='redis://localhost:6379', connection_args={}, \*\*kwargs)

Bases: `BaseLLMCache`

Semantic Cache for Large Language Models.

Semantic Cache for Large Language Models.

* **Parameters:**
  * **name** (*str* *,* *optional*) – The name of the semantic cache search index.
    Defaults to “llmcache”.
  * **prefix** (*Optional* *[**str* *]* *,* *optional*) – The prefix for Redis keys
    associated with the semantic cache search index. Defaults to
    None, and the index name will be used as the key prefix.
  * **distance_threshold** (*float* *,* *optional*) – Semantic threshold for the
    cache. Defaults to 0.1.
  * **ttl** (*Optional* *[**int* *]* *,* *optional*) – The time-to-live for records cached
    in Redis. Defaults to None.
  * **vectorizer** (*BaseVectorizer* *,* *optional*) – The vectorizer for the cache.
    Defaults to HFTextVectorizer.
  * **redis_client** (*Redis* *,* *optional*) – A redis client connection instance.
    Defaults to None.
  * **redis_url** (*str* *,* *optional*) – The redis url. Defaults to
    “redis://localhost:6379”.
  * **connection_args** (*Dict* *[**str* *,* *Any* *]* *,* *optional*) – The connection arguments
    for the redis client. Defaults to None.
* **Raises:**
  * **TypeError** – If an invalid vectorizer is provided.
  * **TypeError** – If the TTL value is not an int.
  * **ValueError** – If the threshold is not between 0 and 1.
  * **ValueError** – If the index name is not provided

### check(prompt=None, vector=None, num_results=1, return_fields=None)

Checks the semantic cache for results similar to the specified prompt
or vector.

This method searches the cache using vector similarity with
either a raw text prompt (converted to a vector) or a provided vector as
input. It checks for semantically similar prompts and fetches the cached
LLM responses.

* **Parameters:**
  * **prompt** (*Optional* *[**str* *]* *,* *optional*) – The text prompt to search for in
    the cache.
  * **vector** (*Optional* *[**List* *[**float* *]* *]* *,* *optional*) – The vector representation
    of the prompt to search for in the cache.
  * **num_results** (*int* *,* *optional*) – The number of cached results to return.
    Defaults to 1.
  * **return_fields** (*Optional* *[**List* *[**str* *]* *]* *,* *optional*) – The fields to include
    in each returned result. If None, defaults to all available
    fields in the cached entry.
* **Returns:**
  A list of dicts containing the requested
  : return fields for each similar cached response.
* **Return type:**
  List[Dict[str, Any]]
* **Raises:**
  * **ValueError** – If neither a prompt nor a vector is specified.
  * **TypeError** – If return_fields is not a list when provided.

```python
response = cache.check(
    prompt="What is the captial city of France?"
)
```

### clear()

Clear the cache of all keys while preserving the index.

* **Return type:**
  None

### delete()

Clear the semantic cache of all keys and remove the underlying search
index.

* **Return type:**
  None

### deserialize(metadata)

Deserialize the input from a string.

* **Parameters:**
  **metadata** (*str*) – 
* **Return type:**
  *Dict*[str, *Any*]

### hash_input(prompt)

Hashes the input using SHA256.

* **Parameters:**
  **prompt** (*str*) – 

### serialize(metadata)

Serlize the input into a string.

* **Parameters:**
  **metadata** (*Dict* *[**str* *,* *Any* *]*) – 
* **Return type:**
  str

### set_threshold(distance_threshold)

Sets the semantic distance threshold for the cache.

* **Parameters:**
  **distance_threshold** (*float*) – The semantic distance threshold for
  the cache.
* **Raises:**
  **ValueError** – If the threshold is not between 0 and 1.
* **Return type:**
  None

### set_ttl(ttl=None)

Set the default TTL, in seconds, for entries in the cache.

* **Parameters:**
  **ttl** (*Optional* *[**int* *]* *,* *optional*) – The optional time-to-live expiration
  for the cache, in seconds.
* **Raises:**
  **ValueError** – If the time-to-live value is not an integer.

### set_vectorizer(vectorizer)

Sets the vectorizer for the LLM cache.

Must be a valid subclass of BaseVectorizer and have equivalent
dimensions to the vector field defined in the schema.

* **Parameters:**
  **vectorizer** (*BaseVectorizer*) – The RedisVL vectorizer to use for
  vectorizing cache entries.
* **Raises:**
  * **TypeError** – If the vectorizer is not a valid type.
  * **ValueError** – If the vector dimensions are mismatched.
* **Return type:**
  None

### store(prompt, response, vector=None, metadata=None)

Stores the specified key-value pair in the cache along with metadata.

* **Parameters:**
  * **prompt** (*str*) – The user prompt to cache.
  * **response** (*str*) – The LLM response to cache.
  * **vector** (*Optional* *[**List* *[**float* *]* *]* *,* *optional*) – The prompt vector to
    cache. Defaults to None, and the prompt vector is generated on
    demand.
  * **metadata** (*Optional* *[**dict* *]* *,* *optional*) – The optional metadata to cache
    alongside the prompt and response. Defaults to None.
* **Returns:**
  The Redis key for the entries added to the semantic cache.
* **Return type:**
  str
* **Raises:**
  * **ValueError** – If neither prompt nor vector is specified.
  * **TypeError** – If provided metadata is not a dictionary.

```python
key = cache.store(
    prompt="What is the captial city of France?",
    response="Paris",
    metadata={"city": "Paris", "country": "France"}
)
```

### *property* distance_threshold *: float*

The semantic distance threshold for the cache.

* **Returns:**
  The semantic distance threshold.
* **Return type:**
  float

### *property* index *: [SearchIndex](searchindex.md#redisvl.index.SearchIndex)*

The underlying SearchIndex for the cache.

* **Returns:**
  The search index.
* **Return type:**
  [SearchIndex](searchindex.md#redisvl.index.SearchIndex)

### *property* ttl *: int | None*

The default TTL, in seconds, for entries in the cache.
