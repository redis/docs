---
title: "RAG with hybrid search (vector + metadata filtering)"
linkTitle: "RAG hybrid search"
description: "Retrieval-Augmented Generation using semantic search combined with structured filters"
weight: 105
---

## Pattern: RAG with Hybrid Search

**Intent**: Ground LLM responses in relevant context by retrieving documents using both semantic similarity (vector search) AND structured metadata filters (date ranges, permissions, categories), ensuring retrieved context is both semantically relevant and meets business constraints.

Pure vector search finds semantically similar documents but may return stale content, wrong tenant data, or unauthorized documents. Hybrid search combines "what matches the meaning?" with "what is allowed and current?"

## The abstraction (developer experience)

Use RedisVL to build RAG pipelines with hybrid search capabilities.

```python
from redisvl.extensions.llmcache import SemanticCache
from redisvl.index import SearchIndex
from redisvl.query import VectorQuery
from redisvl.query.filter import Tag, Num, Text

# Define schema for document index
schema = {
    "index": {"name": "docs", "prefix": "doc"},
    "fields": [
        {"name": "content", "type": "text"},
        {"name": "content_vector", "type": "vector",
         "attrs": {"dims": 768, "algorithm": "hnsw", "distance_metric": "cosine"}},
        {"name": "category", "type": "tag"},
        {"name": "user_id", "type": "tag"},
        {"name": "timestamp", "type": "numeric"},
        {"name": "doc_id", "type": "tag"}
    ]
}

# Create index
index = SearchIndex.from_dict(schema)
index.connect("redis://localhost:6379")
index.create(overwrite=True)

# Index documents with embeddings and metadata
def index_document(doc_id, content, embedding, category, user_id, timestamp):
    index.load([{
        "doc_id": doc_id,
        "content": content,
        "content_vector": embedding,
        "category": category,
        "user_id": user_id,
        "timestamp": timestamp
    }])

# RAG retrieval with hybrid search
def rag_retrieve(query_text, query_embedding, user_id, since_timestamp, k=5):
    """Retrieve relevant docs with permission and recency filters"""

    # Build hybrid query: vector similarity + metadata filters
    query = VectorQuery(
        vector=query_embedding,
        vector_field_name="content_vector",
        return_fields=["content", "doc_id", "category", "timestamp"],
        num_results=k,
        filter_expression=(
            (Tag("user_id") == user_id) &  # Permission filter
            (Num("timestamp") >= since_timestamp)  # Recency filter
        )
    )

    results = index.query(query)
    return [{"content": r.content, "doc_id": r.doc_id} for r in results]

# Use in RAG pipeline
def answer_question(question, user_id):
    # Generate query embedding
    query_embedding = embed_model.encode(question)

    # Retrieve relevant context (last 30 days only, user's docs only)
    thirty_days_ago = int(time.time()) - (30 * 86400)
    context_docs = rag_retrieve(question, query_embedding, user_id, thirty_days_ago, k=5)

    # Build LLM prompt with context
    context = "\n\n".join([doc["content"] for doc in context_docs])
    prompt = f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"

    # Generate answer
    return llm.generate(prompt)
```

**Why this works**: RedisVL handles the complexity of combining vector search with metadata filters, preventing agents from writing incorrect filter expressions or missing permission checks.

## The raw commands (machine verification)

If RedisVL fails or you need to debug, use these exact Redis commands to verify state.

### Verify the index schema

```bash
# Check index was created with vector and tag fields
FT.INFO docs
```

**Expected output**: Vector field `content_vector` with HNSW algorithm, tag fields `user_id` and `category`, numeric field `timestamp`.

### Manually execute hybrid search

```bash
# Find top 5 similar documents for user123 from last 30 days
FT.SEARCH docs
  "((@user_id:{user123}) (@timestamp:[1704067200 +inf]))=>[KNN 5 @content_vector $BLOB AS score]"
  PARAMS 2 BLOB <query_embedding_bytes>
  RETURN 4 content doc_id category timestamp
  SORTBY score ASC
  DIALECT 2
```

**What this reveals**:
- `(@user_id:{user123})` - Tag filter for permissions
- `(@timestamp:[1704067200 +inf])` - Numeric range for recency
- `=>[KNN 5 @content_vector $BLOB]` - Vector similarity search
- Order matters: filters applied BEFORE vector search for efficiency

### Debug filter effectiveness

```bash
# How many docs match the filter criteria (before vector search)?
FT.SEARCH docs "(@user_id:{user123}) (@timestamp:[1704067200 +inf])"
  LIMIT 0 0  # Count only, don't return docs
```

If this returns 0 results, the filters are too restrictive - no docs available for vector search.

### Inspect stored documents

```bash
# Check how documents are stored
HGETALL doc:doc123

# Expected fields
# 1) "content"
# 2) "Machine learning is..."
# 3) "content_vector"
# 4) "<binary_vector>"
# 5) "user_id"
# 6) "user123"
# 7) "category"
```

## Production patterns

### Multi-tenant RAG

Prevent cross-tenant data leakage by enforcing tenant filters:

```python
def rag_retrieve_multitenant(query_embedding, tenant_id, user_id, k=5):
    """Enforce both tenant and user isolation"""

    # CRITICAL: Always include tenant_id in filter
    filter_expr = (
        (Tag("tenant_id") == tenant_id) &  # Tenant boundary
        (Tag("user_id") == user_id)        # User permissions
    )

    query = VectorQuery(
        vector=query_embedding,
        vector_field_name="content_vector",
        num_results=k,
        filter_expression=filter_expr
    )

    return index.query(query)
```

**Anti-pattern**: Relying on application-level filtering after retrieval. ALWAYS filter at query time to prevent accidental data leaks.

### Chunking strategy

Chunk long documents for effective retrieval:

```python
def chunk_document(content, chunk_size=500, overlap=50):
    """Split document with overlapping windows"""
    words = content.split()
    chunks = []

    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)

    return chunks

def index_long_document(doc_id, full_content, embedding_model, metadata):
    """Index document as multiple chunks"""
    chunks = chunk_document(full_content)

    for idx, chunk in enumerate(chunks):
        chunk_embedding = embedding_model.encode(chunk)

        index_document(
            doc_id=f"{doc_id}:chunk{idx}",
            content=chunk,
            embedding=chunk_embedding,
            **metadata  # Inherit parent doc metadata
        )
```

**Chunk size trade-offs**:
- **Small chunks (200-300 words)**: More precise matching, but may lose context
- **Large chunks (800-1000 words)**: More context, but noisier matches
- **Sweet spot**: 500 words with 10% overlap for most use cases

### Rerank retrieved results

Vector search returns approximate results. Rerank them for better accuracy:

```python
def rag_with_reranking(question, user_id, k=20, final_k=5):
    """Retrieve more candidates, then rerank"""

    # Step 1: Retrieve 20 candidates (over-fetch)
    query_embedding = embed_model.encode(question)
    candidates = rag_retrieve(question, query_embedding, user_id, k=20)

    # Step 2: Rerank using cross-encoder model
    pairs = [(question, doc["content"]) for doc in candidates]
    rerank_scores = cross_encoder.predict(pairs)

    # Step 3: Return top 5 after reranking
    reranked = sorted(
        zip(candidates, rerank_scores),
        key=lambda x: x[1],
        reverse=True
    )[:final_k]

    return [doc for doc, score in reranked]
```

**Performance impact**: Reranking adds ~50-100ms latency but improves relevance by 20-30%.

### Document versioning

Handle document updates without losing history:

```python
def update_document_version(doc_id, new_content, new_embedding, metadata):
    """Create new version while keeping old versions searchable"""

    # Mark old version as historical
    old_doc_key = f"doc:{doc_id}:current"
    if r.exists(old_doc_key):
        old_version = r.hget(old_doc_key, "version")
        r.hset(f"doc:{doc_id}:v{old_version}", "archived", "true")

    # Index new version
    new_version = int(time.time())
    index_document(
        doc_id=f"{doc_id}:v{new_version}",
        content=new_content,
        embedding=new_embedding,
        version=new_version,
        **metadata
    )

    # Update current pointer
    r.hset(old_doc_key, mapping={"version": new_version, "doc_id": f"{doc_id}:v{new_version}"})
```

### Memory and performance

Estimate index size:

- **1536-dim float32 vector**: 6KB
- **500-word text content**: 2KB
- **Metadata (4 tags, 2 numerics)**: 500 bytes
- **Redis Search overhead**: ~1KB
- **Total per document**: ~9.5KB

For 1 million documents: **~9.5GB**

**HNSW performance** (1M docs, 768 dims):
- **Search latency**: 5-15ms (vs 1-2s for brute force)
- **Recall @ 10**: 95-98% (vs 100% for exact search)
- **Memory**: ~1.5x vector size (for graph structure)

## Use Cases

✅ **Best for**:
- **Customer support**: Answer questions using knowledge base + ticket history
- **Document Q&A**: Search internal docs with department/access filters
- **E-commerce**: Product recommendations with inventory/price filters
- **Legal/Compliance**: Search contracts with jurisdiction/date constraints

❌ **Not suitable for**:
- **Real-time data**: RAG has 100-500ms latency, not for sub-10ms use cases
- **Small document sets**: <1000 docs don't benefit from vector search (use FT.SEARCH full-text instead)
- **Highly structured queries**: SQL better for exact field matching

## Common issues and solutions

### Issue: Low recall (relevant docs not retrieved)

**Diagnosis**:
```bash
# Check if filters are too restrictive
FT.SEARCH docs "(@user_id:{user123})" LIMIT 0 0
# Returns: Total: 5  <-- Only 5 docs available, requesting k=10 won't help
```

**Solution**:
- Relax time filters (90 days instead of 30)
- Expand permission scope (team docs, not just user docs)
- Use hierarchical filtering (try strict first, fall back to relaxed)

### Issue: Retrieved docs aren't semantically relevant

**Diagnosis**: Vector similarity scores are low (<0.7)

**Solution**:
- Improve embedding model (upgrade to larger model)
- Add reranking step
- Tune chunk size (smaller chunks = more precise matching)

### Issue: Slow queries (>100ms)

**Diagnosis**:
```bash
FT.PROFILE docs QUERY "(... hybrid query ...)"
# Shows: Vector scan took 80ms
```

**Solution**:
- Reduce `k` (retrieve fewer candidates)
- Apply filters BEFORE vector search (Redis Search does this automatically)
- Shard index across multiple Redis instances

## Benefits of this pattern

1. **Safety**: RedisVL enforces correct filter syntax and prevents agents from writing queries that leak data across tenants or return unauthorized documents.

2. **Accuracy**: The raw commands (FT.SEARCH, VSIM) let agents debug when retrieval fails:
   - "Are docs being indexed?" → HGETALL doc:123
   - "Do filters match anything?" → FT.SEARCH with LIMIT 0 0
   - "Is vector search working?" → FT.SEARCH without filters

3. **Efficiency**:
   - Hybrid search applies filters BEFORE vector similarity (10-100x faster than post-filtering)
   - HNSW returns results in 5-15ms vs 1-2s for brute force on 1M docs
   - Pipeline architecture enables 1000s of concurrent RAG queries

4. **Flexibility**: This pattern shows **two implementation paths**:
   - **Redis Search** (FT.SEARCH) - Production-ready today, rich filter expressions
   - **Vector Sets** (VSIM) - Redis 8 native, simpler JSON filters, no module

5. **Production-ready**:
   - Multi-tenant isolation built into query structure
   - Chunking strategy for long documents
   - Reranking for precision
   - Document versioning for updates
   - Clear memory and performance characteristics

## Performance Comparison

| Approach | Latency (1M docs) | Recall | Memory |
|----------|-------------------|--------|--------|
| **Pure vector search** | 10-15ms | 95-98% | 9GB |
| **Hybrid (vector + filters)** | 5-10ms | 95-98% | 9GB |
| **Brute force exact** | 1-2s | 100% | 6GB (no index) |
| **Full-text search only** | 2-5ms | 60-70% | 2GB |

Hybrid search is **faster** than pure vector search because filters reduce the search space.

## When to use Redis Search vs Vector Sets

**Use Redis Search (FT.SEARCH) when**:
- You need rich filter expressions like text search, geospatial, or complex boolean logic
- Aggregations are required to count docs by category or time buckets
- You're using Redis 6.2+ or Redis Cloud and not Redis 8 yet

**Use Vector Sets (VSIM) when**:
- You're using Redis 8+ with native Vector Sets support
- You need simple metadata filters like equality or numeric ranges
- You want minimal dependencies with no modules
- You prefer a simpler operational model

## References

- [RedisVL hybrid queries]({{< relref "/develop/ai/redisvl/user_guide/hybrid_queries" >}})
- [RedisVL overview]({{< relref "/develop/ai/redisvl" >}})
- [Redis Search vector similarity](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/vectors/)
- [Redis for AI libraries]({{< relref "/integrate/redis-ai-libraries" >}})
- [Redis Vector Sets (antirez.com)](https://redis.antirez.com/fundamental/vector-sets.md)
- [RAG patterns (antirez.com)](https://redis.antirez.com/community/vector-search-ai.md)
- Production RAG deployments at customer support platforms and document Q&A systems

## Alternative: Redis 8 native Vector Sets (future-proof)

For Redis 8+, use native Vector Sets with JSON filtering instead of Redis Search.

### Store documents with Vector Sets

```bash
# Add document with embedding and JSON metadata
VADD docs:embeddings FP32 <embedding_bytes> "doc:123"
  SETATTR '{"content": "...", "user_id": "user123", "timestamp": 1706648400, "category": "technical"}'
```

### Hybrid search with Vector Sets

```bash
# Find similar docs with user permission and recency filters
VSIM docs:embeddings FP32 <query_embedding> COUNT 5
  WITHSCORES WITHATTRIBS
  FILTER '.user_id == "user123" and .timestamp >= 1704067200'
```

### Python example with Vector Sets

```python
import redis
import numpy as np

r = redis.Redis(decode_responses=False)

def index_doc_vset(doc_id, content, embedding, user_id, category, timestamp):
    """Index document using Vector Sets"""
    import json

    # Store embedding with metadata
    r.execute_command(
        'VADD', 'docs:embeddings', 'FP32', embedding.tobytes(), f'doc:{doc_id}',
        'SETATTR', json.dumps({
            "content": content,
            "user_id": user_id,
            "category": category,
            "timestamp": timestamp
        })
    )

def rag_retrieve_vset(query_embedding, user_id, since_timestamp, k=5):
    """RAG retrieval with Vector Sets hybrid search"""

    # Hybrid search: vector similarity + JSON filter
    results = r.execute_command(
        'VSIM', 'docs:embeddings', 'FP32', query_embedding.tobytes(),
        'COUNT', str(k),
        'WITHSCORES', 'WITHATTRIBS',
        'FILTER', f'.user_id == "{user_id}" and .timestamp >= {since_timestamp}'
    )

    docs = []
    for doc_id, score, attrs in results:
        docs.append({
            "doc_id": doc_id.decode(),
            "content": attrs["content"],
            "score": score
        })

    return docs
```

**Why Vector Sets are simpler**:
- No index schema definition required
- JSON filter expressions more readable than Redis Search syntax
- Native O(log N) performance without module overhead
