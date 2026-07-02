// Offline smoke test: exercises the index + tools directly (no MCP transport).
//   npm run smoke            # uses test/fixture.ndjson
//   DOCS_NDJSON=... npm run smoke   # point at a real feed (path or URL)
import { fileURLToPath } from "node:url";
import { loadFeed } from "./feed.js";
import { DocsIndex } from "./search.js";
import { searchDocs } from "./tools/search-docs.js";
import { getPage } from "./tools/get-page.js";

const feed =
  process.env.DOCS_NDJSON ??
  fileURLToPath(new URL("../test/fixture.ndjson", import.meta.url));

const pages = await loadFeed(feed);
const index = new DocsIndex(pages);
console.log(`loaded ${index.size} pages from ${feed}\n`);

console.log("# search_docs('append an entry to a stream')");
console.log(JSON.stringify(searchDocs(index, { query: "append an entry to a stream" }), null, 2));

console.log("\n# search_docs('store json document', page_type=content)");
console.log(JSON.stringify(searchDocs(index, { query: "store json document", page_type: "content" }), null, 2));

console.log("\n# get_page(id='commands/xadd', roles=['parameters'])");
console.log(JSON.stringify(getPage(index, { id: "commands/xadd", roles: ["parameters"] }), null, 2));

console.log("\n# get_page(url='/commands/xadd/')  -- partial-URL fallback");
console.log(JSON.stringify(getPage(index, { url: "/commands/xadd/", roles: ["return"] }).url ?? "not found", null, 2));
