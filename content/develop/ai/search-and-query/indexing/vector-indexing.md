---
aliases:
- /develop/interact/search-and-query/indexing/vector-indexing
- /develop/ai/search-and-query/indexing/vector-indexing
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: How to index and search vector embeddings for similarity search and machine learning applications
linkTitle: Vector indexing
title: Vector indexing
weight: 40
---

You can index vector embeddings in Redis to enable similarity search, recommendation systems, and machine learning applications. Vector indexing allows you to find documents with similar content, perform semantic search, and build AI-powered features.

## What are vector embeddings?

Vector embeddings are numerical representations of data (text, images, audio) that capture semantic meaning in high-dimensional space. Similar items have similar vector representations, enabling you to find related content through mathematical distance calculations.

**Common use cases:**
- **Semantic search**: Find documents with similar meaning, not just matching keywords
- **Recommendation engines**: Suggest products, content, or users based on similarity
- **Image search**: Find visually similar images or objects
- **Anomaly detection**: Identify outliers in data patterns
- **Chatbots and AI**: Enable context-aware responses and retrieval-augmented generation (RAG)

## Comprehensive documentation

For detailed information about vector search capabilities, algorithms, parameters, and advanced use cases, see the comprehensive [Vector search documentation]({{< relref "/develop/ai/search-and-query/vectors" >}}).

The vectors page covers:
- **Detailed algorithm comparisons** and parameter tuning
- **Advanced query techniques** and filtering options  
- **Performance optimization** strategies
- **Client library examples** in multiple languages
- **Production deployment** best practices
- **Troubleshooting** and monitoring guidance

## Next steps

- Learn about [field and type options]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options" >}}) for vector configuration
- Explore [JSON indexing]({{< relref "/develop/ai/search-and-query/indexing/json-indexing" >}}) for storing embeddings with metadata
- See [search techniques]({{< relref "/develop/ai/search-and-query/indexing/search-techniques" >}}) for combining vector and traditional search
