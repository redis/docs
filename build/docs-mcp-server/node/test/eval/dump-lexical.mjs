// Dump the REAL lexical ranker's results for every eval case, so the Python
// vector experiment can compare against (and fuse with) the exact production
// ranking rather than a reimplementation. Reuses the built dist/.
//   node test/eval/dump-lexical.mjs > test/eval/lexical.json
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadFeed } from "../../dist/feed.js";
import { DocsIndex } from "../../dist/search.js";
import { searchDocs } from "../../dist/tools/search-docs.js";

const TOPN = 50;
const norm = (u) => u.trim().toLowerCase().replace(/\/+$/, "");
const feedSrc =
  process.env.DOCS_NDJSON ?? fileURLToPath(new URL("./docs.ndjson.gz", import.meta.url));
const cases = JSON.parse(await readFile(fileURLToPath(new URL("./cases.json", import.meta.url)), "utf8"));

const index = new DocsIndex(await loadFeed(feedSrc));

const out = [];
for (const c of cases) {
  const { results } = await searchDocs(index, { query: c.q, limit: TOPN });
  out.push({
    q: c.q,
    kind: c.kind ?? "command",
    expected: c.expected.map(norm),
    lexical: results.map((r) => norm(r.url)),
  });
}

process.stdout.write(JSON.stringify(out, null, 2) + "\n");
