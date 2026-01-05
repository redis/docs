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
description: Combine semantic vector search with keyword filtering for best results
linkTitle: Hybrid search
title: How do I combine vector and keyword search?
weight: 3
---

## Problem

You need search results that combine:

- Semantic similarity (meaning-based matching)
- Exact keyword matches (specific terms or filters)
- Structured filters (category, price range, date)
- Relevance ranking that considers both semantic and lexical signals

Pure vector search may miss important exact matches, while pure keyword search misses semantic relationships.

## Solution overview

Redis supports hybrid search by combining vector similarity with traditional filters in a single query:

1. **Pre-filtering** - Apply filters before vector search (recommended)
2. **Post-filtering** - Apply filters after vector search
3. **Re-ranking** - Combine scores from multiple signals
4. **Hybrid scoring** - Weight semantic vs lexical relevance

The key is using Redis Search's ability to combine vector KNN with tag, numeric, and text filters.

**Architecture:**

```
User Query: "comfortable running shoes under $100"
     │
     ├──────────────────┬──────────────────┐
     │                  │                  │
     ▼                  ▼                  ▼
┌──────────┐    ┌──────────────┐   ┌──────────┐
│ Semantic │    │   Keyword    │   │ Filters  │
│ Vector   │    │   "running"  │   │ price<100│
│ Embed    │    │   "shoes"    │   │ inStock  │
└────┬─────┘    └──────┬───────┘   └────┬─────┘
     │                 │                 │
     └─────────────────┴─────────────────┘
                       │
                       ▼
     ┌─────────────────────────────────────────┐
     │  Redis Hybrid Search Query              │
     │                                         │
     │  (@category:{shoes}                     │
     │   @price:[0 100]                        │
     │   @inStock:{true})                      │
     │  =>                                     │
     │  [KNN 10 @embedding $vec]               │
     │  RETURN title price score               │
     └─────────────────────────────────────────┘
                       │
                       ▼
     ┌─────────────────────────────────────────┐
     │  Search Process                         │
     │                                         │
     │  1. Pre-filter: category=shoes,         │
     │     price<100, inStock=true             │
     │     (Reduces search space)              │
     │                                         │
     │  2. Vector search: Find 10 most         │
     │     similar within filtered set         │
     │                                         │
     │  3. Keyword boost: Boost docs with      │
     │     "running" in title/description      │
     └─────────────────────────────────────────┘
                       │
                       ▼
     ┌─────────────────────────────────────────┐
     │  Ranked Results                         │
     │  1. Nike Air Zoom - $89 (0.95)          │
     │  2. Adidas Ultraboost - $99 (0.92)      │
     │  3. New Balance 880 - $85 (0.89)        │
     └─────────────────────────────────────────┘

Benefits:
  - Semantic understanding + exact filters
  - Single query (no multiple round trips)
  - Efficient pre-filtering
  - Combined relevance scoring
```

## Prerequisites

Before implementing this pattern, review:

- [Vector similarity search]({{< relref "/develop/patterns/queries/vector-similarity-search" >}}) - Vector search basics
- [JSON document queries]({{< relref "/develop/patterns/queries/json-document-queries" >}}) - Keyword search and filters
- [Vector search documentation]({{< relref "/develop/ai/search-and-query/query/vector-search" >}}) - Hybrid query syntax
- [Combined queries]({{< relref "/develop/ai/search-and-query/query/combined" >}}) - Combining query types

## Implementation

### Step 1: Create index with both vector and keyword fields

Define an index that supports both vector and traditional search.

**Python example:**

```python
import redis
import numpy as np
from redis.commands.search.field import VectorField, TextField, TagField, NumericField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

VECTOR_DIM = 1536  # OpenAI embedding dimension

schema = (
    TextField("$.title", as_name="title"),
    TextField("$.description", as_name="description"),
    TagField("$.category", as_name="category"),
    TagField("$.tags[*]", as_name="tags"),
    NumericField("$.price", as_name="price"),
    NumericField("$.rating", as_name="rating"),
    VectorField(
        "$.embedding",
        "HNSW",
        {
            "TYPE": "FLOAT32",
            "DIM": VECTOR_DIM,
            "DISTANCE_METRIC": "COSINE",
            "M": 16,
            "EF_CONSTRUCTION": 200
        },
        as_name="embedding"
    )
)

index_def = IndexDefinition(prefix=["product:"], index_type=IndexType.JSON)
r.ft("idx:products").create_index(schema, definition=index_def)
```

### Step 2: Pre-filtering (recommended approach)

Apply filters before vector search to reduce the search space.

**Python example:**

```python
from redis.commands.search.query import Query

def hybrid_search_prefilter(query_text, category=None, min_price=None, max_price=None, k=10):
    """Hybrid search with pre-filtering"""
    # Generate query embedding
    query_embedding = get_embedding(query_text)
    query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()
    
    # Build filter expression
    filters = []
    if category:
        filters.append(f"@category:{{{category}}}")
    if min_price is not None and max_price is not None:
        filters.append(f"@price:[{min_price} {max_price}]")
    
    # Combine filters with vector search
    filter_expr = " ".join(filters) if filters else "*"
    query_str = f"{filter_expr}=>[KNN {k} @embedding $vec AS score]"
    
    query = (
        Query(query_str)
        .return_fields("title", "description", "category", "price", "score")
        .sort_by("score")
        .dialect(2)
    )
    
    results = r.ft("idx:products").search(
        query,
        query_params={"vec": query_bytes}
    )
    
    return results

# Search for electronics under $500
results = hybrid_search_prefilter(
    "wireless headphones with noise cancellation",
    category="Electronics",
    min_price=0,
    max_price=500,
    k=10
)

for doc in results.docs:
    print(f"{doc.title} - ${doc.price} (score: {doc.score})")
```

### Step 3: Combining vector search with text search

Combine semantic similarity with keyword matching.

**Python example:**

```python
def hybrid_text_vector_search(query_text, keywords=None, k=10):
    """Combine text search with vector search"""
    query_embedding = get_embedding(query_text)
    query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()
    
    # Build text filter
    if keywords:
        # Search for keywords in title or description
        text_filter = f"(@title:{keywords}|@description:{keywords})"
    else:
        text_filter = "*"
    
    query_str = f"{text_filter}=>[KNN {k} @embedding $vec AS score]"
    
    query = (
        Query(query_str)
        .return_fields("title", "description", "score")
        .sort_by("score")
        .dialect(2)
    )
    
    results = r.ft("idx:products").search(
        query,
        query_params={"vec": query_bytes}
    )
    
    return results

# Find products semantically similar to query that also mention "bluetooth"
results = hybrid_text_vector_search(
    "portable audio device",
    keywords="bluetooth",
    k=10
)
```

### Step 4: Multi-filter hybrid search

Combine multiple filter types with vector search.

**Python example:**

```python
def advanced_hybrid_search(
    query_text,
    categories=None,
    tags=None,
    min_rating=None,
    price_range=None,
    k=10
):
    """Advanced hybrid search with multiple filters"""
    query_embedding = get_embedding(query_text)
    query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()
    
    filters = []
    
    # Category filter (OR logic)
    if categories:
        cat_filter = "|".join(categories)
        filters.append(f"@category:{{{cat_filter}}}")
    
    # Tags filter (AND logic)
    if tags:
        for tag in tags:
            filters.append(f"@tags:{{{tag}}}")
    
    # Rating filter
    if min_rating:
        filters.append(f"@rating:[{min_rating} +inf]")
    
    # Price range filter
    if price_range:
        min_p, max_p = price_range
        filters.append(f"@price:[{min_p} {max_p}]")
    
    # Combine all filters
    filter_expr = " ".join(filters) if filters else "*"
    query_str = f"{filter_expr}=>[KNN {k} @embedding $vec AS score]"
    
    query = (
        Query(query_str)
        .return_fields("title", "category", "tags", "price", "rating", "score")
        .sort_by("score")
        .dialect(2)
    )
    
    results = r.ft("idx:products").search(
        query,
        query_params={"vec": query_bytes}
    )
    
    return results

# Complex hybrid search
results = advanced_hybrid_search(
    query_text="comfortable running gear",
    categories=["Sports", "Fitness"],
    tags=["athletic", "breathable"],
    min_rating=4.0,
    price_range=(50, 200),
    k=10
)
```

### Step 5: Re-ranking with multiple signals

Combine vector similarity with other relevance signals.

**Python example:**

```python
def hybrid_search_with_reranking(query_text, category=None, k=20):
    """Hybrid search with custom re-ranking"""
    # Get initial results (fetch more than needed)
    query_embedding = get_embedding(query_text)
    query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()
    
    filter_expr = f"@category:{{{category}}}" if category else "*"
    query_str = f"{filter_expr}=>[KNN {k} @embedding $vec AS vector_score]"
    
    query = (
        Query(query_str)
        .return_fields("title", "description", "price", "rating", "vector_score")
        .dialect(2)
    )
    
    results = r.ft("idx:products").search(
        query,
        query_params={"vec": query_bytes}
    )
    
    # Re-rank based on multiple signals
    scored_results = []
    for doc in results.docs:
        # Combine vector score with other signals
        vector_score = float(doc.vector_score)
        rating_score = float(doc.rating) / 5.0  # Normalize to 0-1
        
        # Weighted combination
        final_score = (
            0.7 * (1 - vector_score) +  # Vector similarity (inverted distance)
            0.3 * rating_score           # Product rating
        )
        
        scored_results.append((doc, final_score))
    
    # Sort by final score
    scored_results.sort(key=lambda x: x[1], reverse=True)
    
    return scored_results[:10]  # Return top 10

# Search with re-ranking
results = hybrid_search_with_reranking(
    "high quality headphones",
    category="Electronics",
    k=20
)

for doc, score in results:
    print(f"{doc.title} - Rating: {doc.rating} (final score: {score:.4f})")
```

### Step 6: Range queries with vector search

Combine numeric range queries with vector similarity.

**Python example:**

```python
def search_by_price_and_similarity(query_text, budget, k=10):
    """Find similar products within budget"""
    query_embedding = get_embedding(query_text)
    query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()
    
    # Search within price range
    query_str = f"@price:[0 {budget}]=>[KNN {k} @embedding $vec AS score]"
    
    query = (
        Query(query_str)
        .return_fields("title", "price", "score")
        .sort_by("score")
        .dialect(2)
    )
    
    results = r.ft("idx:products").search(
        query,
        query_params={"vec": query_bytes}
    )
    
    return results

# Find similar products under $100
results = search_by_price_and_similarity("laptop bag", budget=100, k=10)
```

## Redis Cloud setup

When deploying hybrid search to Redis Cloud:

1. **Index all searchable fields** - Both vector and keyword fields
2. **Use pre-filtering** - More efficient than post-filtering
3. **Tune K parameter** - Fetch more results if re-ranking
4. **Monitor query performance** - Use FT.PROFILE to analyze
5. **Consider EF_RUNTIME** - Tune HNSW search quality vs speed

Example configuration:
- **K value**: 10-50 depending on re-ranking needs
- **EF_RUNTIME**: 10-200 (higher = better recall, slower)
- **Filters**: Use TAG for exact match, TEXT for full-text
- **Re-ranking**: Fetch 2-5x more results than final output

## Common pitfalls

1. **Post-filtering instead of pre-filtering** - Less efficient
2. **Not using dialect 2** - Required for hybrid query syntax
3. **Wrong filter syntax** - TAG uses `{value}`, TEXT uses `value`
4. **Fetching too few results** - Increase K if re-ranking
5. **Not normalizing scores** - Combine scores on same scale

## Related patterns

- [Vector similarity search]({{< relref "/develop/patterns/queries/vector-similarity-search" >}}) - Pure vector search
- [JSON document queries]({{< relref "/develop/patterns/queries/json-document-queries" >}}) - Keyword search
- [RAG pipelines]({{< relref "/develop/patterns/ai/rag-pipeline" >}}) - Use hybrid search for retrieval

## More information

- [Vector search documentation]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
- [Combined queries]({{< relref "/develop/ai/search-and-query/query/combined" >}})
- [FT.SEARCH command]({{< relref "/commands/ft.search" >}})
- [Query syntax]({{< relref "/develop/ai/search-and-query/query" >}})

