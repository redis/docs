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
- /develop/clients/redis-py/queryjson
- /develop/clients/redis-py/vecsets
- /develop/ai/search-and-query
topics:
- Redis Query Engine
- JSON
- hash
- vectors
weight: 40
---

[Redis Query Engine]({{< relref "/develop/ai/search-and-query" >}})
lets you index vector fields in [hash]({{< relref "/develop/data-types/hashes" >}})
or [JSON]({{< relref "/develop/data-types/json" >}}) objects (see the
[Vectors]({{< relref "/develop/ai/search-and-query/vectors" >}}) 
reference page for more information).
Among other things, vector fields can store *text embeddings*, which are AI-generated vector
representations of the semantic information in pieces of text. The
[vector distance]({{< relref "/develop/ai/search-and-query/vectors#distance-metrics" >}})
between two embeddings indicates how similar they are semantically. By comparing the
similarity of an embedding generated from some query text with embeddings stored in hash
or JSON fields, Redis can retrieve documents that closely match the query in terms
of their meaning.

The example below uses the
[`sentence-transformers`](https://pypi.org/project/sentence-transformers/)
library to generate vector embeddings to store and index with
Redis Query Engine. The code is first demonstrated for hash documents with a
separate section to explain the
[differences with JSON documents](#differences-with-json-documents).

{{< note >}}From [v6.0.0](https://github.com/redis/redis-py/releases/tag/v6.0.0) onwards,
`redis-py` uses query dialect 2 by default.
Redis query engine methods such as [`ft().search()`]({{< relref "/commands/ft.search" >}})
will explicitly request this dialect, overriding the default set for the server.
See
[Query dialects]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}})
for more information.
{{< /note >}}

## Initialize

Install [`redis-py`]({{< relref "/develop/clients/redis-py" >}}) if you
have not already done so. Also, install `sentence-transformers` with the
following command:

```bash
pip install sentence-transformers
```

In a new Python source file, start by importing the required classes:

{{< clients-example set="home_query_vec" step="import" lang_filter="Python" description="Foundational: Import required libraries for vector embeddings, Redis operations, and search functionality" difficulty="beginner" >}}
{{< /clients-example >}}

The first of these imports is the
`SentenceTransformer` class, which generates an embedding from a section of text.
Here, we create an instance of `SentenceTransformer` that uses the
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
model for the embeddings. This model generates vectors with 384 dimensions, regardless
of the length of the input text, but note that the input is truncated to 256
tokens (see
[Word piece tokenization](https://huggingface.co/learn/nlp-course/en/chapter6/6)
at the [Hugging Face](https://huggingface.co/) docs to learn more about the way tokens
are related to the original text).

{{< clients-example set="home_query_vec" step="model" lang_filter="Python" description="Foundational: Initialize a SentenceTransformer model to generate vector embeddings from text" difficulty="beginner" >}}
{{< /clients-example >}}

## Create the index

Connect to Redis and delete any index previously created with the
name `vector_idx`. (The `dropindex()` call throws an exception if
the index doesn't already exist, which is why you need the
`try: except:` block.)

{{< clients-example set="home_query_vec" step="connect" lang_filter="Python" description="Foundational: Connect to a Redis server and clean up existing vector indexes" difficulty="beginner" >}}
{{< /clients-example >}}

Next, create the index.
The schema in the example below specifies hash objects for storage and includes
three fields: the text content to index, a
[tag]({{< relref "/develop/ai/search-and-query/advanced-concepts/tags" >}})
field to represent the "genre" of the text, and the embedding vector generated from
the original text content. The `embedding` field specifies
[HNSW]({{< relref "/develop/ai/search-and-query/vectors#hnsw-index" >}})
indexing, the
[L2]({{< relref "/develop/ai/search-and-query/vectors#distance-metrics" >}})
vector distance metric, `Float32` values to represent the vector's components,
and 384 dimensions, as required by the `all-MiniLM-L6-v2` embedding model.

{{< clients-example set="home_query_vec" step="create_index" lang_filter="Python" description="Foundational: Create a vector search index for hash documents with HNSW algorithm and L2 distance metric" difficulty="intermediate" >}}
{{< /clients-example >}}

## Add data

You can now supply the data objects, which will be indexed automatically
when you add them with [`hset()`]({{< relref "/commands/hset" >}}), as long as
you use the `doc:` prefix specified in the index definition.

Use the `model.encode()` method of `SentenceTransformer`
as shown below to create the embedding that represents the `content` field.
The `astype()` option that follows the `model.encode()` call specifies that
we want a vector of `float32` values. The `tobytes()` option encodes the
vector components together as a single binary string.
Use the binary string representation when you are indexing hashes
or running a query (but use a list of `float` for
[JSON documents](#differences-with-json-documents)).

{{< clients-example set="home_query_vec" step="add_data" lang_filter="Python" description="Foundational: Store hash documents with vector embeddings generated from text content" difficulty="beginner" >}}
{{< /clients-example >}}

## Run a query

After you have created the index and added the data, you are ready to run a query.
To do this, you must create another embedding vector from your chosen query
text. Redis calculates the similarity between the query vector and each
embedding vector in the index as it runs the query. It then ranks the
results in order of this numeric similarity value.

The code below creates the query embedding using `model.encode()`, as with
the indexing, and passes it as a parameter when the query executes
(see
[Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
for more information about using query parameters with embeddings).

{{< clients-example set="home_query_vec" step="query" lang_filter="Python" description="Vector similarity search: Find semantically similar documents by comparing query embeddings with indexed vectors using L2 distance" difficulty="intermediate" >}}
{{< /clients-example >}}

The code is now ready to run, but note that it may take a while to complete when
you run it for the first time (which happens because RedisVL must download the
`all-MiniLM-L6-v2` model data before it can
generate the embeddings). When you run the code, it outputs the following result
object (slightly formatted here for clarity):

```
Result{
    3 total,
    docs: [
        Document {
            'id': 'doc:0',
            'payload': None,
            'vector_distance': '0.114169985056',
            'content': 'That is a very happy person'
        },
        Document {
            'id': 'doc:1',
            'payload': None,
            'vector_distance': '0.610845386982',
            'content': 'That is a happy dog'
        },
        Document {
            'id': 'doc:2',
            'payload': None,
            'vector_distance': '1.48624813557',
            'content': 'Today is a sunny day'
        }
    ]
}
```

Note that the results are ordered according to the value of the `vector_distance`
field, with the lowest distance indicating the greatest similarity to the query.
As you would expect, the result for `doc:0` with the content text *"That is a very happy person"*
is the result that is most similar in meaning to the query text
*"That is a happy person"*.

## Differences with JSON documents

Indexing JSON documents is similar to hash indexing, but there are some
important differences. JSON allows much richer data modelling with nested fields, so
you must supply a [path]({{< relref "/develop/data-types/json/path" >}}) in the schema
to identify each field you want to index. However, you can declare a short alias for each
of these paths (using the `as_name` keyword argument) to avoid typing it in full for
every query. Also, you must specify `IndexType.JSON` when you create the index.

The code below shows these differences, but the index is otherwise very similar to
the one created previously for hashes:

{{< clients-example set="home_query_vec" step="json_index" lang_filter="Python" description="Foundational: Create a vector search index for JSON documents with JSON paths and field aliases" difficulty="intermediate" >}}
{{< /clients-example >}}

Use [`json().set()`]({{< relref "/commands/json.set" >}}) to add the data
instead of [`hset()`]({{< relref "/commands/hset" >}}). The dictionaries
that specify the fields have the same structure as the ones used for `hset()`
but `json().set()` receives them in a positional argument instead of
the `mapping` keyword argument.

An important difference with JSON indexing is that the vectors are
specified using lists instead of binary strings. Generate the list
using the `tolist()` method instead of `tobytes()` as you would with a
hash.

{{< clients-example set="home_query_vec" step="json_data" lang_filter="Python" description="Foundational: Store JSON documents with vector embeddings as lists (different from hash binary format)" difficulty="beginner" >}}
{{< /clients-example >}}

The query is almost identical to the one for the hash documents. This
demonstrates how the right choice of aliases for the JSON paths can
save you having to write complex queries. An important thing to notice
is that the vector parameter for the query is still specified as a
binary string (using the `tobytes()` method), even though the data for
the `embedding` field of the JSON was specified as a list.

{{< clients-example set="home_query_vec" step="json_query" lang_filter="Python" description="Vector similarity search: Query JSON documents using vector embeddings with field aliases for simplified syntax" difficulty="intermediate" >}}
{{< /clients-example >}}

Apart from the `jdoc:` prefixes for the keys, the result from the JSON
query is the same as for hash:

```
Result{
    3 total,
    docs: [
        Document {
            'id': 'jdoc:0',
            'payload': None,
            'vector_distance': '0.114169985056',
            'content': 'That is a very happy person'
        },
            .
            .
            .
```

## Learn more

See
[Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
for more information about the indexing options, distance metrics, and query format
for vectors.
