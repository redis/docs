#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadFeed } from "./feed.js";
import { DocsIndex, type Searcher } from "./search.js";
import { HybridSearcher } from "./hybrid.js";
import { VectorStore } from "./vector-store.js";
import { searchDocs, SearchDocsInput } from "./tools/search-docs.js";
import { getPage, GetPageInput } from "./tools/get-page.js";
import { toolResult, fail } from "./response.js";

// Feed source: local path or http(s) URL, gzip-aware. Defaults to production.
const FEED_SOURCE =
  process.env.DOCS_NDJSON ?? "https://redis.io/docs/latest/docs.ndjson";

// Hosted hybrid mode activates only when a Redis backend is configured. Without
// REDIS_URL the server stays lexical-only, which needs no datastore and runs
// client-side over stdio (SPEC §6). The vector index must be pre-loaded by
// `npm run load-index` against the same REDIS_URL.
const REDIS_URL = process.env.REDIS_URL;

const TOOLS = [
  {
    name: "search_docs",
    description:
      "Search the Redis documentation and return the most relevant pages as references (title, url, summary, matching section ids). Each hit includes a unique `url` — pass that `url` to get_page (a hit's `id` is NOT unique and may be ambiguous). Returns no full text — follow up with get_page to read a result.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        page_type: {
          type: "string",
          enum: ["content", "index"],
          description: "Restrict to prose ('content') or navigation ('index') pages",
        },
        limit: {
          type: "number",
          description: "Max results (default 10, max 50)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_page",
    description:
      "Fetch a single documentation page. Prefer the unique `url` from a search_docs hit. `id` also works but is NOT unique, so an ambiguous id returns an error listing candidate urls (likewise an ambiguous partial url). Optionally filter to sections with specific roles (e.g. ['syntax','parameters']) to save tokens. Includes content_hash for caching.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Page id (last URL slug); not unique — prefer url",
        },
        url: {
          type: "string",
          description: "Full page URL (preferred — unique). A partial/suffix URL also works when it matches exactly one page.",
        },
        roles: {
          type: "array",
          items: { type: "string" },
          description: "Only return sections with these roles",
        },
      },
    },
  },
];

async function main() {
  const pages = await loadFeed(FEED_SOURCE);
  // Refuse to start on an empty index (empty file, bad path, or no valid NDJSON
  // lines) rather than advertising readiness and serving only empty results.
  if (pages.length === 0) {
    throw new Error(
      `No documents loaded from ${FEED_SOURCE} — refusing to start with an empty index.`,
    );
  }
  const index = new DocsIndex(pages);
  // Log to stderr — stdout is reserved for the MCP protocol.
  console.error(`[redis-docs-mcp] indexed ${index.size} pages from ${FEED_SOURCE}`);

  // search_docs backend: hybrid when Redis is configured, else lexical-only.
  // get_page always uses the lexical index (feed lookup, no ranking).
  let searcher: Searcher = index;
  if (REDIS_URL) {
    const store = new VectorStore(REDIS_URL);
    await store.connect();
    await store.ensureIndex();
    searcher = new HybridSearcher(index, store);
    console.error(`[redis-docs-mcp] hybrid mode: vector KNN via ${REDIS_URL}`);
  } else {
    console.error("[redis-docs-mcp] lexical-only mode (no REDIS_URL)");
  }

  const server = new Server(
    { name: "redis-docs-mcp", version: "0.0.1" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
      switch (name) {
        case "search_docs":
          return toolResult(await searchDocs(searcher, SearchDocsInput.parse(args ?? {})));
        case "get_page":
          return toolResult(getPage(index, GetPageInput.parse(args ?? {})));
        default:
          return fail(`Unknown tool: ${name}`);
      }
    } catch (e) {
      return fail(e instanceof Error ? e.message : String(e));
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[redis-docs-mcp] ready on stdio");
}

main().catch((e) => {
  console.error("[redis-docs-mcp] fatal:", e);
  process.exit(1);
});
