/**
 * Redis-backed leaderboard implementation using a sorted set and user metadata hashes.
 */

class RedisLeaderboard {
  /**
   * @param {Object} options
   * @param {import("redis").RedisClientType} options.redisClient
   * @param {string} [options.key="leaderboard:demo"]
   * @param {number} [options.maxEntries=100]
   */
  constructor({ redisClient, key = "leaderboard:demo", maxEntries = 100 } = {}) {
    if (!redisClient) {
      throw new Error("redisClient is required");
    }

    this.redis = redisClient;
    this.key = key;
    this.maxEntries = this._normalizePositiveInt(maxEntries, "maxEntries");
  }

  _normalizePositiveInt(value, fieldName) {
    const normalized = Number.parseInt(value, 10);
    if (!Number.isFinite(normalized) || normalized < 1) {
      throw new Error(`${fieldName} must be at least 1`);
    }
    return normalized;
  }

  _metadataKey(userId) {
    return `${this.key}:user:${userId}`;
  }

  _coerceMetadata(metadata = null) {
    if (!metadata) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(metadata).map(([field, value]) => [field, String(value)]),
    );
  }

  async _deleteMetadataForUsers(userIds) {
    if (!userIds.length) {
      return;
    }

    const keys = userIds.map((userId) => this._metadataKey(userId));
    await this.redis.sendCommand(["DEL", ...keys]);
  }

  async _zRangeWithScoresRev(start, end) {
    const response = await this.redis.sendCommand([
      "ZRANGE",
      this.key,
      String(start),
      String(end),
      "REV",
      "WITHSCORES",
    ]);

    const entries = [];
    for (let index = 0; index < response.length; index += 2) {
      entries.push({
        value: response[index],
        score: Number(response[index + 1]),
      });
    }

    return entries;
  }

  async _zRevRank(userId) {
    const response = await this.redis.sendCommand(["ZREVRANK", this.key, userId]);
    if (response === null) {
      return null;
    }

    return Number(response);
  }

  async _zScore(userId) {
    const response = await this.redis.sendCommand(["ZSCORE", this.key, userId]);
    if (response === null) {
      return null;
    }

    return Number(response);
  }

  async _hydrateEntries(entries, startRank) {
    if (!entries.length) {
      return [];
    }

    const multi = this.redis.multi();
    for (const entry of entries) {
      multi.hGetAll(this._metadataKey(entry.value));
    }
    const metadataResults = await multi.exec();

    return entries.map((entry, index) => ({
      rank: startRank + index,
      userId: entry.value,
      score: Number(entry.score),
      metadata: metadataResults[index] || {},
    }));
  }

  async _trimToMaxEntries() {
    const overflow = (await this.redis.zCard(this.key)) - this.maxEntries;
    if (overflow <= 0) {
      return [];
    }

    const trimmedUserIds = await this.redis.zRange(this.key, 0, overflow - 1);
    if (!trimmedUserIds.length) {
      return [];
    }

    await this.redis.zRemRangeByRank(this.key, 0, overflow - 1);
    await this._deleteMetadataForUsers(trimmedUserIds);
    return trimmedUserIds;
  }

  async upsertUser(userId, score, metadata = null) {
    const metadataKey = this._metadataKey(userId);
    const payload = this._coerceMetadata(metadata);

    const multi = this.redis.multi();
    multi.zAdd(this.key, [{ score: Number(score), value: userId }]);
    if (Object.keys(payload).length > 0) {
      multi.hSet(metadataKey, payload);
    }
    await multi.exec();

    const trimmedUserIds = await this._trimToMaxEntries();
    const entry = await this.getUserEntry(userId);
    if (!entry) {
      return {
        userId,
        score: Number(score),
        metadata: payload,
        trimmedUserIds,
      };
    }

    return {
      ...entry,
      trimmedUserIds,
    };
  }

  async incrementScore(userId, amount, metadata = null) {
    const metadataKey = this._metadataKey(userId);
    const payload = this._coerceMetadata(metadata);

    const multi = this.redis.multi();
    multi.zIncrBy(this.key, Number(amount), userId);
    if (Object.keys(payload).length > 0) {
      multi.hSet(metadataKey, payload);
    }
    const result = await multi.exec();

    const newScore = Number(result[0]);
    const trimmedUserIds = await this._trimToMaxEntries();
    const entry = await this.getUserEntry(userId);
    if (!entry) {
      return {
        userId,
        score: newScore,
        metadata: payload,
        trimmedUserIds,
      };
    }

    return {
      ...entry,
      trimmedUserIds,
    };
  }

  async setMaxEntries(maxEntries) {
    this.maxEntries = this._normalizePositiveInt(maxEntries, "maxEntries");
    return this._trimToMaxEntries();
  }

  async getTop(count) {
    const normalizedCount = this._normalizePositiveInt(count, "count");
    const entries = await this._zRangeWithScoresRev(0, normalizedCount - 1);
    return this._hydrateEntries(entries, 1);
  }

  async getAroundRank(rank, count) {
    const normalizedRank = this._normalizePositiveInt(rank, "rank");
    const normalizedCount = this._normalizePositiveInt(count, "count");
    const totalEntries = await this.getSize();

    if (totalEntries === 0) {
      return [];
    }

    if (totalEntries <= normalizedCount) {
      return this.listAll();
    }

    const halfWindow = Math.floor(normalizedCount / 2);
    let start = Math.max(0, normalizedRank - 1 - halfWindow);
    start = Math.min(start, totalEntries - normalizedCount);
    const end = start + normalizedCount - 1;

    const entries = await this._zRangeWithScoresRev(start, end);
    return this._hydrateEntries(entries, start + 1);
  }

  async getRank(userId) {
    const rank = await this._zRevRank(userId);
    if (rank === null) {
      return null;
    }
    return rank + 1;
  }

  async getUserMetadata(userId) {
    return this.redis.hGetAll(this._metadataKey(userId));
  }

  async getUserEntry(userId) {
    const [score, rank, metadata] = await Promise.all([
      this._zScore(userId),
      this._zRevRank(userId),
      this.redis.hGetAll(this._metadataKey(userId)),
    ]);

    if (score === null || rank === null) {
      return null;
    }

    return {
      rank: rank + 1,
      userId,
      score,
      metadata: metadata || {},
    };
  }

  async listAll() {
    const entries = await this._zRangeWithScoresRev(0, -1);
    return this._hydrateEntries(entries, 1);
  }

  async getSize() {
    return Number(await this.redis.zCard(this.key));
  }

  async deleteUser(userId) {
    const multi = this.redis.multi();
    multi.zRem(this.key, userId);
    multi.del(this._metadataKey(userId));
    const [removedCount] = await multi.exec();
    return Boolean(removedCount);
  }

  async clear() {
    const userIds = await this.redis.zRange(this.key, 0, -1);
    const keys = [this.key, ...userIds.map((userId) => this._metadataKey(userId))];
    await this.redis.sendCommand(["DEL", ...keys]);
  }
}

module.exports = { RedisLeaderboard };
