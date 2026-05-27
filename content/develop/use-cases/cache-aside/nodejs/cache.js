"use strict";

const { randomBytes } = require("crypto");

const ACQUIRE_LOCK_SCRIPT = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
    return 1
end
return 0
`;

const RELEASE_LOCK_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
`;

class RedisCache {
  constructor({
    redisClient,
    prefix = "cache:product:",
    ttl = 30,
    lockTtlMs = 2000,
    waitPollMs = 25,
  } = {}) {
    if (!redisClient) {
      throw new Error("A connected redisClient is required.");
    }
    this.redis = redisClient;
    this.prefix = prefix;
    this.ttl = ttl;
    this.lockTtlMs = lockTtlMs;
    this.waitPollMs = waitPollMs;

    this._stats = { hits: 0, misses: 0, stampedesSuppressed: 0 };
  }

  _cacheKey(id) {
    return `${this.prefix}${id}`;
  }

  _lockKey(id) {
    return `lock:${this.prefix}${id}`;
  }

  async get(entityId, loader) {
    const cacheKey = this._cacheKey(entityId);

    const started = process.hrtime.bigint();
    const cached = await this.redis.hGetAll(cacheKey);
    const redisLatencyMs = Number(process.hrtime.bigint() - started) / 1e6;

    if (cached && Object.keys(cached).length > 0) {
      this._stats.hits += 1;
      return { record: cached, hit: true, redisLatencyMs };
    }

    this._stats.misses += 1;
    const record = await this._loadWithSingleFlight(entityId, loader);
    return { record, hit: false, redisLatencyMs };
  }

  async _loadWithSingleFlight(entityId, loader) {
    const cacheKey = this._cacheKey(entityId);
    const lockKey = this._lockKey(entityId);
    const token = randomBytes(8).toString("hex");

    const acquired = await this.redis.eval(ACQUIRE_LOCK_SCRIPT, {
      keys: [lockKey],
      arguments: [token, String(this.lockTtlMs)],
    });

    if (acquired === 1) {
      try {
        const record = await loader(entityId);
        if (record == null) {
          return null;
        }
        const multi = this.redis.multi();
        multi.del(cacheKey);
        multi.hSet(cacheKey, record);
        multi.expire(cacheKey, this.ttl);
        await multi.exec();
        return record;
      } finally {
        await this.redis.eval(RELEASE_LOCK_SCRIPT, {
          keys: [lockKey],
          arguments: [token],
        });
      }
    }

    this._stats.stampedesSuppressed += 1;

    const deadline = Date.now() + this.lockTtlMs;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, this.waitPollMs));
      const cached = await this.redis.hGetAll(cacheKey);
      if (cached && Object.keys(cached).length > 0) {
        return cached;
      }
    }
    return loader(entityId);
  }

  async invalidate(entityId) {
    const deleted = await this.redis.del(this._cacheKey(entityId));
    return deleted === 1;
  }

  async updateField(entityId, field, value) {
    const cacheKey = this._cacheKey(entityId);
    while (true) {
      try {
        await this.redis.watch(cacheKey);
        const exists = await this.redis.exists(cacheKey);
        if (!exists) {
          await this.redis.unwatch();
          return false;
        }
        const result = await this.redis
          .multi()
          .hSet(cacheKey, field, String(value))
          .expire(cacheKey, this.ttl)
          .exec();
        if (result === null) {
          continue;
        }
        return true;
      } catch (err) {
        if (err && err.name === "WatchError") {
          continue;
        }
        throw err;
      }
    }
  }

  async ttlRemaining(entityId) {
    return this.redis.ttl(this._cacheKey(entityId));
  }

  stats() {
    const total = this._stats.hits + this._stats.misses;
    const hitRate = total > 0 ? Math.round((1000 * this._stats.hits) / total) / 10 : 0;
    return {
      hits: this._stats.hits,
      misses: this._stats.misses,
      stampedes_suppressed: this._stats.stampedesSuppressed,
      hit_rate_pct: hitRate,
    };
  }

  resetStats() {
    this._stats.hits = 0;
    this._stats.misses = 0;
    this._stats.stampedesSuppressed = 0;
  }
}

module.exports = { RedisCache };
