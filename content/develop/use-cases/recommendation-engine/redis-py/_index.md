---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed recommendation engine in Python with redis-py and sentence-transformers
linkTitle: redis-py example (Python)
title: Redis recommendation engine with redis-py
weight: 1
---

This guide shows you how to build a small Redis-backed product recommendation service in Python with [`redis-py`]({{< relref "/develop/clients/redis-py" >}}) and the [`sentence-transformers`](https://www.sbert.net/) library. It includes a local web server built with the Python standard library so you can embed a natural-language query, run a KNN retrieval with structured pre-filters in one round trip, feed clicks back as a session signal, and watch the next recommendation incorporate them immediately.

## Overview

Each product is stored as a single Redis [Hash]({{< relref "/develop/data-types/hashes" >}}) at `product:<id>`. The hash holds the structured metadata (name, description, category, brand, price, rating, in-stock flag) alongside the raw `float32` bytes of a 384-dimensional embedding. A single [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) index covers every field, so one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call with a `KNN` clause does the vector similarity *and* the TAG / NUMERIC pre-filtering in the same pass — no cross-store joins.

Per-user state lives in `user:<id>:features`: a session vector written as an exponentially weighted average of recently-clicked item embeddings, plus per-category affinity counters. [`HSET`]({{< relref "/commands/hset" >}}) updates to that hash are atomic and immediately visible to the next [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}), so a click feeds the very next recommendation without a batch cycle.

That gives you:

* A single round trip for retrieval — vector KNN + structured filters in one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}).
* Sub-millisecond hot path once the query is embedded; the embedding itself is the bottleneck, and that's a model-side cost, not a Redis one.
* Real-time session signals — a click writes a new session vector and the next query picks it up with zero coordination.
* No-downtime embedding refresh — [`HSET`]({{< relref "/commands/hset" >}}) on the vector field, and the HNSW index reflects the change on the next query.

## How it works

The flow looks like this:

1. The application calls `embedder.encode_one(query_text)` to turn a natural-language query into a 384-dimensional `float32` vector.
2. Optionally, the application reads the user's session vector from the user features hash and blends it into the query vector with a tunable weight, so the user's recent clicks pull retrieval toward what they've been engaging with.
3. `recommender.candidate_retrieve(query_vec, ...)` runs [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) with a pre-filter clause built from the request's TAG / NUMERIC inputs, followed by a `KNN k @embedding $vec` clause. Redis returns up to `k` candidates with the cosine distance to the query (lower is closer).
4. `recommender.rerank(candidates, user_features)` subtracts a per-category affinity bonus from that distance, pulled from the same user features hash, and re-sorts the list closest-first.
5. When the user clicks a product, `recommender.record_click(user_id, product_id)` reads that item's embedding, blends it into the user's session vector with an exponentially weighted moving average, bumps the category affinity counter, and writes everything back with a single [`HSET`]({{< relref "/commands/hset" >}}). The update is visible to the next [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) immediately.

Refreshing an item's embedding follows the same path: encode the new text, write the vector bytes back with [`HSET`]({{< relref "/commands/hset" >}}), and the HNSW index picks up the change on the next query without a rebuild.

## The recommender helper

The `RedisRecommender` class wraps the Redis Search index and the retrieval flow
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/redis-py/recommender.py)):

```python
import redis
from embeddings import LocalEmbedder
from recommender import RedisRecommender

# Use decode_responses=False because the embedding field is raw bytes;
# the helper decodes text fields explicitly where it needs them.
r = redis.Redis(host="localhost", port=6379, decode_responses=False)
recommender = RedisRecommender(redis_client=r, index_name="recommend:idx")
embedder = LocalEmbedder()  # sentence-transformers/all-MiniLM-L6-v2

# One-time index setup (idempotent).
recommender.create_index()

# Embed the natural-language query.
query_vec = embedder.encode_one("warm waterproof jacket for hiking")

# Retrieval: KNN with structured pre-filter in one round trip.
candidates = recommender.candidate_retrieve(
    query_vec,
    category="outerwear",
    in_stock_only=True,
    min_price=50,
    max_price=200,
    k=10,
)

# Record a click — updates the user's session vector and category
# affinity atomically; the next call to candidate_retrieve sees it.
recommender.record_click("alice", "p001")

# Pull user features so the next retrieval can blend the session
# vector into the query and apply the category-affinity re-rank.
features = recommender.get_user_features("alice")
candidates = recommender.candidate_retrieve(
    query_vec,
    category="outerwear",
    in_stock_only=True,
    k=10,
    session_vec=features["session_vec"],
    session_weight=0.3,
)
candidates = recommender.rerank(candidates, features, affinity_weight=0.15)

# Hot embedding refresh — overwrite the vector for one product; the
# HNSW index reflects the change on the next FT.SEARCH.
import numpy as np
new_vector = embedder.encode_one("heavy-duty arctic expedition parka")
recommender.refresh_embedding("p001", new_vector)
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

The KNN clause is a hybrid query: a pre-filter expression in parentheses, then `=>[KNN k @embedding $vec]`. With `DIALECT 2`, Redis applies the filter first and then KNN-ranks only the matching documents.

```text
FT.SEARCH recommend:idx
  "(@category:{outerwear} @in_stock:{true} @price:[50.0 200.0])
     =>[KNN 10 @embedding $vec AS vector_score]"
  PARAMS 2 vec <384-float32-bytes>
  SORTBY vector_score
  RETURN 8 name description category brand price rating in_stock vector_score
  DIALECT 2
```

When there's no filter, the pre-filter clause is just `(*)`. `vector_score` is the cosine *distance* (0 means identical, 2 means opposite), so the result is sorted ascending and the top row is the closest candidate to the query.

## The catalogue builder

Item vectors are pre-computed once and stored in `catalog.json` so the demo server can boot quickly. `build_catalog.py` is the reference for how to do that — and is the script you'd adapt for a real catalogue ingestion pipeline
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/redis-py/build_catalog.py)):

```python
from embeddings import LocalEmbedder

CATALOG = [
    {"id": "p001", "name": "Alpine down parka",
     "description": "Heavyweight 800-fill goose down parka...",
     "category": "outerwear", "brand": "northpeak",
     "price": 289.00, "in_stock": True, "rating": 4.7},
    # ... rest of the catalogue ...
]

embedder = LocalEmbedder()
vectors = embedder.encode_many(
    f"{p['name']}. {p['description']}" for p in CATALOG
)
# Each vector is 384 float32s, packed and written into catalog.json
# alongside the structured fields. The demo server reads that file at
# startup and HSETs every product into Redis.
```

In production the equivalent of this script lives in an offline pipeline: embed once on catalogue updates and ship the vectors into Redis with [`HSET`]({{< relref "/commands/hset" >}}). The serving tier never has to load a model.

## The interactive demo

`demo_server.py` runs a ThreadingHTTPServer with one demo user (`demo`). The HTML page lets you:

* Type a natural-language query and toggle filters (category, brand, price range, rating, in-stock).
* Toggle session blending and category-affinity re-ranking independently to see what each layer contributes.
* Click any product card to record a click into the session. The page re-renders the user features panel immediately — that hash was atomically updated by the click, so the next search picks it up with no extra work.
* Refresh a single product's embedding with new text and watch the ranking change on the next query.

The server holds one `LocalEmbedder` instance and one `RedisRecommender` for the lifetime of the process. Endpoints:

| Endpoint                | What it does                                                                |
|-------------------------|-----------------------------------------------------------------------------|
| `GET  /state`           | Index info, user features, full catalogue listing.                          |
| `POST /search`          | Embed the query, run `FT.SEARCH` with filters + KNN, optionally re-rank.    |
| `POST /click`           | Record a click for the demo user: update session vector and affinity.       |
| `POST /reset-user`      | Drop the user features hash.                                                |
| `POST /reset-index`     | Drop the index and documents and re-seed from `catalog.json`.               |
| `POST /refresh-embedding` | Embed new text and overwrite one product's vector with `HSET`.            |

## Run the demo locally

1.  Install the dependencies:

    ```bash
    pip install redis sentence-transformers numpy
    ```

2.  Make sure a Redis instance with the Redis Search module is running locally on
    port 6379. [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
    [Redis 8 with Search]({{< relref "/develop/ai/search-and-query" >}}) both work.

3.  Generate the catalogue with pre-computed embeddings. The first run downloads the
    `all-MiniLM-L6-v2` model (~80 MB) into the local Hugging Face cache:

    ```bash
    python build_catalog.py
    ```

4.  Start the demo server:

    ```bash
    python demo_server.py
    ```

5.  Open <http://localhost:8084> and try some queries:

    * **"warm waterproof jacket for hiking"** — filtered to `outerwear`, in-stock only.
    * **"comfortable shoes for trail running"** — filtered to `footwear`.
    * Click a couple of products to seed a session, then re-run the same query
      with **Blend session vector into query** on and watch the ranking shift.
    * Use **Refresh embedding** to change a product's vector — for example,
      change the Alpine down parka's text to "heavy duty arctic expedition parka
      with hood" and re-run the jacket query to see the result move.

The server is read/write against your local Redis. The default index name is `recommend:idx` and product keys live under `product:`. Pass `--no-reset` to keep an existing index across restarts, or `--redis-host` / `--redis-port` to point at a different Redis.
