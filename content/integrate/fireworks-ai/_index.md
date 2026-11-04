---
LinkTitle: Fireworks AI
Title: Redis with Fireworks AI
categories:
- docs
- integrate
- oss
- rs
- rc
description: Build a retrieval-augmented generation application with Fireworks AI and Redis.
group: ai
stack: true
summary: Use Redis as the retrieval layer for retrieval-augmented generation (RAG) applications that use Fireworks AI models.
type: integration
weight: 30
---
Use Redis as the retrieval layer for retrieval-augmented generation (RAG) applications powered by [Fireworks AI](https://fireworks.ai/).

Fireworks AI provides OpenAI-compatible application programming interfaces (APIs) for embeddings and text generation. Redis stores document chunks, vector embeddings, and metadata in the same database and retrieves relevant context with vector search. You can also rerank the Redis results with a Fireworks reranking model before sending them to the generative model.

In this architecture:

1. Fireworks converts document chunks into vector embeddings.
2. Redis stores and indexes the chunks, embeddings, and metadata.
3. At query time, Fireworks embeds the user's question.
4. Redis retrieves the most relevant chunks with vector search and optional metadata filters.
5. Fireworks optionally reranks the candidates and generates an answer from the retrieved context.

## Prerequisites

You need:

- A Redis database with search capabilities. You can create a free database with [Redis Cloud](https://redis.io/try-free/).
- A [Fireworks AI account and API key](https://docs.fireworks.ai/getting-started/quickstart).
- Python 3.10 or later.

Install the required packages:

```bash
pip install "redisvl>=0.18" "openai>=1.0" requests
```

Set the connection details in environment variables:

```bash
export REDIS_URL="redis://localhost:6379"
export FIREWORKS_API_KEY="<your-fireworks-api-key>"
```

For Redis Cloud, copy the connection URL from the database's **Connect** dialog. Use a `rediss://` URL when Transport Layer Security (TLS) is enabled.

## Create the clients

Fireworks exposes an OpenAI-compatible endpoint, so you can use the OpenAI Python client for both embeddings and chat completions.

```python
import os

from openai import OpenAI
from redisvl.index import SearchIndex

fireworks = OpenAI(
    api_key=os.environ["FIREWORKS_API_KEY"],
    base_url="https://api.fireworks.ai/inference/v1",
)

REDIS_URL = os.environ["REDIS_URL"]
EMBEDDING_MODEL = "fireworks/qwen3-embedding-8b"
EMBEDDING_DIM = 768
CHAT_MODEL = os.getenv(
    "FIREWORKS_CHAT_MODEL",
    "accounts/fireworks/models/glm-5p3-flash",
)
```

The Qwen3 embedding model supports shortened vectors through the `dimensions` parameter. The vector field in Redis must use the same dimension as the vectors returned by Fireworks.

## Create a vector index

The following schema stores documents as JavaScript Object Notation (JSON). It indexes the document text for lexical search, metadata for filtering, and a Hierarchical Navigable Small World (HNSW) vector field for approximate nearest-neighbor search.

```python
schema = {
    "index": {
        "name": "idx:fireworks-rag",
        "prefix": "fireworks-rag:doc:",
        "storage_type": "json",
    },
    "fields": [
        {"name": "id", "type": "tag"},
        {"name": "title", "type": "text"},
        {"name": "content", "type": "text"},
        {"name": "source", "type": "tag"},
        {
            "name": "embedding",
            "type": "vector",
            "attrs": {
                "algorithm": "hnsw",
                "datatype": "float32",
                "dims": EMBEDDING_DIM,
                "distance_metric": "cosine",
            },
        },
    ],
}

index = SearchIndex.from_dict(schema, redis_url=REDIS_URL)
if not index.exists():
    index.create()
```

HNSW is a good default for production collections where low-latency approximate search is preferred. For a small collection where exact results matter more than search latency, use `flat` instead.

## Embed and load documents

Split source documents into chunks before indexing them. A chunk size of roughly 200 to 500 tokens is a useful starting point, but you should evaluate chunking against your own documents and queries.

This example uses three short chunks:

```python
documents = [
    {
        "id": "vector-search",
        "title": "Vector search",
        "source": "https://redis.io/docs/latest/develop/ai/search-and-query/vectors/",
        "content": (
            "Redis supports vector similarity search with FLAT and HNSW indexes. "
            "Vector queries can be combined with filters over document metadata."
        ),
    },
    {
        "id": "redisvl",
        "title": "RedisVL",
        "source": "https://redis.io/docs/latest/develop/ai/redisvl/",
        "content": (
            "RedisVL is a Python client library for building AI applications "
            "with Redis, including vector search and retrieval workflows."
        ),
    },
    {
        "id": "rag",
        "title": "RAG with Redis",
        "source": "https://redis.io/docs/latest/develop/get-started/rag/",
        "content": (
            "A RAG pipeline retrieves relevant information from Redis, adds it "
            "to the model prompt, and generates an answer grounded in that context."
        ),
    },
]

embedding_response = fireworks.embeddings.create(
    model=EMBEDDING_MODEL,
    input=[document["content"] for document in documents],
    dimensions=EMBEDDING_DIM,
)

embeddings = sorted(embedding_response.data, key=lambda item: item.index)
for document, embedding in zip(documents, embeddings):
    document["embedding"] = embedding.embedding

index.load(documents, id_field="id")
```

In a production ingestion job, batch embedding and Redis write operations rather than processing one chunk at a time. Store enough metadata with each chunk to support access controls, filters, and source attribution.

## Retrieve context and generate an answer

Embed the question with the same model and dimensions used for the indexed documents. Then use a Redis vector query to retrieve candidate chunks.

```python
from redisvl.query import VectorQuery


def embed_query(question: str) -> list[float]:
    response = fireworks.embeddings.create(
        model=EMBEDDING_MODEL,
        input=question,
        dimensions=EMBEDDING_DIM,
    )
    return response.data[0].embedding


def retrieve(question: str, limit: int = 8) -> list[dict]:
    query = VectorQuery(
        vector=embed_query(question),
        vector_field_name="embedding",
        return_fields=["id", "title", "content", "source", "vector_distance"],
        num_results=limit,
    )
    return index.query(query)


def answer(question: str) -> str:
    matches = retrieve(question)
    context = "\n\n".join(
        f"[{position}] {item['title']}\n"
        f"Source: {item['source']}\n"
        f"{item['content']}"
        for position, item in enumerate(matches, start=1)
    )

    response = fireworks.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "Answer using only the supplied context. "
                    "If the context is insufficient, say so. "
                    "Cite supporting passages with bracketed numbers such as [1]."
                ),
            },
            {
                "role": "user",
                "content": f"Question: {question}\n\nContext:\n{context}",
            },
        ],
        temperature=0,
    )
    return response.choices[0].message.content


print(answer("How does Redis support a RAG application?"))
```

The Redis query returns only the fields needed to build the prompt. Keeping the return set small reduces network traffic and prompt-building overhead.

## Optional: rerank the retrieved chunks

Vector search is an efficient first-stage retriever. For queries where precision matters, retrieve a wider candidate set from Redis and use a Fireworks reranker to select the best passages before generation.

```python
import requests


def rerank(question: str, matches: list[dict], limit: int = 5) -> list[dict]:
    response = requests.post(
        "https://api.fireworks.ai/inference/v1/rerank",
        headers={
            "Authorization": f"Bearer {os.environ['FIREWORKS_API_KEY']}",
            "Content-Type": "application/json",
        },
        json={
            "model": "fireworks/qwen3-reranker-8b",
            "query": question,
            "documents": [item["content"] for item in matches],
            "top_n": limit,
            "return_documents": False,
        },
        timeout=30,
    )
    response.raise_for_status()
    ranking = response.json()["data"]
    return [matches[item["index"]] for item in ranking]


question = "How does Redis support a RAG application?"
candidates = retrieve(question, limit=20)
best_matches = rerank(question, candidates, limit=5)
```

Use the reranked results in place of `matches` when constructing the model context. A common pattern is to retrieve 20 to 50 candidates from Redis and rerank the best 5 to 10, but the right values depend on your corpus, latency target, and model context window.

## Add metadata filters

For multi-tenant or permission-aware applications, add fields such as `tenant_id`, `document_type`, or `created_at` to the index. Apply these constraints as Redis query filters so that ineligible documents are excluded before vector ranking. Avoid retrieving a broad candidate set and filtering it in application code.

For workloads that need both keyword relevance and semantic similarity, use [`FT.HYBRID`](/content/commands/ft.hybrid.md). Redis 8.4 and later supports `FT.HYBRID` for combining lexical and vector ranking in one query.

## Production considerations

- Keep the embedding model and vector dimensions consistent for document and query embeddings. Reindex the corpus when changing embedding models.
- Use metadata filters to enforce tenant and document-level boundaries during retrieval.
- Preserve source identifiers and URLs with every chunk so generated answers can include citations.
- Evaluate retrieval recall, reranking quality, answer faithfulness, latency, and cost with representative queries.
- Use a versioned index and an alias when changing the schema or embedding model so applications can switch indexes without downtime.
- Add retries with exponential backoff for transient Fireworks API errors. Dedicated Fireworks deployments can return a temporary `503` while scaling from zero.

## More information

- [RAG with Redis](/content/develop/get-started/rag.md)
- [Redis vector search](/content/develop/ai/search-and-query/vectors/_index.md)
- [RedisVL](/content/develop/ai/redisvl/_index.md)
- [Fireworks embeddings and reranking](https://docs.fireworks.ai/guides/querying-embeddings-models)
- [Fireworks text models](https://docs.fireworks.ai/guides/querying-text-models)
