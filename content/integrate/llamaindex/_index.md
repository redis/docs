---
LinkTitle: LlamaIndex
Title: Redis with LlamaIndex
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Use Redis as a LlamaIndex vector store, chat store, document store, index store, and ingestion cache.
group: ai
stack: true
summary: Use the LlamaIndex Redis packages to search embeddings, keep chat history, and cache ingestion work in Redis.
type: integration
weight: 30
---

[LlamaIndex](https://developers.llamaindex.ai/) is a Python framework for building retrieval-augmented generation (RAG) applications over your own data. Separate Redis packages plug into it:

| Package | Use it to |
|---------|-----------|
| `llama-index-vector-stores-redis` | Store embeddings and run vector searches with metadata filters, using [Redis Search](/content/develop/ai/search-and-query/_index.md). |
| `llama-index-storage-chat-store-redis` | Keep chat history for each user or session. |
| `llama-index-storage-docstore-redis` and `llama-index-storage-index-store-redis` | Persist the document and index metadata that LlamaIndex otherwise keeps in memory. |
| `llama-index-storage-kvstore-redis` | Cache the results of ingestion pipeline steps. |

See the [semantic cache](/content/develop/use-cases/semantic-cache/_index.md) and
[memory layer](/content/develop/use-cases/memory-layer/_index.md) use cases for more
information about when to use these patterns.

## Requirements

- Python 3.11 to 3.13
- Redis with [Redis Search](/content/develop/ai/search-and-query/_index.md) for the vector store
(Redis 8 and later versions include it but earlier versions need Redis Stack). The chat store, document store, index store, and cache work on any Redis server.

Install the packages you need:

```bash
pip install llama-index-vector-stores-redis \
    llama-index-storage-chat-store-redis \
    llama-index-storage-docstore-redis \
    llama-index-storage-index-store-redis \
    llama-index-storage-kvstore-redis
```

The examples on this page were run with LlamaIndex Core 0.14.26 and Redis 8.10. They use LlamaIndex's default OpenAI models, so set `OPENAI_API_KEY` or configure [`Settings.embed_model`](https://developers.llamaindex.ai/python/framework/module_guides/models/embeddings/) and `Settings.llm` to your own providers.

## Search embeddings with the vector store

Create a `RedisVectorStore`, wrap it in a `StorageContext`, and build an index:

```python
from llama_index.core import Document, StorageContext, VectorStoreIndex
from llama_index.vector_stores.redis import RedisVectorStore

vector_store = RedisVectorStore(redis_url="redis://localhost:6379", overwrite=True)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

documents = [
    Document(text="Redis is an in-memory data store."),
    Document(text="Llamas live in the Andes."),
]
index = VectorStoreIndex.from_documents(documents, storage_context=storage_context)

retriever = index.as_retriever(similarity_top_k=1)
for result in retriever.retrieve("What is Redis?"):
    print(result.score, result.text)
```

LlamaIndex embeds each document, stores it in a Redis hash, and indexes the hashes with a Redis Search index. `overwrite=True` drops and recreates the index if it already exists.

To reuse the index in a later run without embedding the documents again, connect to the same index and build from the vector store:

```python
vector_store = RedisVectorStore(redis_url="redis://localhost:6379")
index = VectorStoreIndex.from_vector_store(vector_store)
```

### Define a custom schema

The default schema has an index named `llama_index`, a key prefix of `llama_index/vector`, and a vector field of **1536** dimensions, the size of OpenAI `text-embedding-ada-002` and `text-embedding-3-small` vectors. An embedding model with a different size fails when you add documents:

```text
ValueError: Attempting to index embeddings of dim 8 which doesn't match the index schema expectation of 1536.
```

Pass your own schema to set the vector size, the index name and prefix, the vector algorithm, and the metadata fields that you want to filter on:

```python
from redisvl.schema import IndexSchema

schema = IndexSchema.from_dict({
    "index": {"name": "docs_idx", "prefix": "doc", "key_separator": ":"},
    "fields": [
        {"name": "id", "type": "tag"},
        {"name": "doc_id", "type": "tag"},
        {"name": "text", "type": "text"},
        {"name": "topic", "type": "tag"},
        {
            "name": "vector",
            "type": "vector",
            "attrs": {"dims": 1536, "algorithm": "hnsw", "distance_metric": "cosine"},
        },
    ],
})

vector_store = RedisVectorStore(schema=schema, redis_url="redis://localhost:6379")
```

The schema must contain the `id`, `doc_id`, `text`, and `vector` fields. `RedisVectorStore` uses the [RedisVL](/content/develop/ai/redisvl/_index.md) `IndexSchema` class, which is installed with the package. See [Get started with RedisVL](/content/develop/ai/redisvl/user_guide/getting_started.md) for the field types and attributes.

### Filter on metadata

Add a field to the schema for each metadata key that you want to filter on (such as `topic` in the
example above). Then pass a `MetadataFilters` object to the retriever:

```python
from llama_index.core.vector_stores.types import MetadataFilter, MetadataFilters

index = VectorStoreIndex.from_documents(
    [
        Document(text="Redis is an in-memory data store.", metadata={"topic": "redis"}),
        Document(text="Llamas live in the Andes.", metadata={"topic": "animals"}),
    ],
    storage_context=StorageContext.from_defaults(vector_store=vector_store),
)

filters = MetadataFilters(filters=[MetadataFilter(key="topic", value="redis")])
retriever = index.as_retriever(filters=filters)
```

If a filter names a key that is not in the schema, the query returns no results. LlamaIndex logs `One or more requested filter fields are not present in the Redis index schema` but doesn't raise an error.

## Keep chat history

`RedisChatStore` keeps each conversation as a Redis list, keyed by a name you choose. Pass it to a memory buffer to give a chat engine or agent a history that survives a restart:

```python
from llama_index.core.llms import ChatMessage
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.storage.chat_store.redis import RedisChatStore

chat_store = RedisChatStore(redis_url="redis://localhost:6379", ttl=3600)

memory = ChatMemoryBuffer.from_defaults(
    token_limit=3000,
    chat_store=chat_store,
    chat_store_key="user-1",
)
memory.put(ChatMessage(role="user", content="Hello"))
memory.put(ChatMessage(role="assistant", content="Hi there"))
print([m.content for m in memory.get()])
```

The "time to live" (`ttl`) is in seconds. This is the time (since the last message) after which Redis
expires the whole conversation. This is useful for automatically cleaning up idle sessions.

{{< warning >}}
The `RedisChatStore.get_keys()` method runs [`KEYS *`](/content/commands/keys.md), which returns
every key in the database, not only conversation 
keys. It also blocks the server while it scans. To avoid performance problems, use a dedicated database
for the chat store, and keep your own list of conversation keys instead of calling
`RedisChatStore.get_keys()`.
{{< /warning >}}

## Persist documents and indexes

By default, LlamaIndex keeps the document store and index store in memory and writes them to disk. To keep them in Redis instead, pass Redis-backed stores to the `StorageContext`:

```python
from llama_index.storage.docstore.redis import RedisDocumentStore
from llama_index.storage.index_store.redis import RedisIndexStore

storage_context = StorageContext.from_defaults(
    docstore=RedisDocumentStore.from_host_and_port("localhost", 6379, namespace="demo"),
    index_store=RedisIndexStore.from_host_and_port("localhost", 6379, namespace="demo"),
)
```

Both stores prefix their keys with `namespace`, so several applications can share a database. A new `StorageContext` with the same namespace reads the stored documents and index metadata back.

## Cache ingestion work

An `IngestionPipeline` runs transformations such as splitting and embedding. If you supply
it with an `IngestionCache` backed by `RedisKVStore`, as shown in the example below,
it will skip any step whose input hasn't changed, even in a later process:

```python
from llama_index.core.ingestion import IngestionCache, IngestionPipeline
from llama_index.core.node_parser import SentenceSplitter
from llama_index.storage.kvstore.redis import RedisKVStore

cache = IngestionCache(
    cache=RedisKVStore.from_host_and_port("localhost", 6379),
    collection="ingestion_cache",
)

pipeline = IngestionPipeline(
    transformations=[SentenceSplitter(chunk_size=512), embed_model],
    cache=cache,
)
nodes = pipeline.run(documents=documents)
```

Replace `embed_model` with your embedding model. The cache is a Redis hash named after `collection`. On a second run with the same documents, the pipeline reads the embeddings from Redis and makes no embedding calls.

## More information

- [LlamaIndex Redis vector store guide](https://developers.llamaindex.ai/python/examples/vector_stores/redisindexdemo/)
- [RedisVL](/content/develop/ai/redisvl/_index.md), the Redis library that `RedisVectorStore` is built on
- [Vector search with Redis Search](/content/develop/ai/search-and-query/vectors/_index.md)
