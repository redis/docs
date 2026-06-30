"use strict";

/**
 * Background sync worker for the prefetch-cache demo.
 *
 * An async task drains the primary's change queue and applies each event
 * to Redis through `PrefetchCache.applyChange`. In a real system, the
 * queue is replaced by a CDC pipeline (Redis Data Integration, Debezium,
 * or an equivalent) that tails the primary's binlog/WAL and writes the
 * same shape of events.
 *
 * The worker exposes `pause()` and `resume()` so maintenance paths
 * (`/reprefetch`, `clear()`) can stop event application without tearing
 * the task down. `pause()` blocks until the worker is parked, so the
 * caller knows no apply is in flight by the time it returns.
 */

class SyncWorker {
  constructor({ primary, cache, pollTimeoutMs = 50 } = {}) {
    if (!primary || !cache) {
      throw new Error("primary and cache are required.");
    }
    this.primary = primary;
    this.cache = cache;
    this.pollTimeoutMs = pollTimeoutMs;

    this._stopped = true;
    this._paused = false;
    this._runPromise = null;

    // Promise that resolves when the worker has confirmed it is parked
    // (idle, with no apply in flight). pause() awaits this.
    this._pausedIdlePromise = null;
    this._pausedIdleResolve = null;

    // Promise that resolves when the worker should leave its parked
    // state — either resume() is called or the worker is stopped.
    this._resumePromise = null;
    this._resumeResolve = null;
  }

  start() {
    if (this._runPromise && !this._stopped) {
      return;
    }
    this._stopped = false;
    this._paused = false;
    this._resetIdleSignal();
    this._resetResumeSignal();
    this._runPromise = this._run();
  }

  /**
   * Signal the worker to exit and await its task.
   *
   * If the join times out the worker is wedged inside applyChange; we
   * leave `_runPromise` populated so a subsequent `start()` does not
   * spawn a second worker on top of the orphan.
   */
  async stop(joinTimeoutMs = 2000) {
    this._stopped = true;
    // Wake any parked waiter so the worker can observe the stop flag.
    if (this._resumeResolve) {
      this._resumeResolve();
    }
    if (!this._runPromise) {
      return;
    }
    const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), joinTimeoutMs));
    const result = await Promise.race([this._runPromise.then(() => "ok"), timeout]);
    if (result === "ok") {
      this._runPromise = null;
    }
  }

  /**
   * Stop applying events and wait until the worker is parked.
   *
   * Returns `true` once the worker has confirmed it is idle, or `false`
   * if the timeout elapsed first. While paused, change events accumulate
   * in the primary's queue and are applied in order after `resume()`.
   */
  async pause(timeoutMs = 2000) {
    this._resetIdleSignal();
    this._paused = true;
    if (!this._runPromise || this._stopped) {
      return true;
    }
    const timeout = new Promise((resolve) => setTimeout(() => resolve(false), timeoutMs));
    const idle = this._pausedIdlePromise.then(() => true);
    return Promise.race([idle, timeout]);
  }

  resume() {
    this._paused = false;
    // Wake the parked worker.
    if (this._resumeResolve) {
      this._resumeResolve();
    }
    this._resetResumeSignal();
    this._resetIdleSignal();
  }

  _resetIdleSignal() {
    this._pausedIdlePromise = new Promise((resolve) => {
      this._pausedIdleResolve = resolve;
    });
  }

  _resetResumeSignal() {
    this._resumePromise = new Promise((resolve) => {
      this._resumeResolve = resolve;
    });
  }

  async _run() {
    while (!this._stopped) {
      if (this._paused) {
        // Park until resume() or stop() is called.
        // Resolve `_pausedIdleResolve` on every iteration (after each
        // resume/pause cycle that's re-armed by `_resetIdleSignal`) so a
        // *new* pause() that arrives while we are still parked from the
        // previous cycle gets acknowledged immediately, not after the
        // caller's full pause-timeout.
        while (this._paused && !this._stopped) {
          if (this._pausedIdleResolve) {
            this._pausedIdleResolve();
          }
          await this._resumePromise;
        }
        // Loop will re-check flags at the top.
        continue;
      }

      const change = await this.primary.nextChange(this.pollTimeoutMs);
      if (change === null || change === undefined) {
        continue;
      }
      try {
        await this.cache.applyChange(change);
      } catch (err) {
        // Demo behaviour: log and drop the event. A production CDC
        // consumer would retry with bounded backoff and expose a
        // dead-letter / error counter; see the guide's "Production
        // usage" section.
        console.error(`[sync] failed to apply ${JSON.stringify(change)}: ${err && err.message}`);
      }
    }
  }
}

module.exports = { SyncWorker };
