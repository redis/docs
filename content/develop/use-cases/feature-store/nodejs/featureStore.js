"use strict";

/**
 * Redis online feature store backed by per-entity Hashes.
 *
 * Each entity (here, a user) lives at a deterministic key such as
 * `fs:user:{id}`. The hash holds every feature for that entity as one
 * field per feature — batch-materialized aggregates (refreshed on a
 * daily cycle) alongside streaming-updated signals (refreshed every
 * few seconds). One `HMGET` returns whichever subset the model needs
 * in one network round trip.
 *
 * Two TTL layers solve the *mixed staleness* problem:
 *
 *   - A key-level `EXPIRE` aligned with the batch materialization
 *     cycle causes the whole entity to disappear if its batch
 *     refresher fails, so inference sees a missing entity (which the
 *     model handler can detect and fall back on) rather than silently
 *     outdated values.
 *   - A per-field `HEXPIRE` on each streaming field gives that field
 *     its own shorter expiry, independent of the rest of the hash.
 *     When the streaming pipeline stops updating a field, the field
 *     self-cleans while the rest of the entity stays populated.
 *
 * `HEXPIRE` and `HTTL` require Redis 7.4 or later. node-redis 5
 * exposes them as `hExpire` and `hTTL`.
 *
 * Concurrency is by construction: Redis is single-threaded per shard,
 * so overlapping `HSET` calls from a batch job and a streaming worker
 * on the same entity hash are applied atomically without locks or
 * version columns.
 */

/**
 * @typedef {string|number|boolean} FeatureValue
 * @typedef {Record<string, FeatureValue>} FeatureMap
 */

/**
 * Default batch feature schema. Daily aggregates computed offline and
 * bulk-loaded once per materialization cycle.
 */
const DEFAULT_BATCH_FIELDS = Object.freeze([
  "country_iso",
  "risk_segment",
  "account_age_days",
  "tx_count_7d",
  "avg_amount_30d",
  "chargeback_count_180d",
]);

/**
 * Default streaming feature schema. Updated by the streaming worker as
 * new events arrive, with a per-field TTL so each field self-expires
 * when its upstream pipeline stops.
 */
const DEFAULT_STREAMING_FIELDS = Object.freeze([
  "last_login_ts",
  "last_device_id",
  "tx_count_5m",
  "failed_logins_15m",
  "session_country",
]);

/**
 * Encode a feature value as a string for hash storage.
 *
 * Booleans become `"true"` / `"false"` (not `"True"` / `"False"`) so
 * they round-trip cleanly through other clients and `redis-cli`.
 *
 * @param {FeatureValue} value
 * @returns {string}
 */
function encode(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

class FeatureStore {
  /**
   * @param {object} options
   * @param {import("redis").RedisClientType} options.redisClient
   * @param {string} [options.keyPrefix="fs:user:"]
   * @param {number} [options.batchTtlSeconds=86400]
   * @param {number} [options.streamingTtlSeconds=300]
   */
  constructor({
    redisClient,
    keyPrefix = "fs:user:",
    batchTtlSeconds = 24 * 60 * 60,
    streamingTtlSeconds = 5 * 60,
  } = {}) {
    if (!redisClient) {
      throw new Error("A connected redisClient is required.");
    }
    this.redis = redisClient;
    this.keyPrefix = keyPrefix;
    this.batchTtlSeconds = batchTtlSeconds;
    this.streamingTtlSeconds = streamingTtlSeconds;

    // Node.js is single-threaded for JS execution, so plain numbers
    // are safe for counters. No lock needed.
    this.batchWritesTotal = 0;
    this.streamingWritesTotal = 0;
    this.readsTotal = 0;
    this.readFieldsTotal = 0;
  }

  // --- Key helpers ---------------------------------------------------

  /** @param {string} entityId */
  keyFor(entityId) {
    return `${this.keyPrefix}${entityId}`;
  }

  // --- Batch ingestion (materialization) -----------------------------

  /**
   * Materialize a batch of entities into Redis.
   *
   * `rows` is `{entityId: {field: value, ...}}`. One `HSET` plus one
   * `EXPIRE` per entity, all batched into a single round trip through
   * `multi().exec()`. The key-level `EXPIRE` is what makes the whole
   * entity disappear if a future batch run fails — inference reads
   * the missing entity rather than silently outdated values.
   *
   * @param {Record<string, FeatureMap>} rows
   * @param {number} [ttlSeconds]
   * @returns {Promise<number>}
   */
  async bulkLoad(rows, ttlSeconds) {
    const ttl = ttlSeconds ?? this.batchTtlSeconds;
    const ids = Object.keys(rows);
    if (ids.length === 0) return 0;

    const pipe = this.redis.multi();
    for (const entityId of ids) {
      const key = this.keyFor(entityId);
      const fields = rows[entityId];
      const encoded = {};
      for (const [name, value] of Object.entries(fields)) {
        encoded[name] = encode(value);
      }
      pipe.hSet(key, encoded);
      pipe.expire(key, ttl);
    }
    await pipe.exec();
    this.batchWritesTotal += ids.length;
    return ids.length;
  }

  /**
   * Update a single batch feature without touching the key TTL.
   *
   * Used by the demo's "manually refresh one user" lever; in a real
   * pipeline batch updates always flow through `bulkLoad`.
   *
   * @param {string} entityId
   * @param {string} field
   * @param {FeatureValue} value
   * @returns {Promise<void>}
   */
  async updateBatchFeature(entityId, field, value) {
    await this.redis.hSet(this.keyFor(entityId), field, encode(value));
    this.batchWritesTotal += 1;
  }

  // --- Streaming ingestion -------------------------------------------

  /**
   * Write streaming features with a per-field TTL.
   *
   * Each field carries its own `HEXPIRE` so it self-expires
   * independently of the rest of the hash. If the streaming pipeline
   * stops, the streaming fields drop out while the batch-materialized
   * fields remain populated under their longer key-level `EXPIRE`.
   *
   * `HEXPIRE` returns one status code per field:
   *   1 = TTL set / updated,
   *   2 = the expiry was 0 or in the past, so Redis deleted the field
   *       instead of applying a TTL,
   *   0 = an `NX | XX | GT | LT` conditional flag was specified and not
   *       met (we never use one here),
   *   -2 = no such field, or no such key.
   * We just `HSET` every field on the same call, so any code other
   * than 1 means the per-field TTL invariant did not hold — the
   * mixed-staleness story relies on every streaming field carrying a
   * fresh TTL after the write, so failure is loud.
   *
   * @param {string} entityId
   * @param {FeatureMap} fields
   * @param {number} [ttlSeconds]
   * @returns {Promise<void>}
   */
  async updateStreaming(entityId, fields, ttlSeconds) {
    const names = Object.keys(fields);
    if (names.length === 0) return;
    const ttl = ttlSeconds ?? this.streamingTtlSeconds;
    const key = this.keyFor(entityId);
    const encoded = {};
    for (const [name, value] of Object.entries(fields)) {
      encoded[name] = encode(value);
    }

    const [, expireResult] = await this.redis
      .multi()
      .hSet(key, encoded)
      .hExpire(key, names, ttl)
      .exec();
    if (!Array.isArray(expireResult) ||
        expireResult.some((code) => Number(code) !== 1)) {
      throw new Error(
        `HEXPIRE did not set every field TTL for ${key}: ` +
          JSON.stringify(expireResult),
      );
    }
    this.streamingWritesTotal += names.length;
  }

  // --- Inference reads -----------------------------------------------

  /**
   * Retrieve a subset of features for one entity.
   *
   * `HMGET` returns the requested fields in one round trip. Pass
   * `fieldNames=null` (the default) to fetch the entire hash with
   * `HGETALL` — useful for debugging but rarely the right call on the
   * request path, where the model knows exactly which features it
   * consumes.
   *
   * @param {string} entityId
   * @param {string[] | null} [fieldNames]
   * @returns {Promise<Record<string, string>>}
   */
  async getFeatures(entityId, fieldNames = null) {
    const key = this.keyFor(entityId);
    if (fieldNames === null || fieldNames === undefined) {
      const data = await this.redis.hGetAll(key);
      this.readsTotal += 1;
      this.readFieldsTotal += Object.keys(data).length;
      return data;
    }
    const names = [...fieldNames];
    if (names.length === 0) return {};
    const values = await this.redis.hmGet(key, names);
    const out = {};
    let returned = 0;
    for (let i = 0; i < names.length; i += 1) {
      const v = values[i];
      if (v !== null && v !== undefined) {
        out[names[i]] = v;
        returned += 1;
      }
    }
    this.readsTotal += 1;
    this.readFieldsTotal += returned;
    return out;
  }

  /**
   * Pipeline `HMGET` across many entities for batch scoring.
   *
   * Hundreds of entities in one round trip. The model can then score
   * them all without further network calls.
   *
   * @param {Iterable<string>} entityIds
   * @param {Iterable<string>} fieldNames
   * @returns {Promise<Record<string, Record<string, string>>>}
   */
  async batchGetFeatures(entityIds, fieldNames) {
    const ids = [...entityIds];
    const names = [...fieldNames];
    if (ids.length === 0 || names.length === 0) return {};

    const pipe = this.redis.multi();
    for (const entityId of ids) {
      pipe.hmGet(this.keyFor(entityId), names);
    }
    const rows = await pipe.exec();

    const out = {};
    let seenFields = 0;
    for (let i = 0; i < ids.length; i += 1) {
      const values = rows[i] || [];
      const row = {};
      for (let j = 0; j < names.length; j += 1) {
        const v = values[j];
        if (v !== null && v !== undefined) {
          row[names[j]] = v;
          seenFields += 1;
        }
      }
      out[ids[i]] = row;
    }
    this.readsTotal += ids.length;
    this.readFieldsTotal += seenFields;
    return out;
  }

  // --- TTL inspection (used by the demo UI) --------------------------

  /**
   * Seconds until the entity key expires.
   *
   * Returns `-1` if no key-level TTL is set, `-2` if the key doesn't
   * exist.
   *
   * @param {string} entityId
   * @returns {Promise<number>}
   */
  async keyTtlSeconds(entityId) {
    return Number(await this.redis.ttl(this.keyFor(entityId)));
  }

  /**
   * Per-field TTL via `HTTL` (Redis 7.4+).
   *
   * Each value mirrors the `TTL` convention: positive means seconds
   * remaining, `-1` means no TTL on the field, `-2` means the field
   * doesn't exist on this hash (or the key itself is missing).
   *
   * Normalized for forward-compat: some client versions can report
   * `null` for a missing key or a singleton list-of-list in pipeline
   * contexts. Both shapes collapse back to the flat list shape that
   * matches the field order passed in.
   *
   * @param {string} entityId
   * @param {Iterable<string>} fieldNames
   * @returns {Promise<Record<string, number>>}
   */
  async fieldTtlsSeconds(entityId, fieldNames) {
    const names = [...fieldNames];
    if (names.length === 0) return {};
    let ttls = await this.redis.hTTL(this.keyFor(entityId), names);
    if (ttls === null || ttls === undefined) {
      ttls = names.map(() => -2);
    } else if (Array.isArray(ttls) && ttls.length === 1 && Array.isArray(ttls[0])) {
      ttls = ttls[0];
    }
    const out = {};
    for (let i = 0; i < names.length; i += 1) {
      out[names[i]] = Number(ttls[i]);
    }
    return out;
  }

  // --- Demo housekeeping ---------------------------------------------

  /**
   * Enumerate entity IDs by scanning `keyPrefix*`.
   *
   * `SCAN` is non-blocking; the demo uses it to populate UI dropdowns,
   * not as a serving primitive.
   *
   * @param {number} [limit=200]
   * @returns {Promise<string[]>}
   */
  async listEntityIds(limit = 200) {
    const ids = [];
    const prefixLen = this.keyPrefix.length;
    for await (const key of this.redis.scanIterator({
      MATCH: `${this.keyPrefix}*`,
      COUNT: 200,
    })) {
      // node-redis 5 yields each batch as an array; older majors yield one key.
      if (Array.isArray(key)) {
        for (const k of key) {
          ids.push(k.slice(prefixLen));
          if (ids.length >= limit) break;
        }
      } else {
        ids.push(key.slice(prefixLen));
      }
      if (ids.length >= limit) break;
    }
    ids.sort();
    return ids.slice(0, limit);
  }

  /**
   * Count entities currently in the store (via `SCAN`).
   * @returns {Promise<number>}
   */
  async countEntities() {
    let count = 0;
    for await (const key of this.redis.scanIterator({
      MATCH: `${this.keyPrefix}*`,
      COUNT: 500,
    })) {
      count += Array.isArray(key) ? key.length : 1;
    }
    return count;
  }

  /**
   * @param {string} entityId
   * @returns {Promise<number>}
   */
  async deleteEntity(entityId) {
    return Number(await this.redis.del(this.keyFor(entityId)));
  }

  /**
   * Drop every entity under `keyPrefix`. Used by the demo reset path.
   *
   * Scans in batches and issues one variadic `DEL` per batch, so a
   * large demo dataset doesn't land on the server as one giant
   * synchronous delete.
   *
   * @returns {Promise<number>}
   */
  async reset() {
    let deleted = 0;
    let batch = [];
    const flush = async () => {
      if (batch.length === 0) return;
      deleted += Number(await this.redis.del(batch));
      batch = [];
    };
    for await (const key of this.redis.scanIterator({
      MATCH: `${this.keyPrefix}*`,
      COUNT: 500,
    })) {
      if (Array.isArray(key)) {
        batch.push(...key);
      } else {
        batch.push(key);
      }
      if (batch.length >= 500) await flush();
    }
    await flush();
    return deleted;
  }

  stats() {
    return {
      batch_writes_total: this.batchWritesTotal,
      streaming_writes_total: this.streamingWritesTotal,
      reads_total: this.readsTotal,
      read_fields_total: this.readFieldsTotal,
    };
  }

  resetStats() {
    this.batchWritesTotal = 0;
    this.streamingWritesTotal = 0;
    this.readsTotal = 0;
    this.readFieldsTotal = 0;
  }
}

module.exports = {
  FeatureStore,
  DEFAULT_BATCH_FIELDS,
  DEFAULT_STREAMING_FIELDS,
};
