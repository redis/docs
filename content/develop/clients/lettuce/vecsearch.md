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
- /develop/clients/lettuce/queryjson
- /develop/clients/lettuce/vecsets
- /develop/ai/search-and-query
topics:
- Redis Query Engine
- JSON
- hash
- vectors
weight: 3
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

The example below uses the [HuggingFace](https://huggingface.co/) model
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
to generate the vector embeddings to store and index with Redis Query Engine.
The code is first demonstrated for hash documents with a
separate section to explain the
[differences with JSON documents](#differences-with-json-documents).

## Initialize

If you are using [Maven](https://maven.apache.org/), add the following
dependencies to your `pom.xml` file:

```xml
<dependency>
    <groupId>io.lettuce</groupId>
    <artifactId>lettuce-core</artifactId>
     <!-- Check for the latest version on Maven Central -->
    <version>6.7.1.RELEASE</version>
</dependency>

<dependency>
    <groupId>ai.djl.huggingface</groupId>
    <artifactId>tokenizers</artifactId>
    <version>0.33.0</version>
</dependency>

<dependency>
    <groupId>ai.djl.pytorch</groupId>
    <artifactId>pytorch-model-zoo</artifactId>
    <version>0.33.0</version>
</dependency>

<dependency>
    <groupId>ai.djl</groupId>
    <artifactId>api</artifactId>
    <version>0.33.0</version>
</dependency>
```

If you are using [Gradle](https://gradle.org/), add the following
dependencies to your `build.gradle` file:

```bash
compileOnly 'io.lettuce:lettuce-core:6.7.1.RELEASE'
compileOnly 'ai.djl.huggingface:tokenizers:0.33.0'
compileOnly 'ai.djl.pytorch:pytorch-model-zoo:0.33.0'
compileOnly 'ai.djl:api:0.33.0'
```

## Import dependencies

Import the following classes in your source file:

{{< clients-example set="home_query_vec" step="import" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

## Define a helper method

When you store vectors in a hash object, or pass them as query parameters,
you must encode the `float` components of the vector
array as a `byte` string. The helper method `floatArrayToByteBuffer()`
shown below does this for you:

{{< clients-example set="home_query_vec" step="helper_method" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

## Create an embedding model instance

The example below uses the
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
model to generate the embeddings. This model generates vectors with 384 dimensions, regardless of the length of the input text, but note that the input is truncated to 256
tokens (see
[Word piece tokenization](https://huggingface.co/learn/nlp-course/en/chapter6/6)
at the [Hugging Face](https://huggingface.co/) docs to learn more about the way tokens
are related to the original text).

The [`Predictor`](https://javadoc.io/doc/ai.djl/api/latest/ai/djl/inference/Predictor.html)
class implements the model to generate the embeddings. The code below
creates an instance of `Predictor` that uses the `all-MiniLM-L6-v2` model:

{{< clients-example set="home_query_vec" step="model" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

## Create the index

As noted in [Define a helper method](#define-a-helper-method) above, you must
pass the embeddings to the hash and query commands as a binary string.

Lettuce has an option to specify a `ByteBufferCodec` for the connection to Redis.
This lets you construct binary strings for Redis keys and values conveniently using
the standard
[`ByteBuffer`](https://docs.oracle.com/javase/8/docs/api/java/nio/ByteBuffer.html)
class (see [Codecs](https://redis.github.io/lettuce/integration-extension/#codecs)
in the Lettuce documentation for more information). However, you will probably find
it more convenient to use the default `StringCodec` for commands that don't require binary strings. It is therefore helpful to have two connections available, one using `ByteBufferCodec` and one using `StringCodec`.

The code below shows how to declare one connection with the
`ByteBufferCodec` and another without in the try-with-resources
block. You also need two separate instances of `RedisAsyncCommands` to
use the two connections:

{{< clients-example set="home_query_vec" step="connect" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

Next, create the index.
The schema in the example below includes three fields:

-   The text content to index
-   A [tag]({{< relref "/develop/ai/search-and-query/advanced-concepts/tags" >}})
    field to represent the "genre" of the text
-   The embedding vector generated from the original text content

The `embedding` field specifies
[HNSW]({{< relref "/develop/ai/search-and-query/vectors#hnsw-index" >}}) 
indexing, the
[L2]({{< relref "/develop/ai/search-and-query/vectors#distance-metrics" >}})
vector distance metric, `Float32` values to represent the vector's components,
and 384 dimensions, as required by the `all-MiniLM-L6-v2` embedding model.

The `CreateArgs` object specifies hash objects for storage and a
prefix `doc:` that identifies the hash objects to index.

{{< clients-example set="home_query_vec" step="create_index" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

## Add data

You can now supply the data objects, which will be indexed automatically
when you add them with [`hset()`]({{< relref "/commands/hset" >}}), as long as
you use the `doc:` prefix specified in the index definition.

Use the `predict()` method of the `Predictor` object
as shown below to create the embedding that represents the `content` field
and use the `floatArrayToByteBuffer()` helper method to convert it to a binary string.
Use the binary string representation when you are
indexing hash objects, but use an array of `float` for
JSON objects (see [Differences with JSON objects](#differences-with-json-documents)
below).

You must use instances of `Map<ByteBuffer, ByteBuffer>` to supply the data to `hset()`
when using the `ByteBufferCodec` connection, which adds a little complexity. Note
that the `predict()` call is in a `try`/`catch` block because it will throw
exceptions if it can't download the embedding model (you should add code to handle
the exceptions in production code).

{{< clients-example set="home_query_vec" step="add_data" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

## Run a query

After you have created the index and added the data, you are ready to run a query.
To do this, you must create another embedding vector from your chosen query
text. Redis calculates the vector distance between the query vector and each
embedding vector in the index as it runs the query. You can request the results to be
sorted to rank them in order of ascending distance.

The code below creates the query embedding using the `predict()` method, as with
the indexing, and passes it as a parameter when the query executes (see
[Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
for more information about using query parameters with embeddings).
The query is a
[K nearest neighbors (KNN)]({{< relref "/develop/ai/search-and-query/vectors#knn-vector-search" >}})
search that sorts the results in order of vector distance from the query vector.

{{< clients-example set="home_query_vec" step="query" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

Assuming you have added the code from the steps above to your source file,
it is now ready to run, but note that it may take a while to complete when
you run it for the first time (which happens because the model must download the
`all-MiniLM-L6-v2` model data before it can
generate the embeddings). When you run the code, it outputs the following result text:

```
Results:
ID: doc:1, Content: That is a very happy person, Distance: 0.114169836044
ID: doc:2, Content: That is a happy dog, Distance: 0.610845506191
ID: doc:3, Content: Today is a sunny day, Distance: 1.48624765873
```

Note that the results are ordered according to the value of the `distance`
field, with the lowest distance indicating the greatest similarity to the query.
As you would expect, the result for `doc:1` with the content text
*"That is a very happy person"*
is the result that is most similar in meaning to the query text
*"That is a happy person"*.

## Differences with JSON documents

Indexing JSON documents is similar to hash indexing, but there are some
important differences. JSON allows much richer data modeling with nested fields, so
you must supply a [path]({{< relref "/develop/data-types/json/path" >}}) in the schema
to identify each field you want to index. However, you can declare a short alias for each
of these paths (using the `as()` option) to avoid typing it in full for
every query. Also, you must specify `CreateArgs.TargetType.JSON` when you create the index.

The code below shows these differences, but the index is otherwise very similar to
the one created previously for hashes:

{{< clients-example set="home_query_vec" step="json_schema" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

An important difference with JSON indexing is that the vectors are
specified using arrays of `float` instead of binary strings. This means
you don't need to use the `ByteBufferCodec` connection, and you can use
[`Arrays.toString()`](https://docs.oracle.com/javase/8/docs/api/java/util/Arrays.html#toString-float:A-) to convert the `float` array to a suitable JSON string.

Use [`jsonSet()`]({{< relref "/commands/json.set" >}}) to add the data
instead of [`hset()`]({{< relref "/commands/hset" >}}). Use instances
of `JSONObject` to supply the data instead of `Map`, as you would for
hash objects.

{{< clients-example set="home_query_vec" step="json_data" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

The query is almost identical to the one for the hash documents. This
demonstrates how the right choice of aliases for the JSON paths can
save you having to write complex queries. An important thing to notice
is that the vector parameter for the query is still specified as a
binary string, even though the data for the `embedding` field of the JSON
was specified as an array.

{{< clients-example set="home_query_vec" step="json_query" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

The distance values are not identical to the hash query because the
string representations of the vectors used here are stored with different
precisions. However, the relative order of the results is the same:

```
Results:
ID: jdoc:1, Content: That is a very happy person, Distance: 0.628328084946
ID: jdoc:2, Content: That is a happy dog, Distance: 0.895147025585
ID: jdoc:3, Content: Today is a sunny day, Distance: 1.49569523335
```

## Learn more

See
[Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
for more information about the indexing options, distance metrics, and query format
for vectors.
