"use strict";

/**
 * Redis event-stream helper backed by a single Redis Stream.
 *
 * Producers append events with `XADD`. Consumers belong to consumer
 * groups and read with `XREADGROUP`. The group as a whole tracks a
 * single `last-delivered-id` cursor, and each consumer gets its own
 * pending-entries list (PEL) of in-flight messages it has been handed.
 * Once a consumer has processed an entry it acknowledges it with
 * `XACK`; entries left unacknowledged past an idle threshold can be
 * swept to a healthy consumer with `XAUTOCLAIM` (or to a specific one
 * with `XCLAIM`).
 *
 * Each `XADD` carries an approximate `MAXLEN` so the stream stays
 * bounded as it rolls forward. `XRANGE` supports replay over the
 * retained history for debugging, audit, or rebuilding a downstream
 * projection. Note that approximate trimming can release entries that
 * are still in a group's PEL: those entries appear in `XAUTOCLAIM`'s
 * deletedMessages list, which the caller should log and route to a
 * dead-letter store. Redis 7+ removes them from the PEL inside the
 * `XAUTOCLAIM` call itself, so no explicit `XACK` is needed.
 *
 * The same stream can be read by any number of consumer groups — each
 * group has its own cursor and its own pending lists, so analytics,
 * notifications, and audit can all process the full event flow at
 * their own pace without coordinating with each other.
 */

/**
 * @typedef {[string, Record<string, string>]} Entry
 */

/**
 * Flatten the `XREADGROUP` reply (an array of `{name, messages}`) into
 * a flat list of `[id, fields]` tuples. node-redis 5.x returns each
 * message as `{id, message}` where `message` is already a plain
 * object map of field/value strings.
 *
 * @param {Array<{name: string, messages: Array<{id: string, message: Record<string,string>}>}> | null} raw
 * @returns {Entry[]}
 */
function flattenEntries(raw) {
  if (!raw) return [];
  const out = [];
  for (const stream of raw) {
    for (const entry of stream.messages || []) {
      out.push([entry.id, entry.message || {}]);
    }
  }
  return out;
}

/**
 * Coerce node-redis stream-message objects (`{id, message}`) into a
 * `[id, fields]` tuple. Used by every read path that returns an array
 * of stream messages (XAUTOCLAIM, XCLAIM, XRANGE).
 *
 * @param {{id: string, message: Record<string,string>} | null} entry
 * @returns {Entry | null}
 */
function toTuple(entry) {
  if (!entry || !entry.id) return null;
  return [entry.id, entry.message || {}];
}

class EventStream {
  /**
   * @param {object} options
   * @param {import("redis").RedisClientType} options.redisClient
   * @param {string} [options.streamKey="demo:events:orders"]
   * @param {number} [options.maxlenApprox=10000]
   * @param {number} [options.claimMinIdleMs=15000]
   */
  constructor({
    redisClient,
    streamKey = "demo:events:orders",
    maxlenApprox = 10_000,
    claimMinIdleMs = 15_000,
  } = {}) {
    if (!redisClient) {
      throw new Error("A connected redisClient is required.");
    }
    this.redis = redisClient;
    this.streamKey = streamKey;
    this.maxlenApprox = maxlenApprox;
    this.claimMinIdleMs = claimMinIdleMs;

    // Node.js is single-threaded for JS execution, so plain numbers
    // are safe for counters. No lock needed.
    this._producedTotal = 0;
    this._ackedTotal = 0;
    this._claimedTotal = 0;
  }

  // --------------------------------------------------------------------
  // Producer
  // --------------------------------------------------------------------

  /**
   * Append a single event. Returns the stream ID Redis assigned.
   * @param {string} eventType
   * @param {Record<string, unknown>} payload
   * @returns {Promise<string>}
   */
  async produce(eventType, payload) {
    const ids = await this.produceBatch([[eventType, payload]]);
    return ids[0];
  }

  /**
   * Pipeline several `XADD` calls in one round trip.
   *
   * Each entry carries an approximate `MAXLEN` cap. The `~` flavour
   * lets Redis trim at a macro-node boundary, which is much cheaper
   * than exact trimming and is the right call for a retention
   * guardrail rather than a hard size limit.
   *
   * @param {Array<[string, Record<string, unknown>]>} events
   * @returns {Promise<string[]>}
   */
  async produceBatch(events) {
    const list = Array.from(events);
    if (list.length === 0) return [];
    const pipe = this.redis.multi();
    for (const [eventType, payload] of list) {
      const fields = EventStream._encodeFields(eventType, payload);
      pipe.xAdd(this.streamKey, "*", fields, {
        TRIM: {
          strategy: "MAXLEN",
          strategyModifier: "~",
          threshold: this.maxlenApprox,
        },
      });
    }
    // execAsPipeline sends the commands in one round trip without
    // wrapping them in MULTI/EXEC.
    const ids = await pipe.execAsPipeline();
    this._producedTotal += ids.length;
    return ids.map((id) => String(id));
  }

  /**
   * Build the field/value map for an XADD. Every value is coerced
   * to a string so node-redis doesn't reject mixed-type input.
   *
   * @param {string} eventType
   * @param {Record<string, unknown>} payload
   * @returns {Record<string, string>}
   */
  static _encodeFields(eventType, payload) {
    const fields = {
      type: String(eventType),
      ts_ms: String(Date.now()),
    };
    if (payload) {
      for (const [key, value] of Object.entries(payload)) {
        fields[key] = value === null || value === undefined ? "" : String(value);
      }
    }
    return fields;
  }

  // --------------------------------------------------------------------
  // Consumer groups
  // --------------------------------------------------------------------

  /**
   * Create the consumer group if it doesn't exist.
   *
   * `$` means "deliver only events appended after this point"; pass
   * `0-0` to replay the entire stream into a fresh group.
   *
   * @param {string} group
   * @param {string} [startId="$"]
   */
  async ensureGroup(group, startId = "$") {
    try {
      await this.redis.xGroupCreate(this.streamKey, group, startId, {
        MKSTREAM: true,
      });
    } catch (err) {
      const msg = (err && err.message) || "";
      if (!msg.includes("BUSYGROUP")) {
        throw err;
      }
    }
  }

  /**
   * @param {string} group
   * @returns {Promise<number>}
   */
  async deleteGroup(group) {
    try {
      return Number(await this.redis.xGroupDestroy(this.streamKey, group));
    } catch {
      return 0;
    }
  }

  /**
   * Read new entries for this consumer via `XREADGROUP`.
   *
   * The `>` ID means "deliver entries this consumer group has not
   * delivered to anyone yet" — that is the at-least-once path.
   * Replaying an explicit ID instead would re-deliver an entry that
   * is already in this consumer's pending list (see `consumeOwnPel`
   * for that recovery path).
   *
   * @param {string} group
   * @param {string} consumer
   * @param {number} [count=10]
   * @param {number} [blockMs=500]
   * @returns {Promise<Entry[]>}
   */
  async consume(group, consumer, count = 10, blockMs = 500) {
    const raw = await this.redis.xReadGroup(
      group,
      consumer,
      [{ key: this.streamKey, id: ">" }],
      { COUNT: count, BLOCK: blockMs },
    );
    return flattenEntries(raw);
  }

  /**
   * Re-deliver entries already in this consumer's PEL.
   *
   * Reading with an explicit ID (`0` here) instead of `>` replays the
   * entries already assigned to this consumer name without advancing
   * the group's `last-delivered-id`. This is the canonical recovery
   * path after a restart on the same consumer name. Do NOT call this
   * from the main read loop — every call resets the per-entry idle
   * counter, which would keep crashed entries below the XAUTOCLAIM
   * threshold forever.
   *
   * @param {string} group
   * @param {string} consumer
   * @param {number} [count=10]
   * @returns {Promise<Entry[]>}
   */
  async consumeOwnPel(group, consumer, count = 10) {
    const raw = await this.redis.xReadGroup(
      group,
      consumer,
      [{ key: this.streamKey, id: "0" }],
      { COUNT: count },
    );
    return flattenEntries(raw);
  }

  /**
   * @param {string} group
   * @param {Iterable<string>} ids
   * @returns {Promise<number>}
   */
  async ack(group, ids) {
    const idList = Array.from(ids);
    if (idList.length === 0) return 0;
    const n = Number(await this.redis.xAck(this.streamKey, group, idList));
    this._ackedTotal += n;
    return n;
  }

  /**
   * Sweep idle pending entries to `consumer`.
   *
   * A single `XAUTOCLAIM` call scans up to `pageCount` PEL entries
   * starting at `startId` and returns a continuation cursor. For a
   * full sweep of the PEL, loop until the cursor returns to `0-0` (or
   * hit `maxPages` as a safety net so a very large PEL can't
   * monopolise the call).
   *
   * Returns `{claimed, deletedIds}`. `deletedIds` are PEL entries
   * whose stream payload had already been trimmed by the time this
   * sweep ran (typically because `MAXLEN ~` retention outran a slow
   * consumer). `XAUTOCLAIM` removes those dangling slots from the PEL
   * itself — the caller does **not** need to `XACK` them — but they
   * cannot be retried, so log and route them to a dead-letter store
   * for observability.
   *
   * @param {string} group
   * @param {string} consumer
   * @param {object} [options]
   * @param {number} [options.pageCount=100]
   * @param {string} [options.startId="0-0"]
   * @param {number} [options.maxPages=10]
   * @returns {Promise<{claimed: Entry[], deletedIds: string[]}>}
   */
  async autoclaim(group, consumer, options = {}) {
    const { pageCount = 100, startId = "0-0", maxPages = 10 } = options;
    const claimedAll = [];
    const deletedAll = [];
    let cursor = startId;
    for (let i = 0; i < maxPages; i += 1) {
      const reply = await this.redis.xAutoClaim(
        this.streamKey,
        group,
        consumer,
        this.claimMinIdleMs,
        cursor,
        { COUNT: pageCount },
      );
      for (const entry of reply.messages || []) {
        const tuple = toTuple(entry);
        if (tuple) claimedAll.push(tuple);
      }
      for (const id of reply.deletedMessages || []) {
        deletedAll.push(String(id));
      }
      const nextId = String(reply.nextId || "0-0");
      if (nextId === "0-0") break;
      cursor = nextId;
    }
    this._claimedTotal += claimedAll.length;
    return { claimed: claimedAll, deletedIds: deletedAll };
  }

  /**
   * Drop a consumer from a group.
   *
   * `XGROUP DELCONSUMER` destroys this consumer's PEL entries — any
   * entry it still owned is no longer tracked anywhere in the group,
   * and `XAUTOCLAIM` will never find it again. Always `handoverPending`
   * (or `XCLAIM` manually) to a healthy consumer first; this method is
   * the raw destructive call and is exposed only for explicit cleanup.
   *
   * @param {string} group
   * @param {string} consumer
   * @returns {Promise<number>}
   */
  async deleteConsumer(group, consumer) {
    try {
      return Number(
        await this.redis.xGroupDelConsumer(this.streamKey, group, consumer),
      );
    } catch {
      return 0;
    }
  }

  /**
   * Move every PEL entry owned by `fromConsumer` to `toConsumer`.
   *
   * Enumerates the source consumer's PEL with `XPENDING ... CONSUMER`
   * and reassigns each ID with `XCLAIM` at zero idle time so the move
   * is unconditional. (`XAUTOCLAIM` does not filter by source consumer,
   * so it cannot be used for a per-consumer handover.)
   *
   * Call this before `deleteConsumer` whenever the source still has
   * pending entries — otherwise `XGROUP DELCONSUMER` would silently
   * destroy them and they could never be recovered.
   *
   * @param {string} group
   * @param {string} fromConsumer
   * @param {string} toConsumer
   * @param {number} [batch=100]
   * @returns {Promise<number>}
   */
  async handoverPending(group, fromConsumer, toConsumer, batch = 100) {
    let totalClaimed = 0;
    while (true) {
      // Errors from XPENDING / XCLAIM propagate up. Swallowing them
      // and returning a partial count would let the caller think the
      // handover succeeded; the caller's next step is XGROUP
      // DELCONSUMER, which would destroy whatever entries were left
      // in the source's PEL.
      const rows = await this.redis.xPendingRange(
        this.streamKey,
        group,
        "-",
        "+",
        batch,
        { consumer: fromConsumer },
      );
      if (!rows || rows.length === 0) break;
      const ids = rows.map((row) => String(row.id));
      const claimed = await this.redis.xClaim(
        this.streamKey,
        group,
        toConsumer,
        0,
        ids,
      );
      totalClaimed += Array.isArray(claimed) ? claimed.length : 0;
      if (rows.length < batch) break;
    }
    this._claimedTotal += totalClaimed;
    return totalClaimed;
  }

  // --------------------------------------------------------------------
  // Replay, length, trim
  // --------------------------------------------------------------------

  /**
   * Range read with `XRANGE` for replay or audit.
   *
   * Read-only: ranges do not update any group cursor and do not ack
   * anything. Useful for bootstrapping a new projection, for building
   * an audit view, or for debugging what actually went through the
   * stream.
   *
   * @param {string} [startId="-"]
   * @param {string} [endId="+"]
   * @param {number} [count=100]
   * @returns {Promise<Entry[]>}
   */
  async replay(startId = "-", endId = "+", count = 100) {
    const raw = await this.redis.xRange(this.streamKey, startId, endId, {
      COUNT: count,
    });
    const out = [];
    for (const entry of raw || []) {
      const tuple = toTuple(entry);
      if (tuple) out.push(tuple);
    }
    return out;
  }

  /** @returns {Promise<number>} */
  async length() {
    return Number(await this.redis.xLen(this.streamKey));
  }

  /**
   * @param {number} maxlen
   * @returns {Promise<number>}
   */
  async trimMaxlen(maxlen) {
    return Number(
      await this.redis.xTrim(this.streamKey, "MAXLEN", maxlen, {
        strategyModifier: "~",
      }),
    );
  }

  /**
   * @param {string} minid
   * @returns {Promise<number>}
   */
  async trimMinid(minid) {
    return Number(
      await this.redis.xTrim(this.streamKey, "MINID", minid, {
        strategyModifier: "~",
      }),
    );
  }

  // --------------------------------------------------------------------
  // Inspection
  // --------------------------------------------------------------------

  /** Subset of XINFO STREAM that's safe to JSON-encode. */
  async infoStream() {
    let raw;
    try {
      raw = await this.redis.xInfoStream(this.streamKey);
    } catch {
      return {
        length: 0,
        last_generated_id: null,
        first_entry_id: null,
        last_entry_id: null,
      };
    }
    const first = raw["first-entry"];
    const last = raw["last-entry"];
    return {
      length: Number(raw.length || 0),
      last_generated_id: raw["last-generated-id"]
        ? String(raw["last-generated-id"])
        : null,
      first_entry_id: first && first.id ? String(first.id) : null,
      last_entry_id: last && last.id ? String(last.id) : null,
    };
  }

  async infoGroups() {
    let rows;
    try {
      rows = await this.redis.xInfoGroups(this.streamKey);
    } catch {
      return [];
    }
    return (rows || []).map((row) => ({
      name: String(row.name),
      consumers: Number(row.consumers || 0),
      pending: Number(row.pending || 0),
      last_delivered_id: row["last-delivered-id"]
        ? String(row["last-delivered-id"])
        : null,
      lag: row.lag === null || row.lag === undefined ? null : Number(row.lag),
    }));
  }

  /**
   * @param {string} group
   */
  async infoConsumers(group) {
    let rows;
    try {
      rows = await this.redis.xInfoConsumers(this.streamKey, group);
    } catch {
      return [];
    }
    return (rows || []).map((row) => ({
      name: String(row.name),
      pending: Number(row.pending || 0),
      idle_ms: Number(row.idle || 0),
    }));
  }

  /**
   * Per-entry PEL view (id, consumer, idleMs, deliveries).
   *
   * @param {string} group
   * @param {number} [count=20]
   */
  async pendingDetail(group, count = 20) {
    let rows;
    try {
      rows = await this.redis.xPendingRange(
        this.streamKey,
        group,
        "-",
        "+",
        count,
      );
    } catch {
      return [];
    }
    return (rows || []).map((row) => ({
      id: String(row.id),
      consumer: String(row.consumer),
      idleMs: Number(row.millisecondsSinceLastDelivery || 0),
      deliveries: Number(row.deliveriesCounter || 0),
    }));
  }

  stats() {
    return {
      produced_total: this._producedTotal,
      acked_total: this._ackedTotal,
      claimed_total: this._claimedTotal,
    };
  }

  resetStats() {
    this._producedTotal = 0;
    this._ackedTotal = 0;
    this._claimedTotal = 0;
  }

  // --------------------------------------------------------------------
  // Demo housekeeping
  // --------------------------------------------------------------------

  /** Drop the stream key entirely. Used by the demo's reset path. */
  async deleteStream() {
    await this.redis.del(this.streamKey);
  }
}

module.exports = { EventStream };
