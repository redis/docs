---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed recommendation engine in Ruby with redis-rb and informers
linkTitle: redis-rb example (Ruby)
title: Redis recommendation engine with redis-rb
weight: 9
---

This guide shows you how to build a small Redis-backed product recommendation service in Ruby with the [`redis-rb`]({{< relref "/develop/clients/ruby" >}}) gem and the [`informers`](https://github.com/ankane/informers) gem for local text embeddings. It includes a small local web server built on Ruby's `webrick` library so you can embed a natural-language query, run a KNN retrieval with structured pre-filters in one round trip, feed clicks back as a session signal, and watch the next recommendation incorporate them immediately.

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

1. The application calls `embedder.encode_one(query_text)` to turn a natural-language query into a 384-dimensional `float32` vector.
2. The application reads the user's session vector and affinities from the user features hash. If a session vector exists, it gets blended into the query vector with a tunable weight, so the user's recent clicks pull retrieval toward what they've been engaging with.
3. `recommender.candidate_retrieve(query_vec, ...)` runs [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) with a pre-filter clause built from the request's TAG / NUMERIC / TEXT inputs, followed by a `KNN k @embedding $vec` clause. Redis returns up to `k` candidates with the cosine distance to the query (lower is closer).
4. `recommender.rerank(candidates, user_features)` subtracts a log-scaled per-category affinity bonus from each candidate's distance and re-sorts the list closest-first. The log scaling keeps repeated clicks from running away with the ranking.

### Click path (per user interaction)

When the user clicks a product, `recommender.record_click(user_id, product_id)` does the following:

1. Reads the clicked item's embedding from its hash.
2. Reads the user's previous session vector from the user features hash, blends the new click in via an exponentially weighted moving average, and writes the new session vector back with [`HSET`]({{< relref "/commands/hset" >}}). This is a read-modify-write — atomic against any single write but not against a concurrent click for the same user; in practice, per-user click streams don't generate the contention to make this matter, and if a deployment does, the read and write can be wrapped in [`WATCH/MULTI/EXEC`]({{< relref "/commands/multi" >}}) or a small Lua script.
3. Bumps the per-category affinity counter with [`HINCRBYFLOAT`]({{< relref "/commands/hincrbyfloat" >}}) — atomic, no read needed — and the click count with [`HINCRBY`]({{< relref "/commands/hincrby" >}}).

The next query path picks both changes up the next time it reads the user features hash.

Refreshing an item's embedding follows a similar shape: encode the new text, write the vector bytes back with [`HSET`]({{< relref "/commands/hset" >}}), and the HNSW index reflects the change on the next query without a rebuild.

## The recommender helper

The `RedisRecommender` class wraps the Redis Search index and the retrieval flow
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/ruby/recommender.rb)):

```ruby
require 'redis'
require_relative 'embeddings'
require_relative 'recommender'

# redis-rb returns binary replies as ASCII-8BIT strings automatically,
# so the embedding bytes round-trip cleanly with no extra flags.
redis = Redis.new(host: 'localhost', port: 6379)
recommender = RedisRecommender.new(redis: redis, index_name: 'recommend:idx')
embedder = LocalEmbedder.new  # sentence-transformers/all-MiniLM-L6-v2

# One-time index setup (idempotent).
recommender.create_index

# Embed the natural-language query.
query_vec = embedder.encode_one('warm waterproof jacket for hiking')

# Retrieval: KNN with structured pre-filter in one round trip.
# Filters combine TAG (category, brand, in_stock_only), NUMERIC
# (price range, rating), and TEXT (text_match against text_field) --
# Redis applies them all in front of the KNN.
candidates = recommender.candidate_retrieve(
  query_vec,
  category: 'outerwear',
  in_stock_only: true,
  min_price: 50,
  max_price: 200,
  text_match: 'waterproof',   # TEXT pre-filter on @description
  k: 10,
)

# Record a click -- updates the user's session vector and category
# affinity atomically; the next call to candidate_retrieve sees it.
recommender.record_click('alice', 'p001')

# Pull user features so the next retrieval can blend the session
# vector into the query and apply the category-affinity re-rank.
features = recommender.get_user_features('alice')
candidates = recommender.candidate_retrieve(
  query_vec,
  category: 'outerwear',
  in_stock_only: true,
  k: 10,
  session_vec: features[:session_vec],
  session_weight: 0.3,
)
candidates = recommender.rerank(candidates, features, affinity_weight: 0.15)

# Hot embedding refresh -- overwrite the vector for one product; the
# HNSW index reflects the change on the next FT.SEARCH.
new_vector = embedder.encode_one('heavy-duty arctic expedition parka')
recommender.refresh_embedding('p001', new_vector)
```

### Data model

Each product is one Redis Hash. The vector field is raw little-endian `float32` bytes — no JSON wrapping — because the Redis Search vector encoding expects exactly that. In Ruby, `Array#pack('e*')` packs a `Float` array into the on-wire form, and `String#unpack('e*')` decodes it back; redis-rb hands binary replies back as `ASCII-8BIT` strings, so no decoder configuration is needed.

```text
product:p001
  name=Alpine down parka
  description=Heavyweight 800-fill goose down parka...
  category=outerwear
  brand=northpeak
  price=289.0
  rating=4.7
  in_stock=true
  embedding=<384 x float32 little-endian bytes>
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

`redis-rb` 5.x does not ship typed bindings for the Redis Search module, so the helper drives `FT.CREATE`, `FT.SEARCH`, `FT.INFO`, `FT.DROPINDEX`, and `FT.TAGVALS` through the raw `redis.call(...)` escape hatch. The replies come back as nested Ruby Arrays, which the helper walks pair-by-pair into hashes; everything else in the file uses the typed `hset` / `hget` / `hmget` / `hincrbyfloat` / `pipelined` wrappers.

Per-user state is a separate hash. The session vector is stored as raw `float32` bytes the same way; affinity counters are stored as plain numeric strings, one field per category, prefixed with `aff:` so they don't collide with anything else.

```text
user:alice:features
  session_vec=<384 x float32 little-endian bytes>
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

When there's no filter, the pre-filter clause is just `(*)`. `vector_score` is the cosine *distance* (0 means identical, 2 means opposite), so the result is sorted ascending and the top row is the closest candidate to the query. TAG values are backslash-escaped before being interpolated into a `@tag:{...}` clause so a value that happens to contain a space, hyphen, or other Redis Search syntax character can't accidentally close the brace or inject an additional clause.

## The catalogue builder

Item vectors are pre-computed once and stored in `catalog.json` so the demo server can boot quickly. `build_catalog.rb` is the reference for how to do that — and is the script you'd adapt for a real catalogue ingestion pipeline
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/ruby/build_catalog.rb)):

```ruby
require_relative 'embeddings'

CATALOG = [
  { 'id' => 'p001', 'name' => 'Alpine down parka',
    'description' => 'Heavyweight 800-fill goose down parka...',
    'category' => 'outerwear', 'brand' => 'northpeak',
    'price' => 289.00, 'in_stock' => true, 'rating' => 4.7 },
  # ... rest of the catalogue ...
]

embedder = LocalEmbedder.new
vectors = embedder.encode_many(
  CATALOG.map { |p| "#{p['name']}. #{p['description']}" }
)
# Each vector is 384 float32s, packed and written into catalog.json
# alongside the structured fields. The demo server reads that file at
# startup and HSETs every product into Redis.
```

In production the equivalent of this script lives in an offline pipeline: embed once on catalogue updates and ship the vectors into Redis with [`HSET`]({{< relref "/commands/hset" >}}). The serving tier still embeds the *query* on each request, but that's usually fronted by a dedicated model server or batched at the API gateway rather than co-located with the data tier as it is in this demo.

## The interactive demo

`demo_server.rb` runs a WEBrick HTTP server with one demo user (`demo`). The HTML page lets you:

* Type a natural-language query and toggle filters: TAG (category, brand, in-stock), NUMERIC (price range, rating), and TEXT (the **Description contains** field, a phrase pre-filter against the `description` text index).
* Toggle session blending and category-affinity re-ranking independently to see what each layer contributes.
* Click any product card to record a click into the session. The page re-renders the user features panel immediately — the click wrote to the user features hash, and the next search reads that hash to fold the update in.
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

## Prerequisites

* Redis 7.x or later with the Redis Search module loaded (Redis Stack, or Redis 8 with Search).
* Ruby 3.0 or later. The `informers` gem requires a recent Ruby; the demo also uses `webrick`, which was removed from Ruby's standard library in Ruby 3.0 and is declared in the Gemfile.
* `redis-rb` 5.x for the typed core commands and the `redis.call(...)` raw escape hatch for the Redis Search calls.
* `informers` (the Ankane ONNX-runtime port of sentence-transformers) for the local text embedder. The first call downloads `sentence-transformers/all-MiniLM-L6-v2` (~80 MB) into the local Hugging Face cache.

## Run the demo locally

1. Clone the [`redis/docs`](https://github.com/redis/docs) repository and change into the example
   directory:

   ```bash
   git clone https://github.com/redis/docs.git
   cd docs/content/develop/use-cases/recommendation-engine/ruby
   ```

2. Install the gems:

   ```bash
   bundle install
   ```

3. Make sure a Redis instance with the Redis Search module is running locally on
   port 6379. [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
   [Redis 8 with Search]({{< relref "/develop/ai/search-and-query" >}}) both work.

4. Generate the catalogue with pre-computed embeddings. The first run downloads the
   `all-MiniLM-L6-v2` model (~80 MB) into the local Hugging Face cache:

   ```bash
   bundle exec ruby build_catalog.rb
   ```

5. Start the demo server:

   ```bash
   bundle exec ruby demo_server.rb
   ```

6. Open <http://localhost:8085> and try some queries:

   * **"insulated down jacket for cold weather"** — filtered to `outerwear`, in-stock only.
   * **"comfortable shoes for trail running"** — filtered to `footwear`.
   * Add **Description contains: waterproof** to either query above to see a TEXT pre-filter
     combine with the KNN.
   * Click a couple of products to seed a session, then re-run the same query
     with **Blend session vector into query** on and watch the ranking shift.
   * Use **Refresh embedding** to change a product's vector — for example,
     change the Alpine down parka's text to "heavy duty arctic expedition parka
     with hood" and re-run the jacket query to see the result move.

The server is read/write against your local Redis. The default index name is `recommend:idx` and product keys live under `product:`. Pass `--no-reset` to keep an existing index across restarts, `--redis-host` / `--redis-port` to point at a different Redis, or `--index-name` / `--key-prefix` to isolate the demo from any other Search index on the same instance.
