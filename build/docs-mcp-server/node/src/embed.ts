// bge-small-en-v1.5 embedding via fastembed-js (ONNX, in-process). Proven in
// the DOC-6809 Step 2 experiment to reproduce Python fastembed vectors to
// cosine 1.0, so query-time embedding here is interchangeable with the offline
// corpus vectors. IMPORTANT: use plain embed() and prepend the BGE query prefix
// manually for queries — do NOT use fastembed's queryEmbed/passageEmbed, whose
// built-in prefix wording differs and silently breaks parity (Step 2 finding).
import { FlagEmbedding, EmbeddingModel } from "fastembed";

const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

let modelPromise: Promise<FlagEmbedding> | null = null;

function model(): Promise<FlagEmbedding> {
  return (modelPromise ??= FlagEmbedding.init({
    model: EmbeddingModel.BGESmallENV15,
  }));
}

function l2normalize(v: number[]): Float32Array {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) + 1e-12;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
}

async function embedAll(texts: string[]): Promise<Float32Array[]> {
  const m = await model();
  const out: Float32Array[] = [];
  for await (const batch of m.embed(texts, 64)) {
    for (const v of batch) out.push(l2normalize(Array.from(v)));
  }
  return out;
}

/** Embed a search query (applies the BGE query prefix). Returns a unit vector. */
export async function embedQuery(text: string): Promise<Float32Array> {
  const [v] = await embedAll([QUERY_PREFIX + text]);
  return v;
}

/** Embed corpus passages (no prefix). Returns unit vectors, input order. */
export async function embedPassages(texts: string[]): Promise<Float32Array[]> {
  return embedAll(texts);
}

export const EMBED_DIM = 384;
