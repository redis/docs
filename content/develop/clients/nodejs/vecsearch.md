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

[Redis Query Engine]({{< relref "/develop/interact/search-and-query" >}})
lets you index vector fields in [hash]({{< relref "/develop/data-types/hashes" >}})
or [JSON]({{< relref "/develop/data-types/json" >}}) objects (see the
[Vectors]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors" >}}) 
reference page for more information).

Vector fields can store *text embeddings*, which are AI-generated vector
representations of text content. The
[vector distance]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors#distance-metrics" >}})
between two embeddings measures their semantic similarity. When you compare the
similarity of a query embedding with stored embeddings, Redis can retrieve documents
that closely match the query's meaning.

In the example below, we use the
[`@xenova/transformers`](https://www.npmjs.com/package/@xenova/transformers)
library to generate vector embeddings to store and index with
Redis Query Engine. The code is first demonstrated for hash documents with a
separate section to explain the
[differences with JSON documents](#differences-with-json-documents).

## Initialize

Install the required dependencies:

1. Install [`node-redis`]({{< relref "/develop/clients/nodejs" >}}) if you haven't already.
2. Install `@xenova/transformers`:

```bash
npm install @xenova/transformers
```

In your JavaScript source file, import the required classes:

```js
import * as transformers from '@xenova/transformers';
import {
    VectorAlgorithms,
    createClient,
    SCHEMA_FIELD_TYPE,
} from 'redis';
```

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

```js
let pipe = await transformers.pipeline(
    'feature-extraction', 'Xenova/all-distilroberta-v1'
);

const pipeOptions = {
    pooling: 'mean',
    normalize: true,
};
```

## Create the index

First, connect to Redis and remove any existing index named `vector_idx`:

```js
const client = createClient({url: 'redis://localhost:6379'});
await client.connect();

try { 
    await client.ft.dropIndex('vector_idx'); 
} catch (e) {
    // Index doesn't exist, which is fine
}
```

Next, create the index with the following schema:
-   `content`: Text field for the content to index
-   `genre`: [Tag]({{< relref "/develop/interact/search-and-query/advanced-concepts/tags" >}})
    field representing the text's genre
-   `embedding`: [Vector]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors" >}})
    field with:
    -   [HNSW]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors#hnsw-index" >}})
        indexing
    -   [L2]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors#distance-metrics" >}})
        distance metric
    -   Float32 values
    -   768 dimensions (matching the embedding model)

```js
await client.ft.create('vector_idx', {
    'content': {
        type: SchemaFieldTypes.TEXT,
    },
    'genre': {
        type: SchemaFieldTypes.TAG,
    },
    'embedding': {
        type: SchemaFieldTypes.VECTOR,
        TYPE: 'FLOAT32',
        ALGORITHM: VectorAlgorithms.HNSW,
        DISTANCE_METRIC: 'L2',
        DIM: 768,
    }
}, {
    ON: 'HASH',
    PREFIX: 'doc:'
});
```

## Add data

Add data objects to the index using `hSet()`. The index automatically processes objects with the `doc:` prefix.

For each document:
1. Generate an embedding using the `pipe()` function and `pipeOptions`
2. Convert the embedding to a binary string using `Buffer.from()`
3. Store the document with `hSet()`

Use `Promise.all()` to batch the commands and reduce network round trips:

```js
const sentence1 = 'That is a very happy person';
const doc1 = {
    'content': sentence1, 
    'genre': 'persons', 
    'embedding': Buffer.from(
        (await pipe(sentence1, pipeOptions)).data.buffer
    ),
};

const sentence2 = 'That is a happy dog';
const doc2 = {
    'content': sentence2, 
    'genre': 'pets', 
    'embedding': Buffer.from(
        (await pipe(sentence2, pipeOptions)).data.buffer
    )
};

const sentence3 = 'Today is a sunny day';
const doc3 = {
    'content': sentence3, 
    'genre': 'weather', 
    'embedding': Buffer.from(
        (await pipe(sentence3, pipeOptions)).data.buffer
    )
};

await Promise.all([
    client.hSet('doc:1', doc1),
    client.hSet('doc:2', doc2),
    client.hSet('doc:3', doc3)
]);
```

## Run a query

To query the index:
1. Generate an embedding for your query text
2. Pass the embedding as a parameter to the search
3. Redis calculates vector distances and ranks results

The query returns an array of document objects. Each object contains:
- `id`: The document's key
- `value`: An object with fields specified in the `RETURN` option

```js
const similar = await client.ft.search(
    'vector_idx',
    '*=>[KNN 3 @embedding $B AS score]',
    {
        'PARAMS': {
            B: Buffer.from(
                (await pipe('That is a happy person', pipeOptions)).data.buffer
            ),
        },
        'RETURN': ['score', 'content'],
        'DIALECT': '2'
    },
);

for (const doc of similar.documents) {
    console.log(`${doc.id}: '${doc.value.content}', Score: ${doc.value.score}`);
}

await client.quit();
```

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

```js
await client.ft.create('vector_json_idx', {
    '$.content': {
        type: SchemaFieldTypes.TEXT,
        AS: 'content',
    },
    '$.genre': {
        type: SchemaFieldTypes.TAG,
        AS: 'genre',
    },
    '$.embedding': {
        type: SchemaFieldTypes.VECTOR,
        TYPE: 'FLOAT32',
        ALGORITHM: VectorAlgorithms.HNSW,
        DISTANCE_METRIC: 'L2',
        DIM: 768,
        AS: 'embedding',
    }
}, {
    ON: 'JSON',
    PREFIX: 'jdoc:'
});
```

Add data using `json.set()`. Convert the `Float32Array` to a standard JavaScript array using the spread operator:

```js
const jSentence1 = 'That is a very happy person';
const jdoc1 = {
    'content': jSentence1,
    'genre': 'persons',
    'embedding': [...(await pipe(jSentence1, pipeOptions)).data],
};

const jSentence2 = 'That is a happy dog';
const jdoc2 = {
    'content': jSentence2,
    'genre': 'pets',
    'embedding': [...(await pipe(jSentence2, pipeOptions)).data],
};

const jSentence3 = 'Today is a sunny day';
const jdoc3 = {
    'content': jSentence3,
    'genre': 'weather',
    'embedding': [...(await pipe(jSentence3, pipeOptions)).data],
};

await Promise.all([
    client.json.set('jdoc:1', '$', jdoc1),
    client.json.set('jdoc:2', '$', jdoc2),
    client.json.set('jdoc:3', '$', jdoc3)
]);
```

Query JSON documents using the same syntax, but note that the vector parameter must still be a binary string:

```js
const jsons = await client.ft.search(
    'vector_json_idx',
    '*=>[KNN 3 @embedding $B AS score]',
    {
        "PARAMS": {
            B: Buffer.from(
                (await pipe('That is a happy person', pipeOptions)).data.buffer
            ),
        },
        'RETURN': ['score', 'content'],
        'DIALECT': '2'
    },
);
```

The results are identical to the hash document query, except for the `jdoc:` prefix:

```
jdoc:1: 'That is a very happy person', Score: 0.127055495977
jdoc:2: 'That is a happy dog', Score: 0.836842417717
jdoc:3: 'Today is a sunny day', Score: 1.50889515877
```

## Learn more

See
[Vector search]({{< relref "/develop/interact/search-and-query/query/vector-search" >}})
for more information about indexing options, distance metrics, and query format.
