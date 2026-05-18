---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed recommendation engine in PHP with Predis and TransformersPHP
linkTitle: Predis example (PHP)
title: Redis recommendation engine with Predis
weight: 8
---

This guide shows you how to build a small Redis-backed product recommendation service in PHP with [`predis/predis`]({{< relref "/develop/clients/php" >}}) and the [`codewithkyrian/transformers`](https://transformers.codewithkyrian.com/) (TransformersPHP) library. It includes a local web server built on PHP's built-in development server so you can embed a natural-language query, run a KNN retrieval with structured pre-filters in one round trip, feed clicks back as a session signal, and watch the next recommendation incorporate them immediately.

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

1. The application calls `$embedder->encodeOne($queryText)` to turn a natural-language query into a 384-element `float[]`.
2. The application reads the user's session vector and affinities from the user features hash. If a session vector exists, it gets blended into the query vector with a tunable weight, so the user's recent clicks pull retrieval toward what they've been engaging with.
3. `$recommender->candidateRetrieve($queryVec, ...)` runs [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) with a pre-filter clause built from the request's TAG / NUMERIC / TEXT inputs, followed by a `KNN k @embedding $vec` clause. Redis returns up to `k` candidates with the cosine distance to the query (lower is closer).
4. `$recommender->rerank($candidates, $userFeatures)` subtracts a log-scaled per-category affinity bonus from each candidate's distance and re-sorts the list closest-first. The log scaling keeps repeated clicks from running away with the ranking.

### Click path (per user interaction)

When the user clicks a product, `$recommender->recordClick($userId, $productId)` does the following:

1. Reads the clicked item's embedding from its hash.
2. Reads the user's previous session vector from the user features hash, blends the new click in via an exponentially weighted moving average, and writes the new session vector back with [`HSET`]({{< relref "/commands/hset" >}}). This is a read-modify-write — atomic against any single write but not against a concurrent click for the same user; in practice, per-user click streams don't generate the contention to make this matter, and if a deployment does, the read and write can be wrapped in [`WATCH/MULTI/EXEC`]({{< relref "/commands/multi" >}}) or a small Lua script.
3. Bumps the per-category affinity counter with [`HINCRBYFLOAT`]({{< relref "/commands/hincrbyfloat" >}}) — atomic, no read needed — and the click count with [`HINCRBY`]({{< relref "/commands/hincrby" >}}).

The next query path picks both changes up the next time it reads the user features hash.

Refreshing an item's embedding follows a similar shape: encode the new text, write the vector bytes back with [`HSET`]({{< relref "/commands/hset" >}}), and the HNSW index reflects the change on the next query without a rebuild.

## The recommender helper

The `Recommender` class wraps the Redis Search index and the retrieval flow
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/php/Recommender.php)):

```php
<?php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/Embedder.php';
require __DIR__ . '/Recommender.php';

use Predis\Client;
use Redis\RecommendationEngine\Embedder;
use Redis\RecommendationEngine\Recommender;

$client = new Client(['host' => '127.0.0.1', 'port' => 6379]);
$recommender = new Recommender($client, 'recommend:idx');
$embedder = new Embedder();  // Xenova/all-MiniLM-L6-v2 (ONNX)

// One-time index setup (idempotent).
$recommender->createIndex();

// Embed the natural-language query.
$queryVec = $embedder->encodeOne('warm waterproof jacket for hiking');

// Retrieval: KNN with structured pre-filter in one round trip.
// Filters combine TAG (category, brand, inStockOnly), NUMERIC
// (price range, rating), and TEXT (textMatch against textField) —
// Redis applies them all in front of the KNN.
$candidates = $recommender->candidateRetrieve($queryVec, [
    'category' => 'outerwear',
    'inStockOnly' => true,
    'minPrice' => 50,
    'maxPrice' => 200,
    'textMatch' => 'waterproof',     // TEXT pre-filter on @description
    'k' => 10,
]);

// Record a click — updates the user's session vector and category
// affinity atomically; the next call to candidateRetrieve sees it.
$recommender->recordClick('alice', 'p001');

// Pull user features so the next retrieval can blend the session
// vector into the query and apply the category-affinity re-rank.
$features = $recommender->getUserFeatures('alice');
$candidates = $recommender->candidateRetrieve($queryVec, [
    'category' => 'outerwear',
    'inStockOnly' => true,
    'k' => 10,
    'sessionVec' => $features['session_vec'],
    'sessionWeight' => 0.3,
]);
$candidates = $recommender->rerank($candidates, $features, 0.15);

// Hot embedding refresh — overwrite the vector for one product; the
// HNSW index reflects the change on the next FT.SEARCH.
$newVector = $embedder->encodeOne('heavy-duty arctic expedition parka');
$recommender->refreshEmbedding('p001', $newVector);
```

### Data model

Each product is one Redis Hash. The vector field is raw little-endian `float32` bytes — no JSON wrapping — because the Redis Search vector encoding expects exactly that. In PHP, `pack('g*', ...$vector)` produces those bytes from a `float[]`, and PHP strings are 8-bit binary-safe so the bytes round-trip cleanly through Predis.

```text
product:p001
  name=Alpine down parka
  description=Heavyweight 800-fill goose down parka...
  category=outerwear
  brand=northpeak
  price=289
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

Predis exposes Redis Search through dedicated client methods (`ftcreate`, `ftsearch`, `ftinfo`, `ftdropindex`, `fttagvals`) and matching schema-field classes (`TextField`, `TagField`, `NumericField`, `VectorField`) — see [`Recommender.php`](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/php/Recommender.php). For a step-by-step walk-through of the typed Predis API for vector indexing, see the [PHP vector-search reference]({{< relref "/develop/clients/php/vecsearch" >}}).

Per-user state is a separate hash. The session vector is stored as raw `float32` bytes the same way; affinity counters are stored as plain numeric strings, one field per category, prefixed with `aff:` so they don't collide with anything else.

```text
user:alice:features
  session_vec=<384 × float32 little-endian bytes>
  aff:outerwear=2
  aff:footwear=1
  last_clicked_id=p015
  last_clicked_category=footwear
  clicks=3
```

### The query

The KNN clause is a hybrid query: a pre-filter expression in parentheses, then `=>[KNN k @embedding $vec]`. With `DIALECT 2`, Redis applies the filter first and then KNN-ranks only the matching documents.

```text
FT.SEARCH recommend:idx
  "(@category:{outerwear} @in_stock:{true} @price:[50 200])
     =>[KNN 10 @embedding $vec AS vector_score]"
  PARAMS 2 vec <384-float32-bytes>
  SORTBY vector_score
  RETURN 8 name description category brand price rating in_stock vector_score
  DIALECT 2
```

When there's no filter, the pre-filter clause is just `(*)`. `vector_score` is the cosine *distance* returned by Redis (0 = identical, 2 = opposite), so the result is sorted ascending and the top row is the closest candidate to the query. From [v3.0.0](https://github.com/predis/predis/releases/tag/v3.0.0) onwards Predis sets `DIALECT 2` by default on `ftsearch`, so the `->dialect('2')` call on `SearchArguments` is explicit but not strictly required.

### Binary fields with Predis

`predis/predis` returns hash field values as ordinary PHP strings. PHP strings are 8-bit binary-safe, so the raw `float32` bytes of the embedding round-trip through `hget` / `hmget` / `hgetall` and `hset` / `hmset` without any extra encoding. The helper uses `pack('g*', ...)` and `unpack('g*', ...)` to convert between PHP `float[]` arrays and the binary form Redis Search expects.

```php
// Write a vector
$client->hset('product:p001', 'embedding', pack('g*', ...$vec));

// Read it back; ``unpack`` returns a 1-indexed array, so reset to 0-indexed.
$bytes = $client->hget('product:p001', 'embedding');
$vec = array_values(unpack('g*', $bytes));
```

## The catalogue builder

Item vectors are pre-computed once and stored in `catalog.json` so the demo server can boot quickly. `build_catalog.php` is the reference for how to do that — and is the script you'd adapt for a real catalogue ingestion pipeline ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/php/build_catalog.php)):

```php
use Redis\RecommendationEngine\Embedder;

$CATALOG = [
    ['id' => 'p001', 'name' => 'Alpine down parka',
     'description' => 'Heavyweight 800-fill goose down parka...',
     'category' => 'outerwear', 'brand' => 'northpeak',
     'price' => 289.00, 'in_stock' => true, 'rating' => 4.7],
    // ... rest of the catalogue ...
];

$embedder = new Embedder();
foreach ($CATALOG as $product) {
    $vec = $embedder->encodeOne($product['name'] . '. ' . $product['description']);
    // Each vector is 384 float32s, packed and written into catalog.json
    // alongside the structured fields. The demo server reads that file
    // at startup and HSETs every product into Redis.
}
```

In production the equivalent of this script lives in an offline pipeline: embed once on catalogue updates and ship the vectors into Redis with [`HSET`]({{< relref "/commands/hset" >}}). The serving tier still embeds the *query* on each request, but that's usually fronted by a dedicated model server or batched at the API gateway rather than co-located with the data tier as it is in this demo.

## The interactive demo

`demo_server.php` runs against PHP's built-in development server with one demo user (`demo`). The HTML page lets you:

* Type a natural-language query and toggle filters: TAG (category, brand, in-stock), NUMERIC (price range, rating), and TEXT (the **Description contains** field, a phrase pre-filter against the `description` text index).
* Toggle session blending and category-affinity re-ranking independently to see what each layer contributes.
* Click any product card to record a click into the session. The page re-renders the user features panel immediately — the click wrote to the user features hash, and the next search reads that hash to fold the update in.
* Refresh a single product's embedding with new text and watch the ranking change on the next query.

`php -S` runs each HTTP request in a fresh process, so the embedding model and the Predis connection are constructed once per request. The recent-clicks ring lives in Redis under `demo:reco:*` so successive requests can see each other; everything else is read from Redis on demand. Endpoints:

| Endpoint                  | What it does                                                                |
|---------------------------|-----------------------------------------------------------------------------|
| `GET  /state`             | Index info, user features, full catalogue listing.                          |
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
    cd docs/content/develop/use-cases/recommendation-engine/php
    ```

2.  Make sure the PHP [FFI](https://www.php.net/manual/en/book.ffi.php)
    extension is enabled. TransformersPHP loads the ONNX Runtime native
    library through FFI; without it the embedder cannot construct.

    ```bash
    php -m | grep -i ffi    # should print "FFI"
    ```

    If FFI is missing, install the `php-ffi` package for your distribution
    (or rebuild PHP with `--with-ffi`) and set `ffi.enable=true` in your
    `php.ini`. The CLI is permissive by default; the built-in dev server
    is more restrictive, so the launch command below passes
    `-d ffi.enable=true` explicitly.

3.  Install the dependencies:

    ```bash
    composer install
    ```

    The `codewithkyrian/transformers-libsloader` Composer plugin
    downloads the ONNX Runtime and supporting native libraries for
    your platform into `vendor/codewithkyrian/transformers/libs/` —
    this needs `allow-plugins` in `composer.json` (already set in the
    example). The download adds ~70 MB on the first install.

4.  Make sure a Redis instance with the Redis Search module is running locally on
    port 6379. [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
    [Redis 8 with Search]({{< relref "/develop/ai/search-and-query" >}}) both work.

5.  Generate the catalogue with pre-computed embeddings. The first run downloads the
    `Xenova/all-MiniLM-L6-v2` model (~80 MB) into the local TransformersPHP cache:

    ```bash
    php build_catalog.php
    ```

6.  Start the demo server. The `-d ffi.enable=true` flag lets the dev
    server load the ONNX Runtime via FFI; the `-d error_reporting`
    flag silences harmless deprecation notices from a third-party
    dependency on PHP 8.4:

    ```bash
    php -d ffi.enable=true \
        -d "error_reporting=E_ALL & ~E_DEPRECATED" \
        -S 127.0.0.1:8091 demo_server.php
    ```

7.  Open <http://localhost:8091> and try some queries:

    * **"insulated down jacket for cold weather"** — filtered to `outerwear`, in-stock only.
    * **"comfortable shoes for trail running"** — filtered to `footwear`.
    * Add **Description contains: waterproof** to either query above to see a TEXT pre-filter
      combine with the KNN.
    * Click a couple of products to seed a session, then re-run the same query
      with **Blend session vector into query** on and watch the ranking shift.
    * Use **Refresh embedding** to change a product's vector — for example,
      change the Alpine down parka's text to "heavy duty arctic expedition parka
      with hood" and re-run the jacket query to see the result move.

The server is read/write against your local Redis. The default index name is `recommend:idx` and product keys live under `product:`. Override either with `INDEX_NAME=...` / `KEY_PREFIX=...` env vars before starting the server, or set `NO_RESET=1` to keep an existing index across restarts. `REDIS_HOST` / `REDIS_PORT` point at a different Redis.
