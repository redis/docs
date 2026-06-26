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
description: Search by meaning with vector embeddings, run KNN queries with FT.SEARCH, and combine keywords with semantic similarity using FT.HYBRID.
linkTitle: 5. Vector and hybrid search
stack: true
title: Vector and hybrid search
aliases:
- /get-started/search-tutorial/vector-search/
weight: 5
---

This is the final step of the [search and query tutorial]({{< relref "/develop/get-started/search-tutorial" >}}). It builds on everything so far: the [catalog]({{< relref "/develop/get-started/search-tutorial/data-modeling" >}}), the [index]({{< relref "/develop/get-started/search-tutorial/indexing" >}}), and the [search]({{< relref "/develop/get-started/search-tutorial/search" >}}) syntax.

{{% alert title="Version requirement" color="warning" %}}
The hybrid search section uses [FT.HYBRID]({{< relref "/commands/ft.hybrid" >}}), which requires **Redis 8.8 or later**. Vector search with `FT.SEARCH` works on earlier versions with Redis Search.
{{% /alert %}}

So far you have matched products by the words they contain and the exact values of their fields. But a shopper searching for "*something to listen to music on a run*" will not use the word *headphones* or *earbuds*, and a keyword search would miss them. **Vector search** solves this by matching on *meaning* rather than exact words.

## How vector search works

A machine learning **embedding model** turns a piece of text into a list of numbers, called a **vector**, that captures its meaning. Texts with similar meanings produce vectors that are close together in space. To search by meaning, you:

1. Generate an embedding for each product (here, from its description) and store it on the document.
2. Add a `VECTOR` field to the index so Redis can search those embeddings.
3. At query time, embed the search phrase and ask Redis for the products whose vectors are nearest to it.

"Nearest" is measured by a **distance metric**. This tutorial uses cosine distance, where a smaller distance means more similar.

## Generate and store embeddings

Embeddings come from a model, so this step uses a client library rather than `redis-cli`. The example below uses the Python [SentenceTransformers](https://www.sbert.net/) framework to embed each product description and store the result on the document under `$.embedding`. The model used here produces 768-dimensional vectors.

```python
from redis import Redis
from sentence_transformers import SentenceTransformer

r = Redis(host="localhost", port=6379, decode_responses=True)
embedder = SentenceTransformer("msmarco-distilbert-base-v4")  # 768-dimensional vectors

# Embed each product's description and store it on the document.
for key in r.scan_iter(match="product:*"):
    description = r.json().get(key, "$.description")[0]
    embedding = embedder.encode(description).astype("float32").tolist()
    r.json().set(key, "$.embedding", embedding)
```

When stored in a JSON document, the embedding is just a JSON array of numbers. Each product now has an `embedding` field alongside its other attributes.

## Add a vector field to the index

The index you created earlier does not know about the new `embedding` field. Recreate it to include a `VECTOR` field. Dropping the index does not delete your documents, and the embeddings you just stored are indexed as soon as the new index is created:

{{< clients-example set="search_tutorial" step="create_vector_index" description="Foundational: Recreate the index with a VECTOR field so embeddings can be searched" difficulty="intermediate" >}}
> FT.DROPINDEX idx:catalog
OK
> FT.CREATE idx:catalog ON JSON PREFIX 1 product: SCHEMA $.name AS name TEXT $.brand AS brand TAG SORTABLE $.category AS category TAG $.description AS description TEXT $.price AS price NUMERIC SORTABLE $.rating AS rating NUMERIC SORTABLE $.features[*] AS features TAG $.embedding AS embedding VECTOR FLAT 6 TYPE FLOAT32 DIM 768 DISTANCE_METRIC COSINE
OK
{{< /clients-example >}}

The vector field definition reads: index `$.embedding` as a `VECTOR` field using the `FLAT` algorithm, with `6` attributes following &mdash; `TYPE FLOAT32`, `DIM 768` (the model's dimension), and `DISTANCE_METRIC COSINE`. `FLAT` does an exact search and is a good default for small datasets; for large datasets you would choose `HNSW`. For all the options, see the [vector search concepts]({{< relref "/develop/ai/search-and-query/vectors" >}}) page.

## K-nearest neighbors (KNN)

A KNN query asks for the `k` products whose embeddings are closest to a query vector. You embed the search phrase with the *same* model, then pass the resulting vector to `FT.SEARCH`:

{{< clients-example set="search_tutorial" step="vector_knn" description="Vector KNN: Find the k nearest documents to a query vector using the =>[KNN ...] syntax" difficulty="intermediate" >}}
> FT.SEARCH idx:catalog "(*)=>[KNN 3 @embedding $query_vector AS score]" PARAMS 2 query_vector "\x9a\x99\x19\x3f..." SORTBY score ASC RETURN 2 score name DIALECT 2
{{< /clients-example >}}

Here is what each part does:

- **`(*)`** is a pre-filter that runs *before* the vector search. `(*)` means "consider all products". You can put any query here to restrict the candidates (shown next).
- **`=>[KNN 3 @embedding $query_vector AS score]`** asks for the 3 nearest neighbors in the `embedding` field, naming each result's distance `score`.
- **`PARAMS 2 query_vector "..."`** supplies the query vector's binary value. The `2` means two arguments follow: the parameter name and its value.
- **`SORTBY score ASC`** orders results closest-first, and **`DIALECT 2`** selects the query dialect that vector search requires.

{{% alert title="Note" color="info" %}}
The query vector's binary value is long, so it is shortened in the example above. In a real application your client library builds it for you from the model's output, as in the [embedding step](#generate-and-store-embeddings) above.
{{% /alert %}}

For a phrase like "*portable music for the outdoors*", this returns the products whose descriptions are closest in meaning &mdash; the portable speaker and the earbuds rank highly &mdash; even though they share no specific keyword with the query.

### Pre-filter the candidates

The pre-filter is where vector search meets the filtering you already know. Replace `(*)` with any `FT.SEARCH` query to search for similar products *within a subset*. This finds the 3 nearest products **among Audio products only**:

{{< clients-example set="search_tutorial" step="vector_prefilter" description="Filtered vector search: Restrict KNN candidates with a pre-filter before the vector search runs" difficulty="advanced" >}}
> FT.SEARCH idx:catalog "(@category:{Audio})=>[KNN 3 @embedding $query_vector AS score]" PARAMS 2 query_vector "\x9a\x99\x19\x3f..." SORTBY score ASC RETURN 2 score name DIALECT 2
{{< /clients-example >}}

## Hybrid search

Keyword search and vector search each have strengths. Keyword search is precise when the user knows the exact term; vector search is forgiving when they describe what they want in their own words. **Hybrid search** runs both at once and fuses the results, giving you the best of each.

The [FT.HYBRID]({{< relref "/commands/ft.hybrid" >}}) command takes a `SEARCH` clause (a full-text query, exactly like `FT.SEARCH`) and a `VSIM` clause (a vector similarity query), and combines their rankings. This searches for the keyword *wireless* and, at the same time, for products semantically similar to the query vector (here, an embedding of "*wireless headphones for listening to music*"):

{{< clients-example set="search_tutorial" step="hybrid_search" description="Hybrid search: Combine a full-text SEARCH clause with a vector VSIM clause using FT.HYBRID" difficulty="advanced" >}}
> FT.HYBRID idx:catalog SEARCH "wireless" VSIM @embedding $query_vector KNN 2 K 5 LOAD 1 @name PARAMS 2 query_vector "\x9a\x99\x19\x3f..."
{{< /clients-example >}}

As with the KNN examples, the query vector's binary value is shortened above; your client library builds it from the model's output.

The result blends two rankings: products that literally mention *wireless* and products whose meaning is closest to the query vector. For this query, the wireless headphones and earbuds come out on top &mdash; they satisfy both the keyword and the meaning &mdash; followed by other wireless items and the nearest semantic matches such as the portable speaker.

By default, `FT.HYBRID` fuses the two rankings with a method called Reciprocal Rank Fusion. You can tune the balance with a `COMBINE` clause, and add `FILTER`, `LOAD`, `APPLY`, and `SORTBY` steps just as you would in an aggregation. See the [FT.HYBRID]({{< relref "/commands/ft.hybrid" >}}) reference for the full syntax.

{{% alert title="Try it in Redis Insight" color="info" %}}
The [Redis Insight Search workspace]({{< relref "/develop/tools/insight/search-workspace" >}}) is built for exactly this kind of work. Its welcome screen introduces full-text, vector, and hybrid search, it can load a ready-made vector dataset, and its editor handles the vector parameters for you &mdash; a much friendlier way to experiment with vector and hybrid queries than pasting binary blobs into `redis-cli`.
{{% /alert %}}

## What you have learned

Congratulations &mdash; you have gone from an empty database to running hybrid semantic search. Along the way you:

1. Modeled records as JSON documents and learned when hashes fit better.
2. Created an index and chose `TEXT`, `TAG`, and `NUMERIC` field types.
3. Searched, filtered, and projected with `FT.SEARCH`.
4. Grouped and summarized data with `FT.AGGREGATE`.
5. Searched by meaning with vector KNN and combined it with keywords using `FT.HYBRID`.

## Where to go next

- **Go deeper on querying** &mdash; the [query documentation]({{< relref "/develop/ai/search-and-query/query" >}}) covers fuzzy matching, geospatial queries, scoring, and more.
- **Tune your vectors** &mdash; [vector search concepts]({{< relref "/develop/ai/search-and-query/vectors" >}}) explains the `FLAT` and `HNSW` index types and how to choose between them.
- **Build an AI application** &mdash; see how Redis powers retrieval-augmented generation in the [Redis as a vector database]({{< relref "/develop/get-started/vector-database" >}}) guide and [Redis for AI]({{< relref "/develop/ai" >}}).
- **See also** &mdash; if you need standalone similarity search without a full search index, Redis also offers the [vector sets]({{< relref "/develop/data-types/vector-sets" >}}) data type.
