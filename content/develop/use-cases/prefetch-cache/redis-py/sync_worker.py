"""
Background sync worker for the prefetch-cache demo.

A daemon thread drains the primary's change queue and applies each event
to Redis through ``PrefetchCache.apply_change``. In a real system, the
queue is replaced by a CDC pipeline (Redis Data Integration, Debezium,
or an equivalent) that tails the primary's binlog/WAL and writes the
same shape of events.

The worker exposes ``pause()`` and ``resume()`` so maintenance paths
(``/reprefetch``, ``clear()``) can stop event application without
tearing the thread down. ``pause()`` blocks until the worker is parked,
so the caller knows no apply is in flight by the time it returns.
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
        self._pause_event = Event()
        self._paused_idle_event = Event()
        self._thread: Optional[Thread] = None

    def start(self) -> None:
        if self._thread is not None and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._pause_event.clear()
        self._paused_idle_event.clear()
        self._thread = Thread(
            target=self._run,
            name="prefetch-cache-sync",
            daemon=True,
        )
        self._thread.start()

    def stop(self, join_timeout_s: float = 2.0) -> None:
        """Signal the worker to exit and join its thread.

        If the join times out the worker is wedged inside ``apply_change``;
        we leave ``self._thread`` populated so a subsequent ``start()`` does
        not spawn a second worker on top of the orphan.
        """
        self._stop_event.set()
        if self._thread is None:
            return
        self._thread.join(timeout=join_timeout_s)
        if not self._thread.is_alive():
            self._thread = None

    def pause(self, timeout_s: float = 2.0) -> bool:
        """Stop applying events and block until the worker is parked.

        Returns ``True`` once the worker has confirmed it is idle, or
        ``False`` if the timeout elapsed first. While paused, change
        events accumulate in the primary's queue and are applied in order
        after ``resume()``.
        """
        self._paused_idle_event.clear()
        self._pause_event.set()
        if self._thread is None or not self._thread.is_alive():
            return True
        return self._paused_idle_event.wait(timeout=timeout_s)

    def resume(self) -> None:
        self._pause_event.clear()
        self._paused_idle_event.clear()

    def _run(self) -> None:
        while not self._stop_event.is_set():
            if self._pause_event.is_set():
                self._paused_idle_event.set()
                # Park until the pause is lifted or the worker is stopped.
                while self._pause_event.is_set() and not self._stop_event.is_set():
                    self._stop_event.wait(timeout=self.poll_timeout_s)
                self._paused_idle_event.clear()
                continue

            change = self.primary.next_change(timeout=self.poll_timeout_s)
            if change is None:
                continue
            try:
                self.cache.apply_change(change)
            except Exception as exc:
                # Demo behaviour: log and drop the event. A production
                # CDC consumer would retry with bounded backoff and
                # expose a dead-letter / error counter; see the guide's
                # "Production usage" section.
                print(f"[sync] failed to apply {change!r}: {exc}")
