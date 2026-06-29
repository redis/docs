"use strict";

/**
 * Redis recommendation-engine helper backed by Redis Search.
 *
 * Items live as Hash documents at ``product:<id>``. Each hash stores the
 * item's structured metadata (name, description, category, brand,
 * price, in-stock flag, rating) alongside the raw float32 bytes of its
 * 384-dimensional embedding. A single Redis Search index covers every
 * field, so one ``FT.SEARCH`` call does the KNN over the embedding and
 * the TAG / NUMERIC / TEXT pre-filter in the same pass — no cross-store
 * joins, no extra round trips.
 *
 * Per-user state lives in ``user:<id>:features``: a session vector
 * written as an exponentially weighted average of recently-clicked item
 * embeddings, plus per-category affinity counters incremented atomically
 * with ``HINCRBYFLOAT``. The next time the application reads that hash
 * to build a query, it sees the click — no batch cycle, no cache
 * invalidation.
 *
 * The recommendation flow has two paths:
 *
 *  * **Query path** (per recommendation request)
 *    1. *Candidate retrieval* — ``FT.SEARCH`` with ``KNN`` over the
 *       embedding, optionally pre-filtered by structured attributes,
 *       optionally biased toward a session vector blended into the
 *       query.
 *    2. *Re-ranking* — the client takes the top-N candidates and adds
 *       a log-scaled per-category affinity bonus pulled from the user
 *       features hash.
 *  * **Click path** (per user interaction) — the click writes a new
 *    EWMA-blended session vector and increments the category affinity
 *    in the user features hash. The next query path picks both up.
 *
 * In ``node-redis`` 5.x the default client returns text fields as
 * JavaScript strings. The embedding field is binary, so this helper
 * keeps a separate type-mapped view of the same connection that returns
 * blob strings as ``Buffer`` instances. Both views share the underlying
 * socket; no extra round trips, no separate client to manage.
 */

import {
  SCHEMA_FIELD_TYPE,
  SCHEMA_VECTOR_FIELD_ALGORITHM,
  RESP_TYPES,
} from "redis";

export const VECTOR_DIM_DEFAULT = 384;

// Characters Redis Search treats as syntax inside a TAG value; any of
// them appearing in a user-supplied filter must be backslash-escaped or
// the surrounding ``{...}`` block won't parse correctly. The list comes
// from the Redis Search query-syntax documentation. The backslash
// itself is included so a value containing a literal ``\`` can't eat
// the next character's escape.
const TAG_SPECIAL = new Set("\\,.<>{}[]\"':;!@#$%^&*()-+=~| ".split(""));

/**
 * Escape characters that have meaning inside ``@tag:{...}``.
 *
 * With this in place a TAG filter built from external input can't
 * accidentally close the brace, inject an additional clause, or
 * misparse a value that simply contains a space or a hyphen.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeTagValue(value) {
  let out = "";
  for (const ch of value) {
    if (TAG_SPECIAL.has(ch)) out += "\\";
    out += ch;
  }
  return out;
}

/**
 * Build the pre-filter clause that goes in front of the ``KNN`` clause.
 *
 * Empty filters return ``(*)``, which is a no-op pre-filter under
 * ``DIALECT 2``.
 *
 * @param {object} opts
 * @returns {string}
 */
export function buildFilterClause({
  category,
  brand,
  minPrice,
  maxPrice,
  inStockOnly,
  minRating,
  textMatch,
  textField = "description",
} = {}) {
  const clauses = [];
  if (category) clauses.push(`@category:{${escapeTagValue(category)}}`);
  if (brand) clauses.push(`@brand:{${escapeTagValue(brand)}}`);
  if (minPrice !== undefined && minPrice !== null || maxPrice !== undefined && maxPrice !== null) {
    const lo = minPrice === undefined || minPrice === null ? "-inf" : String(Number(minPrice));
    const hi = maxPrice === undefined || maxPrice === null ? "+inf" : String(Number(maxPrice));
    clauses.push(`@price:[${lo} ${hi}]`);
  }
  if (minRating !== undefined && minRating !== null) {
    clauses.push(`@rating:[${Number(minRating)} +inf]`);
  }
  if (inStockOnly) clauses.push("@in_stock:{true}");
  if (textMatch) {
    // TEXT-field filter. Wrapping in quotes makes the value a single
    // phrase and avoids tripping the query parser on operators (``-``,
    // ``|``, ``"``, etc.) that a user might legitimately type.
    const safe = textMatch.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
    clauses.push(`@${textField}:"${safe}"`);
  }
  return clauses.length ? `(${clauses.join(" ")})` : "(*)";
}

/**
 * One result row from the candidate-retrieval stage.
 *
 * ``vectorDistance`` is the cosine distance returned by FT.SEARCH
 * (0 = identical, 2 = opposite). ``score`` starts equal to that and
 * may be reduced by ``rerank`` if the user has category affinities.
 * Lower is better in both fields.
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   description: string,
 *   category: string,
 *   brand: string,
 *   price: number,
 *   rating: number,
 *   in_stock: boolean,
 *   vectorDistance: number,
 *   score: number,
 * }} Candidate
 */

class RedisRecommender {
  /**
   * @param {object} options
   * @param {import("redis").RedisClientType} options.redisClient
   *   A connected node-redis 5.x client. The helper derives a
   *   buffer-typed view internally for the binary embedding paths.
   * @param {string} [options.indexName]
   * @param {string} [options.keyPrefix]
   * @param {string} [options.userKeyPrefix]
   * @param {number} [options.vectorDim]
   */
  constructor({
    redisClient,
    indexName = "recommend:idx",
    keyPrefix = "product:",
    userKeyPrefix = "user:",
    vectorDim = VECTOR_DIM_DEFAULT,
  } = {}) {
    if (!redisClient) {
      throw new Error("A connected redisClient is required.");
    }
    this.redis = redisClient;
    // Buffer-typed view: any BLOB_STRING reply (i.e. the body of
    // HGET/HMGET/HGETALL) comes back as a Node ``Buffer`` instead of a
    // UTF-8 string. We use this for the embedding field and the
    // session_vec field; everywhere else we keep strings.
    this.redisBuf = redisClient.withTypeMapping({
      [RESP_TYPES.BLOB_STRING]: Buffer,
    });
    this.indexName = indexName;
    this.keyPrefix = keyPrefix;
    this.userKeyPrefix = userKeyPrefix;
    this.vectorDim = vectorDim;
  }

  // ------------------------------------------------------------------
  // Keys
  // ------------------------------------------------------------------

  productKey(productId) {
    return `${this.keyPrefix}${productId}`;
  }

  userKey(userId) {
    return `${this.userKeyPrefix}${userId}:features`;
  }

  // ------------------------------------------------------------------
  // Index management
  // ------------------------------------------------------------------

  /**
   * Create the Redis Search index if it doesn't already exist.
   *
   * One index covers every queryable field. The vector field is HNSW
   * with cosine distance so KNN is approximate but fast, and
   * TAG / NUMERIC / TEXT fields share the same index so a single
   * ``FT.SEARCH`` can pre-filter and then KNN-rank in one pass.
   */
  async createIndex() {
    try {
      await this.redis.ft.create(
        this.indexName,
        {
          name: { type: SCHEMA_FIELD_TYPE.TEXT, WEIGHT: 1 },
          description: { type: SCHEMA_FIELD_TYPE.TEXT, WEIGHT: 0.5 },
          category: { type: SCHEMA_FIELD_TYPE.TAG },
          brand: { type: SCHEMA_FIELD_TYPE.TAG },
          in_stock: { type: SCHEMA_FIELD_TYPE.TAG },
          price: { type: SCHEMA_FIELD_TYPE.NUMERIC, SORTABLE: true },
          rating: { type: SCHEMA_FIELD_TYPE.NUMERIC, SORTABLE: true },
          embedding: {
            type: SCHEMA_FIELD_TYPE.VECTOR,
            TYPE: "FLOAT32",
            ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.HNSW,
            DIM: this.vectorDim,
            DISTANCE_METRIC: "COSINE",
          },
        },
        {
          ON: "HASH",
          PREFIX: this.keyPrefix,
        },
      );
    } catch (err) {
      if (!/index already exists/i.test(String(err?.message))) throw err;
    }
  }

  /**
   * Drop the search index. Optionally also drop the indexed documents.
   *
   * @param {{ deleteDocuments?: boolean }} [options]
   */
  async dropIndex({ deleteDocuments = false } = {}) {
    try {
      await this.redis.ft.dropIndex(
        this.indexName,
        deleteDocuments ? { DD: true } : undefined,
      );
    } catch (err) {
      const msg = String(err?.message || "").toLowerCase();
      // Different Redis Search versions phrase the missing-index error
      // differently; tolerate either.
      if (
        !msg.includes("no such index") &&
        !msg.includes("unknown index name")
      ) {
        throw err;
      }
    }
  }

  // ------------------------------------------------------------------
  // Catalog ingest
  // ------------------------------------------------------------------

  /**
   * Pipeline a batch of ``HSET`` writes for the catalog.
   *
   * Each product must include the schema fields plus either
   * ``embedding`` (a ``Float32Array``) or ``embedding_b64`` (the
   * base64-encoded bytes of the same vector — that's what
   * ``buildCatalog.js`` writes into ``catalog.json``).
   *
   * @param {Array<object>} products
   * @returns {Promise<number>}
   */
  async indexProducts(products) {
    // node-redis multi() lets us batch HSETs into one round trip.
    const multi = this.redis.multi();
    for (const product of products) {
      multi.hSet(this.productKey(product.id), this._encodeProduct(product));
    }
    await multi.exec();
    return products.length;
  }

  _encodeProduct(product) {
    // The product id lives in the Redis key itself; not repeated in
    // the hash.
    return {
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      price: String(Number(product.price)),
      rating: String(Number(product.rating)),
      in_stock: product.in_stock ? "true" : "false",
      embedding: this._extractVectorBuffer(product),
    };
  }

  _extractVectorBuffer(product) {
    if (product.embedding_b64) {
      return Buffer.from(product.embedding_b64, "base64");
    }
    if (product.embedding instanceof Float32Array) {
      return Buffer.from(
        product.embedding.buffer,
        product.embedding.byteOffset,
        product.embedding.byteLength,
      );
    }
    if (Buffer.isBuffer(product.embedding)) {
      return product.embedding;
    }
    if (Array.isArray(product.embedding)) {
      const arr = new Float32Array(product.embedding);
      return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
    }
    throw new TypeError(`product ${product.id}: no usable embedding`);
  }

  async countIndexed() {
    try {
      const result = await this.redis.ft.search(this.indexName, "*", {
        LIMIT: { from: 0, size: 0 },
      });
      return Number(result.total ?? 0);
    } catch {
      return 0;
    }
  }

  // ------------------------------------------------------------------
  // Candidate retrieval (KNN + optional pre-filter)
  // ------------------------------------------------------------------

  /**
   * Retrieve top-``k`` candidates with ``FT.SEARCH`` KNN + filters.
   *
   * Pre-filter knobs are TAG (``category``, ``brand``, ``inStockOnly``),
   * NUMERIC (``minPrice`` / ``maxPrice``, ``minRating``), and TEXT
   * (``textMatch`` against ``textField``, default ``description``).
   * They combine with an implicit AND in front of the ``KNN`` clause,
   * so Redis evaluates them first and then KNN-ranks only the matching
   * documents.
   *
   * If ``sessionVec`` is provided, the query vector is blended with it
   * before retrieval — that's the real-time signal path. Returns
   * ``Candidate`` rows ordered by ascending cosine distance (closest
   * first); ``score`` starts equal to the distance and may be reduced
   * by ``rerank`` when the user has affinities.
   *
   * @param {Float32Array} queryVec
   * @param {object} [opts]
   * @returns {Promise<Candidate[]>}
   */
  async candidateRetrieve(queryVec, opts = {}) {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      inStockOnly = false,
      minRating,
      textMatch,
      textField = "description",
      k = 10,
      sessionVec = null,
      sessionWeight = 0.3,
    } = opts;

    // Blend query + session signal so the user's recent clicks pull
    // the next retrieval toward the things they've been engaging with.
    // Both inputs are unit-normalised so cosine scores stay comparable.
    const effectiveVec = blendVectors(queryVec, sessionVec, sessionWeight);

    const filterClause = buildFilterClause({
      category,
      brand,
      minPrice,
      maxPrice,
      inStockOnly,
      minRating,
      textMatch,
      textField,
    });
    const query = `${filterClause}=>[KNN ${k} @embedding $vec AS vector_score]`;

    const result = await this.redis.ft.search(this.indexName, query, {
      PARAMS: {
        vec: Buffer.from(
          effectiveVec.buffer,
          effectiveVec.byteOffset,
          effectiveVec.byteLength,
        ),
      },
      SORTBY: "vector_score",
      RETURN: [
        "name",
        "description",
        "category",
        "brand",
        "price",
        "rating",
        "in_stock",
        "vector_score",
      ],
      LIMIT: { from: 0, size: k },
      DIALECT: 2,
    });

    return (result.documents || []).map((doc) =>
      this._decodeCandidate(doc, this.keyPrefix),
    );
  }

  _decodeCandidate(doc, keyPrefix) {
    const v = doc.value || {};
    // ``doc.id`` is the Redis key (``product:<id>``); strip the prefix
    // to expose the bare product id the rest of the demo uses.
    const bareId =
      typeof doc.id === "string" && doc.id.startsWith(keyPrefix)
        ? doc.id.slice(keyPrefix.length)
        : doc.id;

    const distance = Number(v.vector_score ?? 0);

    return {
      id: bareId,
      name: v.name ?? "",
      description: v.description ?? "",
      category: v.category ?? "",
      brand: v.brand ?? "",
      price: Number(v.price ?? 0),
      rating: Number(v.rating ?? 0),
      in_stock: v.in_stock === "true",
      vectorDistance: distance,
      score: distance,
    };
  }

  // ------------------------------------------------------------------
  // Re-ranking with user affinities
  // ------------------------------------------------------------------

  /**
   * Apply a per-category affinity bonus and re-sort.
   *
   * ``userFeatures.affinities`` is a ``{category: weight}`` map
   * accumulated from previous clicks. The bonus is shaped by
   * ``log(1 + affinity) * affinityWeight`` so repeated clicks see
   * diminishing returns and a single dominant category can't push the
   * bonus arbitrarily large. The bonus is subtracted from the cosine
   * distance, so a category the user has shown interest in pulls its
   * members up the list (closer to zero) without overwhelming the
   * vector signal.
   *
   * @param {Candidate[]} candidates
   * @param {object} userFeatures
   * @param {number} [affinityWeight]
   * @returns {Candidate[]}
   */
  rerank(candidates, userFeatures, affinityWeight = 0.15) {
    const affinities = userFeatures?.affinities || {};
    if (!Object.keys(affinities).length || affinityWeight <= 0) {
      return [...candidates].sort((a, b) => a.score - b.score);
    }
    for (const c of candidates) {
      const rawAff = Math.max(Number(affinities[c.category] ?? 0), 0);
      const bonus = Math.log1p(rawAff) * affinityWeight;
      c.score = c.vectorDistance - bonus;
    }
    return [...candidates].sort((a, b) => a.score - b.score);
  }

  // ------------------------------------------------------------------
  // Session signals (clicks)
  // ------------------------------------------------------------------

  /**
   * Update a user's session vector and category affinity.
   *
   * Reads the clicked item's embedding from its hash, blends it into
   * the user's session vector with an exponentially weighted moving
   * average, and bumps the category counter and click total.
   *
   * ``ewmaAlpha`` is the weight given to the *new* click; the previous
   * session keeps ``1 - ewmaAlpha``. The default biases history (0.6)
   * over the latest click (0.4) so a single accidental click doesn't
   * swing the session.
   *
   * The category-affinity bump and click-count bump use
   * ``HINCRBYFLOAT`` / ``HINCRBY`` so they're atomic against any
   * concurrent caller. The session vector blend is inherently
   * read-modify-write — the new vector depends on the previous one —
   * and is *not* atomic against a concurrent click for the same user.
   * For the per-user data this helper writes, that window is rare in
   * practice; if it matters in a given deployment, wrap the read and
   * the writeback in ``WATCH/MULTI/EXEC`` or move the whole blend into
   * a Lua script.
   *
   * @param {string} userId
   * @param {string} productId
   * @param {object} [options]
   */
  async recordClick(userId, productId, { ewmaAlpha = 0.4, affinityStep = 1.0 } = {}) {
    const productKey = this.productKey(productId);
    // Pull the fields we need from the product hash in one round trip.
    // ``embedding`` is binary, ``category`` is text — the buffer-typed
    // client returns both as Buffer.
    const [embeddingRaw, categoryRaw] = await this.redisBuf.hmGet(
      productKey,
      ["embedding", "category"],
    );
    if (!embeddingRaw) {
      throw Object.assign(new Error(`unknown product ${productId}`), {
        code: "UNKNOWN_PRODUCT",
      });
    }
    const clickedVec = this._bufferToVec(embeddingRaw);
    const category = categoryRaw ? categoryRaw.toString("utf8") : "unknown";

    const userKey = this.userKey(userId);
    const previousRaw = await this.redisBuf.hGet(userKey, "session_vec");
    let newSession;
    if (previousRaw) {
      const previousVec = this._bufferToVec(previousRaw);
      const mixed = new Float32Array(clickedVec.length);
      for (let i = 0; i < mixed.length; i++) {
        mixed[i] =
          ewmaAlpha * clickedVec[i] + (1 - ewmaAlpha) * previousVec[i];
      }
      let norm = 0;
      for (let i = 0; i < mixed.length; i++) norm += mixed[i] * mixed[i];
      norm = Math.sqrt(norm) || 1e-12;
      for (let i = 0; i < mixed.length; i++) mixed[i] /= norm;
      newSession = mixed;
    } else {
      // First click: the clicked vector is already unit-normalised.
      newSession = clickedVec;
    }

    // Affinity and click counters are independent atomic increments;
    // only the session vector needs the read-modify-write because it
    // depends on the previous value. Pipeline the three writes.
    const multi = this.redis.multi();
    multi.hSet(userKey, {
      session_vec: Buffer.from(
        newSession.buffer,
        newSession.byteOffset,
        newSession.byteLength,
      ),
      last_clicked_id: productId,
      last_clicked_category: category,
    });
    multi.hIncrByFloat(userKey, `aff:${category}`, affinityStep);
    multi.hIncrBy(userKey, "clicks", 1);
    const [, newAff, newClicks] = await multi.exec();

    return {
      category,
      affinity: Number(newAff),
      clicks: Number(newClicks),
      last_clicked_id: productId,
    };
  }

  /**
   * Read a user's session vector and affinities for re-ranking.
   *
   * Returns shape ``{ session_vec, affinities, clicks,
   * last_clicked_id, last_clicked_category }``. ``session_vec`` is a
   * ``Float32Array`` or ``null`` if the user has no clicks yet.
   *
   * @param {string} userId
   */
  async getUserFeatures(userId) {
    const raw = await this.redisBuf.hGetAll(this.userKey(userId));
    if (!raw || Object.keys(raw).length === 0) {
      return {
        session_vec: null,
        affinities: {},
        clicks: 0,
        last_clicked_id: null,
        last_clicked_category: null,
      };
    }
    const sessionVec = raw.session_vec ? this._bufferToVec(raw.session_vec) : null;
    const affinities = {};
    for (const [field, value] of Object.entries(raw)) {
      if (field.startsWith("aff:")) {
        const cat = field.slice("aff:".length);
        const n = Number(value.toString("utf8"));
        if (Number.isFinite(n)) affinities[cat] = n;
      }
    }
    return {
      session_vec: sessionVec,
      affinities,
      clicks: raw.clicks ? Number(raw.clicks.toString("utf8")) : 0,
      last_clicked_id: raw.last_clicked_id
        ? raw.last_clicked_id.toString("utf8")
        : null,
      last_clicked_category: raw.last_clicked_category
        ? raw.last_clicked_category.toString("utf8")
        : null,
    };
  }

  /** Delete a user's feature hash. Next request starts cold. */
  async resetUser(userId) {
    await this.redis.del(this.userKey(userId));
  }

  /**
   * Decode a Buffer into a ``Float32Array``. Validates length so a
   * corrupted or wrong-dim field surfaces a useful error early.
   *
   * Node's ``Buffer`` is pooled, so ``buf.byteOffset`` is rarely
   * 4-byte-aligned. ``Float32Array`` requires a 4-byte-aligned
   * ``byteOffset``, so we copy into a fresh ``ArrayBuffer`` first.
   */
  _bufferToVec(buf) {
    const expectedBytes = this.vectorDim * 4;
    if (buf.byteLength !== expectedBytes) {
      throw new Error(
        `expected ${expectedBytes} bytes for a ` +
          `${this.vectorDim}-dim float32 vector, got ${buf.byteLength}`,
      );
    }
    const aligned = new ArrayBuffer(expectedBytes);
    // Uint8Array works against any byte offset, so it's safe to use as
    // the copy intermediate. Once the bytes are inside ``aligned`` the
    // Float32Array view starts at offset 0 and is by construction
    // aligned.
    new Uint8Array(aligned).set(
      new Uint8Array(buf.buffer, buf.byteOffset, expectedBytes),
    );
    return new Float32Array(aligned);
  }

  // ------------------------------------------------------------------
  // Hot embedding refresh (no serving downtime)
  // ------------------------------------------------------------------

  /**
   * Overwrite the embedding for one product.
   *
   * The HNSW index reflects the change as soon as the ``HSET`` commits,
   * so subsequent ``FT.SEARCH`` calls see the new vector without any
   * index rebuild or serving downtime. The same call path is what an
   * offline retraining pipeline would use to roll out a re-trained
   * model: stream the new vectors into Redis and the serving tier
   * picks them up on the next query.
   *
   * Throws if ``productId`` does not already exist (``HSET`` would
   * otherwise create a partially-populated key that the index then
   * picks up), and rejects vectors with the wrong dimensionality so a
   * model swap doesn't quietly corrupt the index.
   *
   * @param {string} productId
   * @param {Float32Array} newVector
   */
  async refreshEmbedding(productId, newVector) {
    if (!(newVector instanceof Float32Array)) {
      throw new TypeError("newVector must be a Float32Array");
    }
    if (newVector.length !== this.vectorDim) {
      throw new Error(
        `newVector has length ${newVector.length}; ` +
          `index expects ${this.vectorDim}`,
      );
    }
    const key = this.productKey(productId);
    const exists = await this.redis.exists(key);
    if (!exists) {
      throw Object.assign(new Error(`unknown product ${productId}`), {
        code: "UNKNOWN_PRODUCT",
      });
    }
    await this.redis.hSet(key, {
      embedding: Buffer.from(
        newVector.buffer,
        newVector.byteOffset,
        newVector.byteLength,
      ),
    });
  }

  // ------------------------------------------------------------------
  // Inspection
  // ------------------------------------------------------------------

  /** Subset of FT.INFO useful for the demo UI. */
  async indexInfo() {
    try {
      const info = await this.redis.ft.info(this.indexName);
      // Redis Search reports vector_index_sz_mb at the top level; the
      // attributes structure is awkward to introspect across versions
      // so we read the top-level field directly.
      const vectorMb = pickField(info, [
        "vector_index_sz_mb",
        "vectorIndexSzMb",
      ]);
      const numDocs = pickField(info, ["num_docs", "numDocs"]);
      const failures = pickField(info, [
        "hash_indexing_failures",
        "hashIndexingFailures",
      ]);
      return {
        num_docs: Number(numDocs ?? 0),
        indexing_failures: Number(failures ?? 0),
        vector_index_size_mb: Number(vectorMb ?? 0),
      };
    } catch {
      return { num_docs: 0, indexing_failures: 0, vector_index_size_mb: 0 };
    }
  }

  /**
   * Return every indexed product (metadata only, no vector).
   * Used by the demo to show the full catalog and to know what IDs
   * exist for the "click" buttons.
   */
  async listProducts(limit = 100) {
    const result = await this.redis.ft.search(this.indexName, "*", {
      RETURN: ["name", "category", "brand", "price", "rating", "in_stock"],
      LIMIT: { from: 0, size: limit },
      SORTBY: { BY: "price" },
    });
    return (result.documents || []).map((doc) => {
      const v = doc.value || {};
      const bareId =
        typeof doc.id === "string" && doc.id.startsWith(this.keyPrefix)
          ? doc.id.slice(this.keyPrefix.length)
          : doc.id;
      return {
        id: bareId,
        name: v.name ?? "",
        category: v.category ?? "",
        brand: v.brand ?? "",
        price: Number(v.price ?? 0),
        rating: Number(v.rating ?? 0),
        in_stock: v.in_stock === "true",
      };
    });
  }

  async listCategories() {
    try {
      const vals = await this.redis.ft.tagVals(this.indexName, "category");
      return [...vals].sort();
    } catch {
      return [];
    }
  }

  async listBrands() {
    try {
      const vals = await this.redis.ft.tagVals(this.indexName, "brand");
      return [...vals].sort();
    } catch {
      return [];
    }
  }
}

/**
 * Blend a query vector with an optional session vector and renormalise.
 *
 * @param {Float32Array} queryVec
 * @param {Float32Array | null} sessionVec
 * @param {number} sessionWeight
 * @returns {Float32Array}
 */
function blendVectors(queryVec, sessionVec, sessionWeight) {
  if (!sessionVec || sessionWeight <= 0) return queryVec;
  const out = new Float32Array(queryVec.length);
  for (let i = 0; i < out.length; i++) {
    out[i] = (1 - sessionWeight) * queryVec[i] + sessionWeight * sessionVec[i];
  }
  let norm = 0;
  for (let i = 0; i < out.length; i++) norm += out[i] * out[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return queryVec;
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

/** Pick the first matching field from an object across naming variants. */
function pickField(obj, names) {
  if (!obj) return undefined;
  for (const name of names) {
    if (obj[name] !== undefined) return obj[name];
  }
  return undefined;
}

export { RedisRecommender, blendVectors };
