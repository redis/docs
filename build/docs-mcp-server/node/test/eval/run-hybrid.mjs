// Hybrid retrieval eval (DOC-6809 Step 4 acceptance). Runs the 35 cases through
// the REAL search_docs tool function backed by HybridSearcher — the exact path
// index.ts calls — so this exercises query embedding (fastembed-js) + Redis KNN
// + app-side weighted RRF end to end. Confirms the shipped hybrid mode
// reproduces the offline recipe (overall MRR ~.73).
//
// Prereq: load the vector index first, against the same REDIS_URL:
//   REDIS_URL=redis://localhost:6379 node scripts/load-index.mjs --vectors ../redis-eval/vecdump
//   REDIS_URL=redis://localhost:6379 node test/eval/run-hybrid.mjs
//
// Imports the BUILT server (dist/) — run `npm run build` first (eval:hybrid does).
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadFeed } from "../../dist/feed.js";
import { DocsIndex } from "../../dist/search.js";
import { HybridSearcher } from "../../dist/hybrid.js";
import { VectorStore } from "../../dist/vector-store.js";
import { searchDocs } from "../../dist/tools/search-docs.js";

const K = [1, 3, 5, 10];
const LIMIT = 10;
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const norm = (u) => u.trim().toLowerCase().replace(/\/+$/, "");
const short = (u) => (u ? u.replace("https://redis.io/docs/latest", "") : "—");

const feedSrc =
  process.env.DOCS_NDJSON ?? fileURLToPath(new URL("./docs.ndjson.gz", import.meta.url));
const cases = JSON.parse(await readFile(fileURLToPath(new URL("./cases.json", import.meta.url)), "utf8"));

const pages = await loadFeed(feedSrc);
const index = new DocsIndex(pages);
const feedUrls = new Set(pages.map((p) => norm(p.url)));

const store = new VectorStore(REDIS_URL);
await store.connect();
await store.ensureIndex();
const hybrid = new HybridSearcher(index, store);

const broken = [];
const rows = [];
for (const c of cases) {
  const expected = c.expected.map(norm);
  if (expected.every((u) => !feedUrls.has(u))) {
    broken.push({ q: c.q, missing: expected });
    continue;
  }
  const { results } = await searchDocs(hybrid, { query: c.q, limit: LIMIT });
  const urls = results.map((r) => norm(r.url));
  let rank = null;
  for (let i = 0; i < urls.length; i++) {
    if (expected.includes(urls[i])) {
      rank = i + 1;
      break;
    }
  }
  rows.push({ kind: c.kind ?? "command", q: c.q, rank, top: urls[0] });
}
await store.close();

function metrics(set) {
  const n = set.length || 1;
  const recall = Object.fromEntries(
    K.map((k) => [k, set.filter((r) => r.rank && r.rank <= k).length / n]),
  );
  const mrr = set.reduce((s, r) => s + (r.rank ? 1 / r.rank : 0), 0) / n;
  return { recall, mrr };
}

console.log(
  `Hybrid via ${REDIS_URL} | ${pages.length} pages | cases scored: ${rows.length}` +
    (broken.length ? ` | ${broken.length} BROKEN` : "") +
    "\n",
);
for (const r of rows) {
  const tag = r.rank ? `#${r.rank}`.padEnd(5) : "MISS ";
  console.log(`${tag} [${r.kind.slice(0, 4)}] ${r.q}${r.rank ? "" : `   [rank-1 was: ${short(r.top)}]`}`);
}

const groups = [
  ["overall", rows],
  ["command", rows.filter((r) => r.kind === "command")],
  ["concept", rows.filter((r) => r.kind === "concept")],
];
console.log("\n--- hybrid retrieval quality (recall@1 / @3 / @5 / @10 | MRR) ---");
for (const [label, set] of groups) {
  if (!set.length) continue;
  const m = metrics(set);
  const cells = K.map((k) => `${(m.recall[k] * 100).toFixed(0)}%`.padStart(4)).join(" / ");
  console.log(`${label.padEnd(8)} (n=${String(set.length).padStart(2)}):  ${cells}  | ${m.mrr.toFixed(3)}`);
}

if (broken.length) {
  console.log("\n--- BROKEN eval cases ---");
  for (const b of broken) console.log(`  "${b.q}" -> ${b.missing.map(short).join(", ")}`);
}
