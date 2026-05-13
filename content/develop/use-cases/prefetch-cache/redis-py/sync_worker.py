"""
Background sync worker for the prefetch-cache demo.

A daemon thread drains the primary's change queue and applies each event
to Redis through ``PrefetchCache.apply_change``. In a real system, the
queue is replaced by a CDC pipeline (Redis Data Integration, Debezium,
or an equivalent) that tails the primary's binlog/WAL and writes the
same shape of events.
"""

from __future__ import annotations

from threading import Event, Thread
from typing import Optional

from cache import PrefetchCache
from primary import MockPrimaryStore


class SyncWorker:
    """Drain primary change events into Redis on a daemon thread."""

    def __init__(
        self,
        primary: MockPrimaryStore,
        cache: PrefetchCache,
        poll_timeout_s: float = 0.05,
    ) -> None:
        self.primary = primary
        self.cache = cache
        self.poll_timeout_s = poll_timeout_s
        self._stop_event = Event()
        self._thread: Optional[Thread] = None

    def start(self) -> None:
        if self._thread is not None and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = Thread(
            target=self._run,
            name="prefetch-cache-sync",
            daemon=True,
        )
        self._thread.start()

    def stop(self, join_timeout_s: float = 1.0) -> None:
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=join_timeout_s)
            self._thread = None

    def _run(self) -> None:
        while not self._stop_event.is_set():
            change = self.primary.next_change(timeout=self.poll_timeout_s)
            if change is None:
                continue
            try:
                self.cache.apply_change(change)
            except Exception as exc:
                print(f"[sync] failed to apply {change!r}: {exc}")
