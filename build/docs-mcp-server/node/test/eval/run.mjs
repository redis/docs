// AI-answer eval (retrieval quality) for the docs MCP server.
// Runs each question in cases.json through search_docs and measures whether the
// expected canonical page is retrieved (recall@k, MRR). A data-integrity check
// flags any expected url that isn't in the feed, so a bad ground-truth entry is
// reported rather than silently scored as a miss.
//
//   node test/eval/run.mjs                 # uses cached test/eval/docs.ndjson.gz
//   DOCS_NDJSON=<path|url> node test/eval/run.mjs
//
// Imports the BUILT server (dist/), so run `npm run build` first.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadFeed } from "../../dist/feed.js";
import { DocsIndex } from "../../dist/search.js";
import { searchDocs } from "../../dist/tools/search-docs.js";

const K = [1, 3, 5, 10];
const LIMIT = 10;
const norm = (u) => u.trim().toLowerCase().replace(/\/+$/, "");
const short = (u) => (u ? u.replace("https://redis.io/docs/latest", "") : "—");

const feedSrc =
  process.env.DOCS_NDJSON ?? fileURLToPath(new URL("./docs.ndjson.gz", import.meta.url));
const cases = JSON.parse(await readFile(fileURLToPath(new URL("./cases.json", import.meta.url)), "utf8"));

const pages = await loadFeed(feedSrc);
const index = new DocsIndex(pages);
const feedUrls = new Set(pages.map((p) => norm(p.url)));

const broken = [];
const rows = [];
for (const c of cases) {
  const expected = c.expected.map(norm);
  if (expected.every((u) => !feedUrls.has(u))) {
    broken.push({ q: c.q, missing: expected });
    continue;
  }
  const results = searchDocs(index, { query: c.q, limit: LIMIT }).results.map((r) => norm(r.url));
  let rank = null;
  for (let i = 0; i < results.length; i++) {
    if (expected.includes(results[i])) {
      rank = i + 1;
      break;
    }
  }
  rows.push({ q: c.q, rank, top: results[0] });
}

const scored = rows.length;
const recall = Object.fromEntries(
  K.map((k) => [k, rows.filter((r) => r.rank && r.rank <= k).length / scored]),
);
const mrr = rows.reduce((s, r) => s + (r.rank ? 1 / r.rank : 0), 0) / scored;

console.log(
  `Feed: ${pages.length} pages | cases scored: ${scored}` +
    (broken.length ? ` | ${broken.length} BROKEN (expected url not in feed)` : "") +
    "\n",
);
for (const r of rows) {
  const tag = r.rank ? `#${r.rank}`.padEnd(5) : "MISS ";
  console.log(`${tag} ${r.q}${r.rank ? "" : `   [rank-1 was: ${short(r.top)}]`}`);
}

console.log("\n--- retrieval quality ---");
for (const k of K) console.log(`recall@${k}: ${(recall[k] * 100).toFixed(0)}%`);
console.log(`MRR:       ${mrr.toFixed(3)}`);

if (broken.length) {
  console.log("\n--- BROKEN eval cases (fix ground truth) ---");
  for (const b of broken) console.log(`  "${b.q}" -> not in feed: ${b.missing.map(short).join(", ")}`);
}
