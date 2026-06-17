"use strict";

/**
 * Streaming feature updater for the demo.
 *
 * Stands in for whatever Flink, Kafka Streams, or bespoke service
 * computes the real-time features in a real deployment. In production
 * this code lives in the streaming layer; here it runs as an async
 * timer next to the demo server so the page can start, pause, and
 * resume it from the UI.
 *
 * Every tick it picks a few random users and writes a new value for
 * each streaming feature, with a per-field `HEXPIRE` so the field
 * self-expires if the worker is paused. Pause the worker for longer
 * than `streamingTtlSeconds` and the streaming fields drop out of the
 * hash while the batch fields remain populated under the longer
 * key-level TTL — the *mixed staleness* story made visible.
 */

const DEVICE_IDS = [
  "ios-1a4c", "ios-9f02", "and-7b21", "and-2d18",
  "web-chr-1", "web-saf-1", "web-ff-2",
];
const SESSION_COUNTRIES = [
  "US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL",
];
const FAILED_LOGIN_BUCKETS = [0, 1, 2, 5];
const FAILED_LOGIN_WEIGHTS = [70, 20, 8, 2];

function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  return {
    next() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x1_0000_0000;
    },
    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    choice(items) {
      return items[this.int(0, items.length - 1)];
    },
    weightedChoice(items, weights) {
      const total = weights.reduce((a, b) => a + b, 0);
      let r = this.next() * total;
      for (let i = 0; i < items.length; i += 1) {
        r -= weights[i];
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    },
    sample(items, k) {
      const pool = [...items];
      const out = [];
      const n = Math.min(k, pool.length);
      for (let i = 0; i < n; i += 1) {
        const idx = this.int(0, pool.length - 1);
        out.push(pool.splice(idx, 1)[0]);
      }
      return out;
    },
  };
}

class StreamingWorker {
  /**
   * @param {object} options
   * @param {import("./featureStore").FeatureStore} options.store
   * @param {number} [options.tickSeconds=1.0]
   * @param {number} [options.usersPerTick=5]
   * @param {number} [options.seed=1337]
   */
  constructor({ store, tickSeconds = 1.0, usersPerTick = 5, seed = 1337 } = {}) {
    if (!store) throw new Error("store is required");
    this.store = store;
    this.tickSeconds = tickSeconds;
    this.usersPerTick = usersPerTick;
    this.rng = makeRng(seed);

    this.running = false;
    this.paused = false;
    this.tickCount = 0;
    this.writesCount = 0;
    this._timer = null;
    this._tickInFlight = false;
  }

  // --- Lifecycle -----------------------------------------------------

  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this._schedule();
  }

  async stop() {
    this.running = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    // Wait for any in-flight tick to settle so we don't leak a write
    // that completes after the caller has moved on.
    await this.waitForIdle();
  }

  /**
   * Wait until any in-flight tick has finished its current `await`
   * sequence. `pause()` only stops *future* ticks from running — it
   * does not interrupt one that is already mid-flight. Callers that
   * need a quiesced worker (a reset that's about to DEL every entity,
   * for example) must pause AND await this before they touch state
   * the tick might still be writing to.
   *
   * @returns {Promise<void>}
   */
  async waitForIdle() {
    while (this._tickInFlight) await new Promise((r) => setTimeout(r, 20));
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }

  // --- Tick ----------------------------------------------------------

  _schedule() {
    if (!this.running) return;
    this._timer = setTimeout(
      () => this._run().catch((err) =>
        console.error("[streaming-worker] tick failed:", err),
      ),
      this.tickSeconds * 1000,
    );
  }

  async _run() {
    if (!this.running) return;
    if (this.paused) {
      this._schedule();
      return;
    }
    this._tickInFlight = true;
    try {
      await this._tick();
    } finally {
      this._tickInFlight = false;
      this._schedule();
    }
  }

  async _tick() {
    const ids = await this.store.listEntityIds(500);
    if (ids.length === 0) return;
    const chosen = this.rng.sample(ids, this.usersPerTick);
    const nowMs = Date.now();
    let writes = 0;
    for (const entityId of chosen) {
      const fields = {
        last_login_ts: nowMs,
        last_device_id: this.rng.choice(DEVICE_IDS),
        tx_count_5m: this.rng.int(0, 12),
        failed_logins_15m: this.rng.weightedChoice(
          FAILED_LOGIN_BUCKETS, FAILED_LOGIN_WEIGHTS,
        ),
        session_country: this.rng.choice(SESSION_COUNTRIES),
      };
      await this.store.updateStreaming(entityId, fields);
      writes += Object.keys(fields).length;
    }
    this.tickCount += 1;
    this.writesCount += writes;
  }

  // --- Stats ---------------------------------------------------------

  statsSnapshot() {
    return {
      running: this.running,
      paused: this.paused,
      tick_count: this.tickCount,
      writes_count: this.writesCount,
    };
  }

  resetStats() {
    this.tickCount = 0;
    this.writesCount = 0;
  }
}

module.exports = { StreamingWorker };
