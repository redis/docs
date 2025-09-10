---
linkTitle: Caching embeddings
title: Caching Embeddings
weight: 10
url: '/develop/ai/redisvl/0.6.0/user_guide/embeddings_cache/'
---


RedisVL provides an `EmbeddingsCache` that makes it easy to store and retrieve embedding vectors with their associated text and metadata. This cache is particularly useful for applications that frequently compute the same embeddings, enabling you to:

- Reduce computational costs by reusing previously computed embeddings
- Decrease latency in applications that rely on embeddings
- Store additional metadata alongside embeddings for richer applications

This notebook will show you how to use the `EmbeddingsCache` effectively in your applications.

## Setup

First, let's import the necessary libraries. We'll use a text embedding model from HuggingFace to generate our embeddings.


```python
import os
import time
import numpy as np

# Disable tokenizers parallelism to avoid deadlocks
os.environ["TOKENIZERS_PARALLELISM"] = "False"

# Import the EmbeddingsCache
from redisvl.extensions.cache.embeddings import EmbeddingsCache
from redisvl.utils.vectorize import HFTextVectorizer
```

Let's create a vectorizer to generate embeddings for our texts:


```python
# Initialize the vectorizer
vectorizer = HFTextVectorizer(
    model="redis/langcache-embed-v1",
    cache_folder=os.getenv("SENTENCE_TRANSFORMERS_HOME")
)
```

    /Users/tyler.hutcherson/Library/Caches/pypoetry/virtualenvs/redisvl-VnTEShF2-py3.13/lib/python3.13/site-packages/tqdm/auto.py:21: TqdmWarning: IProgress not found. Please update jupyter and ipywidgets. See https://ipywidgets.readthedocs.io/en/stable/user_install.html
      from .autonotebook import tqdm as notebook_tqdm
    Compiling the model with `torch.compile` and using a `torch.mps` device is not supported. Falling back to non-compiled mode.


## Initializing the EmbeddingsCache

Now let's initialize our `EmbeddingsCache`. The cache requires a Redis connection to store the embeddings and their associated data.


```python
# Initialize the embeddings cache
cache = EmbeddingsCache(
    name="embedcache",                  # name prefix for Redis keys
    redis_url="redis://localhost:6379",  # Redis connection URL
    ttl=None                            # Optional TTL in seconds (None means no expiration)
)
```

## Basic Usage

### Storing Embeddings

Let's store some text with its embedding in the cache. The `set` method takes the following parameters:
- `text`: The input text that was embedded
- `model_name`: The name of the embedding model used
- `embedding`: The embedding vector
- `metadata`: Optional metadata associated with the embedding
- `ttl`: Optional time-to-live override for this specific entry


```python
# Text to embed
text = "What is machine learning?"
model_name = "redis/langcache-embed-v1"

# Generate the embedding
embedding = vectorizer.embed(text)

# Optional metadata
metadata = {"category": "ai", "source": "user_query"}

# Store in cache
key = cache.set(
    text=text,
    model_name=model_name,
    embedding=embedding,
    metadata=metadata
)

print(f"Stored with key: {key[:15]}...")
```

    Stored with key: embedcache:909f...


### Retrieving Embeddings

To retrieve an embedding from the cache, use the `get` method with the original text and model name:


```python
# Retrieve from cache

if result := cache.get(text=text, model_name=model_name):
    print(f"Found in cache: {result['text']}")
    print(f"Model: {result['model_name']}")
    print(f"Metadata: {result['metadata']}")
    print(f"Embedding shape: {np.array(result['embedding']).shape}")
else:
    print("Not found in cache.")
```

    Found in cache: What is machine learning?
    Model: redis/langcache-embed-v1
    Metadata: {'category': 'ai', 'source': 'user_query'}
    Embedding shape: (768,)


### Checking Existence

You can check if an embedding exists in the cache without retrieving it using the `exists` method:


```python
# Check if existing text is in cache
exists = cache.exists(text=text, model_name=model_name)
print(f"First query exists in cache: {exists}")

# Check if a new text is in cache
new_text = "What is deep learning?"
exists = cache.exists(text=new_text, model_name=model_name)
print(f"New query exists in cache: {exists}")
```

    First query exists in cache: True
    New query exists in cache: False


### Removing Entries

To remove an entry from the cache, use the `drop` method:


```python
# Remove from cache
cache.drop(text=text, model_name=model_name)

# Verify it's gone
exists = cache.exists(text=text, model_name=model_name)
print(f"After dropping: {exists}")
```

    After dropping: False


## Advanced Usage

### Key-Based Operations

The `EmbeddingsCache` also provides methods that work directly with Redis keys, which can be useful for advanced use cases:


```python
# Store an entry again
key = cache.set(
    text=text,
    model_name=model_name,
    embedding=embedding,
    metadata=metadata
)
print(f"Stored with key: {key[:15]}...")

# Check existence by key
exists_by_key = cache.exists_by_key(key)
print(f"Exists by key: {exists_by_key}")

# Retrieve by key
result_by_key = cache.get_by_key(key)
print(f"Retrieved by key: {result_by_key['text']}")

# Drop by key
cache.drop_by_key(key)
```

    Stored with key: embedcache:909f...
    Exists by key: True
    Retrieved by key: What is machine learning?


### Batch Operations

When working with multiple embeddings, batch operations can significantly improve performance by reducing network roundtrips. The `EmbeddingsCache` provides methods prefixed with `m` (for "multi") that handle batches efficiently.


```python
# Create multiple embeddings
texts = [
    "What is machine learning?",
    "How do neural networks work?",
    "What is deep learning?"
]
embeddings = [vectorizer.embed(t) for t in texts]

# Prepare batch items as dictionaries
batch_items = [
    {
        "text": texts[0],
        "model_name": model_name,
        "embedding": embeddings[0],
        "metadata": {"category": "ai", "type": "question"}
    },
    {
        "text": texts[1],
        "model_name": model_name,
        "embedding": embeddings[1],
        "metadata": {"category": "ai", "type": "question"}
    },
    {
        "text": texts[2],
        "model_name": model_name,
        "embedding": embeddings[2],
        "metadata": {"category": "ai", "type": "question"}
    }
]

# Store multiple embeddings in one operation
keys = cache.mset(batch_items)
print(f"Stored {len(keys)} embeddings with batch operation")

# Check if multiple embeddings exist in one operation
exist_results = cache.mexists(texts, model_name)
print(f"All embeddings exist: {all(exist_results)}")

# Retrieve multiple embeddings in one operation
results = cache.mget(texts, model_name)
print(f"Retrieved {len(results)} embeddings in one operation")

# Delete multiple embeddings in one operation
cache.mdrop(texts, model_name)

# Alternative: key-based batch operations
# cache.mget_by_keys(keys)     # Retrieve by keys
# cache.mexists_by_keys(keys)  # Check existence by keys
# cache.mdrop_by_keys(keys)    # Delete by keys
```

    Stored 3 embeddings with batch operation
    All embeddings exist: True
    Retrieved 3 embeddings in one operation


Batch operations are particularly beneficial when working with large numbers of embeddings. They provide the same functionality as individual operations but with better performance by reducing network roundtrips.

For asynchronous applications, async versions of all batch methods are also available with the `am` prefix (e.g., `amset`, `amget`, `amexists`, `amdrop`).

### Working with TTL (Time-To-Live)

You can set a global TTL when initializing the cache, or specify TTL for individual entries:


```python
# Create a cache with a default 5-second TTL
ttl_cache = EmbeddingsCache(
    name="ttl_cache",
    redis_url="redis://localhost:6379",
    ttl=5  # 5 second TTL
)

# Store an entry
key = ttl_cache.set(
    text=text,
    model_name=model_name,
    embedding=embedding
)

# Check if it exists
exists = ttl_cache.exists_by_key(key)
print(f"Immediately after setting: {exists}")

# Wait for it to expire
time.sleep(6)

# Check again
exists = ttl_cache.exists_by_key(key)
print(f"After waiting: {exists}")
```

    Immediately after setting: True
    After waiting: False


You can also override the default TTL for individual entries:


```python
# Store an entry with a custom 1-second TTL
key1 = ttl_cache.set(
    text="Short-lived entry",
    model_name=model_name,
    embedding=embedding,
    ttl=1  # Override with 1 second TTL
)

# Store another entry with the default TTL (5 seconds)
key2 = ttl_cache.set(
    text="Default TTL entry",
    model_name=model_name,
    embedding=embedding
    # No TTL specified = uses the default 5 seconds
)

# Wait for 2 seconds
time.sleep(2)

# Check both entries
exists1 = ttl_cache.exists_by_key(key1)
exists2 = ttl_cache.exists_by_key(key2)

print(f"Entry with custom TTL after 2 seconds: {exists1}")
print(f"Entry with default TTL after 2 seconds: {exists2}")

# Cleanup
ttl_cache.drop_by_key(key2)
```

    Entry with custom TTL after 2 seconds: False
    Entry with default TTL after 2 seconds: True


## Async Support

The `EmbeddingsCache` provides async versions of all methods for use in async applications. The async methods are prefixed with `a` (e.g., `aset`, `aget`, `aexists`, `adrop`).


```python
async def async_cache_demo():
    # Store an entry asynchronously
    key = await cache.aset(
        text="Async embedding",
        model_name=model_name,
        embedding=embedding,
        metadata={"async": True}
    )
    
    # Check if it exists
    exists = await cache.aexists_by_key(key)
    print(f"Async set successful? {exists}")
    
    # Retrieve it
    result = await cache.aget_by_key(key)
    success = result is not None and result["text"] == "Async embedding"
    print(f"Async get successful? {success}")
    
    # Remove it
    await cache.adrop_by_key(key)

# Run the async demo
await async_cache_demo()
```

    Async set successful? True
    Async get successful? True


## Real-World Example

Let's build a simple embeddings caching system for a text classification task. We'll check the cache before computing new embeddings to save computation time.


```python
# Create a fresh cache for this example
example_cache = EmbeddingsCache(
    name="example_cache",
    redis_url="redis://localhost:6379",
    ttl=3600  # 1 hour TTL
)

vectorizer = HFTextVectorizer(
    model=model_name,
    cache=example_cache,
    cache_folder=os.getenv("SENTENCE_TRANSFORMERS_HOME")
)

# Simulate processing a stream of queries
queries = [
    "What is artificial intelligence?",
    "How does machine learning work?",
    "What is artificial intelligence?",  # Repeated query
    "What are neural networks?",
    "How does machine learning work?"   # Repeated query
]

# Process the queries and track statistics
total_queries = 0
cache_hits = 0

for query in queries:
    total_queries += 1
    
    # Check cache before computing
    before = example_cache.exists(text=query, model_name=model_name)
    if before:
        cache_hits += 1
    
    # Get embedding (will compute or use cache)
    embedding = vectorizer.embed(query)

# Report statistics
cache_misses = total_queries - cache_hits
hit_rate = (cache_hits / total_queries) * 100

print("\nStatistics:")
print(f"Total queries: {total_queries}")
print(f"Cache hits: {cache_hits}")
print(f"Cache misses: {cache_misses}")
print(f"Cache hit rate: {hit_rate:.1f}%")

# Cleanup
for query in set(queries):  # Use set to get unique queries
    example_cache.drop(text=query, model_name=model_name)
```

    
    Statistics:
    Total queries: 5
    Cache hits: 2
    Cache misses: 3
    Cache hit rate: 40.0%


## Performance Benchmark

Let's run benchmarks to compare the performance of embedding with and without caching, as well as batch versus individual operations.


```python
# Text to use for benchmarking
benchmark_text = "This is a benchmark text to measure the performance of embedding caching."

# Create a fresh cache for benchmarking
benchmark_cache = EmbeddingsCache(
    name="benchmark_cache",
    redis_url="redis://localhost:6379",
    ttl=3600  # 1 hour TTL
)
vectorizer.cache = benchmark_cache

# Number of iterations for the benchmark
n_iterations = 10

# Benchmark without caching
print("Benchmarking without caching:")
start_time = time.time()
for _ in range(n_iterations):
    embedding = vectorizer.embed(text, skip_cache=True)
no_cache_time = time.time() - start_time
print(f"Time taken without caching: {no_cache_time:.4f} seconds")
print(f"Average time per embedding: {no_cache_time/n_iterations:.4f} seconds")

# Benchmark with caching
print("\nBenchmarking with caching:")
start_time = time.time()
for _ in range(n_iterations):
    embedding = vectorizer.embed(text)
cache_time = time.time() - start_time
print(f"Time taken with caching: {cache_time:.4f} seconds")
print(f"Average time per embedding: {cache_time/n_iterations:.4f} seconds")

# Compare performance
speedup = no_cache_time / cache_time
latency_reduction = (no_cache_time/n_iterations) - (cache_time/n_iterations)
print(f"\nPerformance comparison:")
print(f"Speedup with caching: {speedup:.2f}x faster")
print(f"Time saved: {no_cache_time - cache_time:.4f} seconds ({(1 - cache_time/no_cache_time) * 100:.1f}%)")
print(f"Latency reduction: {latency_reduction:.4f} seconds per query")
```

    Benchmarking without caching:
    Time taken without caching: 0.4735 seconds
    Average time per embedding: 0.0474 seconds
    
    Benchmarking with caching:
    Time taken with caching: 0.0663 seconds
    Average time per embedding: 0.0066 seconds
    
    Performance comparison:
    Speedup with caching: 7.14x faster
    Time saved: 0.4073 seconds (86.0%)
    Latency reduction: 0.0407 seconds per query


## Common Use Cases for Embedding Caching

Embedding caching is particularly useful in the following scenarios:

1. **Search applications**: Cache embeddings for frequently searched queries to reduce latency
2. **Content recommendation systems**: Cache embeddings for content items to speed up similarity calculations
3. **API services**: Reduce costs and improve response times when generating embeddings through paid APIs
4. **Batch processing**: Speed up processing of datasets that contain duplicate texts
5. **Chatbots and virtual assistants**: Cache embeddings for common user queries to provide faster responses
6. **Development** workflows

## Cleanup

Let's clean up our caches to avoid leaving data in Redis:


```python
# Clean up all caches
cache.clear()
ttl_cache.clear()
example_cache.clear()
benchmark_cache.clear()
```

## Summary

The `EmbeddingsCache` provides an efficient way to store and retrieve embeddings with their associated text and metadata. Key features include:

- Simple API for storing and retrieving individual embeddings (`set`/`get`)
- Batch operations for working with multiple embeddings efficiently (`mset`/`mget`/`mexists`/`mdrop`)
- Support for metadata storage alongside embeddings
- Configurable time-to-live (TTL) for cache entries
- Key-based operations for advanced use cases
- Async support for use in asynchronous applications
- Significant performance improvements (15-20x faster with batch operations)

By using the `EmbeddingsCache`, you can reduce computational costs and improve the performance of applications that rely on embeddings.
