// Local text-embedding helper backed by @xenova/transformers.
//
// This is a thin wrapper around the ONNX-exported sentence-transformers
// model `Xenova/all-MiniLM-L6-v2`: a 384-dimensional encoder that runs
// in-process on CPU through ONNX Runtime Web, needs no API key, and
// produces vectors that are numerically very close to the equivalent
// PyTorch model (close enough that paraphrase distances differ only at
// the fourth decimal place — see the smoke-test in the README).
//
// Vectors are L2-normalised so a Redis Search index declared with
// `DISTANCE_METRIC COSINE` returns scores that are directly comparable
// across entries. The model is downloaded into the local Hugging Face
// cache on the first call; every later call runs offline.

import { env, pipeline } from '@xenova/transformers';

// Allow the local cache to satisfy subsequent runs without re-downloading.
env.allowLocalModels = true;

const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2';

export class LocalEmbedder {
  // Use `LocalEmbedder.create(...)` instead of `new LocalEmbedder(...)`
  // because the pipeline load is async; we want one place that owns
  // the wait and the dimension probe.
  constructor(modelName, extractor, dim) {
    this.modelName = modelName;
    this.extractor = extractor;
    this.dim = dim;
  }

  static async create(modelName = DEFAULT_MODEL) {
    const extractor = await pipeline('feature-extraction', modelName);
    // Probe the output shape once and record it on the instance so
    // callers can compare against the cache's expected vectorDim
    // before doing any inserts. RedisSemanticCache also checks
    // length on every put / lookup, so a model swap that produces
    // wrong-dim vectors fails at the call site with a clear error.
    const probe = await extractor('dimension probe', {
      pooling: 'mean', normalize: true,
    });
    const dim = probe.dims[probe.dims.length - 1];
    return new LocalEmbedder(modelName, extractor, dim);
  }

  // Encode a single string. Returns a Float32Array of length `dim`.
  async encodeOne(text) {
    const out = await this.extractor(text, {
      pooling: 'mean', normalize: true,
    });
    return new Float32Array(out.data);
  }

  // Encode several strings in one pipeline call. Returns an array of
  // Float32Array; callers that need raw bytes use `toBytes` per row.
  async encodeMany(texts) {
    const out = await this.extractor(texts, {
      pooling: 'mean', normalize: true,
    });
    const rows = out.dims[0];
    const cols = out.dims[1];
    const result = [];
    for (let i = 0; i < rows; i++) {
      result.push(new Float32Array(out.data.slice(i * cols, (i + 1) * cols)));
    }
    return result;
  }

  // Pack a Float32Array into the bytes Redis Search expects.
  // Float32Array.buffer is little-endian on every architecture we care
  // about — Node runs on x86_64/arm64, both little-endian.
  static toBytes(vector) {
    return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength);
  }
}
