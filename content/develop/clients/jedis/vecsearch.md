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

In the example below, we use the [HuggingFace](https://huggingface.co/) model
[`all-mpnet-base-v2`](https://huggingface.co/sentence-transformers/all-mpnet-base-v2)
to generate the vector embeddings to store and index with Redis Query Engine.
The code is first demonstrated for hash documents with a
separate section to explain the
[differences with JSON documents](#differences-with-json-documents).

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

```java
// Jedis client and query engine classes.
import redis.clients.jedis.UnifiedJedis;
import redis.clients.jedis.search.*;
import redis.clients.jedis.search.schemafields.*;
import redis.clients.jedis.search.schemafields.VectorField.VectorAlgorithm;
import redis.clients.jedis.exceptions.JedisDataException;

// Data manipulation.
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Map;
import java.util.List;
import org.json.JSONObject;

// Tokenizer to generate the vector embeddings.
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer;
```

## Define a helper method

Our embedding model represents the vectors as an array of `long` integer values,
but Redis Query Engine expects the vector components to be `float` values.
Also, when you store vectors in a hash object, you must encode the vector
array as a `byte` string. To simplify this situation, we declare a helper
method `longsToFloatsByteString()` that takes the `long` array that the
embedding model returns, converts it to an array of `float` values, and
then encodes the `float` array as a `byte` string:

```java
public static byte[] longsToFloatsByteString(long[] input) {
    float[] floats = new float[input.length];
    for (int i = 0; i < input.length; i++) {
        floats[i] = input[i];
    }

    byte[] bytes = new byte[Float.BYTES * floats.length];
    ByteBuffer
        .wrap(bytes)
        .order(ByteOrder.LITTLE_ENDIAN)
        .asFloatBuffer()
        .put(floats);
    return bytes;
}
```

## Create a tokenizer instance

We will use the
[`all-mpnet-base-v2`](https://huggingface.co/sentence-transformers/all-mpnet-base-v2)
tokenizer to generate the embeddings. The vectors that represent the
embeddings have 768 components, regardless of the length of the input
text.

```java
HuggingFaceTokenizer sentenceTokenizer = HuggingFaceTokenizer.newInstance(
    "sentence-transformers/all-mpnet-base-v2",
    Map.of("maxLength", "768",  "modelMaxLength", "768")
);
```

## Create the index

Connect to Redis and delete any index previously created with the
name `vector_idx`. (The `ftDropIndex()` call throws an exception if
the index doesn't already exist, which is why you need the
`try...catch` block.)

```java
UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");

try {jedis.ftDropIndex("vector_idx");} catch (JedisDataException j){}
```

Next, we create the index.
The schema in the example below includes three fields: the text content to index, a
[tag]({{< relref "/develop/interact/search-and-query/advanced-concepts/tags" >}})
field to represent the "genre" of the text, and the embedding vector generated from
the original text content. The `embedding` field specifies
[HNSW]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors#hnsw-index" >}}) 
indexing, the
[L2]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors#distance-metrics" >}})
vector distance metric, `Float32` values to represent the vector's components,
and 768 dimensions, as required by the `all-mpnet-base-v2` embedding model.

The `FTCreateParams` object specifies hash objects for storage and a
prefix `doc:` that identifies the hash objects we want to index.

```java
SchemaField[] schema = {
    TextField.of("content"),
    TagField.of("genre"),
    VectorField.builder()
        .fieldName("embedding")
        .algorithm(VectorAlgorithm.HNSW)
        .attributes(
            Map.of(
                "TYPE", "FLOAT32",
                "DIM", 768,
                "DISTANCE_METRIC", "L2"
            )
        )
        .build()
};

jedis.ftCreate("vector_idx",
    FTCreateParams.createParams()
        .addPrefix("doc:")
        .on(IndexDataType.HASH),
        schema
);
```

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

```java
String sentence1 = "That is a very happy person";
jedis.hset("doc:1", Map.of("content", sentence1, "genre", "persons"));
jedis.hset(
    "doc:1".getBytes(),
    "embedding".getBytes(),
    longsToFloatsByteString(sentenceTokenizer.encode(sentence1).getIds())
);

String sentence2 = "That is a happy dog";
jedis.hset("doc:2", Map.of("content", sentence2, "genre", "pets"));
jedis.hset(
    "doc:2".getBytes(),
    "embedding".getBytes(),
    longsToFloatsByteString(sentenceTokenizer.encode(sentence2).getIds())
);

String sentence3 = "Today is a sunny day";
jedis.hset("doc:3", Map.of("content", sentence3, "genre", "weather"));
jedis.hset(
    "doc:3".getBytes(),
    "embedding".getBytes(),
    longsToFloatsByteString(sentenceTokenizer.encode(sentence3).getIds())
);
```

## Run a query

After you have created the index and added the data, you are ready to run a query.
To do this, you must create another embedding vector from your chosen query
text. Redis calculates the vector distance between the query vector and each
embedding vector in the index as it runs the query. We can request the results to be
sorted to rank them in order of ascending distance.

The code below creates the query embedding using the `encode()` method, as with
the indexing, and passes it as a parameter when the query executes (see
[Vector search]({{< relref "/develop/interact/search-and-query/query/vector-search" >}})
for more information about using query parameters with embeddings).
The query is a
[K nearest neighbors (KNN)]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors#knn-vector-search" >}})
search that sorts the results in order of vector distance from the query vector.

```java
String sentence = "That is a happy person";

int K = 3;
Query q = new Query("*=>[KNN $K @embedding $BLOB AS distance]")
                .returnFields("content", "distance")
                .addParam("K", K)
                .addParam(
                    "BLOB",
                    longsToFloatsByteString(
                        sentenceTokenizer.encode(sentence)..getIds()
                    )
                )
                .setSortBy("distance", true)
                .dialect(2);

List<Document> docs = jedis.ftSearch("vector_idx", q).getDocuments();

for (Document doc: docs) {
    System.out.println(
        String.format(
            "ID: %s, Distance: %s, Content: %s",
            doc.getId(),
            doc.get("distance"),
            doc.get("content")
        )
    );
}
```

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
important differences. JSON allows much richer data modelling with nested fields, so
you must supply a [path]({{< relref "/develop/data-types/json/path" >}}) in the schema
to identify each field you want to index. However, you can declare a short alias for each
of these paths (using the `as()` option) to avoid typing it in full for
every query. Also, you must specify `IndexDataType.JSON` when you create the index.

The code below shows these differences, but the index is otherwise very similar to
the one created previously for hashes:

```java
SchemaField[] jsonSchema = {
    TextField.of("$.content").as("content"),
    TagField.of("$.genre").as("genre"),
    VectorField.builder()
        .fieldName("$.embedding").as("embedding")
        .algorithm(VectorAlgorithm.HNSW)
        .attributes(
            Map.of(
                "TYPE", "FLOAT32",
                "DIM", 768,
                "DISTANCE_METRIC", "L2"
            )
        )
        .build()
};

jedis.ftCreate("vector_json_idx",
    FTCreateParams.createParams()
        .addPrefix("jdoc:")
        .on(IndexDataType.JSON),
        jsonSchema
);
```

An important difference with JSON indexing is that the vectors are
specified using arrays of `float` instead of binary strings. This requires
a modified version of the `longsToFloatsByteString()` method
used previously:

```java
public static float[] longArrayToFloatArray(long[] input) {
    float[] floats = new float[input.length];
    for (int i = 0; i < input.length; i++) {
        floats[i] = input[i];
    }
    return floats;
}
```

Use [`jsonSet()`]({{< relref "/commands/json.set" >}}) to add the data
instead of [`hset()`]({{< relref "/commands/hset" >}}). Use instances
of `JSONObject` to supply the data instead of `Map`, as you would for
hash objects.

```java
String jSentence1 = "That is a very happy person";

JSONObject jdoc1 = new JSONObject()
        .put("content", jSentence1)
        .put("genre", "persons")
        .put(
            "embedding",
            longArrayToFloatArray(
                sentenceTokenizer.encode(jSentence1).getIds()
            )
        );

jedis.jsonSet("jdoc:1", Path2.ROOT_PATH, jdoc1);

String jSentence2 = "That is a happy dog";

JSONObject jdoc2 = new JSONObject()
        .put("content", jSentence2)
        .put("genre", "pets")
        .put(
            "embedding",
            longArrayToFloatArray(
                sentenceTokenizer.encode(jSentence2).getIds()
            )
        );

jedis.jsonSet("jdoc:2", Path2.ROOT_PATH, jdoc2);

String jSentence3 = "Today is a sunny day";

JSONObject jdoc3 = new JSONObject()
        .put("content", jSentence3)
        .put("genre", "weather")
        .put(
            "embedding",
            longArrayToFloatArray(
                sentenceTokenizer.encode(jSentence3).getIds()
            )
        );

jedis.jsonSet("jdoc:3", Path2.ROOT_PATH, jdoc3);
```

The query is almost identical to the one for the hash documents. This
demonstrates how the right choice of aliases for the JSON paths can
save you having to write complex queries. An important thing to notice
is that the vector parameter for the query is still specified as a
binary string (using the `longsToFloatsByteString()` method), even though
the data for the `embedding` field of the JSON was specified as an array.

```java
String jSentence = "That is a happy person";

int jK = 3;
Query jq = new Query("*=>[KNN $K @embedding $BLOB AS distance]").
                    returnFields("content", "distance").
                    addParam("K", jK).
                    addParam(
                        "BLOB",
                        longsToFloatsByteString(
                            sentenceTokenizer.encode(jSentence).getIds()
                        )
                    )
                    .setSortBy("distance", true)
                    .dialect(2);

// Execute the query
List<Document> jDocs = jedis
        .ftSearch("vector_json_idx", jq)
        .getDocuments();

```

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
[Vector search]({{< relref "/develop/interact/search-and-query/query/vector-search" >}})
for more information about the indexing options, distance metrics, and query format
for vectors.
