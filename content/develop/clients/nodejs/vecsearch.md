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
weight: 3
---

[Redis Query Engine]({{< relref "/develop/ai/search-and-query" >}})
lets you index vector fields in [hash]({{< relref "/develop/data-types/hashes" >}})
or [JSON]({{< relref "/develop/data-types/json" >}}) objects (see the
[Vectors]({{< relref "/develop/ai/search-and-query/vectors" >}}) 
reference page for more information).

Vector fields can store *text embeddings*, which are AI-generated vector
representations of text content. The
[vector distance]({{< relref "/develop/ai/search-and-query/vectors#distance-metrics" >}})
between two embeddings measures their semantic similarity. When you compare the
similarity of a query embedding with stored embeddings, Redis can retrieve documents
that closely match the query's meaning.

In the example below, we use the
[`@xenova/transformers`](https://www.npmjs.com/package/@xenova/transformers)
library to generate vector embeddings to store and index with
Redis Query Engine. The code is first demonstrated for hash documents with a
separate section to explain the
[differences with JSON documents](#differences-with-json-documents).

{{< note >}}From [v5.0.0](https://github.com/redis/node-redis/releases/tag/redis%405.0.0)
onwards, `node-redis` uses query dialect 2 by default.
Redis query engine methods such as [`ft.search()`]({{< relref "/commands/ft.search" >}})
will explicitly request this dialect, overriding the default set for the server.
See
[Query dialects]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}})
for more information.
{{< /note >}}

## Initialize

Install the required dependencies:

1. Install [`node-redis`]({{< relref "/develop/clients/nodejs" >}}) if you haven't already.
2. Install `@xenova/transformers`:

```bash
npm install @xenova/transformers
```

In your JavaScript source file, import the required classes:

{{< clients-example set="home_query_vec" step="import" lang_filter="Node.js" >}}
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

{{< clients-example set="home_query_vec" step="pipeline" lang_filter="Node.js" >}}
{{< /clients-example >}}

## Create the index

First, connect to Redis and remove any existing index named `vector_idx`:

{{< clients-example set="home_query_vec" step="connect" lang_filter="Node.js" >}}
{{< /clients-example >}}

Next, create the index with the following schema:
-   `content`: Text field for the content to index
-   `genre`: [Tag]({{< relref "/develop/ai/search-and-query/advanced-concepts/tags" >}})
    field representing the text's genre
-   `embedding`: [Vector]({{< relref "/develop/ai/search-and-query/vectors" >}})
    field with:
    -   [HNSW]({{< relref "/develop/ai/search-and-query/vectors#hnsw-index" >}})
        indexing
    -   [L2]({{< relref "/develop/ai/search-and-query/vectors#distance-metrics" >}})
        distance metric
    -   Float32 values
    -   768 dimensions (matching the embedding model)

{{< clients-example set="home_query_vec" step="create_index" lang_filter="Node.js" >}}
{{< /clients-example >}}

## Add data

Add data objects to the index using `hSet()`. The index automatically processes objects with the `doc:` prefix.

For each document:
1. Generate an embedding using the `pipe()` function and `pipeOptions`
2. Convert the embedding to a binary string using `Buffer.from()`
3. Store the document with `hSet()`

Use `Promise.all()` to batch the commands and reduce network round trips:

{{< clients-example set="home_query_vec" step="add_data" lang_filter="Node.js" >}}
{{< /clients-example >}}

## Run a query

To query the index:
1. Generate an embedding for your query text
2. Pass the embedding as a parameter to the search
3. Redis calculates vector distances and ranks results

The query returns an array of document objects. Each object contains:
- `id`: The document's key
- `value`: An object with fields specified in the `RETURN` option

{{< clients-example set="home_query_vec" step="query" lang_filter="Node.js" >}}
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

{{< clients-example set="home_query_vec" step="json_index" lang_filter="Node.js" >}}
{{< /clients-example >}}

Add data using `json.set()`. Convert the `Float32Array` to a standard JavaScript array using the spread operator:

{{< clients-example set="home_query_vec" step="json_data" lang_filter="Node.js" >}}
{{< /clients-example >}}

Query JSON documents using the same syntax, but note that the vector parameter must still be a binary string:

{{< clients-example set="home_query_vec" step="json_query" lang_filter="Node.js" >}}
{{< /clients-example >}}

The results are identical to the hash document query, except for the `jdoc:` prefix:

```
jdoc:1: 'That is a very happy person', Score: 0.127055495977
jdoc:2: 'That is a happy dog', Score: 0.836842417717
jdoc:3: 'Today is a sunny day', Score: 1.50889515877
```

## Learn more

See
[Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
for more information about indexing options, distance metrics, and query format.
