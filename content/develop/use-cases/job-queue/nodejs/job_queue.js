/**
 * Redis-backed job queue helper.
 *
 * Jobs are pushed onto a pending list and atomically moved to a processing
 * list when a worker claims them. Each job's payload, status, attempts, and
 * result live in a Redis hash. A reclaimer scans the processing list for
 * jobs older than the visibility timeout and pushes them back to pending so
 * no work is lost when a worker dies mid-job.
 *
 * @module job_queue
 */

"use strict";

const crypto = require("crypto");

// Mark a job complete and remove it from the processing list. Only deletes
// from the processing list if the worker still owns the claim token; this
// prevents a worker that was reclaimed (because it went over the visibility
// timeout) from later marking a job complete that another worker has
// already picked up.
const COMPLETE_SCRIPT = `
local meta_key = KEYS[1] .. ARGV[1]
local current_token = redis.call('HGET', meta_key, 'claim_token')
if current_token ~= ARGV[2] then
  return 0
end
redis.call('LREM', KEYS[2], 1, ARGV[1])
redis.call('HSET', meta_key,
  'status', ARGV[3],
  'completed_at_ms', ARGV[4],
  'result', ARGV[5])
redis.call('EXPIRE', meta_key, ARGV[6])
redis.call('LPUSH', KEYS[3], ARGV[1])
redis.call('LTRIM', KEYS[3], 0, ARGV[7] - 1)
return 1
`;

// Record a failure. If the job still has retries left it goes back to the
// pending list; otherwise it lands in the failed list with its metadata
// expiring on the same schedule as completed jobs. Only acts if the
// caller still owns the claim token — a reclaimed job can't be failed
// by the original claimant.
const FAIL_SCRIPT = `
local meta_key = KEYS[1] .. ARGV[1]
local current_token = redis.call('HGET', meta_key, 'claim_token')
if current_token ~= ARGV[2] then
  return 0
end
redis.call('LREM', KEYS[2], 1, ARGV[1])
if ARGV[7] == '1' then
  redis.call('HSET', meta_key,
    'status', 'pending',
    'last_error', ARGV[3],
    'last_error_at_ms', ARGV[4],
    'claim_token', '',
    'claimed_at_ms', 0)
  redis.call('LPUSH', KEYS[3], ARGV[1])
  return 1
else
  redis.call('HSET', meta_key,
    'status', 'failed',
    'last_error', ARGV[3],
    'last_error_at_ms', ARGV[4],
    'claim_token', '')
  redis.call('LPUSH', KEYS[4], ARGV[1])
  redis.call('LTRIM', KEYS[4], 0, ARGV[6] - 1)
  redis.call('EXPIRE', meta_key, ARGV[5])
  return 2
end
`;

// Reclaim jobs whose claim has gone stale. Walks the processing list and
// moves any job past the visibility timeout back to the pending list.
// A job is past the timeout if either:
//   - claimed_at_ms is set and (now - claimed_at_ms) > visibility_ms, OR
//   - claimed_at_ms is missing (worker crashed between BLMOVE and the
//     metadata write) and (now - enqueued_at_ms) > 2 * visibility_ms.
// Runs in one round trip so a concurrent worker can't claim a
// half-reclaimed job.
const RECLAIM_SCRIPT = `
local now_ms = tonumber(ARGV[1])
local visibility_ms = tonumber(ARGV[2])
local processing = redis.call('LRANGE', KEYS[2], 0, -1)
local reclaimed = {}
for _, job_id in ipairs(processing) do
  local meta_key = KEYS[3] .. job_id
  local claimed_at = tonumber(redis.call('HGET', meta_key, 'claimed_at_ms') or '0')
  local enqueued_at = tonumber(redis.call('HGET', meta_key, 'enqueued_at_ms') or '0')
  local stale = false
  if claimed_at > 0 and (now_ms - claimed_at) > visibility_ms then
    stale = true
  elseif claimed_at == 0 and enqueued_at > 0 and (now_ms - enqueued_at) > (visibility_ms * 2) then
    stale = true
  end
  if stale then
    redis.call('LREM', KEYS[2], 1, job_id)
    redis.call('LPUSH', KEYS[1], job_id)
    redis.call('HSET', meta_key,
      'status', 'pending',
      'reclaimed_at_ms', now_ms,
      'claim_token', '',
      'claimed_at_ms', 0)
    table.insert(reclaimed, job_id)
  end
end
return reclaimed
`;

/**
 * A job that has been atomically moved into the processing list.
 */
class ClaimedJob {
  constructor(id, payload, attempts, claimToken) {
    this.id = id;
    this.payload = payload;
    this.attempts = attempts;
    this.claimToken = claimToken;
  }

  toObject() {
    return {
      id: this.id,
      payload: this.payload,
      attempts: this.attempts,
      claim_token: this.claimToken,
    };
  }
}

/**
 * Reliable FIFO job queue with visibility-timeout reclaim.
 */
class RedisJobQueue {
  constructor({
    redisClient,
    queueName = "jobs",
    visibilityMs = 5000,
    completedTtl = 300,
    completedHistory = 50,
    maxAttempts = 3,
  } = {}) {
    if (!redisClient) {
      throw new Error("RedisJobQueue requires a redisClient");
    }
    this.redis = redisClient;
    this.queueName = queueName;
    this.visibilityMs = visibilityMs;
    this.completedTtl = completedTtl;
    this.completedHistory = completedHistory;
    this.maxAttempts = maxAttempts;

    this.pendingKey = `queue:${queueName}:pending`;
    this.processingKey = `queue:${queueName}:processing`;
    this.completedKey = `queue:${queueName}:completed`;
    this.failedKey = `queue:${queueName}:failed`;
    this.metaPrefix = `queue:${queueName}:job:`;
    this.eventsChannel = `queue:${queueName}:events`;

    this._completeSha = null;
    this._failSha = null;
    this._reclaimSha = null;
    this._scriptsLoaded = false;

    this._enqueued = 0;
    this._completed = 0;
    this._failed = 0;
    this._reclaimed = 0;
  }

  _metaKey(jobId) {
    return `${this.metaPrefix}${jobId}`;
  }

  static _nowMs() {
    return Date.now();
  }

  async _ensureScriptsLoaded() {
    if (this._scriptsLoaded) {
      return;
    }
    try {
      this._completeSha = await this.redis.scriptLoad(COMPLETE_SCRIPT);
      this._failSha = await this.redis.scriptLoad(FAIL_SCRIPT);
      this._reclaimSha = await this.redis.scriptLoad(RECLAIM_SCRIPT);
      this._scriptsLoaded = true;
    } catch {
      // Fall back to EVAL on each call if we can't preload.
    }
  }

  async _evalScript(script, sha, options) {
    if (sha) {
      try {
        return await this.redis.evalSha(sha, options);
      } catch (err) {
        if (!(err && err.message && err.message.includes("NOSCRIPT"))) {
          throw err;
        }
        this._scriptsLoaded = false;
      }
    }
    return this.redis.eval(script, options);
  }

  /**
   * Push a new job onto the pending list and return its ID.
   * @param {object} payload
   * @returns {Promise<string>}
   */
  async enqueue(payload) {
    await this._ensureScriptsLoaded();
    const jobId = crypto.randomBytes(8).toString("hex");
    const nowMs = RedisJobQueue._nowMs();
    const meta = {
      id: jobId,
      payload: JSON.stringify(payload),
      status: "pending",
      attempts: "0",
      enqueued_at_ms: String(nowMs),
      claim_token: "",
    };
    const multi = this.redis.multi();
    multi.hSet(this._metaKey(jobId), meta);
    multi.lPush(this.pendingKey, jobId);
    await multi.exec();
    this._enqueued += 1;
    return jobId;
  }

  /**
   * Block until a job is available, then atomically claim it.
   *
   * Uses BLMOVE (the replacement for the deprecated BRPOPLPUSH) to wait
   * for a pending job and move it to the processing list in a single
   * Redis call. Returns null if nothing arrives before timeoutMs.
   *
   * @param {number} timeoutMs
   * @returns {Promise<ClaimedJob | null>}
   */
  async claim(timeoutMs = 1000) {
    await this._ensureScriptsLoaded();
    const timeoutS = Math.max(timeoutMs / 1000, 0.1);
    // BLMOVE pending processing RIGHT LEFT timeoutS — atomic right-pop
    // from pending followed by left-push onto processing, matching what
    // BRPOPLPUSH did in earlier Redis versions.
    const jobId = await this.redis.blMove(
      this.pendingKey,
      this.processingKey,
      "RIGHT",
      "LEFT",
      timeoutS,
    );
    if (jobId === null || jobId === undefined) {
      return null;
    }

    const token = crypto.randomBytes(8).toString("hex");
    const nowMs = RedisJobQueue._nowMs();
    const metaKey = this._metaKey(jobId);
    const multi = this.redis.multi();
    multi.hSet(metaKey, {
      status: "processing",
      claimed_at_ms: String(nowMs),
      claim_token: token,
    });
    multi.hIncrBy(metaKey, "attempts", 1);
    multi.hGetAll(metaKey);
    const results = await multi.exec();
    const meta = results[2] || {};

    let payload = {};
    try {
      payload = JSON.parse(meta.payload || "{}");
    } catch {
      payload = {};
    }
    const attempts = Number.parseInt(meta.attempts || "1", 10);
    return new ClaimedJob(jobId, payload, attempts, token);
  }

  /**
   * Mark a job complete and remove it from the processing list.
   *
   * Only succeeds if the worker still owns the claim — a job that was
   * reclaimed by the visibility-timeout sweep can no longer be
   * completed by the original claimant.
   *
   * @param {ClaimedJob} job
   * @param {object} result
   * @returns {Promise<boolean>}
   */
  async complete(job, result) {
    await this._ensureScriptsLoaded();
    const ok = await this._evalScript(COMPLETE_SCRIPT, this._completeSha, {
      keys: [this.metaPrefix, this.processingKey, this.completedKey],
      arguments: [
        job.id,
        job.claimToken,
        "completed",
        String(RedisJobQueue._nowMs()),
        JSON.stringify(result),
        String(this.completedTtl),
        String(this.completedHistory),
      ],
    });
    if (!ok || Number(ok) === 0) {
      return false;
    }
    await this.redis.publish(
      this.eventsChannel,
      JSON.stringify({ id: job.id, status: "completed" }),
    );
    this._completed += 1;
    return true;
  }

  /**
   * Record a failure. Retries up to maxAttempts, then gives up.
   *
   * If the job still has attempts left, it goes back on the pending
   * list. If it has exhausted its retries, it moves to the failed
   * list and the metadata hash records the final error.
   *
   * @param {ClaimedJob} job
   * @param {string} error
   * @returns {Promise<boolean>}
   */
  async fail(job, error) {
    await this._ensureScriptsLoaded();
    const retry = job.attempts < this.maxAttempts;
    const result = await this._evalScript(FAIL_SCRIPT, this._failSha, {
      keys: [
        this.metaPrefix,
        this.processingKey,
        this.pendingKey,
        this.failedKey,
      ],
      arguments: [
        job.id,
        job.claimToken,
        error,
        String(RedisJobQueue._nowMs()),
        String(this.completedTtl),
        String(this.completedHistory),
        retry ? "1" : "0",
      ],
    });
    if (!result || Number(result) === 0) {
      return false;
    }
    await this.redis.publish(
      this.eventsChannel,
      JSON.stringify({ id: job.id, status: retry ? "retry" : "failed" }),
    );
    if (!retry) {
      this._failed += 1;
    }
    return true;
  }

  /**
   * Move processing-list jobs past the visibility timeout back to pending.
   * @returns {Promise<string[]>}
   */
  async reclaimStuck() {
    await this._ensureScriptsLoaded();
    const reclaimed = await this._evalScript(RECLAIM_SCRIPT, this._reclaimSha, {
      keys: [this.pendingKey, this.processingKey, this.metaPrefix],
      arguments: [String(RedisJobQueue._nowMs()), String(this.visibilityMs)],
    });
    const list = Array.isArray(reclaimed) ? reclaimed : [];
    if (list.length > 0) {
      this._reclaimed += list.length;
    }
    return list;
  }

  /**
   * Return the current metadata hash for jobId, decoded.
   * @param {string} jobId
   * @returns {Promise<object | null>}
   */
  async getJob(jobId) {
    const meta = await this.redis.hGetAll(this._metaKey(jobId));
    if (!meta || Object.keys(meta).length === 0) {
      return null;
    }
    try {
      meta.payload = JSON.parse(meta.payload || "{}");
    } catch {
      meta.payload = {};
    }
    if ("result" in meta) {
      try {
        meta.result = JSON.parse(meta.result);
      } catch {
        // leave as-is
      }
    }
    return meta;
  }

  async listPending() {
    const ids = await this.redis.lRange(this.pendingKey, 0, -1);
    // BRPOPLPUSH/BLMOVE RIGHT->LEFT pops from the right of the pending
    // list, so the oldest job is at the right. Reverse so callers see
    // oldest-first.
    return [...ids].reverse();
  }

  async listProcessing() {
    return this.redis.lRange(this.processingKey, 0, -1);
  }

  async listCompleted() {
    return this.redis.lRange(this.completedKey, 0, -1);
  }

  async listFailed() {
    return this.redis.lRange(this.failedKey, 0, -1);
  }

  /**
   * Return counters plus the current queue depth.
   * @returns {Promise<object>}
   */
  async stats() {
    const multi = this.redis.multi();
    multi.lLen(this.pendingKey);
    multi.lLen(this.processingKey);
    multi.lLen(this.completedKey);
    multi.lLen(this.failedKey);
    const [pending, processing, completed, failed] = await multi.exec();
    return {
      enqueued_total: this._enqueued,
      completed_total: this._completed,
      failed_total: this._failed,
      reclaimed_total: this._reclaimed,
      pending_depth: Number(pending) || 0,
      processing_depth: Number(processing) || 0,
      completed_depth: Number(completed) || 0,
      failed_depth: Number(failed) || 0,
      visibility_ms: this.visibilityMs,
    };
  }

  resetStats() {
    this._enqueued = 0;
    this._completed = 0;
    this._failed = 0;
    this._reclaimed = 0;
  }

  /**
   * Delete every queue list and every job metadata hash via SCAN.
   * Only deletes keys under this queue's namespace.
   */
  async purge() {
    await this.redis.del([
      this.pendingKey,
      this.processingKey,
      this.completedKey,
      this.failedKey,
    ]);
    const pattern = `${this.metaPrefix}*`;
    for await (const key of this.redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      // scanIterator may yield string keys or arrays depending on client
      // version; normalise to an array for del().
      if (Array.isArray(key)) {
        if (key.length > 0) {
          await this.redis.del(key);
        }
      } else {
        await this.redis.del(key);
      }
    }
    this.resetStats();
  }
}

module.exports = {
  RedisJobQueue,
  ClaimedJob,
  COMPLETE_SCRIPT,
  FAIL_SCRIPT,
  RECLAIM_SCRIPT,
};
