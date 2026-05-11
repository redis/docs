"""
Mock background worker for the job-queue demo.

A worker pulls jobs off the queue, simulates work by sleeping for a
configurable latency, and either completes the job, fails it, or
intentionally hangs to simulate a worker crash that the reclaimer must
recover from. This is the demo-side stand-in for whatever real work your
application would run in the background (sending emails, transcoding
video, calling third-party webhooks, etc.).
"""

from __future__ import annotations

import threading
import time
from typing import Optional

from job_queue import ClaimedJob, RedisJobQueue


class Worker:
    """A single background worker thread that drains a Redis job queue."""

    def __init__(
        self,
        name: str,
        queue: RedisJobQueue,
        work_latency_ms: int = 400,
        fail_rate: float = 0.0,
        hang_rate: float = 0.0,
    ) -> None:
        self.name = name
        self.queue = queue
        self.work_latency_ms = work_latency_ms
        self.fail_rate = fail_rate
        self.hang_rate = hang_rate
        self._stop = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._processed = 0
        self._lock = threading.Lock()

    def start(self) -> None:
        # If a previous run was asked to stop, wait for it to finish before
        # starting a new thread — otherwise we'd return early because the
        # old thread is still draining a blocking claim() call.
        if self._thread is not None and self._thread.is_alive():
            if not self._stop.is_set():
                return
            self._thread.join(timeout=2.0)
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, name=self.name, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def is_alive(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def processed(self) -> int:
        with self._lock:
            return self._processed

    def _run(self) -> None:
        while not self._stop.is_set():
            job = self.queue.claim(timeout_ms=500)
            if job is None:
                continue
            self._process(job)

    def _process(self, job: ClaimedJob) -> None:
        # Decide outcome up front so the latency reflects "work was tried".
        outcome = self._pick_outcome()
        time.sleep(self.work_latency_ms / 1000.0)

        if outcome == "hang":
            # Simulate a worker that crashed mid-job: don't complete, don't
            # fail. The reclaimer will move this job back to pending once
            # the visibility timeout elapses.
            return

        if outcome == "fail":
            self.queue.fail(job, error=f"{self.name} simulated failure")
            return

        with self._lock:
            self._processed += 1
        self.queue.complete(
            job,
            result={
                "worker": self.name,
                "echo": job.payload,
                "attempts": job.attempts,
            },
        )

    def _pick_outcome(self) -> str:
        # secrets-style randomness isn't needed for demo outcomes.
        import random

        roll = random.random()
        if roll < self.hang_rate:
            return "hang"
        if roll < self.hang_rate + self.fail_rate:
            return "fail"
        return "ok"


class WorkerPool:
    """A pool of named ``Worker`` threads that can be started and stopped."""

    def __init__(
        self,
        queue: RedisJobQueue,
        size: int = 2,
        work_latency_ms: int = 400,
        fail_rate: float = 0.0,
        hang_rate: float = 0.0,
    ) -> None:
        self.queue = queue
        self.work_latency_ms = work_latency_ms
        self.fail_rate = fail_rate
        self.hang_rate = hang_rate
        self._workers: list[Worker] = []
        self._lock = threading.Lock()
        self.resize(size)

    def resize(self, size: int) -> None:
        with self._lock:
            while len(self._workers) < size:
                worker = Worker(
                    name=f"worker-{len(self._workers) + 1}",
                    queue=self.queue,
                    work_latency_ms=self.work_latency_ms,
                    fail_rate=self.fail_rate,
                    hang_rate=self.hang_rate,
                )
                self._workers.append(worker)
            while len(self._workers) > size:
                worker = self._workers.pop()
                worker.stop()

    def start(self) -> None:
        with self._lock:
            for worker in self._workers:
                worker.work_latency_ms = self.work_latency_ms
                worker.fail_rate = self.fail_rate
                worker.hang_rate = self.hang_rate
                worker.start()

    def stop(self) -> None:
        with self._lock:
            for worker in self._workers:
                worker.stop()

    def running(self) -> int:
        with self._lock:
            return sum(1 for w in self._workers if w.is_alive())

    def total_processed(self) -> int:
        with self._lock:
            return sum(w.processed() for w in self._workers)

    def configure(
        self,
        work_latency_ms: Optional[int] = None,
        fail_rate: Optional[float] = None,
        hang_rate: Optional[float] = None,
    ) -> None:
        with self._lock:
            if work_latency_ms is not None:
                self.work_latency_ms = max(0, int(work_latency_ms))
            if fail_rate is not None:
                self.fail_rate = max(0.0, min(1.0, float(fail_rate)))
            if hang_rate is not None:
                self.hang_rate = max(0.0, min(1.0, float(hang_rate)))
            for worker in self._workers:
                worker.work_latency_ms = self.work_latency_ms
                worker.fail_rate = self.fail_rate
                worker.hang_rate = self.hang_rate
