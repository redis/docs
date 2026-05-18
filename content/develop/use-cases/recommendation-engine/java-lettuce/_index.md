---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed recommendation engine in Java with Lettuce and DJL (HuggingFace tokenizers + ONNX Runtime)
linkTitle: Lettuce example (Java)
title: Redis recommendation engine with Lettuce
weight: 7
---

This guide shows you how to build a small Redis-backed product recommendation service in Java with the [Lettuce]({{< relref "/develop/clients/lettuce" >}}) client library and the [Deep Java Library](https://djl.ai/) (DJL) with its HuggingFace tokenizer integration and the ONNX Runtime inference engine. It includes a local web server built on the JDK's `com.sun.net.httpserver` so you can embed a natural-language query, run a KNN retrieval with structured pre-filters in one round trip, feed clicks back as a session signal, and watch the next recommendation incorporate them immediately.

## Overview

Each product is stored as a single Redis [Hash]({{< relref "/develop/data-types/hashes" >}}) at `product:<id>`. The hash holds the structured metadata (name, description, category, brand, price, rating, in-stock flag) alongside the raw `float32` bytes of a 384-dimensional embedding. A single [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) index covers every field, so one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call with a `KNN` clause does the vector similarity *and* the TAG / NUMERIC / TEXT pre-filtering in the same pass &mdash; no cross-store joins.

Per-user state lives in `user:<id>:features`: a session vector written as an exponentially weighted average of recently-clicked item embeddings, plus per-category affinity counters incremented atomically with [`HINCRBYFLOAT`]({{< relref "/commands/hincrbyfloat" >}}). [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) does *not* read that hash directly; instead, the application reads it on the next request and passes the session vector to `FT.SEARCH` as the query parameter. The two-step is what lets a click feed the very next recommendation without a batch cycle or cache invalidation.

That gives you:

* A single round trip for retrieval &mdash; vector KNN + structured filters in one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}).
* Sub-millisecond hot path once the query is embedded; embedding the query is the bottleneck, and that's a model-side cost, not a Redis one.
* Real-time session signals &mdash; a click writes a new session vector and bumps an affinity counter; the next query reads them and folds them in.
* No-downtime embedding refresh &mdash; [`HSET`]({{< relref "/commands/hset" >}}) on the vector field, and the HNSW index reflects the change on the next query.

## How it works

There are two distinct paths: a **query path** runs every time the application wants a recommendation, and a **click path** runs every time the user interacts with a product.

### Query path (per recommendation request)

1. The application calls `embedder.encodeOne(queryText)` to turn a natural-language query into a 384-dimensional `float32` vector. DJL's `Predictor` runs the [HuggingFace tokenizer](https://github.com/deepjavalibrary/djl/tree/master/extensions/tokenizers) and ONNX Runtime inference end-to-end.
2. The application reads the user's session vector and affinities from the user features hash. If a session vector exists, it gets blended into the query vector with a tunable weight, so the user's recent clicks pull retrieval toward what they've been engaging with.
3. `recommender.candidateRetrieve(queryVec, opts)` runs [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) with a pre-filter clause built from the request's TAG / NUMERIC / TEXT inputs, followed by a `KNN k @embedding $vec` clause. Redis returns up to `k` candidates with the cosine distance to the query (lower is closer).
4. `recommender.rerank(candidates, userFeatures, affinityWeight)` subtracts a log-scaled per-category affinity bonus from each candidate's distance and re-sorts the list closest-first. The log scaling keeps repeated clicks from running away with the ranking.

### Click path (per user interaction)

When the user clicks a product, `recommender.recordClick(userId, productId, ewmaAlpha, affinityStep)` does the following:

1. Reads the clicked item's embedding from its hash.
2. Reads the user's previous session vector from the user features hash, blends the new click in via an exponentially weighted moving average, and writes the new session vector back with [`HSET`]({{< relref "/commands/hset" >}}). This is a read-modify-write &mdash; atomic against any single write but not against a concurrent click for the same user. In practice, per-user click streams don't generate the contention to make this matter, and if a deployment does, the read and write can be wrapped in [`WATCH/MULTI/EXEC`]({{< relref "/commands/multi" >}}) or a small Lua script.
3. Bumps the per-category affinity counter with [`HINCRBYFLOAT`]({{< relref "/commands/hincrbyfloat" >}}) &mdash; atomic, no read needed &mdash; and the click count with [`HINCRBY`]({{< relref "/commands/hincrby" >}}).

The next query path picks both changes up the next time it reads the user features hash.

Refreshing an item's embedding follows a similar shape: encode the new text, write the vector bytes back with [`HSET`]({{< relref "/commands/hset" >}}), and the HNSW index reflects the change on the next query without a rebuild.

## The recommender helper

The `Recommender` class wraps the Redis Search index and the retrieval flow
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/java-lettuce/Recommender.java)):

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;

// One client, two connections: a String/String one for structured
// commands and FT.* index management, plus a String/byte[] one for
// every command that touches the binary embedding field (including
// FT.SEARCH, whose $vec parameter is raw bytes too).
RedisClient client = RedisClient.create("redis://localhost:6379");
StatefulRedisConnection<String, String> conn = client.connect();
StatefulRedisConnection<String, byte[]> binConn = client.connect(
        RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));

Recommender recommender = new Recommender(conn, binConn,
        "recommend:idx", "product:", "user:", 384);

LocalEmbedder embedder = new LocalEmbedder();   // all-MiniLM-L6-v2 via DJL + ONNX Runtime

// One-time index setup (idempotent).
recommender.createIndex();

// Embed the natural-language query.
float[] queryVec = embedder.encodeOne("warm waterproof jacket for hiking");

// Retrieval: KNN with structured pre-filter in one round trip.
// Filters combine TAG (category, brand, inStockOnly), NUMERIC
// (price range, rating), and TEXT (textMatch against textField) —
// Redis applies them all in front of the KNN.
Recommender.RetrieveOptions opts = new Recommender.RetrieveOptions();
opts.category = "outerwear";
opts.inStockOnly = true;
opts.minPrice = 50.0;
opts.maxPrice = 200.0;
opts.textMatch = "waterproof";   // TEXT pre-filter on @description
opts.k = 10;
List<Recommender.Candidate> candidates = recommender.candidateRetrieve(queryVec, opts);

// Record a click — updates the user's session vector and category
// affinity atomically; the next call to candidateRetrieve sees it.
recommender.recordClick("alice", "p001", 0.4, 1.0);

// Pull user features so the next retrieval can blend the session
// vector into the query and apply the category-affinity re-rank.
Recommender.UserFeatures features = recommender.getUserFeatures("alice");
opts.sessionVec = features.sessionVec;
opts.sessionWeight = 0.3;
candidates = recommender.candidateRetrieve(queryVec, opts);
candidates = recommender.rerank(candidates, features, 0.15);

// Hot embedding refresh — overwrite the vector for one product; the
// HNSW index reflects the change on the next FT.SEARCH.
float[] newVector = embedder.encodeOne("heavy-duty arctic expedition parka");
recommender.refreshEmbedding("p001", newVector);
```

### Data model

Each product is one Redis Hash. The vector field is raw little-endian `float32` bytes &mdash; no JSON wrapping &mdash; because the Redis Search vector encoding expects exactly that.

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

When there's no filter, the pre-filter clause is just `(*)`. `vector_score` is the cosine *distance* (0 means identical, 2 means opposite), so the result is sorted ascending and the top row is the closest candidate to the query.

The Lettuce equivalent uses the typed `ftSearch` method on the binary-codec connection's `RediSearchCommands`. The query expression is passed as the value type (`byte[]` on the binary connection, so UTF-8-encoded) and the binary `$vec` parameter goes through `SearchArgs.Builder.param(...)`:

```java
String knn = filterClause + "=>[KNN " + k + " @embedding $vec AS vector_score]";
SearchArgs<String, byte[]> args = SearchArgs.<String, byte[]>builder()
        .param("vec", Recommender.floatsToBytes(queryVec))
        .returnField("name").returnField("description")
        .returnField("category").returnField("brand")
        .returnField("price").returnField("rating")
        .returnField("in_stock").returnField("vector_score")
        .sortBy(SortByArgs.<String>builder().attribute("vector_score").build())
        .limit(0, k)
        .dialect(QueryDialects.DIALECT2)
        .build();
SearchReply<String, byte[]> reply = binConn.sync()
        .ftSearch("recommend:idx",
                knn.getBytes(StandardCharsets.UTF_8), args);
```

## Lettuce specifics: binary fields and pipelining

Two things in the helper change shape relative to the [Jedis port]({{< relref "/develop/use-cases/recommendation-engine/java-jedis" >}}):

### 1. Codec choice for the binary embedding field

Lettuce's default `StringCodec` UTF-8-decodes every hash value, which would corrupt the raw `float32` bytes that the Redis Search vector field expects. Following the [Lettuce vector-search reference]({{< relref "/develop/clients/lettuce/vecsearch" >}}), the helper opens a *second* connection bound to a `<String, byte[]>` codec (built with `RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE)`) and routes every command that reads or writes the `embedding` field &mdash; including `FT.SEARCH`, whose `$vec` parameter is raw bytes too &mdash; through that connection. The structured fields share the same hash and are written through the same binary connection as their UTF-8 bytes so Redis sees an identical wire format to what the Jedis port writes.

```java
RedisClient client = RedisClient.create("redis://localhost:6379");
StatefulRedisConnection<String, String> conn = client.connect();
StatefulRedisConnection<String, byte[]> binConn = client.connect(
        RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));
```

### 2. Pipelining with `setAutoFlushCommands(false)`

Jedis pipelines via a dedicated `Pipeline` object you obtain with `client.pipelined()`. Lettuce instead drives pipelining at the *connection* level: turn auto-flush off, queue async commands, flush, then await the futures.

```java
RedisAsyncCommands<String, byte[]> async = binConn.async();
binConn.setAutoFlushCommands(false);
try {
    List<RedisFuture<Long>> futures = new ArrayList<>();
    for (Product p : products) {
        Map<String, byte[]> fields = ...;          // name, description, ..., embedding
        futures.add(async.hset(productKey(p.id), fields));
    }
    binConn.flushCommands();
    for (RedisFuture<Long> f : futures) f.get();
} finally {
    binConn.setAutoFlushCommands(true);
}
```

The toggle is connection-wide, so the helper owns its binary connection rather than borrowing a shared one &mdash; any other thread issuing commands on the same connection while auto-flush is off would be stalled until `flushCommands()` is called.

### A note on `FT.INFO`

Lettuce 7's `RediSearchCommands` exposes typed wrappers for most `FT.*` commands, but `FT.INFO` isn't one of them. The helper dispatches the raw command via `connection.sync().dispatch(...)` with a `NestedMultiOutput` so it can parse the alternating-pair reply, the same approach the [streaming Lettuce port]({{< relref "/develop/use-cases/streaming/java-lettuce" >}}) uses for `XAUTOCLAIM`'s extended reply.

## The local embedder

The `LocalEmbedder` class wraps DJL's HuggingFace text-embedding pipeline so the rest of the helper can hand it a string and get back a unit-normalised `float[]`
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/java-lettuce/LocalEmbedder.java)):

```java
Criteria<String, float[]> criteria = Criteria.builder()
        .setTypes(String.class, float[].class)
        .optModelUrls("djl://ai.djl.huggingface.onnxruntime/sentence-transformers/all-MiniLM-L6-v2")
        .optEngine("OnnxRuntime")
        .optTranslatorFactory(new TextEmbeddingTranslatorFactory())
        .optProgress(new ProgressBar())
        .build();
ZooModel<String, float[]> model = criteria.loadModel();
Predictor<String, float[]> predictor = model.newPredictor();
float[] vector = predictor.predict("warm waterproof jacket for hiking");
```

The model URL routes through DJL's model zoo. The `ai.djl.huggingface.onnxruntime` group ID pulls a pre-converted ONNX bundle (model weights plus `tokenizer.json`) so we don't need a separate conversion step. `optEngine("OnnxRuntime")` pins the inference engine to ONNX Runtime, which means the demo only drags in the small ONNX Runtime native library rather than the much heavier PyTorch native library that `ai.djl.huggingface.pytorch` would require.

`Predictor` is *not* thread-safe; the wrapper guards calls with `synchronized` because the JDK HttpServer dispatches each request on a worker thread. For higher concurrency in production you'd hold a pool of `Predictor` instances backed by one `ZooModel`.

## The catalogue builder

Item vectors are pre-computed once and stored in `catalog.json` so the demo server can boot quickly. `BuildCatalog` is the reference for how to do that &mdash; and is the program you'd adapt for a real catalogue ingestion pipeline
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/recommendation-engine/java-lettuce/BuildCatalog.java)):

```java
List<CatalogSeed.Seed> seeds = CatalogSeed.all();
List<String> texts = new ArrayList<>();
for (CatalogSeed.Seed s : seeds) {
    texts.add(CatalogSeed.embedTextFor(s));    // "<name>. <description>"
}
try (LocalEmbedder embedder = new LocalEmbedder()) {
    float[][] vectors = embedder.encodeMany(texts);
    Catalog.write(Path.of("catalog.json"),
            embedder.getModelName(), vectors[0].length, seeds, vectors);
}
```

In production the equivalent lives in an offline pipeline: embed once on catalogue updates and ship the vectors into Redis with [`HSET`]({{< relref "/commands/hset" >}}). The serving tier still embeds the *query* on each request, but that's usually fronted by a dedicated model server or batched at the API gateway rather than co-located with the data tier as it is in this demo.

The shared `catalog.json` wire format (model name, dim, list of products with base64-encoded `float32` LE bytes for the vector) is identical to what the Python, Node, and Go ports produce, so you can re-use any port's catalog with the Lettuce demo as long as the embedding model matches.

## The interactive demo

`DemoServer` runs `com.sun.net.httpserver.HttpServer` with a 16-thread executor and one demo user (`demo`). The HTML page lets you:

* Type a natural-language query and toggle filters: TAG (category, brand, in-stock), NUMERIC (price range, rating), and TEXT (the **Description contains** field, a phrase pre-filter against the `description` text index).
* Toggle session blending and category-affinity re-ranking independently to see what each layer contributes.
* Click any product card to record a click into the session. The page re-renders the user features panel immediately &mdash; the click wrote to the user features hash, and the next search reads that hash to fold the update in.
* Refresh a single product's embedding with new text and watch the ranking change on the next query.

The server holds one `RedisClient`, two `StatefulRedisConnection`s (regular + binary-codec), one `LocalEmbedder`, and one `Recommender` for the lifetime of the process. Endpoints:

| Endpoint                  | What it does                                                                |
|---------------------------|-----------------------------------------------------------------------------|
| `GET  /state`             | Index info, user features, full catalogue listing.                          |
| `POST /search`            | Embed the query, run `FT.SEARCH` with filters + KNN, optionally re-rank.    |
| `POST /click`             | Record a click for the demo user: update session vector and affinity.       |
| `POST /reset-user`        | Drop the user features hash.                                                |
| `POST /reset-index`       | Drop the index and documents and re-seed from `catalog.json`.               |
| `POST /refresh-embedding` | Embed new text and overwrite one product's vector with `HSET`.              |

## Prerequisites

Before running the demo, make sure that:

* Redis 7.0 or later with the Redis Search module is running and accessible. By default the demo connects to `localhost:6379`. [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or [Redis 8 with Search]({{< relref "/develop/ai/search-and-query" >}}) both work.
* JDK 17 or later is installed (the demo's inline HTML uses text blocks, which require JDK 15+; 17+ keeps the demo on a current LTS).
* [Maven](https://maven.apache.org/) 3.9 or later for dependency resolution. DJL pulls in a couple of dozen transitive jars, so a manual `javac -cp ...` build is impractical; the `pom.xml` shipped next to the source files lets Maven handle that. Lettuce 7.x is required &mdash; the typed `FT.*` API used by this demo (`ftCreate`, `ftSearch`, `ftDropindex`, `ftTagvals`, the `SearchArgs` / `FieldArgs` / `CreateArgs` builders) lives in `io.lettuce.core.search` and was introduced in the 7.x release line.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Run the demo locally

1.  Clone the [`redis/docs`](https://github.com/redis/docs) repository and change into the example
    directory:

    ```bash
    git clone https://github.com/redis/docs.git
    cd docs/content/develop/use-cases/recommendation-engine/java-lettuce
    ```

2.  Build the project. The first build downloads the dependency graph (Lettuce 7, DJL API, the
    HuggingFace tokenizer extension, the ONNX Runtime engine, and Gson):

    ```bash
    mvn -DskipTests package
    ```

3.  Generate the catalogue with pre-computed embeddings. The first run downloads the
    `all-MiniLM-L6-v2` ONNX bundle (~80&nbsp;MB) into the local DJL cache
    (`~/.djl.ai/cache/`):

    ```bash
    mvn -DskipTests exec:java -Dexec.mainClass=BuildCatalog
    ```

4.  Start the demo server:

    ```bash
    mvn -DskipTests exec:java -Dexec.mainClass=DemoServer
    ```

    Override the defaults with `-Dexec.args="--port 8090 --redis-host 127.0.0.1"`.

5.  Open <http://localhost:8084> and try some queries:

    * **"insulated down jacket for cold weather"** &mdash; filtered to `outerwear`, in-stock only.
    * **"comfortable shoes for trail running"** &mdash; filtered to `footwear`.
    * Add **Description contains: waterproof** to either query above to see a TEXT pre-filter
      combine with the KNN.
    * Click a couple of products to seed a session, then re-run the same query
      with **Blend session vector into query** on and watch the ranking shift.
    * Use **Refresh embedding** to change a product's vector &mdash; for example,
      change the Alpine down parka's text to "heavy duty arctic expedition parka
      with hood" and re-run the jacket query to see the result move.

The server is read/write against your local Redis. The default index name is `recommend:idx` and product keys live under `product:`. Pass `--no-reset` to keep an existing index across restarts, or `--index-name` / `--key-prefix` to point the demo at a different prefix entirely.
