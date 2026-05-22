"use strict";

/**
 * Local text-embedding helper backed by @xenova/transformers.
 *
 * This is a thin wrapper around the ONNX-runtime port of the
 * sentence-transformers ``all-MiniLM-L6-v2`` model: a 384-dimensional
 * encoder that runs in pure Node.js (no native build steps), needs no
 * API key, and has a small footprint (~80 MB). On the first call the
 * model files are downloaded into the local Transformers.js cache;
 * every later call runs locally.
 *
 * Vectors are L2-normalised on output so a Redis Search index declared
 * with ``DISTANCE_METRIC COSINE`` returns scores that are already
 * directly comparable across items.
 */

const DEFAULT_MODEL = "Xenova/all-MiniLM-L6-v2";

/**
 * Encode short strings into normalised float32 vectors.
 *
 * A single instance loads the model once and reuses it for every call.
 * The demo server keeps one ``LocalEmbedder`` around for the lifetime
 * of the process.
 */
class LocalEmbedder {
  /**
   * @param {object} [options]
   * @param {string} [options.modelName]
   */
  constructor({ modelName = DEFAULT_MODEL } = {}) {
    this.modelName = modelName;
    /** @type {Promise<any> | null} */
    this._pipelinePromise = null;
    /** @type {number | null} */
    this.dim = null;
  }

  /**
   * Lazily load the pipeline so importing this module is cheap.
   * Subsequent calls reuse the same instance.
   */
  async _pipeline() {
    if (this._pipelinePromise === null) {
      // The dynamic import keeps the heavy ESM-only @xenova/transformers
      // dependency out of cold-start paths that don't actually need it.
      this._pipelinePromise = (async () => {
        const { pipeline } = await import("@xenova/transformers");
        return pipeline("feature-extraction", this.modelName);
      })();
    }
    return this._pipelinePromise;
  }

  /**
   * Encode a single string. Returns a ``Float32Array`` of length ``dim``.
   *
   * @param {string} text
   * @returns {Promise<Float32Array>}
   */
  async encodeOne(text) {
    const batch = await this.encodeMany([text]);
    return batch[0];
  }

  /**
   * Encode a batch. Returns an array of ``Float32Array``s.
   *
   * @param {string[]} texts
   * @returns {Promise<Float32Array[]>}
   */
  async encodeMany(texts) {
    const pipe = await this._pipeline();
    // ``pooling: 'mean'`` averages token-level vectors into one sentence
    // vector; ``normalize: true`` L2-normalises so cosine distance from
    // the Redis Search index can be read as ``1 - dot(query, item)``.
    const tensor = await pipe(texts, { pooling: "mean", normalize: true });
    const { dims, data } = tensor;
    // Transformers.js returns a 2-D tensor as a flat ``Float32Array``
    // with ``dims = [N, dim]``. Slice it into per-row vectors.
    const [n, dim] = dims;
    if (this.dim === null) this.dim = dim;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      // ``subarray`` is a view; copy into a fresh buffer so callers can
      // mutate or persist without holding the whole batch alive.
      out[i] = new Float32Array(data.slice(i * dim, (i + 1) * dim));
    }
    return out;
  }

  /**
   * Pack a 1-D vector into the binary form Redis Search expects.
   *
   * @param {Float32Array | number[]} vector
   * @returns {Buffer}
   */
  static toBuffer(vector) {
    const arr =
      vector instanceof Float32Array ? vector : new Float32Array(vector);
    // ``Buffer.from(arrayBuffer, byteOffset, length)`` wraps the
    // underlying buffer without copying. The .buffer / byteOffset /
    // byteLength dance is necessary because a Float32Array can be a
    // view into a larger buffer (notably when produced by ``subarray``).
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  }
}

export { LocalEmbedder, DEFAULT_MODEL };
