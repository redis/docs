// Offline smoke test: assertion-based checks of the index + tools + MCP
// response wrapping (no stdio transport). Exits non-zero on any failure.
//   npm run smoke
// Runs against test/fixture.ndjson; the assertions encode fixture-specific
// ids/urls (incl. the colliding id="install" pair), so it is not meant to be
// pointed at the live feed.
import { fileURLToPath } from "node:url";
import { loadFeed } from "./feed.js";
import { DocsIndex } from "./search.js";
import { searchDocs } from "./tools/search-docs.js";
import { getPage } from "./tools/get-page.js";
import { toolResult } from "./response.js";

let failures = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

const feed =
  process.env.DOCS_NDJSON ??
  fileURLToPath(new URL("../test/fixture.ndjson", import.meta.url));

const pages = await loadFeed(feed);
const index = new DocsIndex(pages);
console.log(`loaded ${index.size} pages from ${feed}\n`);

// --- search_docs ---
const stream = searchDocs(index, { query: "append an entry to a stream" });
check("search returns hits", stream.count > 0);
check("search hits carry a url", Boolean(stream.results[0]?.url));

// --- get_page happy paths ---
const xadd = getPage(index, { id: "commands/xadd", roles: ["parameters"] }) as any;
check("get_page(unique id) resolves", xadd.id === "commands/xadd");
check("roles filter returns only 'parameters'", (xadd.sections ?? []).every((s: any) => s.role === "parameters"));

const exact = getPage(index, { url: "https://redis.io/docs/latest/operate/redisinsight/install/" }) as any;
check("get_page(exact url) resolves the right page", exact.title === "Install Redis Insight");

const suffixUnique = getPage(index, { url: "/commands/xadd/" }) as any;
check("get_page(unambiguous partial url) resolves", suffixUnique.id === "commands/xadd");

// --- get_page ambiguity (Bugbot High + Codex Medium) ---
const ambId = getPage(index, { id: "install" }) as any;
check("ambiguous id returns error", typeof ambId.error === "string");
check("ambiguous id lists candidates", (ambId.candidates ?? []).length === 2);

const ambUrl = getPage(index, { url: "/install/" }) as any;
check("ambiguous partial url returns error (not silent first match)", typeof ambUrl.error === "string");
check("ambiguous partial url lists candidates", (ambUrl.candidates ?? []).length === 2);

// --- boundary-anchored suffix (Bugbot round-2 High): "add" must NOT match "xadd" ---
const boundary = getPage(index, { url: "add" }) as any;
check("partial url matches only on path-segment boundary (add !-> xadd)", typeof boundary.error === "string" && !boundary.candidates);

// --- conflicting handles (Codex convergence model): url and id point at different pages ---
const conflict = getPage(index, {
  url: "https://redis.io/docs/latest/develop/data-types/json/",
  id: "commands/xadd",
}) as any;
check("conflicting url+id returns error", typeof conflict.error === "string");
check("conflicting url+id lists both candidates", (conflict.candidates ?? []).length === 2);

const missing = getPage(index, { id: "does-not-exist-anywhere" }) as any;
check("missing page returns error", typeof missing.error === "string");

// --- MCP response wrapping (Fix 2 / Bugbot Medium) ---
check("toolResult(missing) sets isError", toolResult(missing).isError === true);
check("toolResult(ambiguous id) sets isError", toolResult(ambId).isError === true);
check("toolResult(search) does NOT set isError", toolResult(stream).isError === undefined);

console.log(`\n${failures === 0 ? "ALL PASSED" : failures + " FAILED"}`);
if (failures > 0) process.exit(1);
