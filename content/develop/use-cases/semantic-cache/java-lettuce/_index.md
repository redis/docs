---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed semantic cache for LLM responses in Java with Lettuce and DJL (PyTorch)
linkTitle: Lettuce example (Java)
title: Redis semantic cache with Lettuce
weight: 4
---

This guide shows you how to build a small Redis-backed semantic cache for LLM responses in Java with [Lettuce]({{< relref "/develop/clients/lettuce" >}}) and [DJL (Deep Java Library)](https://djl.ai/) running the [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) encoder locally on PyTorch. It includes a local web server built with the JDK's standard `com.sun.net.httpserver.HttpServer` so you can send paraphrased prompts at a mock LLM, watch the cache decide hit or miss, sweep the cosine-distance threshold, and see the cumulative latency and token savings build up.

## Overview

Each cache entry is stored as a single Redis [Hash]({{< relref "/develop/data-types/hashes" >}}) at `cache:<id>`. The hash holds the original prompt, the LLM's response, the raw `float32` bytes of a 384-dimensional embedding of the prompt, and metadata fields — tenant, locale, model version, safety flag — plus a `created_ts` and a `hit_count`. A single [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) index covers the embedding field and every metadata field, so one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call with a `KNN` clause does the vector lookup *and* the TAG pre-filter in the same round trip — no cross-store joins.

The lookup is thresholded: [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) always returns the nearest entry that satisfies the filters, but the application only serves it as a hit when the reported cosine distance is at or below `distanceThreshold`. Anything further away is treated as a miss; the caller runs the LLM and writes the new prompt, response, and embedding back to the same key pattern with a TTL.

The embedder is [DJL](https://djl.ai/) loading the [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) PyTorch model from the DJL model zoo. This is the same 384-dimensional encoder the [Python example]({{< relref "/develop/use-cases/semantic-cache/redis-py" >}}), the [Node.js example]({{< relref "/develop/use-cases/semantic-cache/nodejs" >}}), and the [Jedis example]({{< relref "/develop/use-cases/semantic-cache/java-jedis" >}}) use. Embeddings produced by the four implementations are semantically equivalent — paraphrase distances differ only at the fourth decimal place — so a cache populated by one demo can be queried by another against the same Redis instance.

That gives you:

* A single round trip for lookup — vector KNN + metadata pre-filter in one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}).
* Tens of milliseconds on a hit vs. a multi-second LLM call on a miss; the embedding step is the bottleneck either way, and that's a model-side cost, not a Redis one.
* Tenant, locale, and model-version isolation enforced inside the query, not in application code — a write under one tenant cannot be served to another.
* Bounded memory: every entry has an [`EXPIRE`]({{< relref "/commands/expire" >}}) TTL, and a database-level [eviction policy]({{< relref "/develop/reference/eviction" >}}) (LRU / LFU) caps the cache size under pressure.

## How it works

A query goes through three stages: **embed**, **lookup**, and (on a miss) **call the LLM and write back**.

### Hit path (the goal)

1. The application calls `embedder.encodeOne(prompt)` to turn the incoming text into a 384-dimensional `float[]`.
2. `cache.lookup(queryVec, tenant, locale, modelVersion, "ok", threshold)` runs [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) with a TAG pre-filter and a `KNN 1` clause. Redis returns the closest cached prompt that satisfies the filters along with its cosine distance.
3. If the distance is at or below the threshold, the cache returns a `CacheHit` containing the cached response. The helper also runs an [`HINCRBY`]({{< relref "/commands/hincrby" >}}) on `hit_count` and an [`EXPIRE`]({{< relref "/commands/expire" >}}) refresh inside a [`MULTI/EXEC`]({{< relref "/commands/multi" >}}), so a frequently used answer keeps its TTL and the demo UI can see which entries are load-bearing.
4. The LLM is not called at all. The application returns the cached response to the user.

### Miss path

When the distance is above the threshold — or there is no candidate in scope at all — the helper returns a `CacheMiss` instead, carrying the distance of the nearest candidate (if any) for logging. The application then:

1. Calls the LLM with the prompt.
2. Calls `cache.put(prompt, response, embedding, tenant, locale, modelVersion, ...)`. The same embedding the lookup used is reused — no re-encode. The helper writes the Hash with [`HSET`]({{< relref "/commands/hset" >}}) and an [`EXPIRE`]({{< relref "/commands/expire" >}}) TTL inside a single [`MULTI/EXEC`]({{< relref "/commands/multi" >}}) so the entry never lands without a TTL on a partial failure.
3. Returns the LLM's response to the user. The next semantically similar prompt under the same metadata scope will be a hit.

## The cache helper

The `RedisSemanticCache` class wraps the Redis Search index and the lookup / write flow
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/java-lettuce/src/main/java/com/redis/semcache/RedisSemanticCache.java)):

```java
import io.lettuce.core.ClientOptions;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.protocol.ProtocolVersion;
import com.redis.semcache.RedisSemanticCache;
import com.redis.semcache.LocalEmbedder;
import com.redis.semcache.LookupResult;
import com.redis.semcache.CacheHit;

RedisClient client = RedisClient.create("redis://localhost:6379");
client.setOptions(ClientOptions.builder()
        .protocolVersion(ProtocolVersion.RESP2)
        .build());
StatefulRedisConnection<byte[], byte[]> connection =
        client.connect(ByteArrayCodec.INSTANCE);

LocalEmbedder embedder = LocalEmbedder.create();   // sentence-transformers/all-MiniLM-L6-v2

RedisSemanticCache cache = new RedisSemanticCache(
        connection,
        "semcache:idx",
        "cache:",
        384,
        0.5,    // cosine distance, lower = stricter
        3600    // TTL in seconds (one hour)
);

// One-time index setup (idempotent).
cache.createIndex();

// 1) Embed the prompt.
String prompt = "How do I return an item?";
float[] queryVec = embedder.encodeOne(prompt);

// 2) Look up under a metadata scope. The TAG filter and the KNN
//    travel together in one FT.SEARCH.
LookupResult result = cache.lookup(
        queryVec, "acme", "en", "gpt-4.5-2026", "ok", null);

String response;
if (result instanceof CacheHit hit) {
    response = hit.response();
    System.out.printf("hit (%.3f): %s%n", hit.distance(), response);
} else {
    // 3a) Miss — call the LLM. (Use your real client here.)
    response = callLlm(prompt);

    // 3b) Cache the new entry. Reuses the same embedding bytes the
    //     lookup used, so we don't pay the encoder twice.
    cache.put(
            prompt,
            response,
            queryVec,
            "acme",
            "en",
            "gpt-4.5-2026",
            "ok",
            null,   // ttl override (null = default)
            null    // entry id (null = generated)
    );
}
```

The connection uses Lettuce's `ByteArrayCodec` so the binary float-32 bytes of the embedding can share an `HSET` mapping with the UTF-8 text fields without a second connection. RESP2 is pinned explicitly: Lettuce 6.7 negotiates RESP3 by default, which returns the [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) reply as a map keyed by `results` / `total_results` instead of the flat alternating list the demo's parser expects, and pinning RESP2 keeps the wire format identical to what the Python, Node, and Jedis ports speak.

### Data model

Each cache entry is one Redis Hash. The vector field is raw little-endian `float32` bytes — no JSON wrapping — because the Redis Search vector encoding expects exactly that. The helper packs the `float[]` with a `ByteBuffer` in `ByteOrder.LITTLE_ENDIAN`, which matches the bytes Redis Search reads and is identical to the encoding the Python and Node ports write.

```text
cache:7c3f8a1b9e02
  prompt=How do I return an item?
  response=You can return any unworn item within 30 days...
  tenant=acme
  locale=en
  model_version=gpt-4.5-2026
  safety=ok
  created_ts=1715990400.123
  hit_count=4
  embedding=<384 × float32 little-endian bytes>
```

The Redis Search index schema treats every field as queryable in its natural type:

```text
FT.CREATE semcache:idx
  ON HASH PREFIX 1 cache:
  SCHEMA
    prompt         TEXT
    response       TEXT
    tenant         TAG
    locale         TAG
    model_version  TAG
    safety         TAG
    created_ts     NUMERIC SORTABLE
    hit_count      NUMERIC SORTABLE
    embedding      VECTOR HNSW 6 TYPE FLOAT32 DIM 384 DISTANCE_METRIC COSINE
```

### The query

The lookup is a hybrid query: a TAG pre-filter expression in parentheses, then `=>[KNN 1 @embedding $vec]`. With `DIALECT 2`, Redis applies the filter first and KNN-ranks only the matching documents. Lettuce 6.7 doesn't yet ship first-class [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) bindings, so the helper sends the command through `RedisCommands.dispatch()` with a custom `ProtocolKeyword` — the same machinery Lettuce uses internally for any command it does support natively, just spelled out by the caller. The wire bytes are identical to typing the command in `redis-cli`:

```java
CommandArgs<byte[], byte[]> args = new CommandArgs<>(ByteArrayCodec.INSTANCE)
        .add(indexNameBytes)
        .add("(@tenant:{acme} @locale:{en} @model_version:{gpt\\-4\\.5\\-2026} @safety:{ok})"
                + "=>[KNN 1 @embedding $vec AS distance]")
        .add("RETURN").add(7)
        .add("prompt").add("response").add("tenant").add("locale")
        .add("model_version").add("hit_count").add("distance")
        .add("SORTBY").add("distance").add("ASC")
        .add("LIMIT").add(0).add(1)
        .add("PARAMS").add(2).add("vec".getBytes()).add(LocalEmbedder.toBytes(queryVec))
        .add("DIALECT").add(2);

List<Object> raw = sync.dispatch(
        FtCommand.FT_SEARCH,
        new NestedMultiOutput<>(ByteArrayCodec.INSTANCE),
        args
);
```

`distance` is the cosine *distance* (0 means identical, 2 means opposite). The result is sorted ascending, so the top row is the closest candidate. The application inspects `distance` against the threshold and decides hit or miss in user code — Redis returns the row either way, and treating it as a hit or a miss is a policy decision the cache helper owns, not a server-side filter.

## The mock LLM

To make the latency and token savings visible without requiring an API key, `MockLLM.java` provides a deterministic stand-in
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/java-lettuce/src/main/java/com/redis/semcache/MockLLM.java)):

```java
import com.redis.semcache.MockLLM;

MockLLM llm = new MockLLM("gpt-4.5-2026", 1500.0);
MockLLM.Response response = llm.complete("What is your return policy?");
// response.response()      — the templated answer text
// response.latencyMs()     — wall-clock time the call took
// response.totalTokens()   — estimated prompt + completion tokens
```

The mock sleeps for the configured latency, then keyword-matches against a small FAQ table to produce an answer. The deliberate slowness is what makes a hit visibly cheaper than a miss in the demo. In production code, you would replace `MockLLM` with your real client of choice — an HTTP call to OpenAI, Anthropic, a self-hosted vLLM endpoint, anything — without changing the cache helper.

## Pre-seeding the cache

In a real deployment the cache fills up organically: a first-time question is a miss, the LLM answers, and the response is written back. For the demo, `SeedCache.java` pre-loads a small set of canonical FAQ prompts so the very first query lands on a hit
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/java-lettuce/src/main/java/com/redis/semcache/SeedCache.java)):

```java
import com.redis.semcache.SeedCache;

cache.createIndex();
SeedCache.seed(cache, embedder, "acme", "en", "gpt-4.5-2026");
```

The seed list stores the canonical phrasing of each question ("What is your return policy?"). Paraphrases of any of these prompts ("How do I return an item?", "Can I get a refund?") embed close to the canonical entry, so the cache lookup serves the stored response without ever calling the model.

## The interactive demo

`DemoServer.java` runs an HTTP server built on the JDK's `com.sun.net.httpserver.HttpServer` — no Spring, no Jetty, no embedded framework. The HTML page lets you:

* Type a prompt and toggle metadata: tenant, locale, model version. Each combination is a separate cache namespace inside the same index.
* Slide the cosine-distance threshold and see hits flip to misses (and back) on the same prompt, with the actual distance reported on each query.
* Submit with **Ask** to run the full hit-or-miss path (calls the LLM on a miss, writes the answer back). Submit with **Lookup only (no LLM)** to sweep the threshold against a fixed prompt without polluting the cache.
* Watch the cumulative panel build up: total queries, cache hits, cache misses, hit ratio, tokens not spent, LLM milliseconds not waited.
* Inspect every cached entry, including remaining TTL and total hit count, and drop individual entries to simulate eviction.

The server holds one `LocalEmbedder`, one `RedisSemanticCache`, and one `MockLLM` for the lifetime of the process. The HTML page is shared with the Python, Node.js, Go, and Jedis demos; the build embeds `index.html` from the project root as a classpath resource so the jar runs from any working directory. Endpoints:

| Endpoint        | What it does                                                                  |
|-----------------|-------------------------------------------------------------------------------|
| `GET  /state`   | Index info and the full list of cached entries.                               |
| `POST /query`   | Embed the prompt, run `FT.SEARCH`, on miss call the LLM and write back.       |
| `POST /reset`   | Drop every cached entry and re-seed from the FAQ list.                        |
| `POST /drop`    | Delete a single cached entry by id.                                           |

## Run the demo locally

1.  Clone the [`redis/docs`](https://github.com/redis/docs) repository and change into the example
    directory:

    ```bash
    git clone https://github.com/redis/docs.git
    cd docs/content/develop/use-cases/semantic-cache/java-lettuce
    ```

2.  Make sure a Redis instance with the Redis Search module is running locally on
    port 6379. [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
    [Redis 8 with Search]({{< relref "/develop/ai/search-and-query" >}}) both work.

3.  Build the project with Maven. This pulls Lettuce, DJL, and the PyTorch native
    libraries. The first build takes a couple of minutes:

    ```bash
    mvn -q package
    ```

4.  Run the demo. The first run also downloads the `sentence-transformers/all-MiniLM-L6-v2`
    PyTorch weights into the local DJL cache (~90 MB); every subsequent run is offline:

    ```bash
    java -jar target/semantic-cache-lettuce.jar
    ```

    Or with `mvn`:

    ```bash
    mvn -q exec:java
    ```

5.  Open <http://localhost:8090> and try some queries:

    * **"What is your return policy?"** — exact match against the seed, distance ≈ 0,
      hit at any threshold.
    * **"How fast is delivery?"** — paraphrase of the shipping seed; distance
      around 0.30, hit at the default threshold of 0.5.
    * **"How do I return an item?"** — slightly looser paraphrase of the returns
      seed; distance around 0.49, still a hit at the default threshold. Slide
      the threshold down to 0.4 to see this one flip to a miss.
    * **"What payment methods do you accept?"** — unrelated to anything in the
      seed; distance > 0.65, so you'll see a miss, the mock LLM kicks in for
      ~1.5 s, the new answer is cached, and a follow-up of the same question
      is now an immediate hit.
    * Switch the **Tenant** dropdown to `globex` or `initech` and re-ask any
      seeded question — the result flips to a miss because the cache entries
      live under `acme`. That's the metadata pre-filter at work inside `FT.SEARCH`.

The server is read/write against your local Redis. The default index name is `semcache:idx` and entry keys live under `cache:`. Flags mirror the Python, Node, and Jedis demos: `--no-reset` to keep an existing cache across restarts, `--threshold` to change the default cosine-distance cutoff, `--llm-latency-ms` to make the mock LLM faster or slower for the demo, or `--port` to listen on a different port.
