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

**Baseline (lexical v0):** recall@1 32%, @3 45%, @5 59%, @10 73%, MRR 0.42 — i.e.
lexical retrieval is **not** good enough alone (canonical command pages lose to
sibling commands, operator, and concept pages; no stemming). This is the
measured case for the ranking / vector-search work in SPEC §6/§10. Use it to
compare any ranking change against the baseline rather than tuning blind.

## Known limitations (v0)

- **Ranking is untuned lexical search.** Good on distinctive terms
  (`publish`, `incrby`, `pexpire`), but weaker where:
  - there is **no stemmer** — a query for "append" won't match a summary that
    says "appends", so `XADD` is hard to surface from natural language;
  - **canonical command pages** compete with release notes, operator
    (custom-resources) pages, and client-library overviews that repeat the same
    terms.
  Fixing this properly means an analyzer (stemming/lemmatization) and/or the
  vector-search upgrade tracked in SPEC §6/§10.
- **No version filtering.** The `version` param was removed until a committed
  URL/version model exists (the feed is single-version today); see SPEC §7.
- Only `search_docs` + `get_page`. `get_examples`, `get_section`,
  `get_command` are v1 (SPEC §4/§11).
