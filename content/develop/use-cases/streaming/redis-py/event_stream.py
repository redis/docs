"""
Redis event-stream helper backed by a single Redis Stream.

Producers append events with ``XADD``. Consumers belong to consumer
groups and read with ``XREADGROUP``, which gives each consumer a
private cursor and a pending-entries list (PEL) of in-flight messages.
Once a consumer has processed an entry it acknowledges it with
``XACK``; entries left unacknowledged past an idle threshold can be
swept to a healthy consumer with ``XAUTOCLAIM`` (or to a specific one
with ``XCLAIM``).

Each ``XADD`` carries an approximate ``MAXLEN`` so the stream stays
bounded as it rolls forward. ``XRANGE`` supports replay from any point
in history for debugging, audit, or rebuilding a downstream projection.

The same stream can be read by any number of consumer groups — each
group has its own cursor and its own pending list, so analytics,
notifications, and audit can all process the full event flow at their
own pace without coordinating with each other.
"""

from __future__ import annotations

import time
from threading import Lock
from typing import Iterable, Optional

import redis


Entry = tuple[str, dict[str, str]]


class RedisEventStream:
    """Producer/consumer helper for a single Redis Stream with consumer groups."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        stream_key: str = "demo:events:orders",
        maxlen_approx: int = 10_000,
        claim_min_idle_ms: int = 15_000,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost",
            port=6379,
            decode_responses=True,
        )
        self.stream_key = stream_key
        self.maxlen_approx = maxlen_approx
        self.claim_min_idle_ms = claim_min_idle_ms

        self._stats_lock = Lock()
        self._produced_total = 0
        self._acked_total = 0
        self._claimed_total = 0

    # ------------------------------------------------------------------
    # Producer
    # ------------------------------------------------------------------

    def produce(self, event_type: str, payload: dict) -> str:
        """Append a single event. Returns the stream ID Redis assigned."""
        return self.produce_batch([(event_type, payload)])[0]

    def produce_batch(self, events: Iterable[tuple[str, dict]]) -> list[str]:
        """Pipeline several ``XADD`` calls in one round trip.

        Each entry carries an approximate ``MAXLEN`` cap. The ``~``
        flavour lets Redis trim at a macro-node boundary, which is
        much cheaper than exact trimming and is the right call for a
        retention guardrail rather than a hard size limit.
        """
        pipe = self.redis.pipeline(transaction=False)
        for event_type, payload in events:
            fields = self._encode_fields(event_type, payload)
            pipe.xadd(
                self.stream_key,
                fields,
                maxlen=self.maxlen_approx,
                approximate=True,
            )
        ids = pipe.execute()
        with self._stats_lock:
            self._produced_total += len(ids)
        return list(ids)

    @staticmethod
    def _encode_fields(event_type: str, payload: dict) -> dict[str, str]:
        fields: dict[str, str] = {
            "type": event_type,
            "ts_ms": str(int(time.time() * 1000)),
        }
        for key, value in payload.items():
            fields[key] = "" if value is None else str(value)
        return fields

    # ------------------------------------------------------------------
    # Consumer groups
    # ------------------------------------------------------------------

    def ensure_group(self, group: str, start_id: str = "$") -> None:
        """Create the consumer group if it doesn't exist.

        ``$`` means "deliver only events appended after this point";
        pass ``0-0`` to replay the entire stream into a fresh group.
        """
        try:
            self.redis.xgroup_create(
                self.stream_key, group, id=start_id, mkstream=True,
            )
        except redis.ResponseError as exc:
            if "BUSYGROUP" not in str(exc):
                raise

    def delete_group(self, group: str) -> int:
        return int(self.redis.xgroup_destroy(self.stream_key, group))

    def consume(
        self,
        group: str,
        consumer: str,
        count: int = 10,
        block_ms: int = 500,
    ) -> list[Entry]:
        """Read new entries for this consumer via ``XREADGROUP``.

        The ``>`` ID means "deliver entries this consumer group has not
        delivered to *anyone* yet" — that is the at-least-once path.
        Replaying an explicit ID instead would re-deliver an entry that
        is already in this consumer's pending list (used to recover
        after a crash on the same consumer name).
        """
        result = self.redis.xreadgroup(
            group,
            consumer,
            {self.stream_key: ">"},
            count=count,
            block=block_ms,
        )
        return _flatten_entries(result)

    def ack(self, group: str, ids: Iterable[str]) -> int:
        ids = list(ids)
        if not ids:
            return 0
        n = int(self.redis.xack(self.stream_key, group, *ids))
        with self._stats_lock:
            self._acked_total += n
        return n

    def autoclaim(
        self,
        group: str,
        consumer: str,
        count: int = 100,
        start_id: str = "0-0",
    ) -> list[Entry]:
        """Sweep idle pending entries to ``consumer``.

        ``XAUTOCLAIM`` walks the group's PEL from ``start_id`` and
        reassigns every entry that has been idle for at least
        ``claim_min_idle_ms`` to the named consumer. The reassigned
        entry's delivery counter is incremented so a poison-pill
        message can be detected after a few claim cycles.
        """
        _next_id, claimed, _deleted = self.redis.xautoclaim(
            self.stream_key,
            group,
            consumer,
            min_idle_time=self.claim_min_idle_ms,
            start_id=start_id,
            count=count,
        )
        with self._stats_lock:
            self._claimed_total += len(claimed)
        return list(claimed)

    def delete_consumer(self, group: str, consumer: str) -> int:
        """Remove a consumer from a group. Its pending entries are released."""
        try:
            return int(self.redis.xgroup_delconsumer(
                self.stream_key, group, consumer,
            ))
        except redis.ResponseError:
            return 0

    # ------------------------------------------------------------------
    # Replay, length, trim
    # ------------------------------------------------------------------

    def replay(
        self,
        start_id: str = "-",
        end_id: str = "+",
        count: int = 100,
    ) -> list[Entry]:
        """Range read with ``XRANGE`` for replay or audit.

        Read-only: ranges do not update any group cursor and do not
        ack anything. Useful for bootstrapping a new projection, for
        building an audit view, or for debugging what actually went
        through the stream.
        """
        return list(self.redis.xrange(
            self.stream_key, min=start_id, max=end_id, count=count,
        ))

    def length(self) -> int:
        return int(self.redis.xlen(self.stream_key))

    def trim_maxlen(self, maxlen: int) -> int:
        return int(self.redis.xtrim(
            self.stream_key, maxlen=maxlen, approximate=True,
        ))

    def trim_minid(self, minid: str) -> int:
        return int(self.redis.xtrim(
            self.stream_key, minid=minid, approximate=True,
        ))

    # ------------------------------------------------------------------
    # Inspection
    # ------------------------------------------------------------------

    def info_stream(self) -> dict:
        """Subset of ``XINFO STREAM`` that's safe to JSON-encode."""
        try:
            raw = self.redis.xinfo_stream(self.stream_key)
        except redis.ResponseError:
            return {"length": 0, "last_generated_id": None,
                    "first_entry_id": None, "last_entry_id": None}
        first = raw.get("first-entry")
        last = raw.get("last-entry")
        return {
            "length": int(raw.get("length", 0)),
            "last_generated_id": raw.get("last-generated-id"),
            "first_entry_id": first[0] if first else None,
            "last_entry_id": last[0] if last else None,
        }

    def info_groups(self) -> list[dict]:
        try:
            rows = self.redis.xinfo_groups(self.stream_key)
        except redis.ResponseError:
            return []
        return [
            {
                "name": row["name"],
                "consumers": int(row.get("consumers", 0)),
                "pending": int(row.get("pending", 0)),
                "last_delivered_id": row.get("last-delivered-id"),
                "lag": int(row["lag"]) if row.get("lag") is not None else None,
            }
            for row in rows
        ]

    def info_consumers(self, group: str) -> list[dict]:
        try:
            rows = self.redis.xinfo_consumers(self.stream_key, group)
        except redis.ResponseError:
            return []
        return [
            {
                "name": row["name"],
                "pending": int(row.get("pending", 0)),
                "idle_ms": int(row.get("idle", 0)),
            }
            for row in rows
        ]

    def pending_detail(self, group: str, count: int = 20) -> list[dict]:
        """Per-entry PEL view (id, consumer, idle, deliveries)."""
        try:
            rows = self.redis.xpending_range(
                self.stream_key, group, min="-", max="+", count=count,
            )
        except redis.ResponseError:
            return []
        return [
            {
                "id": row["message_id"],
                "consumer": row["consumer"],
                "idle_ms": int(row["time_since_delivered"]),
                "deliveries": int(row["times_delivered"]),
            }
            for row in rows
        ]

    def stats(self) -> dict[str, int]:
        with self._stats_lock:
            return {
                "produced_total": self._produced_total,
                "acked_total": self._acked_total,
                "claimed_total": self._claimed_total,
            }

    def reset_stats(self) -> None:
        with self._stats_lock:
            self._produced_total = 0
            self._acked_total = 0
            self._claimed_total = 0

    # ------------------------------------------------------------------
    # Demo housekeeping
    # ------------------------------------------------------------------

    def delete_stream(self) -> None:
        """Drop the stream key entirely. Used by the demo's reset path."""
        self.redis.delete(self.stream_key)


def _flatten_entries(raw) -> list[Entry]:
    """Flatten ``XREADGROUP`` output into a list of ``(id, fields)``."""
    if not raw:
        return []
    out: list[Entry] = []
    for _stream, entries in raw:
        for entry_id, fields in entries:
            out.append((entry_id, fields))
    return out
