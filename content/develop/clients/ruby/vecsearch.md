---
bannerText: The redis-rb Query Engine support shown here is not yet available in a released gem and is subject to change.
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
- /develop/clients/ruby/queryjson
- /develop/ai/search-and-query
topics:
- Redis Search
- JSON
- hash
- vectors
weight: 3
---

[Redis Search]({{< relref "/develop/ai/search-and-query" >}})
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
[`informers`](https://github.com/ankane/informers) gem to generate the vector
embeddings to store and index with Redis Search. `informers` is a Ruby port of
Hugging Face transformers that runs the ONNX-exported
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
model locally on the CPU, so no external embedding service is required.
The code is first demonstrated for hash documents with a
separate section to explain the
[differences with JSON documents](#differences-with-json-documents).

{{< note >}}`redis-rb` uses query dialect 2 by default.
Redis Search methods such as [`search()`]({{< relref "/commands/ft.search" >}})
will explicitly request this dialect, overriding the default set for the server.
See
[Query dialects]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}})
for more information.
{{< /note >}}

## Initialize

Install [`redis-rb`]({{< relref "/develop/clients/ruby" >}}) if you
have not already done so. Also, install `informers` with the
following command:

```bash
gem install informers
```

The `informers` gem pulls in [`onnxruntime`](https://rubygems.org/gems/onnxruntime)
(which ships the ONNX Runtime shared library as a native extension) and
[`tokenizers`](https://rubygems.org/gems/tokenizers) (a Hugging Face fast-tokenizer
binding). Both come as pre-built binary gems for `arm64-darwin`, `x86_64-darwin`,
`aarch64-linux`, and `x86_64-linux`, so there is no system ONNX install step on
those platforms.

## Import dependencies

In a new Ruby source file, start by requiring the libraries and declaring a
short alias for the Query Engine namespace:

{{< clients-example set="ruby_home_query_vec" step="import" lang_filter="Ruby" description="Foundational: Import required libraries for vector embeddings, Redis operations, and search functionality" difficulty="beginner" >}}
{{< /clients-example >}}

## Initialize the embedding model

The [`Informers.pipeline`](https://github.com/ankane/informers#usage) method
returns a callable that generates an embedding from a section of text.
Here, we create a pipeline that uses the
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
model. This model generates vectors with 384 dimensions, regardless
of the length of the input text, but note that the input is truncated to 256
tokens (see
[Word piece tokenization](https://huggingface.co/learn/nlp-course/en/chapter6/6)
at the [Hugging Face](https://huggingface.co/) docs to learn more about the way tokens
are related to the original text).

{{< clients-example set="ruby_home_query_vec" step="model" lang_filter="Ruby" description="Foundational: Initialize an informers pipeline to generate vector embeddings from text" difficulty="beginner" >}}
{{< /clients-example >}}

## Define a helper method

The embedding pipeline returns the vector as an `Array` of `Float` values.
When you store a vector in a hash object, you must encode this array as a
binary string of raw little-endian `float32` values, which is the format
Redis Search expects. Declare a helper method `to_bytes` that packs the
array using Ruby's [`Array#pack`](https://docs.ruby-lang.org/en/master/Array.html#method-i-pack)
directive `'e*'`:

{{< clients-example set="ruby_home_query_vec" step="helper_method" lang_filter="Ruby" description="Foundational: Create a helper method to pack float arrays into binary strings for vector storage in hash objects" difficulty="beginner" >}}
{{< /clients-example >}}

## Create the index

Connect to Redis:

{{< clients-example set="ruby_home_query_vec" step="connect" lang_filter="Ruby" description="Foundational: Connect to a Redis server" difficulty="beginner" >}}
{{< /clients-example >}}

Next, delete any index previously created with the name `vector_idx`
(the `ft_dropindex` call raises an exception if the index doesn't already exist,
which is why you need the `begin`/`rescue` block) and create the index.
The schema in the example below specifies hash objects for storage and includes
three fields: the text content to index, a
[tag]({{< relref "/develop/ai/search-and-query/advanced-concepts/tags" >}})
field to represent the "genre" of the text, and the embedding vector generated from
the original text content. The `embedding` field specifies
[HNSW]({{< relref "/develop/ai/search-and-query/vectors#hnsw-index" >}})
indexing, the
[L2]({{< relref "/develop/ai/search-and-query/vectors#distance-metrics" >}})
vector distance metric, `FLOAT32` values to represent the vector's components,
and 384 dimensions, as required by the `all-MiniLM-L6-v2` embedding model.

{{< clients-example set="ruby_home_query_vec" step="create_index" lang_filter="Ruby" description="Foundational: Create a vector search index for hash documents with HNSW algorithm and L2 distance metric" difficulty="intermediate" >}}
{{< /clients-example >}}

## Add data

You can now supply the data objects, which will be indexed automatically
when you add them with [`hset()`]({{< relref "/commands/hset" >}}), as long as
you use the `doc:` prefix specified in the index definition.

Call the pipeline with `pooling: 'mean'` and `normalize: true` to create the
embedding that represents the `content` field, then pass the result through the
`to_bytes` helper to get the binary string that Redis Search indexes.

{{< clients-example set="ruby_home_query_vec" step="add_data" lang_filter="Ruby" description="Foundational: Store hash documents with vector embeddings generated from text content" difficulty="beginner" >}}
{{< /clients-example >}}

## Run a query

After you have created the index and added the data, you are ready to run a query.
To do this, you must create another embedding vector from your chosen query
text. Redis calculates the similarity between the query vector and each
embedding vector in the index as it runs the query. It then ranks the
results in order of this numeric similarity value.

The code below creates the query embedding, packs it with the `to_bytes` helper,
and passes it as a query parameter (see
[Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
for more information about using query parameters with embeddings).

{{< clients-example set="ruby_home_query_vec" step="query" lang_filter="Ruby" description="Vector similarity search: Find semantically similar documents by comparing query embeddings with indexed vectors using L2 distance" difficulty="intermediate" >}}
{{< /clients-example >}}

The code is now ready to run, but note that it may take a while to complete when
you run it for the first time (which happens because `informers` must download the
`all-MiniLM-L6-v2` model data before it can generate the embeddings). When you run
the code, it outputs the following result (the exact distances may differ slightly
on your system):

```
3
0: That is a very happy person (distance 0.114169895649)
1: That is a happy dog (distance 0.610845208168)
2: Today is a sunny day (distance 1.48624789715)
```

Note that the results are ordered according to the value of the `vector_distance`
field, with the lowest distance indicating the greatest similarity to the query.
As you would expect, the result for `doc:0` with the content text *"That is a very happy person"*
is the result that is most similar in meaning to the query text
*"That is a happy person"*.

Note also that `redis-rb` strips the key prefix (`doc:`) that the index
definition specifies, so the document id returned in the result is `0` rather
than `doc:0`.

## Differences with JSON documents

Indexing JSON documents is similar to hash indexing, but there are some
important differences. JSON allows much richer data modelling with nested fields, so
you must supply a [path]({{< relref "/develop/data-types/json/path" >}}) in the schema
to identify each field you want to index. However, you can declare a short alias for each
of these paths (using the `as:` keyword argument) to avoid typing it in full for
every query. Also, you must specify `Search::IndexType::JSON` when you create the index.

The code below shows these differences, but the index is otherwise very similar to
the one created previously for hashes:

{{< clients-example set="ruby_home_query_vec" step="json_index" lang_filter="Ruby" description="Foundational: Create a vector search index for JSON documents with JSON paths and field aliases" difficulty="intermediate" >}}
{{< /clients-example >}}

Use [`json_set()`]({{< relref "/commands/json.set" >}}) to add the data
instead of [`hset()`]({{< relref "/commands/hset" >}}).

An important difference with JSON indexing is that the vectors are
specified using arrays instead of binary strings. Pass the `Array<Float>`
returned by the embedding pipeline directly, without the `to_bytes` step
you use for a hash.

{{< clients-example set="ruby_home_query_vec" step="json_data" lang_filter="Ruby" description="Foundational: Store JSON documents with vector embeddings as arrays (different from hash binary format)" difficulty="beginner" >}}
{{< /clients-example >}}

The query is almost identical to the one for the hash documents. This
demonstrates how the right choice of aliases for the JSON paths can
save you having to write complex queries. An important thing to notice
is that the vector parameter for the query is still specified as a
binary string (using the `to_bytes` helper), even though the data for
the `embedding` field of the JSON was specified as an array.

{{< clients-example set="ruby_home_query_vec" step="json_query" lang_filter="Ruby" description="Vector similarity search: Query JSON documents using vector embeddings with field aliases for simplified syntax" difficulty="intermediate" >}}
{{< /clients-example >}}

Apart from the `jdoc:` prefixes for the keys, the result from the JSON
query is the same as for hash:

```
3
0: That is a very happy person (distance 0.114169895649)
1: That is a happy dog (distance 0.610845208168)
2: Today is a sunny day (distance 1.48624789715)
```

## Learn more

See
[Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
for more information about the indexing options, distance metrics, and query format
for vectors.
