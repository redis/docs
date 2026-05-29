"""
Streaming feature updater for the demo.

Stands in for whatever Flink, Kafka Streams, or bespoke service computes
the real-time features in a real deployment. In production this code
lives in the streaming layer; here it runs as a daemon thread next to
the demo server so the page can start, pause, and resume it from the UI.

Every tick it picks a few random users and writes a new value for each
streaming feature, with a per-field ``HEXPIRE`` so the field self-expires
if the worker is paused. Pause the worker for longer than
``streaming_ttl_seconds`` and the streaming fields drop out of the hash
while the batch fields remain populated under the longer key-level TTL —
the *mixed staleness* story made visible.
"""

from __future__ import annotations

import random
import threading
import time
from typing import Optional

from feature_store import RedisFeatureStore


DEVICE_IDS = (
    "ios-1a4c", "ios-9f02", "and-7b21", "and-2d18",
    "web-chr-1", "web-saf-1", "web-ff-2",
)
SESSION_COUNTRIES = ("US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL")


class StreamingWorker:
    """Background thread that updates streaming features on a tick."""

    def __init__(
        self,
        store: RedisFeatureStore,
        tick_seconds: float = 1.0,
        users_per_tick: int = 5,
        seed: int = 1337,
    ) -> None:
        self.store = store
        self.tick_seconds = tick_seconds
        self.users_per_tick = users_per_tick
        self._rng = random.Random(seed)

        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._paused = threading.Event()

        self._lock = threading.Lock()
        self._tick_count = 0
        self._writes_count = 0

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self) -> None:
        if self._thread is not None and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._paused.clear()
        self._thread = threading.Thread(
            target=self._run, name="streaming-worker", daemon=True,
        )
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        thread = self._thread
        if thread is not None:
            thread.join(timeout=2.0)
        self._thread = None

    def pause(self) -> None:
        self._paused.set()

    def resume(self) -> None:
        self._paused.clear()

    @property
    def is_paused(self) -> bool:
        return self._paused.is_set()

    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    # ------------------------------------------------------------------
    # Tick
    # ------------------------------------------------------------------

    def _run(self) -> None:
        while not self._stop_event.is_set():
            if self._paused.is_set():
                time.sleep(0.05)
                continue
            try:
                self._tick()
            except Exception as exc:
                print(f"[streaming-worker] tick failed: {exc}")
            self._stop_event.wait(timeout=self.tick_seconds)

    def _tick(self) -> None:
        ids = self.store.list_entity_ids(limit=500)
        if not ids:
            return
        chosen = self._rng.sample(ids, k=min(self.users_per_tick, len(ids)))
        now_ms = int(time.time() * 1000)
        writes = 0
        for entity_id in chosen:
            fields = {
                "last_login_ts": now_ms,
                "last_device_id": self._rng.choice(DEVICE_IDS),
                "tx_count_5m": self._rng.randint(0, 12),
                "failed_logins_15m": self._rng.choices(
                    (0, 1, 2, 5), weights=(70, 20, 8, 2), k=1,
                )[0],
                "session_country": self._rng.choice(SESSION_COUNTRIES),
            }
            self.store.update_streaming(entity_id, fields)
            writes += len(fields)
        with self._lock:
            self._tick_count += 1
            self._writes_count += writes

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    def stats(self) -> dict:
        with self._lock:
            return {
                "running": self.is_running,
                "paused": self.is_paused,
                "tick_count": self._tick_count,
                "writes_count": self._writes_count,
            }

    def reset_stats(self) -> None:
        with self._lock:
            self._tick_count = 0
            self._writes_count = 0
