---
aliases:
- /develop/use-cases/semantic-cache/go-redis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed semantic cache for LLM responses in Go with go-redis and Hugot
linkTitle: go-redis example (Go)
title: Redis semantic cache with go-redis
weight: 3
---

This guide shows you how to build a small Redis-backed semantic cache for LLM responses in Go with [`go-redis`]({{< relref "/develop/clients/go" >}}) and the [Hugot](https://pkg.go.dev/github.com/knights-analytics/hugot) library. It includes a local web server built with Go's standard `net/http` package so you can send paraphrased prompts at a mock LLM, watch the cache decide hit or miss, sweep the cosine-distance threshold, and see the cumulative latency and token savings build up.

## Overview

Each cache entry is stored as a single Redis [Hash]({{< relref "/develop/data-types/hashes" >}}) at `cache:<id>`. The hash holds the original prompt, the LLM's response, the raw `float32` bytes of a 384-dimensional embedding of the prompt, and metadata fields — tenant, locale, model version, safety flag — plus a `created_ts` and a `hit_count`. A single [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) index covers the embedding field and every metadata field, so one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call with a `KNN` clause does the vector lookup *and* the TAG pre-filter in the same round trip — no cross-store joins.

The lookup is thresholded: [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) always returns the nearest entry that satisfies the filters, but the application only serves it as a hit when the reported cosine distance is at or below `DistanceThreshold`. Anything further away is treated as a miss; the caller runs the LLM and writes the new prompt, response, and embedding back to the same key pattern with a TTL.

The embedder is [Hugot](https://pkg.go.dev/github.com/knights-analytics/hugot) running the ONNX-exported [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model, which is the same encoder the [Python example]({{< relref "/develop/use-cases/semantic-cache/redis-py" >}}) and the [Node.js example]({{< relref "/develop/use-cases/semantic-cache/nodejs" >}}) use. Embeddings produced by the three implementations are semantically equivalent — paraphrase distances differ only at the fourth decimal place — so a cache populated by one demo can be queried by the others against the same Redis instance.

That gives you:

* A single round trip for lookup — vector KNN + metadata pre-filter in one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}).
* Tens of milliseconds on a hit vs. a multi-second LLM call on a miss; the embedding step is the bottleneck either way, and that's a model-side cost, not a Redis one.
* Tenant, locale, and model-version isolation enforced inside the query, not in application code — a write under one tenant cannot be served to another.
* Bounded memory: every entry has an [`EXPIRE`]({{< relref "/commands/expire" >}}) TTL, and a database-level [eviction policy]({{< relref "/develop/reference/eviction" >}}) (LRU / LFU) caps the cache size under pressure.

## How it works

A query goes through three stages: **embed**, **lookup**, and (on a miss) **call the LLM and write back**.

### Hit path (the goal)

1. The application calls `embedder.EncodeOne(ctx, prompt)` to turn the incoming text into a 384-element `[]float32`.
2. `cache.Lookup(ctx, queryVec, LookupParams{Tenant: ..., Locale: ..., ModelVersion: ...})` runs [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) with a TAG pre-filter and a `KNN 1` clause. Redis returns the closest cached prompt that satisfies the filters along with its cosine distance.
3. If the distance is at or below the threshold, the cache returns a `LookupResult` with the `Hit` field populated. The helper also runs an [`HINCRBY`]({{< relref "/commands/hincrby" >}}) on `hit_count` and an [`EXPIRE`]({{< relref "/commands/expire" >}}) refresh inside a [`MULTI/EXEC`]({{< relref "/commands/multi" >}}), so a frequently used answer keeps its TTL and the demo UI can see which entries are load-bearing.
4. The LLM is not called at all. The application returns the cached response to the user.

### Miss path

When the distance is above the threshold — or there is no candidate in scope at all — the helper returns a `LookupResult` with the `Miss` field populated instead, carrying the distance of the nearest candidate (if any) for logging. The application then:

1. Calls the LLM with the prompt.
2. Calls `cache.Put(ctx, PutParams{Prompt: ..., Response: ..., Embedding: queryVec, ...})`. The same embedding the lookup used is reused — no re-encode. The helper writes the Hash with [`HSET`]({{< relref "/commands/hset" >}}) and an [`EXPIRE`]({{< relref "/commands/expire" >}}) TTL inside a single [`MULTI/EXEC`]({{< relref "/commands/multi" >}}) so the entry never lands without a TTL on a partial failure.
3. Returns the LLM's response to the user. The next semantically similar prompt under the same metadata scope will be a hit.

## The cache helper

The `RedisSemanticCache` struct wraps the Redis Search index and the lookup / write flow
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/go/cache.go)):

```go
import (
    "context"
    "fmt"

    "github.com/redis/go-redis/v9"
)

ctx := context.Background()
client := redis.NewClient(&redis.Options{Addr: "localhost:6379"})

cache := NewRedisSemanticCache(
    client,
    "semcache:idx",
    "cache:",
    384,    // vector dimension
    0.5,    // cosine distance threshold; lower = stricter
    3600,   // default TTL in seconds (one hour)
)
embedder, _ := NewLocalEmbedder(ctx, "", "")  // sentence-transformers/all-MiniLM-L6-v2

// One-time index setup (idempotent).
_ = cache.CreateIndex(ctx)

// 1) Embed the prompt.
prompt := "How do I return an item?"
queryVec, _ := embedder.EncodeOne(ctx, prompt)

// 2) Look up under a metadata scope. The TAG filter and the KNN
//    travel together in one FT.SEARCH.
result, _ := cache.Lookup(ctx, queryVec, LookupParams{
    Tenant:       "acme",
    Locale:       "en",
    ModelVersion: "gpt-4.5-2026",
})

var response string
if result.Hit != nil {
    response = result.Hit.Response
    fmt.Printf("hit (%.3f): %s\n", result.Hit.Distance, response)
} else {
    // 3a) Miss — call the LLM. (Use your real client here.)
    response = callLLM(prompt)

    // 3b) Cache the new entry. Reuses the same embedding bytes the
    //     lookup used, so we don't pay the encoder twice.
    _, _ = cache.Put(ctx, PutParams{
        Prompt:       prompt,
        Response:     response,
        Embedding:    queryVec,
        Tenant:       "acme",
        Locale:       "en",
        ModelVersion: "gpt-4.5-2026",
    })
}
```

### Data model

Each cache entry is one Redis Hash. The vector field is raw little-endian `float32` bytes — no JSON wrapping — because the Redis Search vector encoding expects exactly that. The helper uses `binary.LittleEndian` rather than `binary.NativeEndian` so the byte layout is independent of the host architecture (every supported Go target is little-endian today, but pinning the encoding makes the docs example portable in principle).

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

The lookup is a hybrid query: a TAG pre-filter expression in parentheses, then `=>[KNN 1 @embedding $vec]`. With `DialectVersion: 2`, Redis applies the filter first and KNN-ranks only the matching documents. In `go-redis`:

```go
result, _ := client.FTSearchWithArgs(ctx,
    "semcache:idx",
    "(@tenant:{acme} @locale:{en} @model_version:{gpt\\-4\\.5\\-2026} @safety:{ok})"+
        "=>[KNN 1 @embedding $vec AS distance]",
    &redis.FTSearchOptions{
        DialectVersion: 2,
        Params:         map[string]any{"vec": FloatsToBytes(queryVec)},
        SortBy: []redis.FTSearchSortBy{
            {FieldName: "distance", Asc: true},
        },
        Return: []redis.FTSearchReturn{
            {FieldName: "prompt"}, {FieldName: "response"},
            {FieldName: "tenant"}, {FieldName: "locale"},
            {FieldName: "model_version"},
            {FieldName: "hit_count"}, {FieldName: "distance"},
        },
        LimitOffset: 0,
        Limit:       1,
    },
).Result()
```

`distance` is the cosine *distance* (0 means identical, 2 means opposite). The result is sorted ascending, so the top row is the closest candidate. The application inspects `distance` against the threshold and decides hit or miss in user code — Redis returns the row either way, and treating it as a hit or a miss is a policy decision the cache helper owns, not a server-side filter.

## The mock LLM

To make the latency and token savings visible without requiring an API key, `mockllm.go` provides a deterministic stand-in
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/go/mockllm.go)):

```go
llm := NewMockLLM("", 1500)  // 1.5 seconds per call
resp := llm.Complete("What is your return policy?")
// resp.Response       — the templated answer text
// resp.LatencyMs      — wall-clock time the call took
// resp.TotalTokens()  — estimated prompt + completion tokens
```

The mock sleeps for the configured latency, then keyword-matches against a small FAQ table to produce an answer. The deliberate slowness is what makes a hit visibly cheaper than a miss in the demo. In production code, you would replace `MockLLM` with your real client of choice — an OpenAI Go SDK, an Anthropic SDK, an internal vLLM endpoint, anything — without changing the cache helper.

## Pre-seeding the cache

In a real deployment the cache fills up organically: a first-time question is a miss, the LLM answers, and the response is written back. For the demo, `seedcache.go` pre-loads a small set of canonical FAQ prompts so the very first query lands on a hit
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/go/seedcache.go)):

```go
_ = cache.CreateIndex(ctx)
_, _ = Seed(ctx, cache, embedder, SeedOptions{Tenant: "acme", Locale: "en"})
```

The seed list stores the canonical phrasing of each question ("What is your return policy?"). Paraphrases of any of these prompts ("How do I return an item?", "Can I get a refund?") embed close to the canonical entry, so the cache lookup serves the stored response without ever calling the model.

## The interactive demo

`main.go` runs a Go `net/http` server. The HTML page lets you:

* Type a prompt and toggle metadata: tenant, locale, model version. Each combination is a separate cache namespace inside the same index.
* Slide the cosine-distance threshold and see hits flip to misses (and back) on the same prompt, with the actual distance reported on each query.
* Submit with **Ask** to run the full hit-or-miss path (calls the LLM on a miss, writes the answer back). Submit with **Lookup only (no LLM)** to sweep the threshold against a fixed prompt without polluting the cache.
* Watch the cumulative panel build up: total queries, cache hits, cache misses, hit ratio, tokens not spent, LLM milliseconds not waited.
* Inspect every cached entry, including remaining TTL and total hit count, and drop individual entries to simulate eviction.

The server holds one `LocalEmbedder`, one `RedisSemanticCache`, and one `MockLLM` for the lifetime of the process. The HTML page is shared with the Python and Node.js demos and is loaded from `index.html` next to `main.go`. Endpoints:

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
    cd docs/content/develop/use-cases/semantic-cache/go
    ```

2.  Pull the Go modules:

    ```bash
    go mod tidy
    ```

    This demo uses Hugot's pure-Go inference backend (`hugot.NewGoSession`),
    so no native ONNX Runtime C library is required. If you'd prefer the
    higher-throughput ONNX Runtime backend you can swap `NewGoSession` for
    `NewORTSession` and follow the [ONNX Runtime install
    instructions](https://onnxruntime.ai/docs/install/) — the rest of the
    demo is unchanged.

3.  Make sure a Redis instance with the Redis Search module is running locally on
    port 6379. [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
    [Redis 8 with Search]({{< relref "/develop/ai/search-and-query" >}}) both work.

4.  Start the demo server. The first run downloads the ONNX-exported
    `sentence-transformers/all-MiniLM-L6-v2` model into the local `./models`
    directory:

    ```bash
    go run .
    ```

5.  Open <http://localhost:8088> and try some queries:

    * **"What is your return policy?"** — exact match against the seed, distance ≈ 0,
      hit at any threshold.
    * **"How fast is delivery?"** — paraphrase of the shipping seed; distance
      around 0.30, hit at the default threshold of 0.5.
    * **"How do I return an item?"** — slightly looser paraphrase of the returns
      seed; distance around 0.49, still a hit at the default threshold. Slide
      the threshold down to 0.4 to see this one flip to a miss.
    * **"What payment methods do you accept?"** — unrelated to anything in the
      seed; distance > 0.6, so you'll see a miss, the mock LLM kicks in for
      ~1.5 s, the new answer is cached, and a follow-up of the same question
      is now an immediate hit.
    * Switch the **Tenant** dropdown to `globex` or `initech` and re-ask any
      seeded question — the result flips to a miss because the cache entries
      live under `acme`. That's the metadata pre-filter at work inside `FT.SEARCH`.

The server is read/write against your local Redis. The default index name is `semcache:idx` and entry keys live under `cache:`. Flags mirror the Python and Node.js demos: `--no-reset` to keep an existing cache across restarts, `--threshold` to change the default cosine-distance cutoff, or `--llm-latency-ms` to make the mock LLM faster or slower for the demo.
