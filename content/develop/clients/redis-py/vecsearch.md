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
description: Store and query vector embeddings with Redis
linkTitle: Vector embeddings
title: Vector embeddings
weight: 5
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

The [RedisVL]({{< relref "/develop/clients/redis-vl" >}}) library provides a
high-level Python API to help you use vector embeddings with Redis Query
Engine. The example below shows how RedisVL can retrieve data
that has a similar meaning to the query text you supply.

## Initialize

Start by importing the required classes:

```python
from redisvl.utils.vectorize.text.huggingface import (
    HFTextVectorizer
)
from redisvl.index import SearchIndex
from redisvl.query import VectorQuery
```

The first of these imports is the
[`HFTextVectorizer`](https://docs.redisvl.com/en/stable/api/vectorizer.html#hftextvectorizer)
class, which generates
an embedding from a section sample of text. Here, we create an instance of `HFTextVectorizer` 
that uses the
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
model for the embeddings. This model generates vectors with 384 dimensions, regardless
of the length of the input text, but note that the input is truncated to 256
tokens (see
[Word piece tokenization](https://huggingface.co/learn/nlp-course/en/chapter6/6).
at the [Hugging Face](https://huggingface.co/) docs to learn more about how tokens
are related to the original text).

```python
hf = HFTextVectorizer(model="sentence-transformers/all-MiniLM-L6-v2")
```

## Create the index

RedisVL's
[`SearchIndex`](https://docs.redisvl.com/en/stable/api/searchindex.html#searchindex-api)
class provides the
[`from_dict()`](https://docs.redisvl.com/en/stable/api/searchindex.html#redisvl.index.SearchIndex.from_dict)
method, which lets you specify your index schema with a Python dictionary, as shown
below. Another option is
[`from_yaml()`](https://docs.redisvl.com/en/stable/api/searchindex.html#redisvl.index.SearchIndex.from_yaml),
which loads the index schema from a [YAML](https://en.wikipedia.org/wiki/YAML) file.

The schema in the example below specifies hash objects for storage and includes
three fields: the text content to index, a
[tag]({{< relref "/develop/interact/search-and-query/advanced-concepts/tags" >}})
field to represent the "genre" of the text, and the embedding vector generated from
the original text content. The attributes of the vector field (specified in the
`attrs` object) specify [HNSW]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors#hnsw-index" >}}) indexing, the
[L2]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors#distance-metrics" >}})
vector distance metric, `Float32` values to represent the vector's components,
and 384 dimensions, as required by the `all-MiniLM-L6-v2` embedding model.

```python
index = SearchIndex.from_dict({
    "index": {
        "name": "vector_idx",
        "prefix": "doc",
        "storage_type": "hash",
    },
    "fields": [
        {"name": "content", "type": "text"},
        {"name": "genre", "type": "tag"},
        {
            "name": "embedding",
            "type": "vector",
            "attrs": {
                "algorithm": "HNSW",
                "dims": 384,
                "distance_metric": "l2",
                "datatype": "float32",
            },
        },
    ],
})
```

When you have created the `SearchIndex` object, you must connect to the Redis
server using the
[`connect()`](https://docs.redisvl.com/en/stable/api/searchindex.html#redisvl.index.SearchIndex.connect)
method and then use the
[`create()`](https://docs.redisvl.com/en/stable/api/searchindex.html#redisvl.index.SearchIndex.create)
method to actually create the index in the database. The `overwrite` parameter for `create()`
ensures that the index you create replaces any existing index with
the same name. The `drop` parameter deletes any objects that were
indexed by the index you are replacing.

```python
index.connect("redis://localhost:6379")
index.create(overwrite=True, drop=True)
```

## Add data

You can now supply the data objects, which will be indexed automatically
when you add them using the
[`load()`](https://docs.redisvl.com/en/stable/api/searchindex.html#redisvl.index.SearchIndex.load)
method. Use the
[`embed()`](https://docs.redisvl.com/en/stable/api/vectorizer.html#redisvl.utils.vectorize.text.huggingface.HFTextVectorizer.embed)
method of the `HFTextVectorizer` instance to create the embedding that represents the `content` field. By default, `embed()` returns a list of `float` values to represent the embedding
vector, but you can also supply the `as_buffer` parameter to encode this list as a
binary string. Use the string representation when you are indexing hash objects
(as we are here), but use the default list of `float` for JSON objects.

```python
hf = HFTextVectorizer(model="sentence-transformers/all-MiniLM-L6-v2")

data = [
    {
        "content": "That is a very happy person",
        "genre": "persons",
        "embedding": hf.embed("That is a very happy person", as_buffer=True)
    },
    {
        "content": "That is a happy dog",
        "genre": "pets",
        "embedding": hf.embed("That is a happy dog", as_buffer=True)
    },
    {
        "content": "Today is a sunny day",
        "genre": "weather",
        "embedding": hf.embed("Today is a sunny day", as_buffer=True)
    }
]

index.load(data)
```

## Run a query

After you have created the index, you are ready to run a query against it.
To do this, you must create another embedding vector from your chosen query
text. Redis calculates the similarity between the query vector and each
embedding vector in the index as it runs the query. It then ranks the
results in order of this numeric similarity value.

Create a
[`VectorQuery`](https://docs.redisvl.com/en/stable/api/query.html#vectorquery)
instance by supplying the embedding vector for your
query text, along with the hash or JSON field to match against and the number
of results you want, as shown in the example below. Then, call the 
[`query()`](https://docs.redisvl.com/en/stable/api/searchindex.html#redisvl.index.SearchIndex.query)
method of `SearchIndex` with your `VectorQuery` instance to run the query.

```python
query = VectorQuery(
    vector=hf.embed("That is a happy person"),
    vector_field_name="embedding",
    return_fields=["content"],
    num_results=3,
)

results = index.query(query)
print(results)
```

The code is now ready to run, but note that it may take a while to complete when
you run it for the first time (which happens because RedisVL must download the
`all-MiniLM-L6-v2` model data before it can
generate the embeddings). When you run the code, it outputs the following results
as a list of dict objects:

```Python
[
    {
        'id': 'doc:cf3c28e7fdd44753af3080a9a7f8d8e9',
        'vector_distance': '0.114169985056',
        'content': 'That is a very happy person'
    },
    {
        'id': 'doc:614508f297b644d0be47dde5373bb059',
        'vector_distance': '0.610845386982',
        'content': 'That is a happy dog'
    },
    {
        'id': 'doc:930a7dfca0d74808baee490d747c9534',
        'vector_distance': '1.48624813557',
        'content': 'Today is a sunny day'
    }
]
```

Note that the results are ordered according to the value of the `vector_distance`
field, with the lowest distance indicating the greatest similarity to the query.
As you would expect, the text *"That is a very happy person"* is the result that is
most similar in meaning to the query text *"That is a happy person"*.

## Learn more

See the [RedisVL documentation](https://docs.redisvl.com/en/stable/index.html)
for more details about its features and examples of how to use them.
