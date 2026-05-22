/**
 * Mock background worker for the job-queue demo.
 *
 * A worker pulls jobs off the queue, simulates work by sleeping for a
 * configurable latency, and either completes the job, fails it, or
 * intentionally hangs to simulate a worker crash that the reclaimer must
 * recover from. This is the demo-side stand-in for whatever real work
 * your application would run in the background.
 *
 * @module worker
 */

"use strict";

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * A single background worker that drains a Redis job queue.
 */
class Worker {
  constructor({
    name,
    queue,
    workLatencyMs = 400,
    failRate = 0.0,
    hangRate = 0.0,
  }) {
    this.name = name;
    this.queue = queue;
    this.workLatencyMs = workLatencyMs;
    this.failRate = failRate;
    this.hangRate = hangRate;
    this._stop = false;
    this._loopPromise = null;
    this._processed = 0;
  }

  start() {
    if (this._loopPromise && !this._stop) {
      return;
    }
    this._stop = false;
    this._loopPromise = this._run().catch((err) => {
      // Worker loop errors should never crash the demo; just log.
      // eslint-disable-next-line no-console
      console.error(`[${this.name}] worker loop error:`, err);
    });
  }

  stop() {
    this._stop = true;
  }

  isAlive() {
    return this._loopPromise !== null && !this._stop;
  }

  processed() {
    return this._processed;
  }

  resetProcessed() {
    this._processed = 0;
  }

  async _run() {
    while (!this._stop) {
      let job;
      try {
        job = await this.queue.claim(500);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[${this.name}] claim error:`, err);
        await sleep(100);
        continue;
      }
      if (job === null || job === undefined) {
        continue;
      }
      await this._process(job);
    }
    this._loopPromise = null;
  }

  async _process(job) {
    // Decide outcome up front so the latency reflects "work was tried".
    const outcome = this._pickOutcome();
    await sleep(this.workLatencyMs);

    if (outcome === "hang") {
      // Simulate a worker that crashed mid-job: don't complete, don't
      // fail. The reclaimer will move this job back to pending once the
      // visibility timeout elapses.
      return;
    }

    if (outcome === "fail") {
      try {
        await this.queue.fail(job, `${this.name} simulated failure`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[${this.name}] fail error:`, err);
      }
      return;
    }

    this._processed += 1;
    try {
      await this.queue.complete(job, {
        worker: this.name,
        echo: job.payload,
        attempts: job.attempts,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[${this.name}] complete error:`, err);
    }
  }

  _pickOutcome() {
    const roll = Math.random();
    if (roll < this.hangRate) {
      return "hang";
    }
    if (roll < this.hangRate + this.failRate) {
      return "fail";
    }
    return "ok";
  }
}

/**
 * A pool of named Worker instances that can be started and stopped.
 */
class WorkerPool {
  constructor({
    queue,
    size = 2,
    workLatencyMs = 400,
    failRate = 0.0,
    hangRate = 0.0,
  }) {
    this.queue = queue;
    this.workLatencyMs = workLatencyMs;
    this.failRate = failRate;
    this.hangRate = hangRate;
    this._workers = [];
    this.resize(size);
  }

  resize(size) {
    while (this._workers.length < size) {
      const worker = new Worker({
        name: `worker-${this._workers.length + 1}`,
        queue: this.queue,
        workLatencyMs: this.workLatencyMs,
        failRate: this.failRate,
        hangRate: this.hangRate,
      });
      this._workers.push(worker);
    }
    while (this._workers.length > size) {
      const worker = this._workers.pop();
      worker.stop();
    }
  }

  start() {
    for (const worker of this._workers) {
      worker.workLatencyMs = this.workLatencyMs;
      worker.failRate = this.failRate;
      worker.hangRate = this.hangRate;
      worker.start();
    }
  }

  stop() {
    for (const worker of this._workers) {
      worker.stop();
    }
  }

  running() {
    return this._workers.filter((w) => w.isAlive()).length;
  }

  totalProcessed() {
    return this._workers.reduce((sum, w) => sum + w.processed(), 0);
  }

  resetProcessed() {
    for (const worker of this._workers) {
      worker.resetProcessed();
    }
  }

  configure({ workLatencyMs, failRate, hangRate } = {}) {
    if (workLatencyMs !== undefined && workLatencyMs !== null) {
      this.workLatencyMs = Math.max(0, Number.parseInt(workLatencyMs, 10) || 0);
    }
    if (failRate !== undefined && failRate !== null) {
      const value = Number.parseFloat(failRate);
      this.failRate = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
    }
    if (hangRate !== undefined && hangRate !== null) {
      const value = Number.parseFloat(hangRate);
      this.hangRate = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
    }
    for (const worker of this._workers) {
      worker.workLatencyMs = this.workLatencyMs;
      worker.failRate = this.failRate;
      worker.hangRate = this.hangRate;
    }
  }
}

module.exports = { Worker, WorkerPool };
