# redis-docs-mcp (v0 prototype)

A read-only MCP server that lets an AI coding agent query the Redis
documentation corpus as a tool, backed by the `docs.ndjson` feed we already
publish. See [`../SPEC.md`](../SPEC.md) for the full design.

**This is a v0 prototype.** It ships two tools (`search_docs`, `get_page`) over
an in-memory lexical (BM25 + field-boost) index. No datastore, no credentials,
no live Redis connection.

## Install & build

```bash
cd build/docs-mcp-server/node
npm install
npm run build      # compiles to dist/
```

## Try it offline (no network)

```bash
npm run smoke      # runs against test/fixture.ndjson
```

Point it at the real feed (or any local `.ndjson` / `.ndjson.gz`):

```bash
DOCS_NDJSON="https://redis.io/docs/latest/docs.ndjson" npm run smoke
```

## Run as an MCP server

The server speaks MCP over stdio. Feed source is set via `DOCS_NDJSON`
(default: `https://redis.io/docs/latest/docs.ndjson`).

Add to a Claude Code / Cursor MCP config after `npm run build`:

```json
{
  "mcpServers": {
    "redis-docs": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/build/docs-mcp-server/node/dist/index.js"],
      "env": { "DOCS_NDJSON": "https://redis.io/docs/latest/docs.ndjson" }
    }
  }
}
```

## Tools

| Tool | Inputs | Returns |
|------|--------|---------|
| `search_docs` | `query` (req), `page_type`, `limit` | ranked `[{id, title, url, summary, page_type, score, matching_section_ids}]` — refs only, no full text |
| `get_page` | `id` **or** `url` (req), `roles[]` | one page with `content_hash` + `sections`, optionally filtered to the given section roles |

Typical agent flow: `search_docs` → pick a result → `get_page` with `roles`
(e.g. `["parameters","returns"]`) to pull just what's needed.

## Measured (real feed, ~2,530 pages)

- Index build: ~0.3 s. Query latency: ~75–125 ms. This is why v0 needs no
  datastore and why Rust/WASM would be premature (see SPEC §6).

## Retrieval eval

`npm run eval` scores retrieval quality: it runs the questions in
`test/eval/cases.json` (command-lookup questions phrased *without* the command
name) through `search_docs` and reports recall@k / MRR, plus a data-integrity
check that flags any expected url missing from the feed. The feed is read from
`DOCS_NDJSON` or a local cache at `test/eval/docs.ndjson.gz` (gitignored;
`curl -o test/eval/docs.ndjson.gz https://redis.io/docs/latest/docs.ndjson.gz`).

Cases are tagged `command` (22) or `concept` (13, how-to / concept pages) so the
runner reports recall per kind — because command and concept queries behave very
differently.

**Current results (shipped config: Porter stemming + field boosts + page-type
weighting with `/commands/*` ×1.5, `/operate/` ×0.7, REST-API/release-notes ×0.5):**

| group | recall@1 | @3 | @5 | @10 | MRR |
|---|---|---|---|---|---|
| command (22) | 50% | 68% | 86% | 95% | 0.65 |
| concept (13) | 15% | 31% | 46% | 62% | 0.29 |
| overall (35) | 37% | 54% | 71% | 83% | 0.52 |

(Un-stemmed, un-weighted lexical baseline on the command set was 59%@5 / 0.42.)

**Finding:** command retrieval is good, but **concept/how-to retrieval is about
half as good** — and the `/commands/*` boost is the cause: it lifts command
queries but pushes command pages *above* the canonical concept page when both
compete (e.g. "configure persistence" → `bgrewriteaof`; "set up replication" →
`cluster-replicate`). An ablation neutralising the command boost moves concept
@5 46%→62% and MRR 0.29→0.45, at the cost of command @5 86%→73%. That trade-off
(command-optimised vs balanced) is a product call; the residual misses are pure
semantic gaps that motivate vector search (SPEC §6/§10).

## Known limitations (v0)

- **Ranking is lexical (BM25 + Porter stemming + field/page-type weighting).**
  Now recall@5 86% on command lookups (see eval above), but still lexical: it
  can't bridge pure semantic gaps (e.g. "remove a key" → `flushdb` over `del`),
  and concept/how-to queries are unmeasured. Closing the remainder is the case
  for vector search (SPEC §6/§10).
- **No version filtering.** The `version` param was removed until a committed
  URL/version model exists (the feed is single-version today); see SPEC §7.
- Only `search_docs` + `get_page`. `get_examples`, `get_section`,
  `get_command` are v1 (SPEC §4/§11).
