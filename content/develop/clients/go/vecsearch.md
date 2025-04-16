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
[Vectors]({{< relref "/develop/ai/vector-fields" >}}) 
reference page for more information).
Among other things, vector fields can store *text embeddings*, which are AI-generated vector
representations of the semantic information in pieces of text. The
[vector distance]({{< relref "/develop/ai/vector-fields#distance-metrics" >}})
between two embeddings indicates how similar they are semantically. By comparing the
similarity of an embedding generated from some query text with embeddings stored in hash
or JSON fields, Redis can retrieve documents that closely match the query in terms
of their meaning.

In the example below, we use the
[`huggingfaceembedder`](https://pkg.go.dev/github.com/henomis/lingoose@v0.3.0/embedder/huggingface)
package from the [`LinGoose`](https://pkg.go.dev/github.com/henomis/lingoose@v0.3.0)
framework to generate vector embeddings to store and index with
Redis Query Engine.

## Initialize

Start a new Go module with the following command:

```bash 
go mod init vecexample
```

Then, in your module folder, install
[`go-redis`]({{< relref "/develop/clients/go" >}})
and the 
[`huggingfaceembedder`](https://pkg.go.dev/github.com/henomis/lingoose@v0.3.0/embedder/huggingface)
package:

```bash
go get github.com/redis/go-redis/v9
go get github.com/henomis/lingoose/embedder/huggingface
```

Add the following imports to your module's main program file:

```go
package main

import (
	"context"
	"encoding/binary"
	"fmt"
	"math"

	huggingfaceembedder "github.com/henomis/lingoose/embedder/huggingface"
	"github.com/redis/go-redis/v9"
)
```

You must also create a [HuggingFace account](https://huggingface.co/join)
and add a new access token to use the embedding model. See the
[HuggingFace](https://huggingface.co/docs/hub/en/security-tokens)
docs to learn how to create and manage access tokens. Note that the
account and the `all-MiniLM-L6-v2` model that we will use to produce
the embeddings for this example are both available for free.

## Add a helper function

The `huggingfaceembedder` model outputs the embeddings as a
`[]float32` array. If you are storing your documents as
[hash]({{< relref "/develop/data-types/hashes" >}}) objects
(as we are in this example), then you must convert this array
to a `byte` string before adding it as a hash field. In this example,
we will use the function below to produce the `byte` string:

```go
func floatsToBytes(fs []float32) []byte {
	buf := make([]byte, len(fs)*4)

	for i, f := range fs {
		u := math.Float32bits(f)
		binary.NativeEndian.PutUint32(buf[i*4:], u)
	}

	return buf
}
```

Note that if you are using [JSON]({{< relref "/develop/data-types/json" >}})
objects to store your documents instead of hashes, then you should store
the `[]float32` array directly without first converting it to a `byte`
string.

## Create the index

In the `main()` function, connect to Redis and delete any index previously
created with the name `vector_idx`:

```go
ctx := context.Background()
rdb := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    Password: "", // no password docs
    DB:       0,  // use default DB
    Protocol: 2,
})

rdb.FTDropIndexWithArgs(ctx,
    "vector_idx",
    &redis.FTDropIndexOptions{
        DeleteDocs: true,
    },
)
```

Next, create the index.
The schema in the example below specifies hash objects for storage and includes
three fields: the text content to index, a
[tag]({{< relref "/develop/interact/search-and-query/advanced-concepts/tags" >}})
field to represent the "genre" of the text, and the embedding vector generated from
the original text content. The `embedding` field specifies
[HNSW]({{< relref "/develop/ai/vector-fields#hnsw-index" >}}) 
indexing, the
[L2]({{< relref "/develop/ai/vector-fields#distance-metrics" >}})
vector distance metric, `Float32` values to represent the vector's components,
and 384 dimensions, as required by the `all-MiniLM-L6-v2` embedding model.

```go
_, err := rdb.FTCreate(ctx,
    "vector_idx",
    &redis.FTCreateOptions{
        OnHash: true,
        Prefix: []any{"doc:"},
    },
    &redis.FieldSchema{
        FieldName: "content",
        FieldType: redis.SearchFieldTypeText,
    },
    &redis.FieldSchema{
        FieldName: "genre",
        FieldType: redis.SearchFieldTypeTag,
    },
    &redis.FieldSchema{
        FieldName: "embedding",
        FieldType: redis.SearchFieldTypeVector,
        VectorArgs: &redis.FTVectorArgs{
            HNSWOptions: &redis.FTHNSWOptions{
                Dim:            384,
                DistanceMetric: "L2",
                Type:           "FLOAT32",
            },
        },
    },
).Result()

if err != nil {
    panic(err)
}
```

## Create an embedder instance

You need an instance of the `huggingfaceembedder` class to
generate the embeddings. Use the code below to create an
instance that uses the `sentence-transformers/all-MiniLM-L6-v2`
model, passing your HuggingFace access token to the `WithToken()`
method.

```go
hf := huggingfaceembedder.New().
		WithToken("<your-access-token>").
		WithModel("sentence-transformers/all-MiniLM-L6-v2")
```

## Add data

You can now supply the data objects, which will be indexed automatically
when you add them with [`hset()`]({{< relref "/commands/hset" >}}), as long as
you use the `doc:` prefix specified in the index definition.

Use the `Embed()` method of `huggingfacetransformer`
as shown below to create the embeddings that represent the `content` fields.
This method takes an array of strings and outputs a corresponding
array of `Embedding` objects.
Use the `ToFloat32()` method of `Embedding` to produce the array of float
values that we need, and use the `floatsToBytes()` function we defined
above to convert this array to a `byte` string.

```go
sentences := []string{
    "That is a very happy person",
    "That is a happy dog",
    "Today is a sunny day",
}

tags := []string{
    "persons", "pets", "weather",
}

embeddings, err := hf.Embed(ctx, sentences)

if err != nil {
    panic(err)
}

for i, emb := range embeddings {
    buffer := floatsToBytes(emb.ToFloat32())

    if err != nil {
        panic(err)
    }

    _, err = rdb.HSet(ctx,
        fmt.Sprintf("doc:%v", i),
        map[string]any{
            "content":   sentences[i],
            "genre":     tags[i],
            "embedding": buffer,
        },
    ).Result()

    if err != nil {
        panic(err)
    }
}
```

## Run a query

After you have created the index and added the data, you are ready to run a query.
To do this, you must create another embedding vector from your chosen query
text. Redis calculates the similarity between the query vector and each
embedding vector in the index as it runs the query. It then ranks the
results in order of this numeric similarity value.

The code below creates the query embedding using `Embed()`, as with
the indexing, and passes it as a parameter when the query executes
(see
[Vector search]({{< relref "/develop/ai/vector-search" >}})
for more information about using query parameters with embeddings).

```go
queryEmbedding, err := hf.Embed(ctx, []string{
    "That is a happy person",
})

if err != nil {
    panic(err)
}

buffer := floatsToBytes(queryEmbedding[0].ToFloat32())

if err != nil {
    panic(err)
}

results, err := rdb.FTSearchWithArgs(ctx,
    "vector_idx",
    "*=>[KNN 3 @embedding $vec AS vector_distance]",
    &redis.FTSearchOptions{
        Return: []redis.FTSearchReturn{
            {FieldName: "vector_distance"},
            {FieldName: "content"},
        },
        DialectVersion: 2,
        Params: map[string]any{
            "vec": buffer,
        },
    },
).Result()

if err != nil {
    panic(err)
}

for _, doc := range results.Docs {
    fmt.Printf(
        "ID: %v, Distance:%v, Content:'%v'\n",
        doc.ID, doc.Fields["vector_distance"], doc.Fields["content"],
    )
}
```

The code is now ready to run, but note that it may take a while to complete when
you run it for the first time (which happens because `huggingfacetransformer`
must download the `all-MiniLM-L6-v2` model data before it can
generate the embeddings). When you run the code, it outputs the following text:

```
ID: doc:0, Distance:0.114169843495, Content:'That is a very happy person'
ID: doc:1, Distance:0.610845327377, Content:'That is a happy dog'
ID: doc:2, Distance:1.48624765873, Content:'Today is a sunny day'
```

The results are ordered according to the value of the `vector_distance`
field, with the lowest distance indicating the greatest similarity to the query.
As you would expect, the result for `doc:0` with the content text *"That is a very happy person"*
is the result that is most similar in meaning to the query text
*"That is a happy person"*.

## Learn more

See
[Vector search]({{< relref "/develop/ai/vector-search" >}})
for more information about the indexing options, distance metrics, and query format
for vectors.
