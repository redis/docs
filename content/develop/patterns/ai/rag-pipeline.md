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
description: Build Retrieval Augmented Generation pipelines with Redis vector search
linkTitle: RAG pipelines
title: How do I build a RAG pipeline?
weight: 4
---

## Problem

You need to build a RAG (Retrieval Augmented Generation) system that:

- Retrieves relevant context from a knowledge base
- Augments LLM prompts with retrieved information
- Generates accurate, context-aware responses
- Handles large document collections efficiently
- Supports hybrid search (semantic + keyword)

LLMs alone can't access your proprietary data or recent information.

## Solution overview

Redis provides a complete RAG pipeline with:

1. **Vector storage** - Store document embeddings
2. **Hybrid search** - Combine semantic and keyword search
3. **Metadata filtering** - Filter by document properties
4. **Semantic caching** - Cache LLM responses
5. **Session management** - Track conversation history

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    RAG Pipeline                             │
└─────────────────────────────────────────────────────────────┘

1. INGESTION PHASE
   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │  Documents   │─────▶│   Chunking   │─────▶│  Embeddings  │
   │  (PDF, MD)   │      │  (500 chars) │      │   (OpenAI)   │
   └──────────────┘      └──────────────┘      └──────┬───────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Redis Vector   │
                                              │     Index       │
                                              └─────────────────┘

2. QUERY PHASE
   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │ User Query   │─────▶│  Embedding   │─────▶│ Vector Search│
   │ "How to...?" │      │  Generation  │      │  (Hybrid)    │
   └──────────────┘      └──────────────┘      └──────┬───────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │ Top K Chunks    │
                                              │ (Context)       │
                                              └────────┬────────┘
                                                       │
3. GENERATION PHASE                                    │
   ┌──────────────┐      ┌──────────────┐            │
   │   Prompt     │◀─────│   Context    │◀───────────┘
   │  Template    │      │  Injection   │
   └──────┬───────┘      └──────────────┘
          │
          ▼
   ┌──────────────┐      ┌──────────────┐
   │     LLM      │─────▶│   Response   │
   │  (GPT-4)     │      │   + Cache    │
   └──────────────┘      └──────────────┘
```

## Prerequisites

Before implementing this pattern, review:

- [RAG with Redis]({{< relref "/develop/get-started/rag" >}}) - RAG overview
- [Vector similarity search]({{< relref "/develop/patterns/queries/vector-similarity-search" >}}) - Vector search basics
- [Hybrid search]({{< relref "/develop/patterns/queries/hybrid-search" >}}) - Combined queries
- [Semantic caching]({{< relref "/develop/patterns/ai/semantic-caching" >}}) - Cache LLM responses

## Implementation

### Step 1: Ingest and embed documents

Chunk documents and create embeddings.

**Python example:**

```python
import redis
from redis.commands.json.path import Path
from redis.commands.search.field import VectorField, TextField, TagField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
import numpy as np
from openai import OpenAI

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
openai_client = OpenAI()

def chunk_document(text, chunk_size=500, overlap=50):
    """Split document into overlapping chunks"""
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    
    return chunks

def embed_text(text):
    """Generate embedding for text"""
    response = openai_client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def ingest_document(doc_id, title, content, metadata=None):
    """Ingest document into Redis"""
    metadata = metadata or {}
    
    # Chunk document
    chunks = chunk_document(content)
    
    for i, chunk in enumerate(chunks):
        chunk_id = f"doc:{doc_id}:chunk:{i}"
        
        # Generate embedding
        embedding = embed_text(chunk)
        embedding_bytes = np.array(embedding, dtype=np.float32).tobytes()
        
        # Store chunk with metadata
        r.json().set(chunk_id, Path.root_path(), {
            "doc_id": doc_id,
            "chunk_id": i,
            "title": title,
            "content": chunk,
            "embedding": embedding_bytes.hex(),
            "category": metadata.get("category", "general"),
            "source": metadata.get("source", "unknown"),
            "timestamp": metadata.get("timestamp", "")
        })
    
    return len(chunks)

# Ingest documents
chunks = ingest_document(
    "doc1",
    "Redis Vector Search Guide",
    "Redis provides high-performance vector similarity search...",
    {"category": "documentation", "source": "redis.io"}
)
print(f"Ingested {chunks} chunks")
```

### Step 2: Create vector index

Index documents for hybrid search.

**Python example:**

```python
VECTOR_DIM = 1536  # text-embedding-3-small

schema = (
    TextField("$.title", as_name="title"),
    TextField("$.content", as_name="content"),
    TagField("$.category", as_name="category"),
    TagField("$.source", as_name="source"),
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

index_def = IndexDefinition(prefix=["doc:"], index_type=IndexType.JSON)
r.ft("idx:docs").create_index(schema, definition=index_def)
```

### Step 3: Retrieve relevant context

Search for relevant chunks using hybrid search.

**Python example:**

```python
from redis.commands.search.query import Query

def retrieve_context(query, k=5, category=None):
    """Retrieve relevant document chunks"""
    # Generate query embedding
    query_embedding = embed_text(query)
    query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()
    
    # Build filter
    filter_expr = f"@category:{{{category}}}" if category else "*"
    query_str = f"{filter_expr}=>[KNN {k} @embedding $vec AS score]"
    
    # Search
    search_query = (
        Query(query_str)
        .return_fields("title", "content", "doc_id", "score")
        .sort_by("score")
        .dialect(2)
    )
    
    results = r.ft("idx:docs").search(
        search_query,
        query_params={"vec": query_bytes}
    )
    
    # Format context
    context_chunks = []
    for doc in results.docs:
        context_chunks.append({
            "title": doc.title,
            "content": doc.content,
            "score": float(doc.score)
        })
    
    return context_chunks
```

### Step 4: Generate response with LLM

Augment prompt with retrieved context.

**Python example:**

```python
def generate_rag_response(user_query, category=None):
    """Generate response using RAG"""
    # Retrieve relevant context
    context_chunks = retrieve_context(user_query, k=3, category=category)
    
    # Build context string
    context = "\n\n".join([
        f"[{chunk['title']}]\n{chunk['content']}"
        for chunk in context_chunks
    ])
    
    # Create augmented prompt
    prompt = f"""Answer the question based on the following context. If the context doesn't contain relevant information, say so.

Context:
{context}

Question: {user_query}

Answer:"""
    
    # Generate response
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that answers questions based on the provided context."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )
    
    answer = response.choices[0].message.content
    
    return {
        "answer": answer,
        "sources": [chunk['title'] for chunk in context_chunks],
        "context_chunks": context_chunks
    }

# Generate response
result = generate_rag_response("How does Redis vector search work?")
print(f"Answer: {result['answer']}")
print(f"Sources: {result['sources']}")
```

### Step 5: Add conversation history

Track conversation context for multi-turn dialogues.

**Python example:**

```python
def generate_conversational_rag(user_query, session_id, category=None):
    """Generate response with conversation history"""
    # Get conversation history
    history_key = f"session:{session_id}:history"
    history = r.lrange(history_key, 0, 4)  # Last 5 messages
    history.reverse()
    
    # Retrieve context
    context_chunks = retrieve_context(user_query, k=3, category=category)
    context = "\n\n".join([
        f"[{chunk['title']}]\n{chunk['content']}"
        for chunk in context_chunks
    ])
    
    # Build messages with history
    messages = [
        {"role": "system", "content": f"You are a helpful assistant. Use this context to answer questions:\n\n{context}"}
    ]
    
    # Add conversation history
    for msg in history:
        import json
        msg_data = json.loads(msg)
        messages.append(msg_data)
    
    # Add current query
    messages.append({"role": "user", "content": user_query})
    
    # Generate response
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        temperature=0.7
    )
    
    answer = response.choices[0].message.content
    
    # Store in history
    import json
    r.lpush(history_key, json.dumps({"role": "user", "content": user_query}))
    r.lpush(history_key, json.dumps({"role": "assistant", "content": answer}))
    r.expire(history_key, 3600)  # 1 hour TTL
    
    return {
        "answer": answer,
        "sources": [chunk['title'] for chunk in context_chunks]
    }
```

### Step 6: Re-ranking for better results

Re-rank retrieved chunks for improved relevance.

**Python example:**

```python
def retrieve_with_reranking(query, k=10, top_n=3):
    """Retrieve and re-rank results"""
    # Initial retrieval (get more than needed)
    initial_results = retrieve_context(query, k=k)
    
    # Re-rank using cross-encoder or keyword matching
    def calculate_relevance_score(chunk, query):
        # Simple keyword-based re-ranking
        query_terms = set(query.lower().split())
        content_terms = set(chunk['content'].lower().split())
        
        # Jaccard similarity
        intersection = len(query_terms & content_terms)
        union = len(query_terms | content_terms)
        keyword_score = intersection / union if union > 0 else 0
        
        # Combine with vector score
        vector_score = 1 - chunk['score']  # Convert distance to similarity
        
        return 0.7 * vector_score + 0.3 * keyword_score
    
    # Re-rank
    for chunk in initial_results:
        chunk['relevance_score'] = calculate_relevance_score(chunk, query)
    
    # Sort by relevance
    reranked = sorted(initial_results, key=lambda x: x['relevance_score'], reverse=True)
    
    return reranked[:top_n]
```

## Redis Cloud setup

When deploying RAG to Redis Cloud:

1. **Plan vector dimensions** - Match your embedding model
2. **Tune HNSW parameters** - Balance recall vs performance
3. **Use metadata filters** - Reduce search space
4. **Implement caching** - Cache frequent queries
5. **Monitor performance** - Track retrieval latency

Example configuration:
- **Vector dim**: 1536 (OpenAI), 768 (sentence-transformers)
- **HNSW M**: 16-40
- **EF_CONSTRUCTION**: 200-400
- **Top K**: 3-10 chunks typical
- **Chunk size**: 300-1000 tokens

## Common pitfalls

1. **Chunks too large** - Reduces retrieval precision
2. **No overlap** - Loses context at boundaries
3. **Not filtering** - Returns irrelevant results
4. **Missing re-ranking** - Lower quality results
5. **No caching** - Repeated LLM calls expensive

## Related patterns

- [Vector similarity search]({{< relref "/develop/patterns/queries/vector-similarity-search" >}}) - Vector search
- [Hybrid search]({{< relref "/develop/patterns/queries/hybrid-search" >}}) - Combined queries
- [Semantic caching]({{< relref "/develop/patterns/ai/semantic-caching" >}}) - Cache responses
- [Agent memory]({{< relref "/develop/patterns/ai/agent-memory" >}}) - Conversation history

## More information

- [RAG with Redis]({{< relref "/develop/get-started/rag" >}})
- [Vector database guide]({{< relref "/develop/get-started/vector-database" >}})
- [RedisVL]({{< relref "/develop/ai/redisvl" >}})
- [LangChain integration](https://python.langchain.com/docs/integrations/vectorstores/redis/)
- [LlamaIndex integration](https://docs.llamaindex.ai/en/latest/examples/vector_stores/RedisIndexDemo/)

