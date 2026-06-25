---
aliases:
- /develop/use-cases/recommendation-engine/go-redis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed recommendation engine in Go with go-redis and Hugot
linkTitle: go-redis example (Go)
title: Redis recommendation engine with go-redis
weight: 3
---

This guide shows you how to build a small Redis-backed product recommendation service in Go with [`go-redis`]({{< relref "/develop/clients/go" >}}) and the [Hugot](https://pkg.go.dev/github.com/knights-analytics/hugot) library (pure-Go ONNX runtime, no shared library to install). It includes a local web server built on Go's standard `net/http` package so you can embed a natural-language query, run a KNN retrieval with structured pre-filters in one round trip, feed clicks back as a session signal, and watch the next recommendation incorporate them immediately.

## Overview

Each product is stored as a single Redis [Hash]({{< relref "/develop/data-types/hashes" >}}) at `product:<id>`. The hash holds the structured metadata (name, description, category, brand, price, rating, in-stock flag) alongside the raw `float32` bytes of a 384-dimensional embedding. A single [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) index covers every field, so one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call with a `KNN` clause does the vector similarity *and* the TAG / NUMERIC / TEXT pre-filtering in the same pass — no cross-store joins.

Per-user state lives in `user:<id>:features`: a session vector written as an exponentially weighted average of recently-clicked item embeddings, plus per-category affinity counters incremented atomically with [`HINCRBYFLOAT`]({{< relref "/commands/hincrbyfloat" >}}). [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) does *not* read that hash directly; instead, the application reads it on the next request and passes the session vector to `FT.SEARCH` as the query parameter. The two-step is what lets a click feed the very next recommendation without a batch cycle or cache invalidation.

That gives you:

* A single round trip for retrieval — vector KNN + structured filters in one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}).
* Sub-millisecond hot path once the query is embedded; embedding the query is the bottleneck, and that's a model-side cost, not a Redis one.
* Real-time session signals — a click writes a new session vector and bumps an affinity counter; the next query reads them and folds them in.
* No-downtime embedding refresh — [`HSET`]({{< relref "/commands/hset" >}}) on the vector field, and the HNSW index reflects the change on the next query.

## How it works

There are two distinct paths: a **query path** runs every time the application wants a recommendation, and a **click path** runs every time the user interacts with a product.

### Query path (per recommendation request)

1. The application calls `embedder.EncodeOne(ctx, queryText)` to turn a natural-language query into a 384-dimensional `[]float32`.
2. The application reads the user's session vector and affinities from the user features hash. If a session vector exists, it gets blended into the query vector with a tunable weight, so the user's recent clicks pull retrieval toward what they've been engaging with.
3. `recommender.CandidateRetrieve(ctx, queryVec, opts)` runs [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) with a pre-filter clause built from the request's TAG / NUMERIC / TEXT inputs, followed by a `KNN k @embedding $vec` clause. Redis returns up to `k` candidates with the cosine distance to the query (lower is closer).
4. `recommender.Rerank(candidates, userFeatures, weight)` subtracts a log-scaled per-category affinity bonus from each candidate's distance and re-sorts the list closest-first. The log scaling keeps repeated clicks from running away with the ranking.

### Click path (per user interaction)

When the user clicks a product, `recommender.RecordClick(ctx, userID, productID, nil)` does the following:

1. Reads the clicked item's embedding from its hash.
2. Reads the user's previous session vector from the user features hash, blends the new click in via an exponentially weighted moving average, and writes the new session vector back with [`HSET`]({{< relref "/commands/hset" >}}). This is a read-modify-write — atomic against any single write but not against a concurrent click for the same user; in practice, per-user click streams don't generate the contention to make this matter, and if a deployment does, the read and write can be wrapped in [`WATCH/MULTI/EXEC`]({{< relref "/commands/multi" >}}) or a small Lua script.
3. Bumps the per-category affinity counter with [`HINCRBYFLOAT`]({{< relref "/commands/hincrbyfloat" >}}) — atomic, no read needed — and the click count with [`HINCRBY`]({{< relref "/commands/hincrby" >}}).

The next query path picks both changes up the next time it reads the user features hash.

Refreshing an item's embedding follows a similar shape: encode the new text, write the vector bytes back with [`HSET`]({{< relref "/commands/hset" >}}), and the HNSW index reflects the change on the next query without a rebuild.

## The recommender helper

The `RedisRecommender` struct wraps the Redis Search index and the retrieval flow
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/go/recommender.go)):

```go
package main

import (
    "context"
    "log"

    "github.com/redis/go-redis/v9"
    rec "recommendationengine"
)

func main() {
    ctx := context.Background()
    rdb := redis.NewClient(&redis.Options{
        Addr:     "localhost:6379",
        Protocol: 2, // go-redis marks FT.SEARCH RESP3 unstable.
    })
    recommender := rec.NewRecommender(rdb,
        rec.WithIndexName("recommend:idx"),
    )
    if err := recommender.CreateIndex(ctx); err != nil {
        log.Fatal(err)
    }

    embedder, err := rec.NewLocalEmbedder(ctx, "", "")  // all-MiniLM-L6-v2
    if err != nil {
        log.Fatal(err)
    }
    defer embedder.Close()

    queryVec, _ := embedder.EncodeOne(ctx, "warm waterproof jacket for hiking")

    // Retrieval: KNN with structured pre-filter in one round trip.
    // Filters combine TAG (Category, Brand, InStockOnly), NUMERIC
    // (MinPrice/MaxPrice, MinRating), and TEXT (TextMatch against
    // TextField) — Redis applies them all in front of the KNN.
    minPrice, maxPrice := 50.0, 200.0
    candidates, _ := recommender.CandidateRetrieve(ctx, queryVec, rec.RetrieveOptions{
        FilterOptions: rec.FilterOptions{
            Category:    "outerwear",
            InStockOnly: true,
            MinPrice:    &minPrice,
            MaxPrice:    &maxPrice,
            TextMatch:   "waterproof", // TEXT pre-filter on @description
        },
        K: 10,
    })

    // Record a click — updates the user's session vector and category
    // affinity atomically; the next call to CandidateRetrieve sees it.
    _, _ = recommender.RecordClick(ctx, "alice", "p001", nil)

    // Pull user features so the next retrieval can blend the session
    // vector into the query and apply the category-affinity re-rank.
    features, _ := recommender.GetUserFeatures(ctx, "alice")
    candidates, _ = recommender.CandidateRetrieve(ctx, queryVec, rec.RetrieveOptions{
        FilterOptions: rec.FilterOptions{Category: "outerwear", InStockOnly: true},
        K:             10,
        SessionVec:    features.SessionVec,
        SessionWeight: 0.3,
    })
    candidates = recommender.Rerank(candidates, features, 0.15)

    // Hot embedding refresh — overwrite the vector for one product;
    // the HNSW index reflects the change on the next FT.SEARCH.
    newVec, _ := embedder.EncodeOne(ctx, "heavy-duty arctic expedition parka")
    _ = recommender.RefreshEmbedding(ctx, "p001", newVec)
}
```

### Data model

Each product is one Redis Hash. The vector field is raw little-endian `float32` bytes — no JSON wrapping — because the Redis Search vector encoding expects exactly that.

```text
product:p001
  name=Alpine down parka
  description=Heavyweight 800-fill goose down parka...
  category=outerwear
  brand=northpeak
  price=289.0
  rating=4.7
  in_stock=true
  embedding=<384 × float32 little-endian bytes>
```

The Redis Search index schema treats every field as queryable in its natural type:

```text
FT.CREATE recommend:idx
  ON HASH PREFIX 1 product:
  SCHEMA
    name        TEXT
    description TEXT
    category    TAG
    brand       TAG
    in_stock    TAG
    price       NUMERIC SORTABLE
    rating      NUMERIC SORTABLE
    embedding   VECTOR HNSW 6 TYPE FLOAT32 DIM 384 DISTANCE_METRIC COSINE
```

Per-user state is a separate hash. The session vector is stored as raw `float32` bytes the same way; affinity counters are stored as plain numeric strings, one field per category, prefixed with `aff:` so they don't collide with anything else.

```text
user:alice:features
  session_vec=<384 × float32 little-endian bytes>
  aff:outerwear=2.0
  aff:footwear=1.0
  last_clicked_id=p015
  last_clicked_category=footwear
  clicks=3
```

### The query

The KNN clause is a hybrid query: a pre-filter expression in parentheses, then `=>[KNN k @embedding $vec]`. With dialect 2 (the default in `go-redis` v9.8+), Redis applies the filter first and then KNN-ranks only the matching documents.

```text
FT.SEARCH recommend:idx
  "(@category:{outerwear} @in_stock:{true} @price:[50 200])
     =>[KNN 10 @embedding $vec AS vector_score]"
  PARAMS 2 vec <384-float32-bytes>
  SORTBY vector_score
  RETURN 8 name description category brand price rating in_stock vector_score
  DIALECT 2
```

When there's no filter, the pre-filter clause is just `(*)`. `vector_score` returned by Redis is the cosine *distance* (0 means identical, 2 means opposite), so the result is sorted ascending — a score of 0.0 is a perfect match.

### Binary fields with `go-redis` v9

The embedding field is binary, while everything else in the same hash is text. `go-redis` v9 handles mixed types in a single `HSET` automatically — pass `[]byte` for binary fields and `string` for text fields in the same `map[string]any`:

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    Protocol: 2, // RESP2: go-redis marks FT.SEARCH RESP3 unstable.
})

// Mixed types in one HSET. Strings stay strings; the byte slice gets
// stored verbatim and round-trips through HGET as a Go string (the
// recommender re-interprets it as float32 bytes).
rdb.HSet(ctx, "product:p001", map[string]any{
    "name":      "Alpine down parka",
    "price":     "289.0",
    "embedding": rec.FloatsToBytes(vector), // []byte
})
```

`FT.SEARCH` parameter values are passed the same way — pass `[]byte` for the `vec` parameter and `go-redis` includes it in the command body without any encoding.

The `Protocol: 2` option is important: `go-redis` v9 currently marks `FT.SEARCH`'s RESP3 responses unstable because their shape may still change. RESP2 keeps everything stable for production use.

## The catalog builder

Item vectors are pre-computed once and stored in `catalog.json` so the demo server can boot quickly. `build_catalog.go` and the `cmd/build_catalog` shim are the reference for how to do that — and are the code you'd adapt for a real catalog ingestion pipeline
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/go/build_catalog.go)):

```go
// In package recommendationengine:
var CatalogSeed = []Product{
    {ID: "p001", Name: "Alpine down parka",
        Description: "Heavyweight 800-fill goose down parka...",
        Category:    "outerwear", Brand: "northpeak",
        Price: 289.00, InStock: true, Rating: 4.7},
    // ... rest of the catalog ...
}

// BuildCatalog runs the embedding model over each product and writes
// catalog.json. The demo server reads that file at startup.
embedder, _ := NewLocalEmbedder(ctx, "", "")
_ = BuildCatalog(ctx, embedder, "catalog.json")
```

In production the equivalent of this script lives in an offline pipeline: embed once on catalog updates and ship the vectors into Redis with [`HSET`]({{< relref "/commands/hset" >}}). The serving tier still embeds the *query* on each request, but that's usually fronted by a dedicated model server or batched at the API gateway rather than co-located with the data tier as it is in this demo.

## The interactive demo

`demo_server.go` runs Go's standard `net/http` server with one demo user (`demo`). The HTML page lets you:

* Type a natural-language query and toggle filters: TAG (category, brand, in-stock), NUMERIC (price range, rating), and TEXT (the **Description contains** field, a phrase pre-filter against the `description` text index).
* Toggle session blending and category-affinity re-ranking independently to see what each layer contributes.
* Click any product card to record a click into the session. The page re-renders the user features panel immediately — the click wrote to the user features hash, and the next search reads that hash to fold the update in.
* Refresh a single product's embedding with new text and watch the ranking change on the next query.

The server holds one `LocalEmbedder` instance and one `RedisRecommender` for the lifetime of the process. Endpoints:

| Endpoint                  | What it does                                                                |
|---------------------------|-----------------------------------------------------------------------------|
| `GET  /state`             | Index info, user features, full catalog listing.                            |
| `POST /search`            | Embed the query, run `FT.SEARCH` with filters + KNN, optionally re-rank.    |
| `POST /click`             | Record a click for the demo user: update session vector and affinity.       |
| `POST /reset-user`        | Drop the user features hash.                                                |
| `POST /reset-index`       | Drop the index and documents and re-seed from `catalog.json`.               |
| `POST /refresh-embedding` | Embed new text and overwrite one product's vector with `HSET`.              |

## Run the demo locally

1.  Clone the [`redis/docs`](https://github.com/redis/docs) repository and change into the example
    directory:

    ```bash
    git clone https://github.com/redis/docs.git
    cd docs/content/develop/use-cases/recommendation-engine/go
    ```

2.  Fetch the dependencies (`go-redis` v9 and Hugot):

    ```bash
    go mod download
    ```

3.  Make sure a Redis instance with the Redis Search module is running locally on
    port 6379. [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
    [Redis 8 with Search]({{< relref "/develop/ai/search-and-query" >}}) both work.

4.  Generate the catalog with pre-computed embeddings. The first run downloads the
    `all-MiniLM-L6-v2` model (~80 MB) into a local `models/` directory:

    ```bash
    go run ./cmd/build_catalog
    ```

5.  Start the demo server:

    ```bash
    go run ./cmd/demo_server --port 8084
    ```

6.  Open <http://localhost:8084> and try some queries:

    * **"insulated down jacket for cold weather"** — filtered to `outerwear`, in-stock only.
    * **"comfortable shoes for trail running"** — filtered to `footwear`.
    * Add **Description contains: waterproof** to either query above to see a TEXT pre-filter
      combine with the KNN.
    * Click a couple of products to seed a session, then re-run the same query
      with **Blend session vector into query** on and watch the ranking shift.
    * Use **Refresh embedding** to change a product's vector — for example,
      change the Alpine down parka's text to "heavy duty arctic expedition parka
      with hood" and re-run the jacket query to see the result move.

The server is read/write against your local Redis. The default index name is `recommend:idx` and product keys live under `product:`. Pass `--reset=false` to keep an existing index across restarts, or `--redis-addr` to point at a different Redis.
