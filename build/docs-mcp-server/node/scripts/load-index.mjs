// Build-time index loader for hybrid mode (DOC-6809 Step 4). Chunks the feed
// (section-level), embeds each chunk with fastembed-js, and loads the vectors
// into Redis as the docs_vec FLAT/COSINE index. Run once whenever docs.ndjson
// is regenerated (SPEC freshness model); the server only queries at runtime.
//
//   REDIS_URL=redis://localhost:6379 npm run load-index
//   REDIS_URL=... node scripts/load-index.mjs --vectors ../redis-eval/vecdump
//
// --vectors <dir> seeds precomputed vectors (meta.json/owners.json/vectors.f32)
// instead of embedding in Node. Step 2 proved fastembed-js == those Python
// vectors (cosine 1.0), so seeding is equivalent — used to avoid a ~1h local
// re-embed while iterating. Production runs without the flag.
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { loadFeed } from "../dist/feed.js";
import { buildChunks } from "../dist/chunk.js";
import { embedPassages } from "../dist/embed.js";
import { VectorStore } from "../dist/vector-store.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const FEED =
  process.env.DOCS_NDJSON ??
  fileURLToPath(new URL("../test/eval/docs.ndjson.gz", import.meta.url));

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function fromSeed(dir) {
  // Resolve against cwd (intuitive for a CLI arg), not the script location.
  const base = pathToFileURL(resolve(process.cwd(), dir) + "/");
  const meta = JSON.parse(await readFile(new URL("meta.json", base), "utf8"));
  const owners = JSON.parse(await readFile(new URL("owners.json", base), "utf8"));
  const buf = await readFile(new URL("vectors.f32", base));
  const floats = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  const { n, dim } = meta;
  const chunks = [];
  for (let i = 0; i < n; i++) {
    chunks.push({ owner: owners[i], vec: floats.subarray(i * dim, (i + 1) * dim) });
  }
  console.error(`[load-index] seeded ${n} vectors (dim ${dim}) from ${dir}`);
  return chunks;
}

async function fromEmbed() {
  const pages = await loadFeed(FEED);
  const chunks = buildChunks(pages);
  console.error(`[load-index] ${pages.length} pages -> ${chunks.length} chunks; embedding (fastembed-js) ...`);
  const vecs = await embedPassages(chunks.map((c) => c.text));
  return chunks.map((c, i) => ({ owner: c.owner, vec: vecs[i] }));
}

async function main() {
  const seedDir = arg("--vectors");
  const chunks = seedDir ? await fromSeed(seedDir) : await fromEmbed();

  const store = new VectorStore(REDIS_URL);
  await store.connect();
  await store.dropIndex();
  await store.ensureIndex(chunks[0].vec.length);
  const t0 = Date.now();
  await store.loadChunks(chunks);
  console.error(`[load-index] loaded ${chunks.length} chunks into ${REDIS_URL} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await store.close();
}

main().catch((e) => {
  console.error("[load-index] fatal:", e);
  process.exit(1);
});
