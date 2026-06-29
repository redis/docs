// Redis semantic-cache helper backed by Redis Search.
//
// Each cache entry lives as a Hash document at `cache:<id>`. The hash
// stores the user's prompt and the corresponding LLM response
// alongside the raw float32 bytes of the prompt's 384-dimensional
// embedding and a small set of metadata fields — tenant, locale,
// model version, and a safety flag.
//
// A single Redis Search index covers the embedding plus every
// metadata field, so one `FT.SEARCH` call does an
// approximate-nearest-neighbour lookup against the cached prompts
// with a TAG pre-filter applied in the same pass — no cross-store
// joins, no extra round trips, and tenant isolation is enforced
// *inside* the query rather than after the fact in application code.
//
// The lookup is thresholded: `FT.SEARCH` always returns the closest
// cached prompt, but the cache only serves it as a hit when the
// cosine distance is at or below `distanceThreshold`. Anything
// further away is treated as a miss; the caller is expected to run
// the underlying LLM and write the new prompt, response, and
// embedding back with `put`.
//
// Each cache entry is written with `EXPIRE`, so stale answers age out
// without manual cleanup; combine with an `allkeys-lfu` eviction
// policy on the database to cap memory under pressure too.

import { randomUUID } from 'node:crypto';
import {
  SCHEMA_FIELD_TYPE,
  SCHEMA_VECTOR_FIELD_ALGORITHM,
} from 'redis';

const VECTOR_DIM_DEFAULT = 384;

export class RedisSemanticCache {
  constructor({
    client,
    indexName = 'semcache:idx',
    keyPrefix = 'cache:',
    vectorDim = VECTOR_DIM_DEFAULT,
    distanceThreshold = 0.5,
    defaultTtlSeconds = 3600,
  }) {
    this.client = client;
    this.indexName = indexName;
    this.keyPrefix = keyPrefix;
    this.vectorDim = vectorDim;
    this.distanceThreshold = distanceThreshold;
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  // -- Keys -----------------------------------------------------------

  entryKey(entryId) {
    return `${this.keyPrefix}${entryId}`;
  }

  // -- Index management ----------------------------------------------

  async createIndex() {
    // One index covers the embedding plus every metadata field, so a
    // single FT.SEARCH can pre-filter by tenant / locale / model and
    // then KNN-rank the matching documents in one pass.
    const schema = {
      prompt: { type: SCHEMA_FIELD_TYPE.TEXT },
      response: { type: SCHEMA_FIELD_TYPE.TEXT },
      tenant: { type: SCHEMA_FIELD_TYPE.TAG },
      locale: { type: SCHEMA_FIELD_TYPE.TAG },
      model_version: { type: SCHEMA_FIELD_TYPE.TAG },
      safety: { type: SCHEMA_FIELD_TYPE.TAG },
      created_ts: { type: SCHEMA_FIELD_TYPE.NUMERIC, SORTABLE: true },
      hit_count: { type: SCHEMA_FIELD_TYPE.NUMERIC, SORTABLE: true },
      embedding: {
        type: SCHEMA_FIELD_TYPE.VECTOR,
        ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.HNSW,
        TYPE: 'FLOAT32',
        DIM: this.vectorDim,
        DISTANCE_METRIC: 'COSINE',
      },
    };
    try {
      await this.client.ft.create(this.indexName, schema, {
        ON: 'HASH',
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

  // -- Lookup ---------------------------------------------------------

  // Returns either { kind: 'hit', ...fields } or { kind: 'miss', nearestDistance, nearestId }.
  async lookup({
    queryVec,
    tenant,
    locale,
    modelVersion,
    safety = 'ok',
    distanceThreshold,
  }) {
    // Match the shape check that `put` performs. A wrong-dim vector
    // would otherwise hit Redis as a malformed FT.SEARCH parameter
    // and surface as a server-side parse error instead of a clear
    // caller-side error. We also coerce to Float32Array so a
    // Float64Array view of length 384 (which would send 3072 bytes
    // to a FLOAT32 DIM 384 field) is silently up-cast rather than
    // producing a corrupt query.
    if (!(queryVec instanceof Float32Array)) {
      queryVec = Float32Array.from(queryVec);
    }
    if (queryVec.length !== this.vectorDim) {
      throw new Error(
        `queryVec length is ${queryVec.length}; index expects ${this.vectorDim}`,
      );
    }

    const threshold =
      distanceThreshold !== undefined ? distanceThreshold : this.distanceThreshold;

    const filterClause = RedisSemanticCache.buildFilterClause({
      tenant, locale, modelVersion, safety,
    });

    const queryStr = `${filterClause}=>[KNN 1 @embedding $vec AS distance]`;
    const vecBytes = Buffer.from(queryVec.buffer, queryVec.byteOffset, queryVec.byteLength);

    const result = await this.client.ft.search(this.indexName, queryStr, {
      PARAMS: { vec: vecBytes },
      DIALECT: 2,
      SORTBY: 'distance',
      RETURN: [
        'prompt', 'response', 'tenant', 'locale',
        'model_version', 'hit_count', 'distance',
      ],
      LIMIT: { from: 0, size: 1 },
    });

    if (!result.documents || result.documents.length === 0) {
      return { kind: 'miss', nearestDistance: null, nearestId: null };
    }

    const doc = result.documents[0];
    const rawKey = doc.id;
    const entryId = rawKey.startsWith(this.keyPrefix)
      ? rawKey.slice(this.keyPrefix.length)
      : rawKey;
    const distance = parseFloat(doc.value.distance ?? '0') || 0;

    if (distance > threshold) {
      return { kind: 'miss', nearestDistance: distance, nearestId: entryId };
    }

    // The hash may have expired between FT.SEARCH returning the row
    // and us getting here — the search index lags expirations by its
    // periodic scan. If we just blindly HINCRBY-ed, Redis would
    // helpfully recreate the hash with only `hit_count` set and the
    // search index would then log it as an indexing failure (no
    // embedding, no metadata). EXISTS narrows that race to the
    // pipeline round-trip; a strictly race-free version would wrap
    // the bump in a Lua script that checks existence and acts in one
    // server-side step.
    const entryKey = this.entryKey(entryId);
    const exists = await this.client.exists(entryKey);
    if (!exists) {
      return { kind: 'miss', nearestDistance: distance, nearestId: entryId };
    }

    // MULTI/EXEC the three writes so they apply as a unit on the
    // server — a partial failure between HINCRBY and EXPIRE would
    // otherwise leave the entry without a refreshed TTL.
    const replies = await this.client.multi()
      .hIncrBy(entryKey, 'hit_count', 1)
      .expire(entryKey, this.defaultTtlSeconds)
      .ttl(entryKey)
      .exec();
    const [newHitCount, , ttl] = replies;

    return {
      kind: 'hit',
      id: entryId,
      prompt: doc.value.prompt ?? '',
      response: doc.value.response ?? '',
      tenant: doc.value.tenant ?? '',
      locale: doc.value.locale ?? '',
      modelVersion: doc.value.model_version ?? '',
      distance,
      ttlSeconds: ttl > 0 ? ttl : this.defaultTtlSeconds,
      hitCount: Number(newHitCount),
    };
  }

  // -- Write ----------------------------------------------------------

  async put({
    prompt,
    response,
    embedding,
    tenant = 'default',
    locale = 'en',
    modelVersion = 'gpt-4.5-2026',
    safety = 'ok',
    ttlSeconds,
    entryId,
  }) {
    // Coerce any array-like (Float64Array, plain Array, etc.) to
    // Float32Array so byteLength is always exactly vectorDim * 4 —
    // the only encoding Redis Search accepts for a FLOAT32 vector
    // field.
    if (!(embedding instanceof Float32Array)) {
      embedding = Float32Array.from(embedding);
    }
    if (embedding.length !== this.vectorDim) {
      throw new Error(
        `embedding length is ${embedding.length}; index expects ${this.vectorDim}`,
      );
    }

    const id = entryId || randomUUID().replace(/-/g, '').slice(0, 12);
    const key = this.entryKey(id);
    const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlSeconds;
    const vecBytes = Buffer.from(
      embedding.buffer, embedding.byteOffset, embedding.byteLength,
    );

    // MULTI/EXEC so HSET and EXPIRE either both apply or neither does.
    // Without the transaction wrapper a connection drop between the
    // two writes could leave the entry without a TTL and the cache
    // would then keep an answer past its intended lifetime (or
    // forever, on a database with no eviction policy).
    await this.client.multi()
      .hSet(key, {
        prompt,
        response,
        tenant,
        locale,
        model_version: modelVersion,
        safety,
        created_ts: String(Date.now() / 1000),
        hit_count: '0',
        embedding: vecBytes,
      })
      .expire(key, ttl)
      .exec();
    return id;
  }

  // -- Filter clause -------------------------------------------------

  // Characters Redis Search treats as syntax inside a TAG value; any
  // of them in a user-supplied filter must be backslash-escaped or
  // the surrounding `{...}` block won't parse correctly.
  static _TAG_SPECIAL = new Set('\\,.<>{}[]"\':;!@#$%^&*()-+=~| '.split(''));

  static escapeTagValue(value) {
    let out = '';
    for (const ch of value) {
      out += RedisSemanticCache._TAG_SPECIAL.has(ch) ? '\\' + ch : ch;
    }
    return out;
  }

  static buildFilterClause({ tenant, locale, modelVersion, safety }) {
    const clauses = [];
    if (tenant) {
      clauses.push(`@tenant:{${RedisSemanticCache.escapeTagValue(tenant)}}`);
    }
    if (locale) {
      clauses.push(`@locale:{${RedisSemanticCache.escapeTagValue(locale)}}`);
    }
    if (modelVersion) {
      clauses.push(`@model_version:{${RedisSemanticCache.escapeTagValue(modelVersion)}}`);
    }
    if (safety) {
      clauses.push(`@safety:{${RedisSemanticCache.escapeTagValue(safety)}}`);
    }
    return clauses.length === 0 ? '(*)' : `(${clauses.join(' ')})`;
  }

  // -- Inspection / admin --------------------------------------------

  async indexInfo() {
    try {
      const info = await this.client.ft.info(this.indexName);
      return {
        num_docs: Number(info.numDocs ?? info.num_docs ?? 0),
        indexing_failures: Number(
          info.hashIndexingFailures ?? info.hash_indexing_failures ?? 0,
        ),
        vector_index_size_mb: Number(
          info.vectorIndexSzMb ?? info.vector_index_sz_mb ?? 0,
        ),
      };
    } catch (err) {
      return { num_docs: 0, indexing_failures: 0, vector_index_size_mb: 0.0 };
    }
  }

  async listEntries({ limit = 100 } = {}) {
    const result = await this.client.ft.search(this.indexName, '*', {
      RETURN: [
        'prompt', 'response', 'tenant', 'locale',
        'model_version', 'safety', 'created_ts', 'hit_count',
      ],
      LIMIT: { from: 0, size: limit },
      SORTBY: { BY: 'created_ts', DIRECTION: 'DESC' },
    });

    const out = [];
    for (const doc of result.documents) {
      const rawKey = doc.id;
      const entryId = rawKey.startsWith(this.keyPrefix)
        ? rawKey.slice(this.keyPrefix.length)
        : rawKey;
      const ttl = await this.client.ttl(this.entryKey(entryId));
      out.push({
        id: entryId,
        prompt: doc.value.prompt ?? '',
        response: doc.value.response ?? '',
        tenant: doc.value.tenant ?? '',
        locale: doc.value.locale ?? '',
        model_version: doc.value.model_version ?? '',
        safety: doc.value.safety ?? '',
        hit_count: Number(doc.value.hit_count ?? 0),
        ttl_seconds: ttl > 0 ? ttl : 0,
        created_ts: Number(doc.value.created_ts ?? 0),
      });
    }
    return out;
  }

  async deleteEntry(entryId) {
    const deleted = await this.client.del(this.entryKey(entryId));
    return deleted > 0;
  }

  async clear() {
    // Returns the number of entries that were removed. Used by the
    // demo's "reset" button — in production the equivalent is just
    // FLUSHDB on a dedicated cache database, or letting TTLs expire
    // naturally.
    const before = (await this.indexInfo()).num_docs;
    await this.dropIndex({ deleteDocuments: true });
    await this.createIndex();
    return before;
  }
}
