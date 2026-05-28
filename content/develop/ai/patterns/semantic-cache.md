---
title: "Semantic caching for LLMs"
linkTitle: "Semantic cache"
description: "Cache LLM responses by meaning, not exact match—reduce API costs 40-60%"
weight: 100
---

## Pattern: Semantic LLM Caching

**Intent**: Cache LLM responses based on semantic similarity rather than exact string matching, reducing API costs by 40-60% for applications with repetitive queries phrased differently.

Traditional caches fail with natural language: "Who is the US President?", "Current POTUS", and "Who leads America?" mean the same thing but hash to different keys, causing cache misses despite semantic equivalence.

## The abstraction (developer experience)

### Option 1: LangCache (fully managed service)

Use Redis LangCache for zero-infrastructure semantic caching with automatic embedding generation.

**Best for**: Production apps needing managed service, teams wanting zero infrastructure management, enterprise deployments requiring SLA and compliance.

```python
from langcache import LangCache

# Initialize with your LangCache credentials (from Redis Cloud)
cache = LangCache(
    api_key="your_api_key",
    cache_id="your_cache_id",
    host="your_langcache_host"
)

# Check cache before calling LLM
result = cache.search(
    prompt="What is the capital of France?",
    attributes={"model": "gpt-4", "user_tier": "premium"}  # Optional filtering
)

if result:
    response = result["response"]  # Cache hit - semantically similar
else:
    response = call_llm(prompt)   # Cache miss - call LLM
    cache.store(
        prompt="What is the capital of France?",
        response=response,
        attributes={"model": "gpt-4", "user_tier": "premium"}
    )
```

**Why this works**: LangCache handles embedding generation, vector similarity search, infrastructure management, and monitoring—zero database operations or embedding model management needed.

**When to use LangCache**:
- ✅ You want a managed service with zero infrastructure
- ✅ You need automatic embedding generation
- ✅ You want built-in monitoring and cache analytics
- ✅ You're on Redis Cloud or can access the private preview
- ✅ You need enterprise SLA and compliance (SOC 2, etc.)

**When NOT to use LangCache**:
- ❌ You need on-premises or air-gapped deployment
- ❌ You need custom embedding models (domain-specific)
- ❌ You want full control over caching logic and thresholds
- ❌ You want to avoid service API overhead

[Learn more about LangCache]({{< relref "/develop/ai/langcache" >}})

### Option 2: RedisVL (self-hosted)

Use RedisVL's `SemanticCache` for self-hosted deployments with full control over embedding models and caching strategy.

**Best for**: On-premises deployments, custom embedding models, fine-grained control over infrastructure and caching logic.

```python
from redisvl.extensions.llmcache import SemanticCache

# Initialize the high-level semantic cache
cache = SemanticCache(
    name="llm_cache",
    redis_url="redis://localhost:6379",
    distance_threshold=0.1,  # Lower = stricter semantic match
    ttl=3600                 # 1-hour cache expiry
)

# Store an LLM response
cache.store(
    prompt="What is the capital of France?",
    response="Paris is the capital of France.",
    metadata={"model": "gpt-4", "tokens": 150}
)

# Check cache before calling LLM
if cached := cache.check(prompt="What's the capital city of France?"):
    response = cached[0]["response"]  # Cache hit - semantically similar
else:
    response = call_llm(prompt)       # Cache miss - call LLM
    cache.store(prompt, response)
```

**Why this works**: RedisVL automatically generates embeddings, performs vector similarity search, and manages TTL—preventing you from writing custom embedding pipelines or incorrect similarity logic.

**When to use RedisVL**:
- ✅ On-premises or air-gapped environments
- ✅ Custom embedding models (domain-specific, proprietary)
- ✅ Fine-grained control over caching strategy
- ✅ Cost optimization through self-managed infrastructure
- ✅ Sub-5ms latency requirements (local Redis)

## The raw commands (machine verification)

If RedisVL fails or you need to debug, use these exact Redis commands to verify state.

### Verify the underlying index (uses Redis Search for vector similarity)

```bash
# Check if the semantic cache index exists
FT.INFO llm_cache
```

**Expected output**: Index with `prompt_vector` field of type `VECTOR`, `distance_metric: COSINE`, dimension matching your embedding model (e.g., 768 for `langcache-embed-v1`).

### Manually search for semantically similar prompts

```bash
# Find top 1 similar cached prompt (this is what cache.check() does under the hood)
FT.SEARCH llm_cache
  "(*)=>[KNN 1 @prompt_vector $BLOB AS score]"
  PARAMS 2 BLOB <query_embedding_bytes>
  SORTBY score ASC
  DIALECT 2
```

**What this reveals**: If `FT.SEARCH` returns results with `score > distance_threshold`, the cache would miss even though semantically similar entries exist—indicates threshold needs tuning.

### Inspect cached entries with metadata filters

```bash
# Find all GPT-4 cached responses
FT.SEARCH llm_cache "@model:{gpt-4}"

# Find recent caches (last hour)
FT.SEARCH llm_cache "@inserted_at:[(now-3600) +inf]"
```

## Comparison: LangCache vs RedisVL vs Redis 8 Vector Sets

| Feature | LangCache | RedisVL | Redis 8 Vector Sets |
|---------|-----------|---------|---------------------|
| **Deployment** | Managed service (Redis Cloud) | Self-hosted | Self-hosted |
| **Setup complexity** | REST API + credentials | `pip install` + Redis | Redis 8+ |
| **Embedding generation** | Automatic (managed) | Manual (choose model) | Manual |
| **Infrastructure** | Zero management | Redis + embedding service | Redis only |
| **Monitoring** | Built-in dashboard | DIY | DIY |
| **Custom embedding models** | No | Yes | Yes |
| **Latency** | 50-150ms (network + API) | <5ms (local) | <2ms (native) |
| **Cost model** | Service fee + usage | Redis hosting + compute | Redis hosting only |
| **Multi-tenancy** | Attributes-based | Metadata filters | JSON filters |
| **Search strategies** | Exact + Semantic | Semantic only | Semantic only |
| **Best for** | Managed, enterprise, zero ops | Control, on-prem, custom | Latest Redis, minimal deps |

## Use Cases

✅ **Best for LangCache (managed)**:
- Production applications requiring enterprise SLA and compliance
- Teams without DevOps resources for Redis management
- Multi-region deployments with global caching
- Rapid prototyping without infrastructure setup
- Applications requiring built-in monitoring and analytics

✅ **Best for RedisVL (self-hosted)**:
- On-premises or air-gapped environments
- Custom embedding models (domain-specific, proprietary)
- Fine-grained control over caching strategy and thresholds
- Cost optimization through self-managed infrastructure
- Sub-5ms latency requirements

✅ **Best for Redis 8 Vector Sets (native)**:
- Latest Redis deployments (8.0+)
- Minimal dependencies and module-free architecture
- Maximum performance (sub-2ms latency)
- Simple semantic caching without complex features

**Common use cases across all options**:
- Customer support bots with repetitive questions phrased differently
- FAQ systems where users ask the same thing in multiple ways
- Document Q&A with semantically similar queries
- Developer tools with recurring code-related questions
- RAG applications caching similar retrieval queries

❌ **Not suitable for (all options)**:
- Time-sensitive queries ("What's the current stock price?")
- Highly personalized queries requiring user-specific context
- Creative outputs where variation is desired ("Write a unique poem")

## Alternative: Redis 8 native Vector Sets (future-proof)

For Redis 8+ deployments, use native Vector Sets (VADD/VSIM) instead of Redis Search for simpler operations and better performance.

### Store and retrieve with native commands

```bash
# Store query embedding and response
VADD llm:cache FP32 <embedding_bytes> "query:abc123"
  SETATTR '{"response": "Paris", "model": "gpt-4", "tokens": 150}'

# Find semantically similar cached query
VSIM llm:cache FP32 <new_query_embedding> COUNT 1 WITHSCORES WITHATTRIBS
```

**Returns**: Element ID, similarity score (0-1, where 1 = identical), and attributes (response, model, tokens)

### Threshold selection

Vector similarity scores range 0-1. Empirical testing on customer support workloads:

| Threshold | Hit Rate | False Positive Rate | Use When |
|-----------|----------|---------------------|----------|
| 0.90 | 65% | 8% | Too risky - wrong answers |
| **0.95** | **55%** | **0.5%** | **Sweet spot - production default** |
| 0.98 | 30% | <0.1% | Strict accuracy requirements |

**False positive** = returning a cached answer that doesn't actually answer the new query.

### Python example with native Vector Sets

```python
import redis
import numpy as np

r = redis.Redis(decode_responses=False)  # Binary mode for embeddings

def semantic_cache_check(query_embedding, threshold=0.95):
    # Find most similar cached query
    results = r.execute_command(
        'VSIM', 'llm:cache', 'FP32',
        query_embedding.tobytes(),
        'COUNT', '1',
        'WITHSCORES', 'WITHATTRIBS'
    )

    if results and len(results) > 0:
        query_id, score, attrs = results[0]
        if score >= threshold:
            return attrs['response']  # Cache hit

    return None  # Cache miss

def semantic_cache_store(query_embedding, query_id, response, model, tokens):
    r.execute_command(
        'VADD', 'llm:cache', 'FP32',
        query_embedding.tobytes(),
        query_id,
        'SETATTR', f'{{"response": "{response}", "model": "{model}", "tokens": {tokens}}}'
    )
```

**Why Vector Sets are better**:
- **Simpler**: No index schema, just VADD and VSIM
- **Faster**: O(log N) native HNSW vs Redis Search overhead
- **Smaller**: ~1.5KB per 1536-dim embedding with Q8 quantization (4x compression)
- **No modules**: Built into Redis 8 core

## Production considerations

### Multi-tenancy and attribute-based filtering

**LangCache approach** - Use attributes to isolate cache entries by tenant, environment, or other dimensions:

```python
# Store with tenant isolation
cache.store(
    prompt="What are our return policies?",
    response=llm_response,
    attributes={
        "tenant_id": "tenant_123",
        "environment": "production",
        "model": "gpt-4"
    }
)

# Search scoped to specific tenant
result = cache.search(
    prompt="Tell me about return policies",
    attributes={"tenant_id": "tenant_123"}  # Only matches this tenant's cache
)
```

**RedisVL approach** - Use metadata filters in the semantic cache:

```python
cache.store(
    prompt="What are our return policies?",
    response=llm_response,
    metadata={
        "tenant_id": "tenant_123",
        "environment": "production"
    }
)

# Filter by metadata
cached = cache.check(
    prompt="Tell me about return policies",
    filter_expression="@tenant_id:{tenant_123}"
)
```

**Why this matters**: Without tenant isolation, users can retrieve cached responses from other tenants, causing data leakage. Always scope searches by tenant ID in multi-tenant applications.

### Hybrid search: Exact + Semantic (LangCache only)

LangCache supports both exact and semantic search strategies, which can catch both identical and semantically similar prompts:

```python
# Use both exact and semantic matching
result = cache.search(
    prompt="What is the capital of France?",
    search_strategies=["exact", "semantic"]  # Check for exact match first, then semantic
)
```

**Why this helps**:
- **Exact match** returns instantly (no embedding computation) for identical prompts
- **Semantic match** catches paraphrased versions ("What's France's capital?")
- Cost optimization: exact matches are faster and cheaper (no embedding API call)

**Strategy recommendation**:
- Use `["exact", "semantic"]` for production (best of both)
- Use `["exact"]` only for debugging or when semantic matches cause issues
- Use `["semantic"]` only (default) for maximum cache hit rate

### TTL strategy

Setting a fixed TTL (e.g., 1 hour) works for most queries, but some need different lifetimes:

- **Factual queries** ("When was Lincoln born?"): Cache for days
- **Current events** ("Latest news"): Cache for minutes
- **User-specific** ("My account balance"): Don't cache across users

**Pattern: Metadata-based TTL**

    VADD llm:cache FP32 <embedding> query_id SETATTR '{"type": "factual", "user": null}'

    # On cache lookup
    VSIM llm:cache FP32 <query_embedding> COUNT 1 WITHSCORES WITHATTRIBS FILTER '.type == "factual"'

Store response type as metadata and query with filters to ensure cache hits respect query classification.

## Memory management

Each cache entry requires:
- Vector storage: ~1.5KB (1536-dim embedding with Q8)
- Response text: Variable (avg 500 bytes for chat, 2KB for long-form)
- Overhead: ~500 bytes (Redis metadata, Vector Set graph)

For 1 million cached queries: ~2.5GB total.

**Growth problem**: Without bounds, the cache grows indefinitely as users ask novel questions.

**Solution: Capped insertion with LRU eviction**

```python
MAX_CACHE_SIZE = 100_000

def cache_response(query_embedding, query_id, response):
    current_size = redis.vcard('llm:cache')

    if current_size >= MAX_CACHE_SIZE:
        # Evict least-recently-used entry
        oldest = redis.zrange('llm:cache:lru', 0, 0)[0]
        redis.vrem('llm:cache', oldest)
        redis.delete(f'response:{oldest}')
        redis.zrem('llm:cache:lru', oldest)

    # Add new entry
    redis.vadd('llm:cache', 'FP32', query_embedding, query_id)
    redis.set(f'response:{query_id}', response, ex=3600)

    # Track access for LRU
    redis.zadd('llm:cache:lru', {query_id: time.time()})
```

This maintains a Sorted Set (`llm:cache:lru`) mapping query IDs to last-access timestamps. When the cache is full, evict the entry with the lowest timestamp.

## Cache warming

For predictable workloads like documentation Q&A or product support, pre-populate the cache with common queries:

    # Offline: Generate embeddings for FAQ questions
    for question, answer in faq_pairs:
        query_embedding = embed_model.encode(question)
        query_id = f"faq:{hash(question)}"

        redis.vadd('llm:cache', 'FP32', query_embedding, query_id)
        redis.set(f'response:{query_id}', answer, ex=86400 * 7)  # 7 day TTL

This eliminates cold-start costs for the most common queries.

## Multi-model caching

Different LLMs generate different responses. Cache separately per model:

    # Model-specific cache keys
    VADD llm:cache:gpt4 FP32 <embedding> query_id
    VADD llm:cache:claude FP32 <embedding> query_id

Or use a unified cache with model as a filter:

    VADD llm:cache FP32 <embedding> query_id SETATTR '{"model": "gpt-4"}'

    # Query with model filter
    VSIM llm:cache FP32 <query_embedding> COUNT 1 FILTER '.model == "gpt-4"'

## Monitor cache effectiveness

Track these metrics:

```python
# On each query
total_queries = redis.incr('cache:stats:total')

if cache_hit:
    cache_hits = redis.incr('cache:stats:hits')
    saved_cost = redis.incrbyfloat('cache:stats:saved_usd', llm_cost)

hit_rate = redis.get('cache:stats:hits') / redis.get('cache:stats:total')
```

Monitor daily:
- **Hit rate**: Should be 40-60% for support/FAQ use cases
- **Cost savings**: Track cumulative $ saved by not calling LLM
- **False positives**: User feedback when cached answer is wrong

## Choose an embedding model

| Model | Dimensions | Cost | Performance |
|-------|-----------|------|-------------|
| OpenAI ada-002 | 1536 | $0.0001/1K tokens | Good |
| OpenAI 3-small | 1536 | $0.00002/1K tokens | Better |
| OpenAI 3-large | 3072 | $0.00013/1K tokens | Best (expensive) |
| Sentence BERT | 384 | Free (self-hosted) | Good |

For caching, ada-002 or 3-small provides the best cost/accuracy trade-off. Higher-dimensional embeddings like 3-large don't significantly improve cache hit rates because semantic similarity at 1536 dimensions is already discriminative enough.

## Invalidation strategies

**Time-based**: Set TTL on responses

    SET response:{query_id} <response> EX 3600

**Event-based**: Invalidate when underlying data changes

    # When documentation is updated
    redis.delete('response:*')  # Nuclear option

    # Better: Track which docs each query touched
    VADD llm:cache FP32 <embedding> query_id SETATTR '{"docs": ["manual.pdf", "faq.md"]}'

    # On doc update, selective invalidation
    results = redis.vsim('llm:cache', 'FP32', dummy_vector,
                         count=100000, filter='.docs in ["manual.pdf"]')
    for query_id in results:
        redis.vrem('llm:cache', query_id)
        redis.delete(f'response:{query_id}')

**Version-based**: Include content version in metadata

    SETATTR '{"doc_version": "v2.5"}'

    # Only match cache entries for current version
    FILTER '.doc_version == "v2.5"'

## Production gotchas

**1. Embedding model changes**: If you update your embedding model, old cache entries become invalid because vectors from different models aren't comparable. Solution:
   - **LangCache**: Create a new cache instance (managed for you)
   - **RedisVL**: Version your cache keys (`llm:cache:v2`) and migrate gradually

**2. Prompt changes**: Modifying the system prompt or LLM parameters invalidates cached responses. Version these using attributes/metadata.

**3. Thundering herd**: If many users ask the same question simultaneously before it's cached, they all trigger LLM calls. Solution:
   - **LangCache**: Built-in request deduplication (managed for you)
   - **RedisVL/Self-hosted**: Use a distributed lock:

    SET cache:lock:{query_hash} 1 NX EX 10

    if lock acquired:
        response = llm.generate(query)
        cache_response(...)
    else:
        # Wait briefly, then check cache again
        time.sleep(0.5)
        return get_from_cache(query)

## Cost analysis

Assumptions:
- 10,000 queries/day
- 50% cache hit rate
- GPT-4: $0.03/1K input tokens, $0.06/1K output tokens
- Average query: 50 tokens, response: 200 tokens

**Without cache:**
- Daily cost: 10,000 × (50×$0.03 + 200×$0.06)/1000 = **$135/day**

**With cache:**
- Daily cost: 5,000 × (50×$0.03 + 200×$0.06)/1000 = **$67.50/day**
- Redis Cloud (5GB): ~$15/month
- **Net savings: $60-65/day = $1,800-2,000/month**

ROI improves dramatically at higher query volumes.

## When semantic caching fails

1. **Highly personalized queries**: "Summarize MY recent emails" requires user-specific context
2. **Real-time data**: "Current stock price" changes constantly
3. **Sequential conversations**: Follow-up questions depend on prior context
4. **Creative outputs**: "Write a unique poem" should not be cached

For these cases, combine semantic caching with filters:

    FILTER '.requires_user_context == false and .requires_real_time == false'

## Benefits of this pattern

1. **Safety**: The abstractions prevent agents from writing buggy embedding pipelines or incorrect similarity logic:
   - **LangCache** eliminates all infrastructure code—agents can't misconfigure Redis, embedding models, or vector indexes
   - **RedisVL** handles edge cases like normalization, distance metric selection, and index management
   - Both prevent common mistakes like incorrect similarity thresholds or missing TTL

2. **Accuracy**: The raw commands (FT.SEARCH or VSIM) act as ground truth that agents can use to debug when library versions mismatch or behavior seems wrong. An agent can verify the actual Redis state.

3. **Efficiency**:
   - **LangCache**: Zero infrastructure overhead, automatic scaling, built-in monitoring
   - **RedisVL**: Connection pooling, async support, batch operations
   - **Native Vector Sets**: 7-10x faster retrieval than Redis Search
   - Typical cache hit rates of 40-60% translate to $1,800-2,000/month savings at 10K queries/day

4. **Flexibility**: This pattern shows **three implementation paths**:
   - **LangCache** - Managed service, zero ops, fastest time-to-production
   - **Redis Search** (FT.SEARCH) - Self-hosted, production-ready today, used by RedisVL
   - **Vector Sets** (VADD/VSIM) - Redis 8 native, simpler and faster for new deployments

5. **Observability**: All approaches support filtering/attributes for monitoring cache effectiveness by model, user segment, or query category. LangCache provides built-in dashboards and analytics.

6. **Progressive enhancement**: Start with LangCache for rapid prototyping, migrate to RedisVL if you need custom embeddings, optimize to native Vector Sets if you need sub-2ms latency.

## References

### LangCache (managed service)
- [Redis LangCache overview]({{< relref "/develop/ai/langcache" >}})
- [LangCache API and SDK examples]({{< relref "/develop/ai/langcache/api-examples" >}})
- [LangCache API reference]({{< relref "/develop/ai/langcache/api-reference" >}})
- [LangCache on Redis Cloud]({{< relref "/operate/rc/langcache" >}})

### RedisVL (self-hosted)
- [RedisVL LLM caching]({{< relref "/develop/ai/redisvl/user_guide/llmcache" >}})
- [RedisVL overview]({{< relref "/develop/ai/redisvl" >}})
- [Redis for AI libraries]({{< relref "/integrate/redis-ai-libraries" >}})

### Redis Vector Sets (native)
- [Redis Vector Sets (antirez.com)](https://redis.antirez.com/fundamental/vector-sets.md)
- [Redis Vector Search and AI patterns](https://redis.antirez.com/community/vector-search-ai.md)

### General
- Production semantic caching deployments at AI chat platforms and customer support systems

