"use strict";

/**
 * Background consumer "thread" for a single consumer in a consumer group.
 *
 * Node.js is single-threaded for JavaScript execution, so a worker is
 * really an async loop on the event loop. Each worker uses its own
 * duplicated Redis client because `XREADGROUP BLOCK` parks the
 * connection until either an entry arrives or the timeout expires —
 * other handlers would otherwise have to wait behind it.
 *
 * The loop is `XREADGROUP >` → process → `XACK`. Recovery of stuck
 * PEL entries (this consumer's, after a restart, or another
 * consumer's, after a crash) runs through `reapIdlePel()`, which is
 * the textbook Streams pattern: each consumer periodically calls
 * `XAUTOCLAIM` with itself as the target, then processes whatever
 * it claimed. The demo's "XAUTOCLAIM to selected" button is exactly
 * that call.
 *
 * Two demo-only levers are wired into the loop:
 *
 * - `pause()` parks the worker (so its pending entries age into the
 *   XAUTOCLAIM window without being consumed by `>` reads).
 * - `crashNext(n)` tells the worker to drop its next `n` deliveries
 *   on the floor without acking them — the same effect as a worker
 *   process dying mid-message. Those entries stay in the group's PEL
 *   until `reapIdlePel` recovers them.
 *
 * Real consumers do not need either lever; they only need
 * `XREADGROUP` → process → `XACK` in `_run` and a periodic
 * `reapIdlePel` call to recover stuck entries.
 */

const { EventStream } = require("./eventStream");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ConsumerWorker {
  /**
   * @param {object} options
   * @param {EventStream} options.stream
   *        Shared `EventStream` for `XACK`, `XAUTOCLAIM`, stats, etc.
   *        All workers in the same demo should pass the same instance
   *        so the produced/acked/claimed counters aggregate.
   * @param {EventStream} [options.blockingStream]
   *        Optional separate `EventStream` whose Redis client is used
   *        for `XREADGROUP BLOCK`. node-redis serialises commands per
   *        connection, so a blocking read parks the client until the
   *        BLOCK timeout elapses or an entry arrives — sharing one
   *        client across workers (or with the HTTP handlers) would
   *        serialise all reads through that socket. Defaults to
   *        `stream` if not supplied.
   * @param {string} options.group
   * @param {string} options.name
   * @param {number} [options.processLatencyMs=25]
   * @param {number} [options.recentCapacity=20]
   */
  constructor({
    stream,
    blockingStream,
    group,
    name,
    processLatencyMs = 25,
    recentCapacity = 20,
  }) {
    if (!stream || !group || !name) {
      throw new Error("stream, group and name are required.");
    }
    this.stream = stream;
    this.blockingStream = blockingStream || stream;
    this.group = group;
    this.name = name;
    this.processLatencyMs = processLatencyMs;
    this._recentCapacity = recentCapacity;

    /** @type {Array<object>} */
    this._recent = [];
    this._processed = 0;
    this._reaped = 0;
    this._crashedDrops = 0;

    this._paused = false;
    this._crashNext = 0;
    this._stopped = true;
    /** @type {Promise<void> | null} */
    this._runPromise = null;
  }

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------

  start() {
    if (this._runPromise && !this._stopped) return;
    this._stopped = false;
    this._runPromise = this._run().catch((err) => {
      console.error(
        `[${this.group}/${this.name}] worker loop exited with error: ${
          (err && err.message) || err
        }`,
      );
    });
  }

  async stop(joinTimeoutMs = 2000) {
    this._stopped = true;
    if (!this._runPromise) return;
    const timeout = new Promise((resolve) =>
      setTimeout(() => resolve("timeout"), joinTimeoutMs),
    );
    const result = await Promise.race([
      this._runPromise.then(() => "ok"),
      timeout,
    ]);
    if (result === "ok") {
      this._runPromise = null;
    }
  }

  // ------------------------------------------------------------------
  // Demo levers
  // ------------------------------------------------------------------

  pause() {
    this._paused = true;
  }

  resume() {
    this._paused = false;
  }

  /**
   * Drop the next `count` deliveries without acking them.
   *
   * The entries stay in the group's PEL with their delivery counter
   * incremented, so `XAUTOCLAIM` can recover them once they exceed
   * the idle threshold.
   *
   * @param {number} count
   */
  crashNext(count) {
    const n = Math.max(0, Number.parseInt(count, 10) || 0);
    this._crashNext += n;
  }

  // ------------------------------------------------------------------
  // Introspection
  // ------------------------------------------------------------------

  recent() {
    return this._recent.slice();
  }

  status() {
    return {
      name: this.name,
      group: this.group,
      processed: this._processed,
      reaped: this._reaped,
      crashed_drops: this._crashedDrops,
      paused: this._paused,
      crash_queued: this._crashNext,
      alive: this._runPromise !== null && !this._stopped,
    };
  }

  // ------------------------------------------------------------------
  // Recovery
  // ------------------------------------------------------------------

  /**
   * Run `XAUTOCLAIM` into self and process the claimed entries.
   *
   * Returns a summary `{claimed, deletedIds, processed}`. Safe to call
   * from any handler — the heavy lifting is `stream.autoclaim` (a
   * Redis call) and the sequential per-entry dispatch via
   * `_handleEntry`.
   *
   * `deletedIds` are PEL entries whose stream payload was already
   * trimmed by `MAXLEN ~` / `XTRIM` before the sweep ran. Redis 7+
   * removes them from the PEL inside `XAUTOCLAIM` itself, so the
   * caller does not have to `XACK` them; they are reported so the
   * caller can route them to a dead-letter store.
   */
  async reapIdlePel() {
    const { claimed, deletedIds } = await this.stream.autoclaim(
      this.group,
      this.name,
      { pageCount: 100, maxPages: 10 },
    );
    let processed = 0;
    for (const [entryId, fields] of claimed) {
      try {
        if (this.processLatencyMs) {
          await sleep(this.processLatencyMs);
        }
        await this._handleEntry(entryId, fields);
        processed += 1;
      } catch (err) {
        console.error(
          `[${this.group}/${this.name}] reap failed on ${entryId}: ${
            (err && err.message) || err
          }`,
        );
      }
    }
    this._reaped += processed;
    return { claimed: claimed.length, deletedIds, processed };
  }

  // ------------------------------------------------------------------
  // Main loop
  // ------------------------------------------------------------------

  async _run() {
    while (!this._stopped) {
      if (this._paused) {
        await sleep(50);
        continue;
      }

      let entries;
      try {
        // Use the dedicated blocking client so the shared client stays
        // free for HTTP-handler commands.
        entries = await this.blockingStream.consume(
          this.group,
          this.name,
          10,
          500,
        );
      } catch (err) {
        // Don't kill the loop on a transient Redis error; a real
        // consumer would log this and back off.
        console.error(
          `[${this.group}/${this.name}] read failed: ${
            (err && err.message) || err
          }`,
        );
        await sleep(500);
        continue;
      }

      for (const [entryId, fields] of entries) {
        if (this._stopped) break;
        await this._dispatch(entryId, fields);
      }
    }
    this._runPromise = null;
  }

  /**
   * Wrap per-entry processing so a single failure (typically `XACK`
   * against Redis) doesn't kill the loop — that would silently halt
   * this consumer while every other entry sat in its PEL waiting for
   * XAUTOCLAIM. The entry stays unacked; the next `reapIdlePel` call
   * (here or on any consumer in the group) can recover it once it
   * exceeds the idle threshold.
   */
  async _dispatch(entryId, fields) {
    if (this.processLatencyMs) {
      await sleep(this.processLatencyMs);
    }
    try {
      await this._handleEntry(entryId, fields);
    } catch (err) {
      console.error(
        `[${this.group}/${this.name}] failed to handle ${entryId}: ${
          (err && err.message) || err
        }`,
      );
      this._pushRecent({
        id: entryId,
        type: (fields && fields.type) || "",
        fields,
        acked: false,
        note: `handler error: ${(err && err.message) || err}`,
      });
    }
  }

  async _handleEntry(entryId, fields) {
    // Capture-and-decrement is safe without a lock because Node.js
    // runs JS on a single thread — no other handler can interleave
    // between the read and the write.
    const drop = this._crashNext > 0;
    if (drop) {
      this._crashNext -= 1;
      this._crashedDrops += 1;
      this._pushRecent({
        id: entryId,
        type: (fields && fields.type) || "",
        fields,
        acked: false,
        note: "dropped (simulated crash)",
      });
      return;
    }

    await this.stream.ack(this.group, [entryId]);
    this._processed += 1;
    this._pushRecent({
      id: entryId,
      type: (fields && fields.type) || "",
      fields,
      acked: true,
      note: "",
    });
  }

  _pushRecent(entry) {
    this._recent.unshift(entry);
    if (this._recent.length > this._recentCapacity) {
      this._recent.length = this._recentCapacity;
    }
  }
}

module.exports = { ConsumerWorker };
