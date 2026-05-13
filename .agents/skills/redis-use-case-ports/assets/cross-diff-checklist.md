# Cross-client diff checklist

Phase 6 of the [`redis-use-case-ports`](../SKILL.md) workflow runs this checklist across all 9 client implementations to catch consistency drift.

This is **not** a bug audit (that's `audit-checklist.md`). It's about things that should be **the same** across clients but may have drifted because 9 agents wrote them independently.

A sub-agent can run this in read-only mode. For each row, produce a 9-column comparison (one column per client) and flag any column that disagrees with the majority.

---

## Helper API surface

| Concern | What to compare |
|---|---|
| Method names | `get`, `invalidate`, `update_field`, `stats`, `reset_stats`, `ttl_remaining` (camelCase or snake_case per language idiom). All 9 must expose the same set of operations. |
| Method signatures | Argument names + types should match the reference's semantics. Loader callbacks accept an entity ID and return either a record or null/None/nil. |
| Return shapes | The `get` return must include the record, a hit flag, and the measured Redis round-trip latency. The names may be language-idiomatic but the fields must align. |
| Stats shape | `{ hits, misses, stampedes_suppressed, hit_rate_pct, primary_reads_total, primary_read_latency_ms }`. JSON-serialised exactly like this for the demo's `/stats` endpoint. |

## Redis command set

| Concern | What to compare |
|---|---|
| Read path | `HGETALL` on every hit-check, no client should use individual `HGET`s. |
| Write path | `HSET` (with all fields) + `EXPIRE`, ideally pipelined or in a single `HSET ... EXPIRE` MULTI. |
| Invalidate | `DEL` (not `EXPIRE 0`, not `UNLINK`). |
| Field update | `HSET key field value` + `EXPIRE` inside a conditional transaction or `Condition.KeyExists`. |
| TTL inspection | `TTL` (not `PTTL`, not `OBJECT`). The wrapper must preserve the `-2` (missing key) and `-1` (no TTL) sentinels as integer seconds; if the client's typed wrapper collapses or rescales them (go-redis's `time.Duration` with nanosecond-encoded sentinels, StackExchange.Redis's `KeyTimeToLive` returning `null` for both cases), bypass it with the raw command (`Do("TTL", ...)` / `Execute("TTL", ...)`). See audit-checklist row 15. |
| Single-flight acquire | Lua script using `SET NX PX`. |
| Single-flight release | Lua script using `GET == token` check + `DEL`. |
| Counters (where stats are in Redis, e.g. PHP) | `HINCRBY`. |

Any divergence (e.g. someone using `EXPIREAT` instead of `EXPIRE`, or `SET NX EX` instead of `PX`) should be flagged and either justified or fixed.

## Default values

| Concern | Standard value |
|---|---|
| Cache key prefix | `cache:product:` (or whatever the reference uses for the use case). |
| Lock key prefix | `lock:cache:product:` (mirror of cache key with `lock:` prefix). |
| Default TTL | 30 seconds. |
| Default lock TTL | 2000 milliseconds. |
| Default wait poll interval | 25 milliseconds. |
| Default primary latency | 150 ms. |
| Sample product IDs | `p-001`, `p-002`, `p-003`, `p-004`. |
| Sample fields | `id`, `name`, `price_cents`, `stock`. |

Defaults should be overridable via constructor args (helper) or CLI flags / env vars (demo).

## Demo server HTTP API

| Endpoint | Method | Behaviour |
|---|---|---|
| `/` | GET | Serves the HTML demo page. |
| `/products` | GET | Returns `{ products: [...ids...] }`. |
| `/read?id=<id>` | GET | Returns read result. 400 if `id` missing, 404 if unknown. |
| `/stats` | GET | Returns the stats object. |
| `/invalidate` | POST | Form `id=...`. Returns `{ id, deleted, stats }`. |
| `/update` | POST | Form `id=...&field=...&value=...`. Updates primary then invalidates cache. Returns `{ id, field, value, stats }`. |
| `/stampede` | POST | Form `id=...&concurrency=N`. Returns `{ id, concurrency, primary_reads, elapsed_ms, results, stats }`. |
| `/reset` | POST | Returns stats with all counters zeroed. |

All endpoints return JSON (`application/json`) except `/`. Stats embedded in every mutation response so the UI stays current.

## Response shapes

`/read` response:

```json
{
  "id": "p-001",
  "record": { "id": "p-001", "name": "...", "price_cents": "650", "stock": "42" },
  "hit": false,
  "redis_latency_ms": 1.23,
  "total_latency_ms": 105.4,
  "ttl_remaining": 30,
  "stats": { ... }
}
```

`/stampede` response:

```json
{
  "id": "p-002",
  "concurrency": 20,
  "primary_reads": 1,
  "elapsed_ms": 124.5,
  "results": [
    { "hit": false, "redis_latency_ms": 1.1, "found": true },
    ...
  ],
  "stats": { ... }
}
```

Field naming uses `snake_case` in JSON regardless of host language idiom, for consistency with the demo UI's JavaScript.

## Frontmatter (each `_index.md`)

Per-client guide page:

```yaml
---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis <use-case> in <language> with <client>
linkTitle: <client> example (<language>)
title: Redis <use-case> with <client>
weight: <unique 1-9>
---
```

Landing page (`<use-case>/_index.md`):

```yaml
---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: <one-line description>
hideListLinks: true
linkTitle: <Use case>
title: Redis <use case>
weight: <next available among use cases>
---
```

## Section structure of `_index.md` per client

The guide page must follow this structure (with section titles adapted to the use case):

1. Lead paragraph (1–2 sentences linking to the client docs).
2. ## Overview
3. ## How it works (numbered steps)
4. ## The cache-aside helper (or equivalent name) — code snippet showing the public API.
5. ### Data model
6. ## The relevant operations (one section per operation: stampede protection, invalidation, field updates, etc.)
7. ## Hit/miss accounting (or stats section, if applicable)
8. ## Prerequisites
9. ## Running the demo
10. ## The mock primary store
11. ## Production usage (with `###` subsections)
12. ## Learn more (links to commands and clients)

The "Production usage" section should always discuss TTL choice, invalidate-don't-sync, missing-record handling, lock TTL tuning, and namespacing. Other items vary by language (connection pool, async API, etc.).

## Prose consistency

The same concept should use the same wording across all 9 guides. Drift examples to look for:

| Concept | Preferred wording |
|---|---|
| Cache miss → primary lookup | "fall through to the primary" |
| Single-flight | "single-flight lock" (not "mutex" or "leader election") |
| Stampede | "cache stampede" |
| Invalidate | "delete the cache key" (not "expire", not "evict") |
| Not-found loader return | "missing record" |
| Primary | "primary database" or "primary store" |
| TTL bound | "bounded staleness" |

## HTML demo page

The visible HTML structure should be identical across clients. Each demo inlines [`assets/html-template.html`](html-template.html) with three placeholders:

- `{{OPTIONS}}` — product `<option>` list, HTML-escaped.
- `{{PRIMARY_LATENCY}}` — number, ms.
- `{{CACHE_TTL}}` — number, seconds.

The only per-client variation should be the **pill text** at the top of `<body>` describing the client + HTTP framework (e.g., `"Lettuce + Java HttpServer demo"`).

## Source links and "Get the source files" block

| Concern | What to compare |
|---|---|
| Inline source links | Every `[source](...)` (and any `[FileName.ext](...)` standalone reference) must point to a full `https://github.com/redis/docs/blob/main/content/develop/use-cases/<use-case>/<client>/...` URL — never a relative path. |
| URL routes to this port | The URL after `/use-cases/<use-case>/` matches the port's own directory, not a sibling's. (Common failure: `java-jedis` guide linking to `java-lettuce/RedisCache.java`.) |
| `Get the source files` subsection | Every `_index.md` has a `### Get the source files` subsection as the first child of `## Running the demo`. It contains a `mkdir <use-case>-demo && cd <use-case>-demo`, a `BASE=https://raw.githubusercontent.com/redis/docs/main/...` variable, and one `curl -O $BASE/<file>` per source file the port needs. |
| Files curled match files run | The set of files in the curl block matches what the existing run command (e.g. `python3 demo_server.py`, `dotnet run`, `php -S ... demo_server.php`) actually requires. No missing config files (`package.json`, `composer.json`, `*.csproj`, `go.mod`, `Cargo.toml`), no extras (`Cargo.lock` only if `cargo` expects it; build outputs never). |
| Rust folder layout | The curl block matches the port's on-disk layout: if files live under `src/`, the block does `mkdir -p .../src && cd ...` then `curl -o src/<file> $BASE/src/<file>`; if files are flat at the project root (driven by explicit `path =` in `Cargo.toml`), `curl -O $BASE/<file>` for all of them. |
| Source-file count in prose matches curl block | Prose like *"The demo consists of N files"* in `### Get the source files` must match the actual number of `curl -O` lines in the block. Easy drift when a port adds an extra worker entry point (e.g. PHP's separate `sync_worker.php`) and the count is not updated. |

**Audit prompt:**

> For each of the 9 client implementations of `content/develop/use-cases/{{USE_CASE_NAME}}/`, grep `_index.md` with `grep -nE "\]\(([^h)][^)]*\.[a-z]+)\)"` — the result must be empty (no relative file links). Then confirm `## Running the demo` is followed by `### Get the source files`, and that the curl block downloads the same files the run command needs. Count the `curl -O` lines and confirm the prose intro ("The demo consists of N files") matches. Flag any port where the curl-block file set diverges from the run-time requirements, or where a Rust port's `src/` layout doesn't match its on-disk reality.

## File names per client

| Client | Helper file | Primary file | Demo entry |
|---|---|---|---|
| `redis-py` | `cache.py` | `primary.py` | `demo_server.py` |
| `nodejs` | `cache.js` | `primary.js` | `demoServer.js` |
| `go` | `cache.go` | `primary.go` | `demo_server.go` |
| `java-jedis` | `RedisCache.java` | `MockPrimaryStore.java` | `DemoServer.java` |
| `java-lettuce` | `RedisCache.java` | `MockPrimaryStore.java` | `DemoServer.java` |
| `dotnet` | `RedisCache.cs` | `MockPrimaryStore.cs` | `Program.cs` |
| `php` | `Cache.php` | `Primary.php` | `demo_server.php` |
| `ruby` | `cache.rb` | `primary.rb` | `demo_server.rb` |
| `rust` | `cache.rs` | `primary.rs` | `demo_server.rs` |

Plus any language-required config file (`go.mod`, `Cargo.toml`, `*.csproj`) — see [`redis-conventions.md`](redis-conventions.md).

## How to flag a finding

For each row that's inconsistent across clients, the cross-diff sub-agent should report:

```
[ROW: stats shape]
Inconsistent:
  - redis-py: includes "hit_rate_pct" rounded to 1 decimal
  - dotnet: includes "hit_rate_pct" rounded to 0 decimals
  - <other 7>: 1 decimal (match redis-py)
Recommendation: round to 1 decimal across all clients.
```

The synthesis (Phase 3) or retrofit (Phase 5) then decides whether to enforce the majority pattern or document the deviation.
