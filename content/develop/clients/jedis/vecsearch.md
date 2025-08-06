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
Among other things, vector fields can store *text embeddings*, which are AI-generated vector
representations of the semantic information in pieces of text. The
[vector distance]({{< relref "/develop/ai/search-and-query/vectors#distance-metrics" >}})
between two embeddings indicates how similar they are semantically. By comparing the
similarity of an embedding generated from some query text with embeddings stored in hash
or JSON fields, Redis can retrieve documents that closely match the query in terms
of their meaning.

In the example below, we use the [HuggingFace](https://huggingface.co/) model
[`all-mpnet-base-v2`](https://huggingface.co/sentence-transformers/all-mpnet-base-v2)
to generate the vector embeddings to store and index with Redis Query Engine.
The code is first demonstrated for hash documents with a
separate section to explain the
[differences with JSON documents](#differences-with-json-documents).

{{< note >}}From [v6.0.0](https://github.com/redis/jedis/releases/tag/v6.0.0) onwards,
`Jedis` uses query dialect 2 by default.
Redis query engine methods such as [`ftSearch()`]({{< relref "/commands/ft.search" >}})
will explicitly request this dialect, overriding the default set for the server.
See
[Query dialects]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}})
for more information.
{{< /note >}}

## Initialize

If you are using [Maven](https://maven.apache.org/), add the following
dependencies to your `pom.xml` file:

```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>5.2.0</version>
</dependency>
<dependency>
    <groupId>ai.djl.huggingface</groupId>
    <artifactId>tokenizers</artifactId>
    <version>0.24.0</version>
</dependency>
```

If you are using [Gradle](https://gradle.org/), add the following
dependencies to your `build.gradle` file:

```bash
implementation 'redis.clients:jedis:5.2.0'
implementation 'ai.djl.huggingface:tokenizers:0.24.0'
```

## Import dependencies

Import the following classes in your source file:

{{< clients-example set="HomeQueryVec" step="import" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

## Define a helper method

Our embedding model represents the vectors as an array of `long` integer values,
but Redis Query Engine expects the vector components to be `float` values.
Also, when you store vectors in a hash object, you must encode the vector
array as a `byte` string. To simplify this situation, we declare a helper
method `longsToFloatsByteString()` that takes the `long` array that the
embedding model returns, converts it to an array of `float` values, and
then encodes the `float` array as a `byte` string:

{{< clients-example set="HomeQueryVec" step="helper_method" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

## Create a tokenizer instance

We will use the
[`all-mpnet-base-v2`](https://huggingface.co/sentence-transformers/all-mpnet-base-v2)
tokenizer to generate the embeddings. The vectors that represent the
embeddings have 768 components, regardless of the length of the input
text.

{{< clients-example set="HomeQueryVec" step="tokenizer" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

## Create the index

Connect to Redis and delete any index previously created with the
name `vector_idx`. (The `ftDropIndex()` call throws an exception if
the index doesn't already exist, which is why you need the
`try...catch` block.)

{{< clients-example set="HomeQueryVec" step="connect" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

Next, we create the index.
The schema in the example below includes three fields: the text content to index, a
[tag]({{< relref "/develop/ai/search-and-query/advanced-concepts/tags" >}})
field to represent the "genre" of the text, and the embedding vector generated from
the original text content. The `embedding` field specifies
[HNSW]({{< relref "/develop/ai/search-and-query/vectors#hnsw-index" >}}) 
indexing, the
[L2]({{< relref "/develop/ai/search-and-query/vectors#distance-metrics" >}})
vector distance metric, `Float32` values to represent the vector's components,
and 768 dimensions, as required by the `all-mpnet-base-v2` embedding model.

The `FTCreateParams` object specifies hash objects for storage and a
prefix `doc:` that identifies the hash objects we want to index.

{{< clients-example set="HomeQueryVec" step="create_index" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

## Add data

You can now supply the data objects, which will be indexed automatically
when you add them with [`hset()`]({{< relref "/commands/hset" >}}), as long as
you use the `doc:` prefix specified in the index definition.

Use the `encode()` method of the `sentenceTokenizer` object
as shown below to create the embedding that represents the `content` field.
The `getIds()` method that follows `encode()` obtains the vector
of `long` values which we then convert to a `float` array stored as a `byte`
string using our helper method. Use the `byte` string representation when you are
indexing hash objects (as we are here), but use an array of `float` for
JSON objects (see [Differences with JSON objects](#differences-with-json-documents)
below). Note that when we set the `embedding` field, we must use an overload
of `hset()` that requires `byte` arrays for each of the key, the field name, and
the value, which is why we include the `getBytes()` calls on the strings.

{{< clients-example set="HomeQueryVec" step="add_data" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

## Run a query

After you have created the index and added the data, you are ready to run a query.
To do this, you must create another embedding vector from your chosen query
text. Redis calculates the vector distance between the query vector and each
embedding vector in the index as it runs the query. We can request the results to be
sorted to rank them in order of ascending distance.

The code below creates the query embedding using the `encode()` method, as with
the indexing, and passes it as a parameter when the query executes (see
[Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
for more information about using query parameters with embeddings).
The query is a
[K nearest neighbors (KNN)]({{< relref "/develop/ai/search-and-query/vectors#knn-vector-search" >}})
search that sorts the results in order of vector distance from the query vector.

{{< clients-example set="HomeQueryVec" step="query" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

Assuming you have added the code from the steps above to your source file,
it is now ready to run, but note that it may take a while to complete when
you run it for the first time (which happens because the tokenizer must download the
`all-mpnet-base-v2` model data before it can
generate the embeddings). When you run the code, it outputs the following result text:

```
Results:
ID: doc:2, Distance: 1411344, Content: That is a happy dog
ID: doc:1, Distance: 9301635, Content: That is a very happy person
ID: doc:3, Distance: 67178800, Content: Today is a sunny day
```

Note that the results are ordered according to the value of the `distance`
field, with the lowest distance indicating the greatest similarity to the query.
For this model, the text *"That is a happy dog"*
is the result judged to be most similar in meaning to the query text
*"That is a happy person"*.

## Differences with JSON documents

Indexing JSON documents is similar to hash indexing, but there are some
important differences. JSON allows much richer data modeling with nested fields, so
you must supply a [path]({{< relref "/develop/data-types/json/path" >}}) in the schema
to identify each field you want to index. However, you can declare a short alias for each
of these paths (using the `as()` option) to avoid typing it in full for
every query. Also, you must specify `IndexDataType.JSON` when you create the index.

The code below shows these differences, but the index is otherwise very similar to
the one created previously for hashes:

{{< clients-example set="HomeQueryVec" step="json_schema" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

An important difference with JSON indexing is that the vectors are
specified using arrays of `float` instead of binary strings. This requires
a modified version of the `longsToFloatsByteString()` method
used previously:

{{< clients-example set="HomeQueryVec" step="json_helper_method" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

Use [`jsonSet()`]({{< relref "/commands/json.set" >}}) to add the data
instead of [`hset()`]({{< relref "/commands/hset" >}}). Use instances
of `JSONObject` to supply the data instead of `Map`, as you would for
hash objects.

{{< clients-example set="HomeQueryVec" step="json_data" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

The query is almost identical to the one for the hash documents. This
demonstrates how the right choice of aliases for the JSON paths can
save you having to write complex queries. An important thing to notice
is that the vector parameter for the query is still specified as a
binary string (using the `longsToFloatsByteString()` method), even though
the data for the `embedding` field of the JSON was specified as an array.

{{< clients-example set="HomeQueryVec" step="json_query" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

Apart from the `jdoc:` prefixes for the keys, the result from the JSON
query is the same as for hash:

```
Results:
ID: jdoc:2, Distance: 1411344, Content: That is a happy dog
ID: jdoc:1, Distance: 9301635, Content: That is a very happy person
ID: jdoc:3, Distance: 67178800, Content: Today is a sunny day
```

## Learn more

See
[Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
for more information about the indexing options, distance metrics, and query format
for vectors.
