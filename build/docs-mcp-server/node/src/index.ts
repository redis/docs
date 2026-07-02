#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadFeed } from "./feed.js";
import { DocsIndex } from "./search.js";
import { searchDocs, SearchDocsInput } from "./tools/search-docs.js";
import { getPage, GetPageInput } from "./tools/get-page.js";

// Feed source: local path or http(s) URL, gzip-aware. Defaults to production.
const FEED_SOURCE =
  process.env.DOCS_NDJSON ?? "https://redis.io/docs/latest/docs.ndjson";

const TOOLS = [
  {
    name: "search_docs",
    description:
      "Search the Redis documentation and return the most relevant pages as references (id, title, url, summary, matching section ids). Returns no full text — follow up with get_page to read a result.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        page_type: {
          type: "string",
          enum: ["content", "index"],
          description: "Restrict to prose ('content') or navigation ('index') pages",
        },
        version: {
          type: "string",
          description: "Redis docs version, e.g. 'latest' (default) or '7.4'",
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
      "Fetch a single documentation page by 'id' or 'url'. Optionally filter to sections with specific roles (e.g. ['syntax','parameters']) to save tokens. Includes content_hash for caching.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Page id (URL slug), e.g. 'commands/xadd'" },
        url: { type: "string", description: "Full or partial page URL" },
        roles: {
          type: "array",
          items: { type: "string" },
          description: "Only return sections with these roles",
        },
      },
    },
  },
];

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

async function main() {
  const pages = await loadFeed(FEED_SOURCE);
  const index = new DocsIndex(pages);
  // Log to stderr — stdout is reserved for the MCP protocol.
  console.error(`[redis-docs-mcp] indexed ${index.size} pages from ${FEED_SOURCE}`);

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
          return ok(searchDocs(index, SearchDocsInput.parse(args ?? {})));
        case "get_page":
          return ok(getPage(index, GetPageInput.parse(args ?? {})));
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
