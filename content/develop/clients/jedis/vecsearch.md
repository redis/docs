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
[`sentence-transformers`](https://pypi.org/project/sentence-transformers/)
library to generate vector embeddings to store and index with
Redis Query Engine.

## Initialize

Install [`jedis`]({{< relref "/develop/clients/jedis" >}}) if you
have not already done so.

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

// Tokenizer to generate the vector embeddings.
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer;
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
                "DISTANCE_METRIC", "L2",
                "INITIAL_CAP", 3
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

## Define some helper methods



## Add data

You can now supply the data objects, which will be indexed automatically
when you add them with [`hset()`]({{< relref "/commands/hset" >}}), as long as
you use the `doc:` prefix specified in the index definition.

Use the `model.encode()` method of `SentenceTransformer`
as shown below to create the embedding that represents the `content` field.
The `astype()` option that follows the `model.encode()` call specifies that
we want a vector of `float32` values. The `tobytes()` option encodes the
vector components together as a single binary string rather than the
default Python list of `float` values.
Use the binary string representation when you are indexing hash objects
(as we are here), but use the default list of `float` for JSON objects.

```java
String sentence1 = "That is a very happy person";
jedis.hset("doc:1", Map.of(  "content", sentence1, "genre", "persons"));
jedis.hset(
    "doc:1".getBytes(),
    "embedding".getBytes(),
    longArrayToByteArray(sentenceTokenizer.encode(sentence1).getIds())
);

String sentence2 = "That is a happy dog";
jedis.hset("doc:2", Map.of(  "content", sentence2, "genre", "pets"));
jedis.hset("doc:2".getBytes(), "embedding".getBytes(), longArrayToByteArray(sentenceTokenizer.encode(sentence2).getIds()));

String sentence3 = "Today is a sunny day";
Map<String, String> doc3 = Map.of(  "content", sentence3, "genre", "weather");
jedis.hset("doc:3", doc3);
jedis.hset("doc:3".getBytes(), "embedding".getBytes(), longArrayToByteArray(sentenceTokenizer.encode(sentence3).getIds()));

```

## Run a query

After you have created the index and added the data, you are ready to run a query.
To do this, you must create another embedding vector from your chosen query
text. Redis calculates the similarity between the query vector and each
embedding vector in the index as it runs the query. It then ranks the
results in order of this numeric similarity value.

The code below creates the query embedding using `model.encode()`, as with
the indexing, and passes it as a parameter when the query executes
(see
[Vector search]({{< relref "/develop/interact/search-and-query/query/vector-search" >}})
for more information about using query parameters with embeddings).

```python
q = Query(
    "*=>[KNN 3 @embedding $vec AS vector_distance]"
).return_field("score").dialect(2)

query_text = "That is a happy person"

res = r.ft("vector_idx").search(
    q, query_params={
        "vec": model.encode(query_text).astype(np.float32).tobytes()
    }
)

print(res)
```

The code is now ready to run, but note that it may take a while to complete when
you run it for the first time (which happens because RedisVL must download the
`all-MiniLM-L6-v2` model data before it can
generate the embeddings). When you run the code, it outputs the following result
object (slightly formatted here for clarity):

```Python
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

## Learn more

See
[Vector search]({{< relref "/develop/interact/search-and-query/query/vector-search" >}})
for more information about the indexing options, distance metrics, and query format
for vectors.
