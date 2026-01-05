---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
description: Cache LLM responses semantically to reduce costs and latency
linkTitle: Semantic caching
title: How do I cache LLM responses semantically?
weight: 3
---

## Problem

You need to reduce LLM costs and latency by caching responses:

- Similar questions should return cached answers
- Exact string matching isn't sufficient
- Need to handle paraphrased queries
- Want to reduce API calls to expensive LLMs
- Maintain response quality

Traditional caching can't match semantically similar queries.

## Solution overview

Redis semantic caching uses vector similarity to match queries:

1. **Embed queries** - Convert questions to vectors
2. **Search cache** - Find similar cached queries
3. **Return if match** - Use cached response if similarity above threshold
4. **Cache new responses** - Store new query-response pairs
5. **Expire old entries** - Manage cache size with TTL

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│              Semantic Cache Flow                         │
└──────────────────────────────────────────────────────────┘

User Query: "What is Redis?"
     │
     ▼
┌─────────────────────┐
│  Generate Embedding │
│  [0.23, -0.45, ...] │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│  Redis Vector Search (Semantic Cache)                │
│  ┌────────────────────────────────────────────────┐  │
│  │ cache:1  "What is Redis?"      [0.23, ...]    │  │
│  │          Response: "Redis is..."               │  │
│  │          Similarity: 1.00 ✓ MATCH              │  │
│  ├────────────────────────────────────────────────┤  │
│  │ cache:2  "Explain Redis"       [0.25, ...]    │  │
│  │          Response: "Redis is..."               │  │
│  │          Similarity: 0.96 ✓ MATCH              │  │
│  ├────────────────────────────────────────────────┤  │
│  │ cache:3  "How to use Python?"  [-0.12, ...]   │  │
│  │          Response: "Python is..."              │  │
│  │          Similarity: 0.23 ✗ NO MATCH           │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
           │
           ├─── Similarity ≥ 0.95? ───┐
           │                          │
           ▼ YES                      ▼ NO
    ┌─────────────┐          ┌──────────────────┐
    │ Return      │          │  Call LLM        │
    │ Cached      │          │  (GPT-4)         │
    │ Response    │          └────────┬─────────┘
    └─────────────┘                   │
         │                            ▼
         │                   ┌──────────────────┐
         │                   │ Cache Response   │
         │                   │ with Embedding   │
         │                   └────────┬─────────┘
         │                            │
         └────────────────────────────┘
                     │
                     ▼
              Return to User

Cost Savings: 90%+ reduction in LLM API calls
Latency: <10ms (cache) vs 1-3s (LLM)
```

## Prerequisites

Before implementing this pattern, review:

- [Vector similarity search]({{< relref "/develop/patterns/queries/vector-similarity-search" >}}) - Vector search basics
- [RAG pipelines]({{< relref "/develop/patterns/ai/rag-pipeline" >}}) - LLM integration patterns

## Implementation

### Step 1: Basic semantic cache

Implement simple semantic caching for LLM responses.

**Python example:**

```python
import redis
import numpy as np
from redis.commands.json.path import Path
from redis.commands.search.field import VectorField, TextField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redis.commands.search.query import Query
from openai import OpenAI

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
openai_client = OpenAI()

# Create cache index
VECTOR_DIM = 1536

schema = (
    TextField("$.query", as_name="query"),
    TextField("$.response", as_name="response"),
    VectorField(
        "$.embedding",
        "FLAT",
        {
            "TYPE": "FLOAT32",
            "DIM": VECTOR_DIM,
            "DISTANCE_METRIC": "COSINE"
        },
        as_name="embedding"
    )
)

index_def = IndexDefinition(prefix=["cache:"], index_type=IndexType.JSON)
try:
    r.ft("idx:llm_cache").create_index(schema, definition=index_def)
except:
    pass  # Index already exists

def embed_query(query):
    """Generate embedding for query"""
    response = openai_client.embeddings.create(
        input=query,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def check_cache(query, similarity_threshold=0.95):
    """Check if similar query exists in cache"""
    # Generate query embedding
    query_embedding = embed_query(query)
    query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()
    
    # Search for similar queries
    search_query = (
        Query("*=>[KNN 1 @embedding $vec AS score]")
        .return_fields("query", "response", "score")
        .dialect(2)
    )
    
    results = r.ft("idx:llm_cache").search(
        search_query,
        query_params={"vec": query_bytes}
    )
    
    if results.docs:
        doc = results.docs[0]
        similarity = 1 - float(doc.score)  # Convert distance to similarity
        
        if similarity >= similarity_threshold:
            return {
                "cached": True,
                "response": doc.response,
                "similarity": similarity,
                "original_query": doc.query
            }
    
    return {"cached": False}

def cache_response(query, response, ttl=3600):
    """Cache query-response pair"""
    import hashlib
    
    # Generate cache key
    cache_key = f"cache:{hashlib.md5(query.encode()).hexdigest()}"
    
    # Generate embedding
    embedding = embed_query(query)
    embedding_bytes = np.array(embedding, dtype=np.float32).tobytes()
    
    # Store in cache
    r.json().set(cache_key, Path.root_path(), {
        "query": query,
        "response": response,
        "embedding": embedding_bytes.hex(),
        "timestamp": r.time()[0]
    })
    
    # Set TTL
    r.expire(cache_key, ttl)

def llm_with_cache(query, similarity_threshold=0.95):
    """Call LLM with semantic caching"""
    # Check cache
    cache_result = check_cache(query, similarity_threshold)
    
    if cache_result["cached"]:
        print(f"Cache hit! (similarity: {cache_result['similarity']:.3f})")
        print(f"Original query: {cache_result['original_query']}")
        return cache_result["response"]
    
    # Cache miss - call LLM
    print("Cache miss - calling LLM")
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": query}]
    )
    
    answer = response.choices[0].message.content
    
    # Cache the response
    cache_response(query, answer)
    
    return answer

# Example usage
query1 = "What is Redis?"
answer1 = llm_with_cache(query1)
print(f"Answer: {answer1}\n")

# Similar query should hit cache
query2 = "Can you explain what Redis is?"
answer2 = llm_with_cache(query2)
print(f"Answer: {answer2}")
```

### Step 2: Cache with metadata

Add metadata for better cache management.

**Python example:**

```python
def cache_with_metadata(query, response, metadata=None, ttl=3600):
    """Cache with additional metadata"""
    import hashlib
    import time
    
    metadata = metadata or {}
    cache_key = f"cache:{hashlib.md5(query.encode()).hexdigest()}"
    
    embedding = embed_query(query)
    embedding_bytes = np.array(embedding, dtype=np.float32).tobytes()
    
    r.json().set(cache_key, Path.root_path(), {
        "query": query,
        "response": response,
        "embedding": embedding_bytes.hex(),
        "timestamp": time.time(),
        "model": metadata.get("model", "unknown"),
        "tokens": metadata.get("tokens", 0),
        "cost": metadata.get("cost", 0.0),
        "hit_count": 0
    })
    
    r.expire(cache_key, ttl)

def check_cache_with_stats(query, similarity_threshold=0.95):
    """Check cache and update statistics"""
    query_embedding = embed_query(query)
    query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()
    
    search_query = (
        Query("*=>[KNN 1 @embedding $vec AS score]")
        .return_fields("query", "response", "score", "hit_count", "cost")
        .dialect(2)
    )
    
    results = r.ft("idx:llm_cache").search(
        search_query,
        query_params={"vec": query_bytes}
    )
    
    if results.docs:
        doc = results.docs[0]
        similarity = 1 - float(doc.score)
        
        if similarity >= similarity_threshold:
            # Increment hit count
            cache_key = doc.id
            r.json().numincrby(cache_key, "$.hit_count", 1)
            
            return {
                "cached": True,
                "response": doc.response,
                "similarity": similarity,
                "hit_count": int(doc.hit_count) + 1,
                "cost_saved": float(doc.cost)
            }
    
    return {"cached": False}
```

### Step 3: Multi-tier caching

Implement different similarity thresholds for different use cases.

**Python example:**

```python
def multi_tier_cache(query):
    """Multi-tier semantic cache with different thresholds"""
    # Tier 1: Exact match (0.99+ similarity)
    result = check_cache(query, similarity_threshold=0.99)
    if result["cached"]:
        return {"response": result["response"], "tier": "exact", "similarity": result["similarity"]}
    
    # Tier 2: High similarity (0.95+ similarity)
    result = check_cache(query, similarity_threshold=0.95)
    if result["cached"]:
        # Add disclaimer for high similarity matches
        response = f"{result['response']}\n\n(Note: This answer is based on a similar question)"
        return {"response": response, "tier": "high", "similarity": result["similarity"]}
    
    # Tier 3: Medium similarity (0.90+ similarity) - use as context
    result = check_cache(query, similarity_threshold=0.90)
    if result["cached"]:
        # Use cached response as context for new query
        prompt = f"""Previous similar question: {result['original_query']}
Previous answer: {result['response']}

New question: {query}

Please answer the new question, using the previous answer as context if relevant."""
        
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        
        answer = response.choices[0].message.content
        cache_response(query, answer)
        
        return {"response": answer, "tier": "medium", "similarity": result["similarity"]}
    
    # No cache hit - call LLM
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": query}]
    )
    
    answer = response.choices[0].message.content
    cache_response(query, answer)
    
    return {"response": answer, "tier": "none", "similarity": 0.0}
```

### Step 4: Cache invalidation

Implement cache invalidation strategies.

**Python example:**

```python
def invalidate_cache_by_topic(topic):
    """Invalidate cache entries related to a topic"""
    # Search for cached queries containing topic
    search_query = Query(f"@query:{topic}")
    results = r.ft("idx:llm_cache").search(search_query)
    
    # Delete matching entries
    for doc in results.docs:
        r.delete(doc.id)
    
    return len(results.docs)

def invalidate_old_cache(max_age_seconds=86400):
    """Invalidate cache entries older than max_age"""
    import time
    
    cutoff = time.time() - max_age_seconds
    
    # Get all cache keys
    cache_keys = r.keys("cache:*")
    
    deleted = 0
    for key in cache_keys:
        timestamp = r.json().get(key, "$.timestamp")
        if timestamp and timestamp[0] < cutoff:
            r.delete(key)
            deleted += 1
    
    return deleted

def refresh_cache_entry(query):
    """Refresh a specific cache entry"""
    import hashlib
    
    cache_key = f"cache:{hashlib.md5(query.encode()).hexdigest()}"
    
    # Get new response
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": query}]
    )
    
    answer = response.choices[0].message.content
    
    # Update cache
    cache_response(query, answer)
    
    return answer
```

### Step 5: Cache analytics

Track cache performance metrics.

**Python example:**

```python
def get_cache_stats():
    """Get cache performance statistics"""
    cache_keys = r.keys("cache:*")
    
    total_entries = len(cache_keys)
    total_hits = 0
    total_cost_saved = 0.0
    
    for key in cache_keys:
        data = r.json().get(key)
        if data:
            total_hits += data.get("hit_count", 0)
            total_cost_saved += data.get("cost", 0.0) * data.get("hit_count", 0)
    
    return {
        "total_entries": total_entries,
        "total_hits": total_hits,
        "total_cost_saved": total_cost_saved,
        "avg_hits_per_entry": total_hits / total_entries if total_entries > 0 else 0
    }

def track_cache_hit_rate():
    """Track cache hit rate over time"""
    stats_key = "cache:stats"
    
    # Increment total queries
    r.hincrby(stats_key, "total_queries", 1)
    
    # This would be called on cache hit
    def record_hit():
        r.hincrby(stats_key, "cache_hits", 1)
    
    # Get hit rate
    stats = r.hgetall(stats_key)
    total = int(stats.get(b"total_queries", 0))
    hits = int(stats.get(b"cache_hits", 0))
    
    hit_rate = (hits / total * 100) if total > 0 else 0
    
    return {
        "total_queries": total,
        "cache_hits": hits,
        "hit_rate_percent": hit_rate
    }
```

## Redis Cloud setup

When deploying semantic caching to Redis Cloud:

1. **Set appropriate TTL** - Balance freshness vs cache hits
2. **Monitor cache size** - Limit number of entries
3. **Tune similarity threshold** - Balance precision vs recall
4. **Track cost savings** - Monitor ROI of caching
5. **Implement eviction** - Remove least-used entries

Example configuration:
- **TTL**: 1-24 hours depending on data freshness
- **Similarity threshold**: 0.95-0.99 for high precision
- **Max entries**: 10K-100K typical
- **Eviction**: LRU or based on hit count

## Common pitfalls

1. **Threshold too low** - Returns irrelevant cached responses
2. **No TTL** - Stale responses accumulate
3. **Not tracking hits** - Can't measure effectiveness
4. **Missing invalidation** - Outdated information persists
5. **Wrong embedding model** - Inconsistent similarity scores

## Related patterns

- [Vector similarity search]({{< relref "/develop/patterns/queries/vector-similarity-search" >}}) - Vector search
- [RAG pipelines]({{< relref "/develop/patterns/ai/rag-pipeline" >}}) - LLM integration
- [Agent memory]({{< relref "/develop/patterns/ai/agent-memory" >}}) - Conversation context

## More information

- [Vector database guide]({{< relref "/develop/get-started/vector-database" >}})
- [RAG with Redis]({{< relref "/develop/get-started/rag" >}})
- [Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})

