// Long-term memory store for an agent, backed by Redis JSON and Search.
//
// Each memory lives as one JSON document at `agent:mem:<id>`. The
// document holds the memory text, its embedding vector, and a small
// metadata block — user, namespace, kind, source thread, timestamps —
// that lets the recall query scope results without falling back to
// application-side filtering.
//
// A single Redis Search index covers the embedding plus every
// metadata field, so one `FT.SEARCH` call performs approximate-
// nearest-neighbour over the in-scope subset and returns the top-k
// memories ranked by cosine distance. The same KNN check runs at
// *write* time to deduplicate near-identical memories before they
// enter the store, which keeps the index from filling with
// paraphrases of the same fact as the agent reasons over similar
// topics across sessions.
//
// Memories carry one of two kinds:
//
// * `episodic` — "what happened" snapshots from a specific thread,
//   written with a medium TTL so old session detail decays naturally.
// * `semantic` — distilled facts and preferences the agent should
//   carry forward indefinitely. Written with no TTL by default.
//
// The split is enforced as a TAG on the index, so the recall query
// can ask for one kind or both with a filter — no separate keyspaces.

import { randomUUID } from 'node:crypto';
import {
  SCHEMA_FIELD_TYPE,
  SCHEMA_VECTOR_FIELD_ALGORITHM,
} from 'redis';

const VECTOR_DIM_DEFAULT = 384;

// How close (cosine distance) a candidate must be to an existing
// memory to count as a duplicate at write time. Smaller = stricter.
// 0.20 is calibrated to the `Xenova/all-MiniLM-L6-v2` embedding model
// used in the demo, where a paraphrase of an existing memory lands
// in the 0.10 – 0.20 range and a distinct memory lands above 0.50.
export const DEFAULT_DEDUP_THRESHOLD = 0.20;

// How close (cosine distance) a candidate must be to count as a
// relevant recall result. Larger than the dedup threshold so the
// agent gets a wider net at read time than at write time.
export const DEFAULT_RECALL_THRESHOLD = 0.55;

// TTL tiers, in seconds. `null` means "no TTL" — the memory persists
// until explicitly deleted or evicted under memory pressure.
export const TTL_BY_KIND = {
  episodic: 7 * 24 * 3600,
  semantic: null,
};

export class LongTermMemory {
  constructor({
    client,
    indexName = 'agentmem:idx',
    keyPrefix = 'agent:mem:',
    vectorDim = VECTOR_DIM_DEFAULT,
    dedupThreshold = DEFAULT_DEDUP_THRESHOLD,
    recallThreshold = DEFAULT_RECALL_THRESHOLD,
    ttlByKind,
  }) {
    this.client = client;
    this.indexName = indexName;
    this.keyPrefix = keyPrefix;
    this.vectorDim = vectorDim;
    this.dedupThreshold = dedupThreshold;
    this.recallThreshold = recallThreshold;
    this.ttlByKind = ttlByKind || { ...TTL_BY_KIND };
  }

  // -- Keys -----------------------------------------------------------

  memoryKey(memoryId) {
    return `${this.keyPrefix}${memoryId}`;
  }

  // -- Index management ----------------------------------------------

  async createIndex() {
    // The index is declared on the JSON document type with `as_name`
    // aliases on each path; the same `FT.SEARCH` filter clause works
    // here as on a HASH-backed index, and the field paths
    // (`$.user`, `$.embedding`, ...) only show up in `FT.CREATE`.
    const schema = {
      '$.text': { type: SCHEMA_FIELD_TYPE.TEXT, AS: 'text' },
      '$.user': { type: SCHEMA_FIELD_TYPE.TAG, AS: 'user' },
      '$.namespace': { type: SCHEMA_FIELD_TYPE.TAG, AS: 'namespace' },
      '$.kind': { type: SCHEMA_FIELD_TYPE.TAG, AS: 'kind' },
      '$.source_thread': {
        type: SCHEMA_FIELD_TYPE.TAG, AS: 'source_thread',
      },
      '$.created_ts': {
        type: SCHEMA_FIELD_TYPE.NUMERIC, AS: 'created_ts', SORTABLE: true,
      },
      '$.hit_count': {
        type: SCHEMA_FIELD_TYPE.NUMERIC, AS: 'hit_count', SORTABLE: true,
      },
      '$.embedding': {
        type: SCHEMA_FIELD_TYPE.VECTOR,
        ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.HNSW,
        TYPE: 'FLOAT32',
        DIM: this.vectorDim,
        DISTANCE_METRIC: 'COSINE',
        AS: 'embedding',
      },
    };
    try {
      await this.client.ft.create(this.indexName, schema, {
        ON: 'JSON',
        PREFIX: this.keyPrefix,
      });
    } catch (err) {
      if (!String(err.message || err).includes('Index already exists')) {
        throw err;
      }
    }
  }

  async dropIndex({ deleteDocuments = false } = {}) {
    try {
      await this.client.ft.dropIndex(this.indexName, { DD: deleteDocuments });
    } catch (err) {
      const msg = String(err.message || err).toLowerCase();
      if (!msg.includes('no such index') && !msg.includes('unknown index name')) {
        throw err;
      }
    }
  }

  // -- Write ----------------------------------------------------------

  // Write a new memory, deduplicating against existing entries.
  //
  // Runs one in-scope KNN(1) against the index first. If the nearest
  // existing memory is within `dedupThreshold`, the new memory is
  // skipped (its content is already represented) and the existing
  // memory's `hit_count` is bumped. Otherwise a fresh JSON document
  // is written under a new id with a TTL derived from the memory's
  // `kind`.
  //
  // The KNN-then-write sequence is not atomic; two workers that
  // remember the same fact at the same time can both miss each
  // other's in-flight write and insert duplicate memories. See the
  // walkthrough's "Concurrency caveats" section for the production
  // fix (periodic background consolidator that merges near-duplicates).
  async remember({
    text,
    embedding,
    user = 'default',
    namespace = 'default',
    kind = 'episodic',
    sourceThread = '',
    ttlSeconds,
  }) {
    if (!(embedding instanceof Float32Array)) {
      embedding = Float32Array.from(embedding);
    }
    if (embedding.length !== this.vectorDim) {
      throw new Error(
        `embedding length is ${embedding.length}; index expects ${this.vectorDim}`,
      );
    }

    const nearest = await this._nearest({
      embedding, user, namespace, kind, k: 1,
    });
    const nearestDistance = nearest[0]?.distance ?? null;
    if (nearest[0] && nearest[0].distance != null
        && nearest[0].distance <= this.dedupThreshold) {
      await this._bumpHitCount(nearest[0].id);
      return {
        id: nearest[0].id,
        deduped: true,
        existingDistance: nearestDistance,
      };
    }

    const id = randomUUID().replace(/-/g, '').slice(0, 12);
    const key = this.memoryKey(id);
    const now = Date.now() / 1000;
    const doc = {
      id,
      user,
      namespace,
      kind,
      source_thread: sourceThread,
      text,
      embedding: Array.from(embedding),
      created_ts: now,
      hit_count: 0,
    };
    const ttl = ttlSeconds !== undefined
      ? ttlSeconds
      : this.ttlByKind[kind] ?? null;

    // MULTI / EXEC so the document and its TTL apply together. A
    // connection drop between the JSON.SET and EXPIRE would
    // otherwise leave the memory without an expiry.
    const tx = this.client.multi().json.set(key, '$', doc);
    if (ttl !== null && ttl !== undefined) {
      tx.expire(key, ttl);
    }
    await tx.exec();
    return { id, deduped: false, existingDistance: nearestDistance };
  }

  // -- Recall ---------------------------------------------------------

  // Return the top-k in-scope memories ranked by similarity.
  //
  // Memories beyond `distanceThreshold` (or the instance default)
  // are dropped — the index always returns *something* for KNN, so a
  // recall result on an unrelated query would otherwise be a
  // confidently-wrong false positive.
  async recall({
    queryEmbedding,
    user = 'default',
    namespace = 'default',
    kind,
    k = 5,
    distanceThreshold,
  }) {
    const threshold = distanceThreshold !== undefined
      ? distanceThreshold
      : this.recallThreshold;
    const candidates = await this._nearest({
      embedding: queryEmbedding, user, namespace, kind, k,
    });
    return candidates.filter(
      c => c.distance != null && c.distance <= threshold,
    );
  }

  // -- Internals ------------------------------------------------------

  async _nearest({ embedding, user, namespace, kind, k }) {
    if (!(embedding instanceof Float32Array)) {
      embedding = Float32Array.from(embedding);
    }
    if (embedding.length !== this.vectorDim) {
      throw new Error(
        `embedding length is ${embedding.length}; index expects ${this.vectorDim}`,
      );
    }
    const filterClause = LongTermMemory.buildFilterClause({
      user, namespace, kind,
    });
    const queryStr = `${filterClause}=>[KNN ${k} @embedding $vec AS distance]`;
    const vecBytes = Buffer.from(
      embedding.buffer, embedding.byteOffset, embedding.byteLength,
    );
    const result = await this.client.ft.search(this.indexName, queryStr, {
      PARAMS: { vec: vecBytes },
      DIALECT: 2,
      SORTBY: 'distance',
      RETURN: [
        'user', 'namespace', 'kind', 'source_thread',
        'text', 'created_ts', 'hit_count', 'distance',
      ],
      LIMIT: { from: 0, size: k },
    });
    if (!result.documents || result.documents.length === 0) return [];
    const out = [];
    for (const doc of result.documents) {
      // `doc.id` is the full Redis key (e.g. `agent:mem:abc123`).
      // Strip the prefix so the returned record exposes only the
      // opaque id the UI and `deleteMemory` work with.
      const memoryId = this._stripPrefix(doc.id);
      const ttl = await this.client.ttl(this.memoryKey(memoryId));
      out.push({
        id: memoryId,
        user: doc.value.user ?? '',
        namespace: doc.value.namespace ?? '',
        kind: doc.value.kind ?? '',
        source_thread: doc.value.source_thread ?? '',
        text: doc.value.text ?? '',
        created_ts: parseFloat(doc.value.created_ts ?? '0') || 0,
        hit_count: parseInt(doc.value.hit_count ?? '0', 10) || 0,
        distance: parseFloat(doc.value.distance ?? '0') || 0,
        ttl_seconds: ttl > 0 ? ttl : null,
      });
    }
    return out;
  }

  async _bumpHitCount(memoryId) {
    try {
      await this.client.json.numIncrBy(
        this.memoryKey(memoryId), '$.hit_count', 1,
      );
    } catch {
      // The doc may have expired between recall and bump — fine, we
      // just lose the hit count update.
    }
  }

  _stripPrefix(rawKey) {
    return rawKey.startsWith(this.keyPrefix)
      ? rawKey.slice(this.keyPrefix.length)
      : rawKey;
  }

  // Characters Redis Search treats as syntax inside a TAG value; any
  // of them in a user-supplied filter must be backslash-escaped or
  // the surrounding `{...}` block won't parse correctly.
  static _TAG_SPECIAL = new Set('\\,.<>{}[]"\':;!@#$%^&*()-+=~| '.split(''));

  static escapeTagValue(value) {
    let out = '';
    for (const ch of value) {
      out += LongTermMemory._TAG_SPECIAL.has(ch) ? '\\' + ch : ch;
    }
    return out;
  }

  static buildFilterClause({ user, namespace, kind }) {
    const clauses = [];
    if (user) {
      clauses.push(`@user:{${LongTermMemory.escapeTagValue(user)}}`);
    }
    if (namespace) {
      clauses.push(`@namespace:{${LongTermMemory.escapeTagValue(namespace)}}`);
    }
    if (kind) {
      clauses.push(`@kind:{${LongTermMemory.escapeTagValue(kind)}}`);
    }
    return clauses.length === 0 ? '(*)' : `(${clauses.join(' ')})`;
  }

  // -- Admin / inspection --------------------------------------------

  async indexInfo() {
    try {
      const info = await this.client.ft.info(this.indexName);
      return {
        num_docs: Number(info.numDocs ?? info.num_docs ?? 0),
        indexing_failures: Number(
          info.hashIndexingFailures ?? info.hash_indexing_failures ?? 0,
        ),
      };
    } catch {
      return { num_docs: 0, indexing_failures: 0 };
    }
  }

  async listMemories({ user, namespace, kind, limit = 100 } = {}) {
    const filterClause = LongTermMemory.buildFilterClause({
      user, namespace, kind,
    });
    const result = await this.client.ft.search(this.indexName, filterClause, {
      DIALECT: 2,
      SORTBY: { BY: 'created_ts', DIRECTION: 'DESC' },
      RETURN: [
        'user', 'namespace', 'kind', 'source_thread',
        'text', 'created_ts', 'hit_count',
      ],
      LIMIT: { from: 0, size: limit },
    });
    const out = [];
    for (const doc of result.documents || []) {
      const memoryId = this._stripPrefix(doc.id);
      const ttl = await this.client.ttl(this.memoryKey(memoryId));
      out.push({
        id: memoryId,
        user: doc.value.user ?? '',
        namespace: doc.value.namespace ?? '',
        kind: doc.value.kind ?? '',
        source_thread: doc.value.source_thread ?? '',
        text: doc.value.text ?? '',
        created_ts: parseFloat(doc.value.created_ts ?? '0') || 0,
        hit_count: parseInt(doc.value.hit_count ?? '0', 10) || 0,
        ttl_seconds: ttl > 0 ? ttl : null,
      });
    }
    return out;
  }

  async deleteMemory(memoryId) {
    return (await this.client.del(this.memoryKey(memoryId))) > 0;
  }

  async clear() {
    // Returns the number of memories that were removed. In production
    // the equivalent is `FLUSHDB` on a dedicated memory database, or
    // letting TTLs and eviction expire entries naturally.
    const before = (await this.indexInfo()).num_docs;
    await this.dropIndex({ deleteDocuments: true });
    await this.createIndex();
    return before;
  }
}
