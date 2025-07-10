---
aliases:
- /develop/interact/search-and-query/indexing
- /develop/interact/search-and-query/indexing/
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
description: How to create search indexes for Redis data structures
linkTitle: Indexing
title: Indexing
weight: 3
---

You can create search indexes for your Redis data to enable fast, flexible queries across your stored information. Redis supports indexing for both Hash and JSON data structures, each with their own advantages and use cases.

## Choose your indexing approach

### Hash indexing

Hash indexing provides a straightforward approach where field names in your schema map directly to hash field names. This makes it ideal for:

- **Structured data** with consistent field patterns
- **Simple schemas** without nested objects
- **High performance** requirements with minimal overhead
- **Existing applications** already using Redis Hashes

Learn more: [Hash indexing]({{< relref "/develop/ai/search-and-query/indexing/hash-indexing" >}})

### JSON indexing

JSON indexing uses JSONPath expressions to specify which parts of your documents to index. This approach works well for:

- **Complex, nested data** structures
- **Flexible schemas** that may evolve over time
- **Rich data types** including arrays and objects
- **Applications** requiring document-style storage

Learn more: [JSON indexing]({{< relref "/develop/ai/search-and-query/indexing/json-indexing" >}})

## Core concepts

### Schema definition

Every search index requires a schema that defines:

- **Field types**: TEXT, TAG, NUMERIC, VECTOR, GEO, GEOSHAPE
- **Field options**: SORTABLE, NOINDEX, WEIGHT
- **Index configuration**: prefixes, filters, language settings

### Field types

Redis supports several field types for different data and query patterns:

- **TEXT**: Full-text search with stemming and tokenization
- **TAG**: Exact match searches with high performance
- **NUMERIC**: Range queries and sorting
- **VECTOR**: Similarity search and machine learning
- **GEO/GEOSHAPE**: Geospatial queries and location-based search

Learn more: [Field and type options]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options" >}})

### Indexing process

When you create an index:

1. **Existing data** is indexed asynchronously in the background
2. **New data** is indexed synchronously as you add it
3. **Modified data** is automatically reindexed
4. **Deleted data** is automatically removed from the index

## Advanced topics

### JSON arrays

JSON documents often contain arrays that require special indexing considerations:

- **Array elements as tags** for exact matching
- **Array elements as text** for full-text search
- **Numeric arrays** for range queries
- **Vector arrays** for similarity search

Learn more: [JSON arrays]({{< relref "/develop/ai/search-and-query/indexing/json-arrays" >}})

### Tags and exact matching

Tag fields provide efficient exact matching capabilities:

- **High performance** with compressed indexes
- **Exact match semantics** without tokenization
- **Multiple values** with separator characters
- **Case sensitivity** options

Learn more: [Tags]({{< relref "/develop/ai/search-and-query/indexing/tags" >}})

### Geospatial indexing

Store and query geographical data:

- **Point locations** with GEO fields
- **Complex shapes** with GEOSHAPE fields
- **Proximity queries** within radius or bounds
- **Spatial relationships** like contains, intersects

Learn more: [Geospatial indexing]({{< relref "/develop/ai/search-and-query/indexing/geospatial" >}})

### Text processing

Control how text is tokenized and processed:

- **Tokenization rules** for different field types
- **Character escaping** in queries and documents
- **Language-specific** processing options

Learn more: [Tokenization]({{< relref "/develop/ai/search-and-query/indexing/tokenization" >}})

### Search techniques

Advanced query and result processing:

- **Field projection** to return specific attributes
- **Result highlighting** for search terms
- **Aggregation queries** for analytics and faceting

Learn more: [Search techniques]({{< relref "/develop/ai/search-and-query/indexing/search-techniques" >}})

## Getting started

1. **Choose your data structure**: Hash for simple structured data, JSON for complex nested data
2. **Design your schema**: Define fields, types, and options based on your query requirements
3. **Create your index**: Use `FT.CREATE` with appropriate configuration
4. **Add your data**: Use standard Redis commands (HSET, JSON.SET) to populate your index
5. **Query your data**: Use `FT.SEARCH` and `FT.AGGREGATE` to find and analyze your information

## Next steps

- Start with [Hash indexing]({{< relref "/develop/ai/search-and-query/indexing/hash-indexing" >}}) for simple use cases
- Explore [JSON indexing]({{< relref "/develop/ai/search-and-query/indexing/json-indexing" >}}) for complex data
- Learn about [field types]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options" >}}) and their capabilities
- See [query examples]({{< relref "/develop/ai/search-and-query/query" >}}) for search patterns



