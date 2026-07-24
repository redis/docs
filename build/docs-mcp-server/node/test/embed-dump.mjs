// Step 2b: embed the exported parity strings with fastembed-js (bge-small,
// ONNX in Node) and dump the vectors for Python-side comparison. Uses plain
// embed() and prepends the SAME BGE query prefix as the Python eval, so the
// only variable under test is the Node ONNX embedding itself (tokenizer +
// model + pooling), not prefix wording or method choice.
//
//   node test/embed-dump.mjs
import { FlagEmbedding, EmbeddingModel } from "fastembed";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const IN = path.join(HERE, "..", "..", "redis-eval", "parity_texts.json");
const OUT = path.join(HERE, "..", "..", "redis-eval", "node_vectors.json");

function l2normalize(v) {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) + 1e-12;
  return v.map((x) => x / n);
}

async function embedAll(model, texts) {
  const out = [];
  // embed() yields batches of Float32-ish arrays.
  for await (const batch of model.embed(texts, 64)) {
    for (const v of batch) out.push(l2normalize(Array.from(v)));
  }
  return out;
}

const { query_prefix, queries, corpus } = JSON.parse(fs.readFileSync(IN, "utf-8"));

const model = await FlagEmbedding.init({ model: EmbeddingModel.BGESmallENV15 });

console.log(`embedding ${queries.length} queries + ${corpus.length} corpus chunks ...`);
const t0 = Date.now();
const queryVecs = await embedAll(model, queries.map((q) => query_prefix + q));
const corpusVecs = await embedAll(model, corpus);
const secs = (Date.now() - t0) / 1000;

fs.writeFileSync(
  OUT,
  JSON.stringify({
    model: "fast-bge-small-en-v1.5",
    dim: queryVecs[0].length,
    queries: queryVecs,
    corpus: corpusVecs,
  })
);
console.log(
  `wrote ${OUT}: dim ${queryVecs[0].length}, ` +
    `${(queries.length + corpus.length) / secs | 0} texts/s`
);
