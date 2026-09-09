---
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
description: Learn how to index and query vector embeddings with Redis
linkTitle: Index and query vectors
title: Index and query vectors
scope: example
relatedPages:
- /develop/clients/nodejs/queryjson
- /develop/clients/nodejs/vecsets
- /develop/ai/search-and-query
topics:
- Redis Search
- JSON
- hash
- vectors
weight: 3
---

[Redis Search](/content/develop/ai/search-and-query/_index.md)
lets you index vector fields in [hash](/content/develop/data-types/hashes.md)
or [JSON](/content/develop/data-types/json/_index.md) objects (see the
[Vectors](/content/develop/ai/search-and-query/vectors/_index.md) 
reference page for more information).

Vector fields can store *text embeddings*, which are AI-generated vector
representations of text content. The
[vector distance](/content/develop/ai/search-and-query/vectors/_index.md#distance-metrics)
between two embeddings measures their semantic similarity. When you compare the
similarity of a query embedding with stored embeddings, Redis can retrieve documents
that closely match the query's meaning.

In the example below, we use the
[`@xenova/transformers`](https://www.npmjs.com/package/@xenova/transformers)
library to generate vector embeddings to store and index with
Redis Search. The code is first demonstrated for hash documents with a
separate section to explain the
[differences with JSON documents](#differences-with-json-documents).

> [!NOTE]
> From [v5.0.0](https://github.com/redis/node-redis/releases/tag/redis%405.0.0)
> onwards, `node-redis` uses query dialect 2 by default.
> Redis Search methods such as [`ft.search()`](/content/commands/ft.search.md)
> will explicitly request this dialect, overriding the default set for the server.
> See
> [Query dialects](/content/develop/ai/search-and-query/advanced-concepts/dialects.md)
> for more information.

## Initialize

Install the required dependencies:

1. Install [`node-redis`](/content/develop/clients/nodejs/_index.md) if you haven't already.
2. Install `@xenova/transformers`:

```bash
npm install @xenova/transformers
```

In your JavaScript source file, import the required classes:

{{< clients-example set="home_query_vec" step="import" lang_filter="Node.js" description="Foundational: Import Redis client and transformer modules for vector embedding operations" difficulty="beginner" >}}
{{< /clients-example >}}

The `@xenova/transformers` module handles embedding models. This example uses the
[`all-distilroberta-v1`](https://huggingface.co/sentence-transformers/all-distilroberta-v1)
model, which:
- Generates 768-dimensional vectors
- Truncates input to 128 tokens
- Uses word piece tokenization (see [Word piece tokenization](https://huggingface.co/learn/nlp-course/en/chapter6/6)
  at the [Hugging Face](https://huggingface.co/) docs for details)

The `pipe` function generates embeddings. The `pipeOptions` object specifies how to generate sentence embeddings from token embeddings (see the
[`all-distilroberta-v1`](https://huggingface.co/sentence-transformers/all-distilroberta-v1)
documentation for details):

{{< clients-example set="home_query_vec" step="pipeline" lang_filter="Node.js" description="Foundational: Configure a transformer pipeline to generate vector embeddings from text" difficulty="beginner" >}}
{{< /clients-example >}}

## Create the index

First, connect to Redis and remove any existing index named `vector_idx`:

{{< clients-example set="home_query_vec" step="connect" lang_filter="Node.js" description="Foundational: Connect to Redis and clean up existing vector indexes" difficulty="beginner" >}}
{{< /clients-example >}}

Next, create the index with the following schema:
-   `content`: Text field for the content to index
-   `genre`: [Tag](/content/develop/ai/search-and-query/advanced-concepts/tags.md)
    field representing the text's genre
-   `embedding`: [Vector](/content/develop/ai/search-and-query/vectors/_index.md)
    field with:
    -   [HNSW](/content/develop/ai/search-and-query/vectors/_index.md#hnsw-index)
        indexing
    -   [L2](/content/develop/ai/search-and-query/vectors/_index.md#distance-metrics)
        distance metric
    -   Float32 values
    -   768 dimensions (matching the embedding model)

{{< clients-example set="home_query_vec" step="create_index" lang_filter="Node.js" description="Foundational: Create a vector search index with HNSW algorithm and L2 distance metric for semantic search" difficulty="intermediate" >}}
{{< /clients-example >}}

## Add data

Add data objects to the index using `hSet()`. The index automatically processes objects with the `doc:` prefix.

For each document:
1. Generate an embedding using the `pipe()` function and `pipeOptions`
2. Convert the embedding to a binary string using `Buffer.from()`
3. Store the document with `hSet()`

Use `Promise.all()` to batch the commands and reduce network round trips:

{{< clients-example set="home_query_vec" step="add_data" lang_filter="Node.js" description="Practical pattern: Generate embeddings and store documents with vector fields using pipelined hSet() commands" difficulty="intermediate" >}}
{{< /clients-example >}}

## Run a query

To query the index:
1. Generate an embedding for your query text
2. Pass the embedding as a parameter to the search
3. Redis calculates vector distances and ranks results

The query returns an array of document objects. Each object contains:
- `id`: The document's key
- `value`: An object with fields specified in the `RETURN` option

{{< clients-example set="home_query_vec" step="query" lang_filter="Node.js" description="Vector query: Execute a vector similarity search by generating a query embedding and finding nearest neighbors" difficulty="intermediate" >}}
{{< /clients-example >}}

The first run may take longer as it downloads the model data. The output shows results ordered by score (vector distance), with lower scores indicating greater similarity:

```
doc:1: 'That is a very happy person', Score: 0.127055495977
doc:2: 'That is a happy dog', Score: 0.836842417717
doc:3: 'Today is a sunny day', Score: 1.50889515877
```

## Differences with JSON documents

JSON documents support richer data modeling with nested fields. Key differences from hash documents:

1. Use paths in the schema to identify fields
2. Declare aliases for paths using the `AS` option
3. Set `ON` to `JSON` when creating the index
4. Use arrays instead of binary strings for vectors
5. Use `json.set()` instead of `hSet()`

Create the index with path aliases:

{{< clients-example set="home_query_vec" step="json_index" lang_filter="Node.js" description="Foundational: Create a vector search index for JSON documents with path aliases and nested field support" difficulty="intermediate" >}}
{{< /clients-example >}}

Add data using `json.set()`. Convert the `Float32Array` to a standard JavaScript array using the spread operator:

{{< clients-example set="home_query_vec" step="json_data" lang_filter="Node.js" description="Practical pattern: Store JSON documents with vector embeddings converted to arrays for nested field support" difficulty="intermediate" >}}
{{< /clients-example >}}

Query JSON documents using the same syntax, but note that the vector parameter must still be a binary string:

{{< clients-example set="home_query_vec" step="json_query" lang_filter="Node.js" description="Vector query: Execute vector similarity search on JSON documents with the same query syntax as hash documents" difficulty="intermediate" >}}
{{< /clients-example >}}

The results are identical to the hash document query, except for the `jdoc:` prefix:

```
jdoc:1: 'That is a very happy person', Score: 0.127055495977
jdoc:2: 'That is a happy dog', Score: 0.836842417717
jdoc:3: 'Today is a sunny day', Score: 1.50889515877
```

## Learn more

See
[Vector search](/content/develop/ai/search-and-query/query/vector-search.md)
for more information about indexing options, distance metrics, and query format.
