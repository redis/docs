---
aliases:
- /develop/use-cases/semantic-cache/predis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed semantic cache for LLM responses in PHP with Predis and transformers-php
linkTitle: Predis example (PHP)
title: Redis semantic cache with Predis
weight: 4
---

This guide shows you how to build a small Redis-backed semantic cache for LLM responses in PHP with [Predis]({{< relref "/develop/clients/php" >}}) and [TransformersPHP](https://transformers.codewithkyrian.com/) running the [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) encoder locally on ONNX Runtime. It includes a local web server built with PHP's built-in development HTTP server so you can send paraphrased prompts at a mock LLM, watch the cache decide hit or miss, sweep the cosine-distance threshold, and see the cumulative latency and token savings build up.

## Overview

Each cache entry is stored as a single Redis [Hash]({{< relref "/develop/data-types/hashes" >}}) at `cache:<id>`. The hash holds the original prompt, the LLM's response, the raw `float32` bytes of a 384-dimensional embedding of the prompt, and metadata fields — tenant, locale, model version, safety flag — plus a `created_ts` and a `hit_count`. A single [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) index covers the embedding field and every metadata field, so one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call with a `KNN` clause does the vector lookup *and* the TAG pre-filter in the same round trip — no cross-store joins.

The lookup is thresholded: [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) always returns the nearest entry that satisfies the filters, but the application only serves it as a hit when the reported cosine distance is at or below `distanceThreshold`. Anything further away is treated as a miss; the caller runs the LLM and writes the new prompt, response, and embedding back to the same key pattern with a TTL.

The embedder is [TransformersPHP](https://transformers.codewithkyrian.com/) running the [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2) ONNX export — the same 384-dimensional encoder the [Node.js example]({{< relref "/develop/use-cases/semantic-cache/nodejs" >}}) uses. The library is the established choice for vector embeddings in PHP (see [Index and query vectors]({{< relref "/develop/clients/php/vecsearch" >}}) for the precedent). Cosine distances differ from the Python and Jedis ports by only a few thousandths because of small numerical differences between ONNX Runtime and PyTorch, so a cache populated by one demo can be queried by another against the same Redis instance with very nearly the same hit/miss behaviour.

That gives you:

* A single round trip for lookup — vector KNN + metadata pre-filter in one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}).
* Tens of milliseconds on a hit vs. a multi-second LLM call on a miss; the embedding step is the bottleneck either way, and that's a model-side cost, not a Redis one.
* Tenant, locale, and model-version isolation enforced inside the query, not in application code — a write under one tenant cannot be served to another.
* Bounded memory: every entry has an [`EXPIRE`]({{< relref "/commands/expire" >}}) TTL, and a database-level [eviction policy]({{< relref "/develop/reference/eviction" >}}) (LRU / LFU) caps the cache size under pressure.

## How it works

A query goes through three stages: **embed**, **lookup**, and (on a miss) **call the LLM and write back**.

### Hit path (the goal)

1. The application calls `$embedder->encodeOne($prompt)` to turn the incoming text into a 384-element `float` array.
2. `$cache->lookup($queryVec, tenant: ..., locale: ..., modelVersion: ...)` runs [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) with a TAG pre-filter and a `KNN 1` clause. Redis returns the closest cached prompt that satisfies the filters along with its cosine distance.
3. If the distance is at or below the threshold, the cache returns a `CacheHit` containing the cached response. The helper also issues an [`HINCRBY`]({{< relref "/commands/hincrby" >}}) on `hit_count` and an [`EXPIRE`]({{< relref "/commands/expire" >}}) refresh inside a [`MULTI/EXEC`]({{< relref "/commands/multi" >}}), so a frequently used answer keeps its TTL and the demo UI can see which entries are load-bearing.
4. The LLM is not called at all. The application returns the cached response to the user.

### Miss path

When the distance is above the threshold — or there is no candidate in scope at all — the helper returns a `CacheMiss` instead, carrying the distance of the nearest candidate (if any) for logging. The application then:

1. Calls the LLM with the prompt.
2. Calls `$cache->put($prompt, $response, $embedding, tenant: ..., locale: ..., modelVersion: ...)`. The same embedding the lookup used is reused — no re-encode. The helper writes the Hash with [`HSET`]({{< relref "/commands/hset" >}}) and an [`EXPIRE`]({{< relref "/commands/expire" >}}) TTL inside a single [`MULTI/EXEC`]({{< relref "/commands/multi" >}}) so the entry never lands without a TTL on a partial failure.
3. Returns the LLM's response to the user. The next semantically similar prompt under the same metadata scope will be a hit.

## The cache helper

The `RedisSemanticCache` class wraps the Redis Search index and the lookup / write flow
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/php/src/RedisSemanticCache.php)):

```php
use Predis\Client;
use Redis\SemanticCache\{RedisSemanticCache, LocalEmbedder, CacheHit};

$client = new Client(['host' => 'localhost', 'port' => 6379]);
$embedder = LocalEmbedder::create();   // sentence-transformers/all-MiniLM-L6-v2

$cache = new RedisSemanticCache(
    client: $client,
    indexName: 'semcache:idx',
    keyPrefix: 'cache:',
    distanceThreshold: 0.5,    // cosine distance, lower = stricter
    defaultTtlSeconds: 3600,   // one hour
);

// One-time index setup (idempotent).
$cache->createIndex();

// 1) Embed the prompt.
$prompt = 'How do I return an item?';
$queryVec = $embedder->encodeOne($prompt);

// 2) Look up under a metadata scope. The TAG filter and the KNN
//    travel together in one FT.SEARCH.
$result = $cache->lookup(
    queryVec: $queryVec,
    tenant: 'acme',
    locale: 'en',
    modelVersion: 'gpt-4.5-2026',
);

if ($result instanceof CacheHit) {
    $response = $result->response;
    printf("hit (%.3f): %s\n", $result->distance, $response);
} else {
    // 3a) Miss — call the LLM. (Use your real client here.)
    $response = call_llm($prompt);

    // 3b) Cache the new entry. Reuses the same embedding bytes the
    //     lookup used, so we don't pay the encoder twice.
    $cache->put(
        prompt: $prompt,
        response: $response,
        embedding: $queryVec,
        tenant: 'acme',
        locale: 'en',
        modelVersion: 'gpt-4.5-2026',
    );
}
```

### Data model

Each cache entry is one Redis Hash. The vector field is raw little-endian `float32` bytes — no JSON wrapping — because the Redis Search vector encoding expects exactly that. The helper packs the embedding with PHP's [`pack('g*', ...)`](https://www.php.net/manual/en/function.pack.php) (the `g` format is a little-endian single-precision IEEE-754 float), matching the encoding the Python, Node.js, Go, and Jedis ports write.

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

The lookup is a hybrid query: a TAG pre-filter expression in parentheses, then `=>[KNN 1 @embedding $vec]`. With `DIALECT 2`, Redis applies the filter first and KNN-ranks only the matching documents. In Predis:

```php
use Predis\Command\Argument\Search\SearchArguments;

$arguments = (new SearchArguments())
    ->addReturn(7, 'prompt', 'response', 'tenant', 'locale',
                'model_version', 'hit_count', 'distance')
    ->sortBy('distance', 'asc')
    ->limit(0, 1)
    ->dialect('2')
    ->params(['vec', pack('g*', ...$queryVec)]);

$raw = $client->ftsearch(
    'semcache:idx',
    '(@tenant:{acme} @locale:{en} @model_version:{gpt\-4\.5\-2026} @safety:{ok})'
        . '=>[KNN 1 @embedding $vec AS distance]',
    $arguments,
);
```

`distance` is the cosine *distance* (0 means identical, 2 means opposite). The result is sorted ascending, so the top row is the closest candidate. The application inspects `distance` against the threshold and decides hit or miss in user code — Redis returns the row either way, and treating it as a hit or a miss is a policy decision the cache helper owns, not a server-side filter.

Predis 3.x defaults to query dialect 2; the cache helper sets it explicitly so the code reads correctly against earlier versions too. See [Index and query vectors]({{< relref "/develop/clients/php/vecsearch" >}}) for more on Predis's vector-search helpers.

## The mock LLM

To make the latency and token savings visible without requiring an API key, `MockLLM.php` provides a deterministic stand-in
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/php/src/MockLLM.php)):

```php
use Redis\SemanticCache\MockLLM;

$llm = new MockLLM(latencyMs: 1500.0);
$response = $llm->complete('What is your return policy?');
// $response['response']         — the templated answer text
// $response['latency_ms']       — wall-clock time the call took
// $response['total_tokens']     — estimated prompt + completion tokens
```

The mock sleeps for the configured latency, then keyword-matches against a small FAQ table to produce an answer. The deliberate slowness is what makes a hit visibly cheaper than a miss in the demo. In production code, you would replace `MockLLM` with your real client of choice — an HTTP call to OpenAI, Anthropic, a self-hosted vLLM endpoint, anything — without changing the cache helper.

## Pre-seeding the cache

In a real deployment the cache fills up organically: a first-time question is a miss, the LLM answers, and the response is written back. For the demo, `SeedCache.php` pre-loads a small set of canonical FAQ prompts so the very first query lands on a hit
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/php/src/SeedCache.php)):

```php
use Redis\SemanticCache\SeedCache;

$cache->createIndex();
SeedCache::seed($cache, $embedder, tenant: 'acme', locale: 'en');
```

The seed list stores the canonical phrasing of each question ("What is your return policy?"). Paraphrases of any of these prompts ("How do I return an item?", "Can I get a refund?") embed close to the canonical entry, so the cache lookup serves the stored response without ever calling the model.

The seed helper embeds the prompts one at a time rather than as a single batched `encodeMany` call. TransformersPHP's attention-mask handling produces slightly different mean-pooled vectors for variable-length inputs inside a batch versus single-input calls, and that 0.01-cosine-distance drift would otherwise make a self-lookup of a seeded prompt look like a near-match instead of a clean zero-distance hit.

## The interactive demo

`public/index.php` is a front controller for PHP's built-in HTTP server — no Slim, no Symfony, no embedded framework. The HTML page lets you:

* Type a prompt and toggle metadata: tenant, locale, model version. Each combination is a separate cache namespace inside the same index.
* Slide the cosine-distance threshold and see hits flip to misses (and back) on the same prompt, with the actual distance reported on each query.
* Submit with **Ask** to run the full hit-or-miss path (calls the LLM on a miss, writes the answer back). Submit with **Lookup only (no LLM)** to sweep the threshold against a fixed prompt without polluting the cache.
* Watch the cumulative panel build up: total queries, cache hits, cache misses, hit ratio, tokens not spent, LLM milliseconds not waited.
* Inspect every cached entry, including remaining TTL and total hit count, and drop individual entries to simulate eviction.

The front controller rebuilds a `LocalEmbedder`, a `RedisSemanticCache`, and a `MockLLM` on every request because PHP's built-in server is single-process and does not share user-land objects between requests. The first request is therefore slow (the embedder reloads the tokenizer and ONNX session); subsequent requests reuse the cached model files on disk and are fast. The HTML page is shared with the Python, Node.js, Go, and Jedis demos; the same `index.html` works against any of the language ports without modification. Endpoints:

| Endpoint        | What it does                                                                  |
|-----------------|-------------------------------------------------------------------------------|
| `GET  /state`   | Index info and the full list of cached entries.                               |
| `POST /query`   | Embed the prompt, run `FT.SEARCH`, on miss call the LLM and write back.       |
| `POST /reset`   | Drop every cached entry and re-seed from the FAQ list.                        |
| `POST /drop`    | Delete a single cached entry by id.                                           |

## Configuration

PHP's CLI flag parsing is awkward, so the demo reads configuration from environment variables rather than `--`-style flags. All variables have defaults; override only what you need.

| Variable                    | Default        | Purpose                                            |
|-----------------------------|----------------|----------------------------------------------------|
| `SEMCACHE_PORT`             | `8093`         | TCP port for the dev server                        |
| `SEMCACHE_REDIS_HOST`       | `localhost`    | Redis host                                         |
| `SEMCACHE_REDIS_PORT`       | `6379`         | Redis port                                         |
| `SEMCACHE_INDEX_NAME`       | `semcache:idx` | Redis Search index name                            |
| `SEMCACHE_KEY_PREFIX`       | `cache:`       | Prefix for cache entry hashes                      |
| `SEMCACHE_TTL_SECONDS`      | `3600`         | TTL on each cache entry                            |
| `SEMCACHE_THRESHOLD`        | `0.5`          | Default cosine-distance threshold                  |
| `SEMCACHE_LLM_LATENCY_MS`   | `1500`         | Mock LLM sleep, milliseconds                       |
| `SEMCACHE_RESEED`           | `true`         | Re-seed FAQ entries on the first request           |

## Run the demo locally

1.  Clone the [`redis/docs`](https://github.com/redis/docs) repository and change into the example
    directory:

    ```bash
    git clone https://github.com/redis/docs.git
    cd docs/content/develop/use-cases/semantic-cache/php
    ```

2.  Make sure a Redis instance with the Redis Search module is running locally on
    port 6379. [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
    [Redis 8 with Search]({{< relref "/develop/ai/search-and-query" >}}) both work.

3.  Install the PHP dependencies with [Composer](https://getcomposer.org/). This step also
    downloads the prebuilt TransformersPHP native libraries (ONNX Runtime, OpenBLAS, Rindow's matlib FFI shim) for your platform — about 90 MB on macOS arm64:

    ```bash
    composer install
    ```

    The example requires PHP 8.2 or later and uses [Predis](https://github.com/predis/predis) for Redis access, with no PHP extensions required beyond the standard `ffi` shipped with most builds.

4.  Start the demo. The included `run.sh` sets the PHP `ffi.enable=true` directive that
    TransformersPHP needs at runtime, caps `post_max_size` at 1 MiB to match the demo's
    body-size budget, and silences PHP 8.4 deprecation notices that `codewithkyrian/transformers`
    0.5.x emits on the latest PHP — the underlying inference is unaffected. The first run
    downloads the `Xenova/all-MiniLM-L6-v2` ONNX weights (~30 MB) into the local Hugging
    Face cache; every subsequent run is offline:

    ```bash
    ./run.sh
    ```

    To pick a different port or threshold, set the corresponding environment variable
    before invoking the script:

    ```bash
    SEMCACHE_PORT=8093 SEMCACHE_THRESHOLD=0.4 ./run.sh
    ```

5.  Open <http://localhost:8093> and try some queries:

    * **"What is your return policy?"** — exact match against the seed, distance ≈ 0,
      hit at any threshold.
    * **"How fast is delivery?"** — paraphrase of the shipping seed; distance
      around 0.30, hit at the default threshold of 0.5.
    * **"How do I return an item?"** — slightly looser paraphrase of the returns
      seed; distance around 0.49, still a hit at the default threshold. Slide
      the threshold down to 0.4 to see this one flip to a miss.
    * **"What payment methods do you accept?"** — unrelated to anything in the
      seed, but the embedding model still finds shallow surface-form similarity
      with the canonical "What ___ do you ___?" phrasing of the seeds, so the
      distance lands around 0.66. At the default threshold of 0.5 you will see
      a miss, the mock LLM kicks in for ~1.5 s, the new answer is cached, and
      a follow-up of the same question is now an immediate hit. At threshold
      0.7 the same query is a borderline hit — that's the cosine-distance
      cutoff working exactly as advertised.
    * Switch the **Tenant** dropdown to `globex` or `initech` and re-ask any
      seeded question — the result flips to a miss because the cache entries
      live under `acme`. That's the metadata pre-filter at work inside `FT.SEARCH`.

The server is read/write against your local Redis. The default index name is `semcache:idx` and entry keys live under `cache:`. Set `SEMCACHE_RESEED=false` to keep an existing cache across restarts, `SEMCACHE_THRESHOLD` to change the default cosine-distance cutoff, `SEMCACHE_LLM_LATENCY_MS` to make the mock LLM faster or slower for the demo, or `SEMCACHE_PORT` to listen on a different port.
