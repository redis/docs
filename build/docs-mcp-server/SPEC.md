# Docs MCP server — design spec

**Status:** Draft (investigation, DOC-6809)
**Owner:** Docs
**Scope:** A read-only MCP server that lets AI coding agents query the Redis
documentation corpus as a tool, backed by the JSON/NDJSON feed we already
publish.

---

## 1. Motivation

We already publish AI-readable docs three ways: `llms.txt` (index), per-page
Markdown (`index.html.md`), and structured JSON/NDJSON with role-tagged
sections. These are all *passive files* — an agent must know they exist, fetch
them, and do its own retrieval.

The gap is an *active, queryable* surface: a tool an agent (Cursor, Claude
Code, ChatGPT, VS Code) can call mid-task to get a **current, sourced** answer
instead of relying on stale training data. That is what this server provides.

### Explicitly *not* this server

- **`redis/mcp-redis`** is a *data-plane* server: it connects an agent to a
  *running Redis instance* to read/write/query data. It needs a connection
  string and can mutate data.
- **This server** is a *knowledge-plane* server: it connects an agent to the
  *documentation*. It is read-only, needs no database, no credentials, and its
  entire value is returning citations to our docs.

They are orthogonal and should stay separate products/installs. Bundling doc
lookup into the data-plane server forces the reference-only audience to stand
up a data server and hand it credentials — friction that kills adoption for
the exact audience (coding agents) that benefits most.

## 2. Goals / non-goals

**Goals**
- Thin retrieval wrapper over the **existing** JSON feed — no new content
  pipeline.
- Read-only, no secrets, no live DB connection.
- Every response carries a canonical `url` (citations by construction).
- Token-lean: search returns summaries + refs; agents drill down deliberately.
- Version-aware (our docs are versioned; mixing versions is a correctness bug).

**Non-goals**
- No writes, no code execution, no live Redis access (that's `mcp-redis`).
- No new authoring format — we consume `sections[]` / `examples[]` as-is.
- WebMCP / in-browser tool registration — out of scope for now (different
  layer, different audience; see DOC-6809 discussion).

## 3. Data source

No new pipeline. Reuse the current build output:

```
Hugo  ──►  per-page  public/**/index.json  ──►  generate_ndjson.py  ──►  docs.ndjson
```

Document schema (already published on the *AI Agent Resources* page):

- **Page**: `id`, `title`, `url`, `summary`, `page_type` (`content` | `index`),
  `content_hash`, `sections[]`, `examples[]`, `children[]`
- **Section**: `id`, `title`, `role` (`overview` | `syntax` | `parameters` |
  `returns` | `example` | …), `text`
- **Example**: `id`, `language`, `code`, `section_id`

The server loads `docs.ndjson` (or an index built from it) at startup. Because
`content_hash` is deterministic (`sha256` over summary + section text +
example code), it doubles as a cache/freshness key.

## 4. Tool surface

Five tools. Names, inputs, and the field of the existing schema each is
projected from:

### `search_docs`
Rank pages by relevance. Returns **refs only, no full text**.

- **In:** `query` (string, required); optional `page_type`, `group`,
  `version`, `limit` (default 10)
- **Out:** `[{ id, title, url, summary, matching_section_ids[] }]`
- **From:** NDJSON feed; `page_type` filter lets callers skip `index` pages.

### `get_page`
Fetch one page, optionally filtered to specific section roles.

- **In:** `id` **or** `url` (required); optional `roles[]` (e.g.
  `["syntax","parameters"]`)
- **Out:** `{ id, title, url, summary, page_type, content_hash, sections[] }`
  where `sections` is filtered to `roles[]` if given
- **From:** per-page `index.json`. `roles[]` filtering is only possible because
  sections are role-tagged — big token savings (pull `parameters` without the
  overview prose).

### `get_section`
Return a single role-tagged chunk — the retrieval-native unit.

- **In:** `page_id` (required), `section_id` (required)
- **Out:** `{ page_id, section_id, title, role, text, url }`
- **From:** `sections[]`.

### `get_examples`
Return runnable code, filterable by language. **The highest-value tool for
coding agents** — their most common need is "the go-redis snippet for `XADD`",
not prose.

- **In:** `query` **or** `command` (one required); optional `language`
  (`python` | `go` | `java` | …)
- **Out:** `[{ id, code, language, url, section_id }]`
- **From:** `examples[]` (carries `language` + `section_id` already).

### `get_command`
Convenience lookup for the highest-traffic page type.

- **In:** `name` (e.g. `XADD`)
- **Out:** command page with `syntax`, `parameters`, `returns` sections +
  `examples[]` + `url`
- **From:** command pages (specialised `get_page`; commands are first-class).

## 5. Response conventions

- **Always include `url`.** Agents cite; users click.
- **Search never returns full text.** Force the drill-down path
  (`search_docs` → `get_section` / `get_examples`) so context stays small.
- **Return `content_hash` on page/section responses.** Lets agents and our own
  eval harness do `If-None-Match`-style freshness checks for free.
- **Truncate defensively.** Cap `text` length per section in responses; expose
  a `truncated: true` flag rather than silently cutting.

## 6. Transport & deployment

Follow the existing repo pattern (`build/command_api_mapping/mcp-server/`):
TypeScript, `@modelcontextprotocol/sdk`, Zod input schemas.

- **Local / stdio:** publish an npx-runnable package so developers can add it to
  Cursor/Claude Code config. Zero infra.
- **Remote / hosted:** an HTTP+SSE endpoint on `redis.io` (e.g.
  `https://redis.io/mcp`) built from the same handlers, so no install is
  required. Advertise it on the *AI Agent Resources* page next to `llms.txt`.

Both modes share one core: load feed → build index → handle tool calls. The
data is public, so the remote endpoint needs no auth (rate-limit only).

### Search backend vs. transport — what needs a datastore

Whether the server needs a Redis (or any) backend depends entirely on the
search implementation, **not** on the transport. The corpus is small
(`docs.ndjson` ≈ 30 MB / ≈ 5 MB gzipped, ≈ 4,100 docs), which is what makes
the lexical path infra-free.

| | Lexical (BM25) | Vector (semantic) |
|---|---|---|
| **stdio (client-side)** | ✅ self-contained in-memory index | ❌ impractical (would ship an index + embedding model per install) |
| **remote (hosted)** | ✅ in-process index, no datastore | ✅ needs a vector store (RediSearch / RedisVL) |

- **Lexical (v1):** build a BM25 index in process memory from `docs.ndjson` at
  startup — MiniSearch/Lunr (JS) or a simple BM25 (Python). No datastore, even
  when hosted; horizontally-scaled instances each just load ~5 MB gzipped at
  boot and build their own index. Role-tagged sections and exact command-name
  tokens make lexical retrieval unusually strong on this corpus.
- **Vector (v2, hosted only):** needs embeddings computed offline at build
  time, a vector index queried at runtime, and query-time embedding on each
  request. That implies a real server-side backend — the natural fit is
  **RediSearch / RedisVL**, which doubles as a Redis showcase. It cannot run
  purely client-side, so it's a hosted-endpoint upgrade, not a stdio feature.

Recommendation: ship v1 lexical in **both** modes with no backend; treat
vector-on-Redis as a later upgrade to the **hosted** endpoint only.

## 7. Versioning

- **Planned:** `search_docs` / `get_page` accept an optional `version` (default
  `latest`), and responses echo the resolved version so an agent can't silently
  blend versions — the single most common RAG-over-docs correctness bug.
- **v0 status: deferred, not implemented.** The prototype does **not** expose a
  `version` param. An earlier v0 advertised a `latest` default it didn't
  enforce (the filter was a no-op, and the live feed is single-version anyway),
  which misleads agents. Rather than bake in a `page.url.includes("/<version>/")`
  heuristic, the param was removed until a committed URL/version model exists
  (Bugbot #3585 + Codex review). Add it back with the real filter when the feed
  carries multiple version trees.

## 8. Freshness

- Rebuild the server's index whenever `docs.ndjson` is regenerated (same build
  step). No separate content pipeline to keep in sync.
- `content_hash` per page enables incremental index updates and client caching.

## 9. Security

- Read-only. No write tools, no code execution, no connection string.
- Serves only already-public content.
- Remote endpoint: rate-limit, no auth, no PII.

## 10. Open questions

- **Search backend:** resolved for v1 — lexical (BM25 over NDJSON), no
  datastore, runs in both stdio and hosted modes (see §6). Open: do we add
  vector search as a v2 upgrade to the hosted endpoint, backed by RediSearch /
  RedisVL, and is the retrieval gain worth the added infra given how
  well-structured the corpus already is?
- **Ranking quality (measured via the eval harness):** lexical BM25 with
  Porter stemming, stopword removal, title/summary/slug field boosts, and
  page-type weighting (demote release-notes/REST-API/operator, modestly boost
  `/commands/*`) gets **recall@5 86% / MRR 0.65** on 22 command-lookup cases —
  up from a **59% / 0.42** un-stemmed, un-weighted baseline. Two caveats: (1)
  the eval is command-heavy so the `/commands/*` boost partly flatters it —
  **add concept/how-to eval cases** before concluding lexical is sufficient
  generally; (2) the residual misses are pure semantic gaps ("remove a key" →
  `flushdb` beats `del`) that only vector search closes. Net: stemming+weighting
  **weakened but did not eliminate** the §6 vector-search case — the eval now
  lets that call be made on numbers.
- **Command boost is command-overfit (found after adding concept cases).** With
  13 concept/how-to cases added, per-kind numbers diverge sharply: command
  recall@5 86% / MRR 0.65 vs **concept recall@5 46% / MRR 0.29**. The
  `/commands/*` ×1.5 boost is the cause — it ranks command pages above the
  canonical concept page when both compete ("configure persistence" →
  `bgrewriteaof`; "set up replication" → `cluster-replicate`; "keyspace
  notifications" → `expire`), and the blanket `/operate/` demotion drags down
  legitimate concept pages (persistence, replication). Ablation (neutralise the
  command boost, demote only REST-API/release-notes/references): concept @5
  46%→62%, MRR 0.29→0.45; command @5 86%→73%. **Open decision:** command-
  optimised (current) vs balanced weighting — a workload-mix call. A modest
  command boost (×1.2) helps command none vs neutral, so the command signal
  should really come from better lexical handling or vectors, not the thumb on
  the scale.
- **Section-role vocabulary (found via live MCP test):** the roles the spec
  assumed (`syntax`, `parameters`, `returns`, `example`) do **not** all match
  the feed. Command pages actually carry `content` / `parameters` / `example`
  (singular) / `returns` — there is no `syntax` role, and it's `example` not
  `examples`. So a `roles: ["examples","syntax"]` filter returns **zero
  sections** against the real feed (verified on EXPIREAT). Before building
  `get_examples` / `get_command` and documenting `roles`, enumerate the actual
  role set across the corpus and align tool params/docs to it (and decide
  whether the server should normalise synonyms like `examples`→`example`).
- **`get_command` coverage:** command pages *do* carry `parameters`/`returns`/
  `example` roles (confirmed: `get_page('expire')` → roles
  `[content, parameters, example, returns]`). Confirm this holds across all
  command pages or add a fallback.
- **Package ownership:** does this live here in `docs`, or graduate to its own
  repo like `mcp-redis`?
- **Overlap with `mcp-redis`:** does that server already do any doc lookup we
  should pull into here and deprecate there?

## 11. Phased plan

1. **v0 (prototype):** stdio server, lexical `search_docs` + `get_page` over a
   local `docs.ndjson`. Prove the loop in Claude Code.
2. **v1:** add `get_examples`, `get_section`, `get_command`; `version` support;
   token-budget guards.
3. **v2:** hosted remote endpoint on `redis.io`; advertise on AI Agent
   Resources.
4. **Ongoing:** wire an **AI-answer eval** — a fixed set of real questions run
   through the server, scored for correctness — as a docs-quality regression
   gate. (Extends the code-example verification mindset to answer quality.)

## 12. Success signals

- A coding agent, given only this server, answers common Redis how-to questions
  correctly and with citations.
- Measurable reduction in version-mixing / stale-API answers versus the model's
  own training data.
- Adoption: entries in Cursor/Claude Code MCP configs pointing at the endpoint.
