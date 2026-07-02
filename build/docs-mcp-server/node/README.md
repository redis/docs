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

**Results (22 command-lookup cases):**

| | recall@1 | recall@3 | recall@5 | recall@10 | MRR |
|---|---|---|---|---|---|
| lexical baseline | 32% | 45% | 59% | 73% | 0.42 |
| + Porter stemming + page-type weighting | 50% | 68% | 86% | 95% | 0.65 |

Stemming (append↔appends) and demoting secondary pages (release-notes / REST-API /
operator) while modestly boosting `/commands/*` lifted recall@5 from 59% → 86%.
**Caveat:** this eval is command-heavy, so the `/commands/*` boost partly flatters
it — concept/how-to query cases are not yet covered and should be added before
concluding lexical is sufficient generally. The remaining case (`del`/`unlink`
for "remove a key", beaten by `flushdb`) is a genuine lexical limitation and is
the kind of gap vector search would close (SPEC §6/§10).

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
