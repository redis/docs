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
description: Patterns for real-time queries with Search, JSON, and vector similarity
linkTitle: Queries
title: Real-time query patterns
weight: 20
---

Real-time query patterns help you search and retrieve data instantly using Redis Search, JSON, and vector similarity. These patterns enable full-text search, document queries, and semantic search at scale.

## When to use these patterns

Use query patterns when you need to:

- Search JSON documents by any field
- Perform full-text search across text content
- Find semantically similar content with vector embeddings
- Combine keyword and vector search for hybrid queries
- Query data with complex filters and aggregations
- Build autocomplete and typeahead features

## Available patterns

### [JSON document queries](json-document-queries/)

Index and query JSON documents in real time using Redis Search. Learn how to design indexes, optimize queries, and aggregate results.

**Key concepts:** JSON.SET, FT.CREATE, FT.SEARCH, indexing strategies

### [Vector similarity search](vector-similarity-search/)

Find semantically similar content using vector embeddings. Learn how to configure vector indexes, choose distance metrics, and optimize performance.

**Key concepts:** Vector embeddings, KNN, ANN, HNSW, distance metrics

### [Hybrid vector and keyword search](hybrid-search/)

Combine semantic similarity with exact keyword matching. Learn pre-filtering, post-filtering, and re-ranking strategies.

**Key concepts:** Hybrid queries, filters, re-ranking, relevance scoring

## Prerequisites

Before working with these patterns, familiarize yourself with:

- [JSON data type]({{< relref "/develop/data-types/json" >}}) - Store and manipulate JSON documents
- [Search and query]({{< relref "/develop/ai/search-and-query" >}}) - Full-text and vector search
- [Vector database quick start]({{< relref "/develop/get-started/vector-database" >}}) - Vector search basics
- [Document database quick start]({{< relref "/develop/get-started/document-database" >}}) - JSON document basics

## Common use cases

- **Product search** - Search product catalogs with filters and facets
- **Content discovery** - Find similar articles, videos, or documents
- **Semantic search** - Natural language queries over knowledge bases
- **Recommendation engines** - Find similar items based on embeddings
- **Question answering** - Retrieve relevant context for RAG systems
- **Autocomplete** - Real-time search suggestions

## Related patterns

- [RAG pipelines]({{< relref "/develop/patterns/ai/rag-pipeline" >}}) - Build retrieval-augmented generation systems
- [Semantic caching]({{< relref "/develop/patterns/ai/semantic-caching" >}}) - Cache by semantic similarity
- [JSON document modeling]({{< relref "/develop/patterns/data-modeling/json-documents" >}}) - Structure documents efficiently
- [Secondary indexes]({{< relref "/develop/patterns/data-modeling/secondary-indexes" >}}) - Query by multiple attributes

## More information

- [Search and query documentation]({{< relref "/develop/ai/search-and-query" >}})
- [JSON documentation]({{< relref "/develop/data-types/json" >}})
- [Vector search guide]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
- [Client library examples]({{< relref "/develop/clients" >}})

