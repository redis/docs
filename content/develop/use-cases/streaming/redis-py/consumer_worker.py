"""
Background consumer thread for a single consumer in a consumer group.

Each worker owns a daemon thread that loops on ``XREADGROUP >`` with a
short block timeout and acks every entry it processes. Recovery of
stuck PEL entries (this consumer's, or anyone else's) happens through
``reap_idle_pel()``, which is the textbook Streams pattern: each
consumer periodically (or on demand) calls ``XAUTOCLAIM`` with itself
as the target, then processes whatever it claimed. The demo's
"XAUTOCLAIM to selected" button is exactly that call.

Two demo-only levers are wired into the loop:

* ``pause()`` parks the worker (so its pending entries age into the
  ``XAUTOCLAIM`` window without being consumed by ``>`` reads).
* ``crash_next(n)`` tells the worker to drop its next ``n`` deliveries
  on the floor without acking them — the same effect as a worker
  process dying mid-message. Those entries stay in the group's PEL
  until ``reap_idle_pel`` recovers them.

Real consumers do not need either lever; they only need
``XREADGROUP`` → process → ``XACK`` in ``_run`` and a periodic
``reap_idle_pel`` call to recover stuck entries.
"""

from __future__ import annotations

import threading
import time
from collections import deque
from typing import Optional

from event_stream import RedisEventStream


class ConsumerWorker:
    """One consumer in a consumer group, running in its own thread."""

    def __init__(
        self,
        stream: RedisEventStream,
        group: str,
        name: str,
        process_latency_ms: int = 25,
        recent_capacity: int = 20,
    ) -> None:
        self.stream = stream
        self.group = group
        self.name = name
        self.process_latency_ms = process_latency_ms

        self._recent: deque[dict] = deque(maxlen=recent_capacity)
        self._lock = threading.Lock()
        self._processed = 0
        self._reaped = 0
        self._crashed_drops = 0

        self._paused = threading.Event()
        self._crash_next = 0
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._run,
            name=f"consumer-{self.group}-{self.name}",
            daemon=True,
        )
        self._thread.start()

    def stop(self, timeout: float = 1.0) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=timeout)

    # ------------------------------------------------------------------
    # Demo levers
    # ------------------------------------------------------------------

    def pause(self) -> None:
        self._paused.set()

    def resume(self) -> None:
        self._paused.clear()

    def crash_next(self, count: int) -> None:
        """Drop the next ``count`` deliveries without acking them.

        The entries stay in the group's PEL with their delivery
        counter incremented, so ``XAUTOCLAIM`` can recover them once
        they exceed the idle threshold.
        """
        with self._lock:
            self._crash_next += max(0, int(count))

    # ------------------------------------------------------------------
    # Introspection
    # ------------------------------------------------------------------

    def recent(self) -> list[dict]:
        with self._lock:
            return list(self._recent)

    def status(self) -> dict:
        with self._lock:
            return {
                "name": self.name,
                "group": self.group,
                "processed": self._processed,
                "reaped": self._reaped,
                "crashed_drops": self._crashed_drops,
                "paused": self._paused.is_set(),
                "crash_queued": self._crash_next,
                "alive": bool(self._thread and self._thread.is_alive()),
            }

    # ------------------------------------------------------------------
    # Recovery
    # ------------------------------------------------------------------

    def reap_idle_pel(self) -> dict:
        """Run ``XAUTOCLAIM`` into self and process the claimed entries.

        Returns a summary dict with ``claimed``, ``deleted_ids``, and
        ``processed`` counts. Safe to call from any thread — the heavy
        lifting is ``stream.autoclaim`` (a Redis call) and the
        sequential per-entry dispatch via ``_dispatch``.

        ``deleted_ids`` are PEL entries whose stream payload was
        already trimmed by ``MAXLEN ~`` / ``XTRIM`` before the sweep
        ran. Redis 7+ removes them from the PEL inside ``XAUTOCLAIM``
        itself, so the caller does not have to ``XACK`` them; they are
        reported so the caller can route them to a dead-letter store.
        """
        claimed, deleted = self.stream.autoclaim(
            self.group, self.name, page_count=100, max_pages=10,
        )
        processed = 0
        for entry_id, fields in claimed:
            try:
                self._handle_entry(entry_id, fields)
                processed += 1
            except Exception as exc:
                print(
                    f"[{self.group}/{self.name}] reap failed on "
                    f"{entry_id}: {exc}"
                )
        with self._lock:
            self._reaped += processed
        return {
            "claimed": len(claimed),
            "deleted_ids": deleted,
            "processed": processed,
        }

    # ------------------------------------------------------------------
    # Main loop
    # ------------------------------------------------------------------

    def _run(self) -> None:
        while not self._stop_event.is_set():
            if self._paused.is_set():
                time.sleep(0.05)
                continue
            try:
                entries = self.stream.consume(
                    self.group, self.name, count=10, block_ms=500,
                )
            except Exception as exc:
                # Don't kill the thread on a transient Redis error; a
                # real consumer would log this and back off.
                print(f"[{self.group}/{self.name}] read failed: {exc}")
                time.sleep(0.5)
                continue

            for entry_id, fields in entries:
                self._dispatch(entry_id, fields)

    def _dispatch(self, entry_id: str, fields: dict[str, str]) -> None:
        if self.process_latency_ms:
            time.sleep(self.process_latency_ms / 1000.0)
        try:
            self._handle_entry(entry_id, fields)
        except Exception as exc:
            # A failure here (typically XACK against Redis) must not
            # kill the daemon thread — that would silently halt this
            # consumer while every other entry sat in its PEL waiting
            # for XAUTOCLAIM. The entry stays unacked; the next
            # ``reap_idle_pel`` call (here or on any consumer in the
            # group) can recover it once it exceeds the idle threshold.
            print(
                f"[{self.group}/{self.name}] failed to handle "
                f"{entry_id}: {exc}"
            )
            with self._lock:
                self._recent.appendleft({
                    "id": entry_id,
                    "type": fields.get("type", ""),
                    "fields": fields,
                    "acked": False,
                    "note": f"handler error: {exc}",
                })

    def _handle_entry(self, entry_id: str, fields: dict[str, str]) -> None:
        with self._lock:
            drop = self._crash_next > 0
            if drop:
                self._crash_next -= 1

        if drop:
            with self._lock:
                self._crashed_drops += 1
                self._recent.appendleft({
                    "id": entry_id,
                    "type": fields.get("type", ""),
                    "fields": fields,
                    "acked": False,
                    "note": "dropped (simulated crash)",
                })
            return

        self.stream.ack(self.group, [entry_id])
        with self._lock:
            self._processed += 1
            self._recent.appendleft({
                "id": entry_id,
                "type": fields.get("type", ""),
                "fields": fields,
                "acked": True,
                "note": "",
            })
