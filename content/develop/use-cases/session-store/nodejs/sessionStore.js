"use strict";

const { randomBytes } = require("crypto");

const RESERVED_SESSION_FIELDS = new Set([
  "created_at",
  "last_accessed_at",
  "session_ttl",
]);

class RedisSessionStore {
  constructor({ redisClient, prefix = "session:", ttl = 1800 } = {}) {
    if (!redisClient) {
      throw new Error("A connected redisClient is required.");
    }

    this.redis = redisClient;
    this.prefix = prefix;
    this.ttl = this._normalizeTtl(ttl);
  }

  _normalizeTtl(ttl = this.ttl) {
    const normalized = Number.parseInt(ttl, 10);
    if (!Number.isInteger(normalized) || normalized < 1) {
      throw new Error("TTL must be at least 1 second");
    }
    return normalized;
  }

  _sessionKey(sessionId) {
    return `${this.prefix}${sessionId}`;
  }

  _timestamp() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
  }

  _isValidSession(session) {
    if (!session || Object.keys(session).length === 0) {
      return false;
    }

    return [...RESERVED_SESSION_FIELDS].every((field) =>
      Object.prototype.hasOwnProperty.call(session, field)
    );
  }

  async createSession(data = {}, ttl = undefined) {
    const sessionId = randomBytes(32).toString("base64url");
    const key = this._sessionKey(sessionId);
    const now = this._timestamp();
    const sessionTtl = this._normalizeTtl(ttl);
    const payload = {};

    for (const [field, value] of Object.entries(data)) {
      if (!RESERVED_SESSION_FIELDS.has(field)) {
        payload[field] = String(value);
      }
    }

    payload.created_at = now;
    payload.last_accessed_at = now;
    payload.session_ttl = String(sessionTtl);

    await this.redis.multi().hSet(key, payload).expire(key, sessionTtl).exec();
    return sessionId;
  }

  async getConfiguredTtl(sessionId) {
    const storedTtl = await this.redis.hGet(
      this._sessionKey(sessionId),
      "session_ttl"
    );

    if (storedTtl === null) {
      return null;
    }

    return this._normalizeTtl(storedTtl);
  }

  async getSession(sessionId, refreshTtl = true) {
    const key = this._sessionKey(sessionId);
    const session = await this.redis.hGetAll(key);
    if (!this._isValidSession(session)) {
      return null;
    }

    if (!refreshTtl) {
      return session;
    }

    const sessionTtl = this._normalizeTtl(session.session_ttl);
    const now = this._timestamp();
    const [, , refreshedSession] = await this.redis
      .multi()
      .hSet(key, { last_accessed_at: now })
      .expire(key, sessionTtl)
      .hGetAll(key)
      .exec();

    return this._isValidSession(refreshedSession) ? refreshedSession : null;
  }

  async updateSession(sessionId, data) {
    const key = this._sessionKey(sessionId);
    const session = await this.redis.hGetAll(key);
    if (!this._isValidSession(session)) {
      return false;
    }

    const payload = {};
    for (const [field, value] of Object.entries(data)) {
      if (!RESERVED_SESSION_FIELDS.has(field)) {
        payload[field] = String(value);
      }
    }

    if (Object.keys(payload).length === 0) {
      return true;
    }

    payload.last_accessed_at = this._timestamp();
    const sessionTtl = this._normalizeTtl(session.session_ttl);

    await this.redis.multi().hSet(key, payload).expire(key, sessionTtl).exec();
    return true;
  }

  async incrementField(sessionId, field, amount = 1) {
    const key = this._sessionKey(sessionId);
    const session = await this.redis.hGetAll(key);
    if (!this._isValidSession(session)) {
      return null;
    }

    const sessionTtl = this._normalizeTtl(session.session_ttl);
    const [newValue] = await this.redis
      .multi()
      .hIncrBy(key, field, amount)
      .hSet(key, { last_accessed_at: this._timestamp() })
      .expire(key, sessionTtl)
      .exec();

    return Number(newValue);
  }

  async setSessionTtl(sessionId, ttl) {
    const key = this._sessionKey(sessionId);
    const session = await this.redis.hGetAll(key);
    if (!this._isValidSession(session)) {
      return false;
    }

    const sessionTtl = this._normalizeTtl(ttl);
    await this.redis
      .multi()
      .hSet(key, {
        session_ttl: String(sessionTtl),
        last_accessed_at: this._timestamp(),
      })
      .expire(key, sessionTtl)
      .exec();

    return true;
  }

  async deleteSession(sessionId) {
    return (await this.redis.del(this._sessionKey(sessionId))) === 1;
  }

  async getTtl(sessionId) {
    return Number(await this.redis.ttl(this._sessionKey(sessionId)));
  }
}

module.exports = { RedisSessionStore, RESERVED_SESSION_FIELDS };
