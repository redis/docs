"use strict";

/**
 * Redis prefetch-cache helper.
 *
 * Each cached entity is stored as a Redis hash under `cache:{prefix}:{id}`
 * with a long safety-net TTL that bounds memory if the sync pipeline ever
 * stops, but is not the freshness mechanism. Freshness comes from the
 * `applyChange` path, which the sync worker calls every time a primary
 * mutation arrives.
 *
 * Reads run `HGETALL` against Redis only. A miss is not a fall-back
 * trigger — the application treats it as an error or a deliberate
 * `invalidate` for testing. In production a sustained miss rate means
 * the prefetch or the sync pipeline is broken, not that the primary should
 * be re-queried on the request path.
 */

class PrefetchCache {
  constructor({
    redisClient,
    prefix = "cache:category:",
    ttlSeconds = 3600,
  } = {}) {
    if (!redisClient) {
      throw new Error("A connected redisClient is required.");
    }
    this.redis = redisClient;
    this.prefix = prefix;
    this.ttlSeconds = ttlSeconds;

    // Node.js is single-threaded for JS execution, so plain numbers are
    // safe for counters. No lock needed; an `await` in one helper cannot
    // interleave another helper's counter increment between the read and
    // the write on the same line.
    this._hits = 0;
    this._misses = 0;
    this._prefetched = 0;
    this._syncEventsApplied = 0;
    this._syncLagMsTotal = 0;
    this._syncLagSamples = 0;
  }

  _cacheKey(entityId) {
    return `${this.prefix}${entityId}`;
  }

  _stripPrefix(key) {
    return key.startsWith(this.prefix) ? key.slice(this.prefix.length) : key;
  }

  /**
   * Pipeline `DEL` + `HSET` + `EXPIRE` for every record. Returns the count loaded.
   *
   * The pipeline is non-transactional: it is fast on startup (when
   * nothing is reading the cache) and on the live `/reprefetch` path
   * (when the demo pauses the sync worker around the call). Calling
   * `bulkLoad` on a cache that is actively being read and written to can
   * briefly expose a key that has been deleted but not yet rewritten;
   * pause the writers first or rewrite this with a transactional MULTI
   * if that matters.
   */
  async bulkLoad(records) {
    let loaded = 0;
    const pipe = this.redis.multi();
    for (const record of records) {
      const entityId = record && record.id;
      if (!entityId) {
        continue;
      }
      const cacheKey = this._cacheKey(entityId);
      pipe.del(cacheKey);
      pipe.hSet(cacheKey, record);
      pipe.expire(cacheKey, this.ttlSeconds);
      loaded += 1;
    }
    if (loaded > 0) {
      // execAsPipeline sends the commands in one round trip without
      // wrapping them in MULTI/EXEC.
      await pipe.execAsPipeline();
    }
    this._prefetched += loaded;
    return loaded;
  }

  /**
   * Return `{ record, hit, redisLatencyMs }` for an `HGETALL` against Redis.
   *
   * Prefetch-cache reads do not fall back to the primary. A miss is a
   * signal that the cache is incomplete, not a trigger to re-query the
   * source. The caller decides how to surface it.
   */
  async get(entityId) {
    const cacheKey = this._cacheKey(entityId);

    const started = process.hrtime.bigint();
    const cached = await this.redis.hGetAll(cacheKey);
    const redisLatencyMs = Number(process.hrtime.bigint() - started) / 1e6;

    if (cached && Object.keys(cached).length > 0) {
      this._hits += 1;
      return { record: cached, hit: true, redisLatencyMs };
    }

    this._misses += 1;
    return { record: null, hit: false, redisLatencyMs };
  }

  /**
   * Apply a primary change event to Redis.
   *
   * The sync worker calls this for every event the primary emits. For an
   * upsert, the helper rewrites the hash and refreshes the safety-net
   * TTL. For a delete, it removes the cache key.
   */
  async applyChange(change) {
    if (!change) {
      return;
    }
    const { op, id: entityId, fields, timestamp_ms: timestampMs } = change;
    if (!entityId) {
      return;
    }

    const cacheKey = this._cacheKey(entityId);

    if (op === "upsert") {
      if (!fields || Object.keys(fields).length === 0) {
        // Malformed upsert with no fields. Skip rather than crash the
        // sync worker: hSet with an empty mapping rejects in node-redis,
        // and there's nothing to write anyway. A real CDC consumer would
        // route this to a dead-letter queue and alert; the demo just drops it.
        return;
      }
      await this.redis
        .multi()
        .del(cacheKey)
        .hSet(cacheKey, fields)
        .expire(cacheKey, this.ttlSeconds)
        .exec();
    } else if (op === "delete") {
      await this.redis.del(cacheKey);
    } else {
      return;
    }

    this._syncEventsApplied += 1;
    if (typeof timestampMs === "number" && Number.isFinite(timestampMs)) {
      const lagMs = Math.max(0, Date.now() - timestampMs);
      this._syncLagMsTotal += lagMs;
      this._syncLagSamples += 1;
    }
  }

  /** Delete one cache key. Demo-only: simulates a broken sync pipeline. */
  async invalidate(entityId) {
    const deleted = await this.redis.del(this._cacheKey(entityId));
    return deleted === 1;
  }

  /** Delete every key under this cache's prefix and return the count. */
  async clear() {
    let deleted = 0;
    let pipe = this.redis.multi();
    let batch = 0;
    const match = `${this.prefix}*`;
    // node-redis 5.x scanIterator yields batches (arrays) of keys, not
    // individual keys. Iterate over each batch and flatten.
    for await (const keys of this.redis.scanIterator({ MATCH: match, COUNT: 500 })) {
      for (const key of keys) {
        pipe.del(key);
        batch += 1;
        if (batch >= 500) {
          const results = await pipe.execAsPipeline();
          deleted += results.reduce((acc, r) => acc + (r ? Number(r) : 0), 0);
          pipe = this.redis.multi();
          batch = 0;
        }
      }
    }
    if (batch > 0) {
      const results = await pipe.execAsPipeline();
      deleted += results.reduce((acc, r) => acc + (r ? Number(r) : 0), 0);
    }
    return deleted;
  }

  /** Return every entity id currently in the cache. */
  async ids() {
    const out = [];
    const match = `${this.prefix}*`;
    for await (const keys of this.redis.scanIterator({ MATCH: match, COUNT: 500 })) {
      for (const key of keys) {
        out.push(this._stripPrefix(key));
      }
    }
    out.sort();
    return out;
  }

  async count() {
    let n = 0;
    const match = `${this.prefix}*`;
    for await (const keys of this.redis.scanIterator({ MATCH: match, COUNT: 500 })) {
      n += keys.length;
    }
    return n;
  }

  async ttlRemaining(entityId) {
    return this.redis.ttl(this._cacheKey(entityId));
  }

  stats() {
    const total = this._hits + this._misses;
    const hitRate = total > 0 ? Math.round((1000 * this._hits) / total) / 10 : 0.0;
    const avgLag =
      this._syncLagSamples > 0
        ? Math.round((this._syncLagMsTotal / this._syncLagSamples) * 100) / 100
        : 0.0;
    return {
      hits: this._hits,
      misses: this._misses,
      hit_rate_pct: hitRate,
      prefetched: this._prefetched,
      sync_events_applied: this._syncEventsApplied,
      sync_lag_ms_avg: avgLag,
    };
  }

  resetStats() {
    this._hits = 0;
    this._misses = 0;
    this._prefetched = 0;
    this._syncEventsApplied = 0;
    this._syncLagMsTotal = 0;
    this._syncLagSamples = 0;
  }
}

module.exports = { PrefetchCache };
