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
Among other things, vector fields can store *text embeddings*, which are AI-generated vector
representations of the semantic information in pieces of text. The
[vector distance]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors#distance-metrics" >}})
between two embeddings indicates how similar they are semantically. By comparing the
similarity of an embedding generated from some query text with embeddings stored in hash
or JSON fields, Redis can retrieve documents that closely match the query in terms
of their meaning.

In the example below, we use the
[`@xenova/transformers`](https://www.npmjs.com/package/@xenova/transformers)
library to generate vector embeddings to store and index with
Redis Query Engine.

## Initialize

Install [`node-redis`]({{< relref "/develop/clients/nodejs" >}}) if you
have not already done so. Also, install `@xenova/transformers` with the
following command:

```bash
npm install @xenova/transformers
```

In a new JavaScript source file, start by importing the required classes:

```js
import * as transformers from '@xenova/transformers';
import {VectorAlgorithms, createClient, SchemaFieldTypes} from 'redis';
```

The first of these imports is the `@xenova/transformers` module, which handles
the embedding models.
Here, we use an instance of the
[`all-distilroberta-v1`](https://huggingface.co/sentence-transformers/all-distilroberta-v1)
model for the embeddings. This model generates vectors with 768 dimensions, regardless
of the length of the input text, but note that the input is truncated to 128
tokens (see
[Word piece tokenization](https://huggingface.co/learn/nlp-course/en/chapter6/6)
at the [Hugging Face](https://huggingface.co/) docs to learn more about the way tokens
are related to the original text).

The `pipe` value obtained here is a function that we can call to generate the
embeddings. We also need an object to pass some options for the `pipe()` function
call. These specify the way the sentence embedding is generated from individual
token embeddings (see the
[`all-distilroberta-v1`](https://huggingface.co/sentence-transformers/all-distilroberta-v1)
docs for more information).

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

Connect to Redis and delete any index previously created with the
name `vector_idx`. (The `dropIndex()` call throws an exception if
the index doesn't already exist, which is why you need the
`try...catch` block.)

```js
const client = createClient({url: 'redis://localhost:6379'});

await client.connect();

try { await client.ft.dropIndex('vector_idx'); } catch {}
```

Next, create the index.
The schema in the example below specifies hash objects for storage and includes
three fields: the text content to index, a
[tag]({{< relref "/develop/interact/search-and-query/advanced-concepts/tags" >}})
field to represent the "genre" of the text, and the embedding vector generated from
the original text content. The `embedding` field specifies
[HNSW]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors#hnsw-index" >}}) 
indexing, the
[L2]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors#distance-metrics" >}})
vector distance metric, `Float32` values to represent the vector's components,
and 768 dimensions, as required by the `all-distilroberta-v1` embedding model.

```js
await client.ft.create('vector_idx', {
    'content': {
        type: SchemaFieldTypes.TEXT,
    },
    'genre': {
        type:SchemaFieldTypes.TAG,
    },
    'embedding': {
        type: SchemaFieldTypes.VECTOR,
        TYPE: 'FLOAT32',
        ALGORITHM: VectorAlgorithms.HNSW,
        DISTANCE_METRIC: 'L2',
        DIM: 768,
    }
},{
    ON: 'HASH',
    PREFIX: 'doc:'
});
```

## Add data

You can now supply the data objects, which will be indexed automatically
when you add them with [`hSet()`]({{< relref "/commands/hset" >}}), as long as
you use the `doc:` prefix specified in the index definition.

Use the `pipe()` method and the `pipeOptions` object that we created earlier to
generate the embedding that represents the `content` field.
The object returned by `pipe()` includes a `data` attribute, which is a
[`Float32Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)
that contains the embedding data. If you are indexing hash objects, as
we are here, then you must also call
[`Buffer.from()`](https://nodejs.org/api/buffer.html#static-method-bufferfromarraybuffer-byteoffset-length)
on this array's `buffer` value to convert the `Float32Array`
to a binary string. If you are indexing JSON objects, you can just
use the `Float32Array` directly to represent the embedding.

Make the `hSet()` calls within a
[`Promise.all()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
call to create a Redis [pipeline]({{< relref "/develop/use/pipelining" >}})
(not to be confused with the `@xenova/transformers` pipeline).
This combines the commands together into a batch to reduce network
round trip time.

```js
const sentence1 = 'That is a very happy person';
const doc1 = {
    'content': sentence1, 
    'genre':'persons', 
    'embedding':Buffer.from(
        (await pipe(sentence1, pipeOptions)).data.buffer
    ),
};

const sentence2 = 'That is a happy dog';
const doc2 = {
    'content': sentence2, 
    'genre':'pets', 
    'embedding': Buffer.from(
        (await pipe(sentence2, pipeOptions)).data.buffer
    )
};

const sentence3 = 'Today is a sunny day';
const doc3 = {
    'content': sentence3, 
    'genre':'weather', 
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

After you have created the index and added the data, you are ready to run a query.
To do this, you must create another embedding vector from your chosen query
text. Redis calculates the vector distance between the query vector and each
embedding vector in the index and then ranks the results in order of this
distance value.

The code below creates the query embedding using `pipe()`, as with
the indexing, and passes it as a parameter during execution
(see
[Vector search]({{< relref "/develop/interact/search-and-query/query/vector-search" >}})
for more information about using query parameters with embeddings).

The query returns an array of objects representing the documents
that were found (which are hash objects here). The `id` attribute
contains the document's key. The `value` attribute contains an object
with a key-value entry corresponding to each index field specified in the
`RETURN` option of the query.


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

The code is now ready to run, but note that it may take a while to download the
`all-distilroberta-v1` model data the first time you run it. The
code outputs the following results:

```
doc:1: 'That is a very happy person', Score: 0.127055495977
doc:2: 'That is a happy dog', Score: 0.836842417717
doc:3: 'Today is a sunny day', Score: 1.50889515877
```

The results are ordered according to the value of the `score`
field, which represents the vector distance here. The lowest distance indicates
the greatest similarity to the query.
As you would expect, the result for `doc:1` with the content text
*"That is a very happy person"*
is the result that is most similar in meaning to the query text
*"That is a happy person"*.

## Learn more

See
[Vector search]({{< relref "/develop/interact/search-and-query/query/vector-search" >}})
for more information about the indexing options, distance metrics, and query format
for vectors.
