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
description: Find semantically similar content using vector embeddings and Redis Search
linkTitle: Vector similarity search
title: How do I implement vector search for semantic similarity?
weight: 2
---

## Problem

You need to find semantically similar content based on meaning rather than exact keyword matches:

- Find similar documents, images, or products
- Implement semantic search for natural language queries
- Build recommendation systems based on embeddings
- Retrieve relevant context for RAG applications
- Search across multiple languages or modalities

Traditional keyword search can't capture semantic relationships between content.

## Solution overview

Redis provides high-performance vector similarity search using the HNSW (Hierarchical Navigable Small World) algorithm:

1. **Generate embeddings** - Convert content to vectors using ML models
2. **Store vectors** - Save embeddings in Redis with metadata
3. **Create vector index** - Define vector field with distance metric
4. **Query by similarity** - Find nearest neighbors using KNN/ANN search

Redis supports multiple distance metrics (cosine, L2, inner product) and can handle millions of vectors with millisecond latency.

**Architecture:**

```
┌──────────────────┐
│  Documents       │
│  - Product desc  │
│  - Articles      │
│  - Images        │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│  Embedding Model         │
│  (OpenAI, Cohere, etc)   │
└────────┬─────────────────┘
         │
         ▼ [0.23, -0.45, 0.67, ...]
┌─────────────────────────────────────────┐
│         Redis Vector Index              │
│  ┌────────────────────────────────────┐ │
│  │ doc:1  [0.23, -0.45, 0.67, ...]    │ │
│  │ doc:2  [0.12, 0.89, -0.34, ...]    │ │
│  │ doc:3  [-0.56, 0.23, 0.91, ...]    │ │
│  │ doc:4  [0.78, -0.12, 0.45, ...]    │ │
│  │ ...                                 │ │
│  └────────────────────────────────────┘ │
│         HNSW Graph Structure            │
└─────────────────────────────────────────┘
         ▲
         │ Query: "red shoes"
         │ Vector: [0.25, -0.43, 0.69, ...]
         │
┌────────┴─────────┐
│  KNN Search      │
│  K=10            │
│  Distance: L2    │
└──────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Top K Results           │
│  1. doc:1 (score: 0.95)  │
│  2. doc:4 (score: 0.89)  │
│  3. doc:3 (score: 0.82)  │
└──────────────────────────┘
```

## Prerequisites

Before implementing this pattern, review:

- [Vector database quick start]({{< relref "/develop/get-started/vector-database" >}}) - Vector search basics
- [Vector search documentation]({{< relref "/develop/ai/search-and-query/query/vector-search" >}}) - Detailed guide
- [RedisVL]({{< relref "/develop/ai/redisvl" >}}) - Python library for vector operations
- [Client library examples]({{< relref "/develop/clients" >}}) - Language-specific vector search

## Implementation

### Step 1: Generate embeddings

Use an embedding model to convert text to vectors. Common options include OpenAI, Cohere, or open-source models.

**Python example with OpenAI:**

```python
import redis
import numpy as np
from openai import OpenAI

# Initialize clients
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
openai_client = OpenAI()

def get_embedding(text, model="text-embedding-3-small"):
    """Generate embedding for text"""
    response = openai_client.embeddings.create(
        input=text,
        model=model
    )
    return response.data[0].embedding

# Example documents
documents = [
    {"id": "doc:1", "text": "Redis is an in-memory database", "category": "database"},
    {"id": "doc:2", "text": "Python is a programming language", "category": "programming"},
    {"id": "doc:3", "text": "Redis supports vector search", "category": "database"}
]

# Generate embeddings
for doc in documents:
    doc["embedding"] = get_embedding(doc["text"])
    print(f"Generated embedding for {doc['id']}: {len(doc['embedding'])} dimensions")
```

**Python example with sentence-transformers (open-source):**

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

for doc in documents:
    doc["embedding"] = model.encode(doc["text"]).tolist()
```

### Step 2: Store vectors in Redis

Store embeddings with metadata using JSON or hashes.

**Using JSON (recommended):**

```python
from redis.commands.json.path import Path

for doc in documents:
    # Convert embedding to bytes for efficient storage
    embedding_bytes = np.array(doc["embedding"], dtype=np.float32).tobytes()
    
    r.json().set(doc["id"], Path.root_path(), {
        "text": doc["text"],
        "category": doc["category"],
        "embedding": embedding_bytes.hex()  # Store as hex string
    })
```

**Using hashes (alternative):**

```python
for doc in documents:
    embedding_bytes = np.array(doc["embedding"], dtype=np.float32).tobytes()
    
    r.hset(doc["id"], mapping={
        "text": doc["text"],
        "category": doc["category"],
        "embedding": embedding_bytes
    })
```

### Step 3: Create vector index

Define a vector index with the appropriate algorithm and distance metric.

```python
from redis.commands.search.field import VectorField, TextField, TagField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType

# Define vector field (adjust dimensions based on your model)
VECTOR_DIM = 1536  # For OpenAI text-embedding-3-small
# VECTOR_DIM = 384  # For all-MiniLM-L6-v2

schema = (
    TextField("$.text", as_name="text"),
    TagField("$.category", as_name="category"),
    VectorField(
        "$.embedding",
        "FLAT",  # or "HNSW" for larger datasets
        {
            "TYPE": "FLOAT32",
            "DIM": VECTOR_DIM,
            "DISTANCE_METRIC": "COSINE"  # or "L2", "IP"
        },
        as_name="embedding"
    )
)

# Create index
index_def = IndexDefinition(prefix=["doc:"], index_type=IndexType.JSON)

try:
    r.ft("idx:docs").create_index(schema, definition=index_def)
    print("Vector index created")
except Exception as e:
    print(f"Index error: {e}")
```

**For larger datasets, use HNSW:**

```python
VectorField(
    "$.embedding",
    "HNSW",
    {
        "TYPE": "FLOAT32",
        "DIM": VECTOR_DIM,
        "DISTANCE_METRIC": "COSINE",
        "M": 16,              # Number of connections per node
        "EF_CONSTRUCTION": 200  # Size of dynamic candidate list
    },
    as_name="embedding"
)
```

### Step 4: Perform vector search

Query for similar vectors using KNN search.

**Python example:**

```python
from redis.commands.search.query import Query

def search_similar(query_text, k=5):
    """Find k most similar documents"""
    # Generate query embedding
    query_embedding = get_embedding(query_text)
    query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()
    
    # Create KNN query
    query = (
        Query(f"*=>[KNN {k} @embedding $vec AS score]")
        .return_fields("text", "category", "score")
        .sort_by("score")
        .dialect(2)
    )
    
    # Execute search
    results = r.ft("idx:docs").search(
        query,
        query_params={"vec": query_bytes}
    )
    
    return results

# Search for similar documents
results = search_similar("database for caching", k=3)

for doc in results.docs:
    print(f"Score: {doc.score:.4f} - {doc.text}")
```

**With filters:**

```python
def search_similar_filtered(query_text, category, k=5):
    """Find similar documents in a specific category"""
    query_embedding = get_embedding(query_text)
    query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()
    
    # Combine vector search with filter
    query = (
        Query(f"@category:{{{category}}}=>[KNN {k} @embedding $vec AS score]")
        .return_fields("text", "category", "score")
        .sort_by("score")
        .dialect(2)
    )
    
    results = r.ft("idx:docs").search(
        query,
        query_params={"vec": query_bytes}
    )
    
    return results

# Search only in database category
results = search_similar_filtered("fast data storage", "database", k=3)
```

**Node.js example:**

```javascript
import { createClient } from 'redis';
import { SchemaFieldTypes, VectorAlgorithms } from 'redis';

const client = await createClient().connect();

// Create vector index
await client.ft.create('idx:docs', {
  '$.text': { type: SchemaFieldTypes.TEXT, AS: 'text' },
  '$.category': { type: SchemaFieldTypes.TAG, AS: 'category' },
  '$.embedding': {
    type: SchemaFieldTypes.VECTOR,
    ALGORITHM: VectorAlgorithms.FLAT,
    TYPE: 'FLOAT32',
    DIM: 1536,
    DISTANCE_METRIC: 'COSINE',
    AS: 'embedding'
  }
}, {
  ON: 'JSON',
  PREFIX: 'doc:'
});

// Search
const queryEmbedding = await getEmbedding(queryText);
const queryBuffer = Buffer.from(new Float32Array(queryEmbedding).buffer);

const results = await client.ft.search('idx:docs', 
  '*=>[KNN 5 @embedding $vec AS score]',
  {
    PARAMS: { vec: queryBuffer },
    RETURN: ['text', 'score'],
    SORTBY: 'score',
    DIALECT: 2
  }
);
```

## Redis Cloud setup

When deploying vector search to Redis Cloud:

1. **Choose algorithm** - FLAT for <10K vectors, HNSW for larger datasets
2. **Tune HNSW parameters** - Higher M and EF_CONSTRUCTION improve recall but use more memory
3. **Monitor memory** - Vectors consume significant memory (4 bytes × dimensions per vector)
4. **Batch indexing** - For large datasets, add vectors in batches
5. **Use appropriate distance metric** - COSINE for normalized vectors, L2 for Euclidean distance

Example configuration:
- **Memory**: ~4KB per 1000-dim vector + index overhead
- **Algorithm**: HNSW for >10K vectors
- **M**: 16-40 (higher = better recall, more memory)
- **EF_CONSTRUCTION**: 200-400 (higher = better index quality, slower indexing)
- **Distance metric**: COSINE (most common for embeddings)

## Common pitfalls

1. **Wrong vector dimensions** - Must match embedding model exactly
2. **Not normalizing vectors** - Use COSINE distance for normalized vectors
3. **Using FLAT for large datasets** - Switch to HNSW for >10K vectors
4. **Incorrect byte conversion** - Use FLOAT32, not FLOAT64
5. **Missing dialect 2** - Required for KNN syntax

## Related patterns

- [Hybrid search]({{< relref "/develop/patterns/queries/hybrid-search" >}}) - Combine vector and keyword search
- [RAG pipelines]({{< relref "/develop/patterns/ai/rag-pipeline" >}}) - Use vectors for retrieval
- [Semantic caching]({{< relref "/develop/patterns/ai/semantic-caching" >}}) - Cache by similarity
- [JSON document queries]({{< relref "/develop/patterns/queries/json-document-queries" >}}) - Store vector metadata

## More information

- [Vector database quick start]({{< relref "/develop/get-started/vector-database" >}})
- [Vector search guide]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
- [RedisVL documentation]({{< relref "/develop/ai/redisvl" >}})
- [FT.SEARCH command]({{< relref "/commands/ft.search" >}})
- [Python vector search examples]({{< relref "/develop/clients/redis-py/vecsearch" >}})
- [Node.js vector search examples]({{< relref "/develop/clients/nodejs/vecsearch" >}})

