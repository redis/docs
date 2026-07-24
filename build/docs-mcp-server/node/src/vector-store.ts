// Redis vector-KNN backend for hybrid mode. Redis is used ONLY for vector
// search (DOC-6809 Step 3 verdict: keep BM25 lexical + weighted-RRF fusion
// app-side; native FT.HYBRID can't express the weighted recipe). Section chunks
// are stored as HASHes with a FLAT/COSINE vector field; `owner` (page url) is
// unindexed and pulled back via RETURN. FLAT = exact KNN, which reproduced the
// offline numpy ranking to tie-breaking in Step 1; swap to HNSW later if the
// corpus grows enough to need it.
import {
  createClient,
  SCHEMA_FIELD_TYPE,
  SCHEMA_VECTOR_FIELD_ALGORITHM,
  type RedisClientType,
} from "redis";
import { EMBED_DIM } from "./embed.js";
import { normalizeUrl } from "./url.js";

const INDEX = "docs_vec";
const PREFIX = "docvec:";

function vecBuffer(v: Float32Array): Buffer {
  return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
}

export class VectorStore {
  private client: RedisClientType;

  constructor(url: string) {
    this.client = createClient({ url });
    this.client.on("error", (e) => console.error("[redis-docs-mcp] redis:", e));
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) await this.client.connect();
  }

  async close(): Promise<void> {
    if (this.client.isOpen) await this.client.close();
  }

  /** Create the FLAT/COSINE index if absent (idempotent). */
  async ensureIndex(dim = EMBED_DIM): Promise<void> {
    try {
      await this.client.ft.create(
        INDEX,
        {
          vec: {
            type: SCHEMA_FIELD_TYPE.VECTOR,
            ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.FLAT,
            TYPE: "FLOAT32",
            DIM: dim,
            DISTANCE_METRIC: "COSINE",
          },
        },
        { ON: "HASH", PREFIX },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/index already exists/i.test(msg)) throw e;
    }
  }

  async dropIndex(): Promise<void> {
    try {
      await this.client.ft.dropIndex(INDEX, { DD: true });
    } catch {
      // no index — nothing to drop
    }
  }

  /** Bulk-load chunk vectors. Each chunk becomes one HASH {owner, vec}. */
  async loadChunks(chunks: Array<{ owner: string; vec: Float32Array }>): Promise<void> {
    const BATCH = 2000;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const slice = chunks.slice(i, i + BATCH);
      await Promise.all(
        slice.map((c, j) =>
          this.client.hSet(`${PREFIX}${i + j}`, {
            owner: c.owner,
            vec: vecBuffer(c.vec),
          }),
        ),
      );
    }
  }

  /**
   * KNN over `k` chunks, deduped to the nearest chunk per page. Returns page
   * urls, nearest first (mirrors the offline rank_pages()).
   */
  async knn(qvec: Float32Array, k = 200, topn = 50): Promise<string[]> {
    const res = await this.client.ft.search(
      INDEX,
      `*=>[KNN ${k} @vec $BLOB AS score]`,
      {
        PARAMS: { BLOB: vecBuffer(qvec) },
        SORTBY: { BY: "score", DIRECTION: "ASC" }, // cosine distance: nearest = smallest
        RETURN: ["owner"],
        LIMIT: { from: 0, size: k },
        DIALECT: 2,
      },
    );
    const seen = new Set<string>();
    const pages: string[] = [];
    for (const doc of res.documents) {
      const owner = normalizeUrl(String((doc.value as { owner?: string }).owner ?? ""));
      if (!owner || seen.has(owner)) continue;
      seen.add(owner);
      pages.push(owner);
      if (pages.length >= topn) break;
    }
    return pages;
  }
}
