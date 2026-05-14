"""
Redis event-stream helper backed by a single Redis Stream.

Producers append events with ``XADD``. Consumers belong to consumer
groups and read with ``XREADGROUP``. The group as a whole tracks a
single ``last-delivered-id`` cursor, and each consumer gets its own
pending-entries list (PEL) of in-flight messages it has been handed.
Once a consumer has processed an entry it acknowledges it with
``XACK``; entries left unacknowledged past an idle threshold can be
swept to a healthy consumer with ``XAUTOCLAIM`` (or to a specific one
with ``XCLAIM``).

Each ``XADD`` carries an approximate ``MAXLEN`` so the stream stays
bounded as it rolls forward. ``XRANGE`` supports replay over the
retained history for debugging, audit, or rebuilding a downstream
projection. Note that approximate trimming can release entries that
are still in a group's PEL: those entries appear in ``XAUTOCLAIM``'s
deleted-IDs list, which the caller should log and route to a
dead-letter store. Redis 7+ removes them from the PEL inside the
``XAUTOCLAIM`` call itself, so no explicit ``XACK`` is needed.

The same stream can be read by any number of consumer groups — each
group has its own cursor and its own pending lists, so analytics,
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
        is already in this consumer's pending list (see
        ``consume_own_pel`` for that recovery path).
        """
        result = self.redis.xreadgroup(
            group,
            consumer,
            {self.stream_key: ">"},
            count=count,
            block=block_ms,
        )
        return _flatten_entries(result)

    def consume_own_pel(
        self,
        group: str,
        consumer: str,
        count: int = 10,
    ) -> list[Entry]:
        """Re-deliver entries already in this consumer's PEL.

        Reading with an explicit ID (``0`` here) instead of ``>``
        replays the entries already assigned to this consumer name
        without advancing the group's ``last-delivered-id``. This is
        the canonical recovery path after a crash on the same
        consumer name, and is also how a consumer picks up entries
        that another consumer (or ``XAUTOCLAIM``) handed to it.
        """
        result = self.redis.xreadgroup(
            group,
            consumer,
            {self.stream_key: "0"},
            count=count,
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
        page_count: int = 100,
        start_id: str = "0-0",
        max_pages: int = 10,
    ) -> tuple[list[Entry], list[str]]:
        """Sweep idle pending entries to ``consumer``.

        A single ``XAUTOCLAIM`` call scans up to ``page_count`` PEL
        entries starting at ``start_id`` and returns a continuation
        cursor. For a full sweep of the PEL, loop until the cursor
        returns to ``0-0`` (or hit ``max_pages`` as a safety net so a
        very large PEL can't monopolise the call).

        Returns ``(claimed, deleted_ids)``. ``deleted_ids`` are PEL
        entries whose stream payload had already been trimmed by the
        time this sweep ran (typically because ``MAXLEN ~`` retention
        outran a slow consumer). ``XAUTOCLAIM`` removes those dangling
        slots from the PEL itself — the caller does **not** need to
        ``XACK`` them — but they cannot be retried, so log and route
        them to a dead-letter store for observability.
        """
        claimed_all: list[Entry] = []
        deleted_all: list[str] = []
        cursor = start_id
        for _ in range(max_pages):
            next_id, claimed, deleted = self.redis.xautoclaim(
                self.stream_key,
                group,
                consumer,
                min_idle_time=self.claim_min_idle_ms,
                start_id=cursor,
                count=page_count,
            )
            claimed_all.extend(claimed)
            deleted_all.extend(deleted or [])
            if next_id == "0-0":
                break
            cursor = next_id
        with self._stats_lock:
            self._claimed_total += len(claimed_all)
        return claimed_all, deleted_all

    def delete_consumer(self, group: str, consumer: str) -> int:
        """Drop a consumer from a group.

        ``XGROUP DELCONSUMER`` destroys this consumer's PEL entries —
        any entry it still owned is no longer tracked anywhere in the
        group, and ``XAUTOCLAIM`` will never find it again. Always
        ``handover_pending`` (or ``XCLAIM`` it manually) to a healthy
        consumer first; this method is the raw destructive call and
        is exposed only for explicit cleanup.
        """
        try:
            return int(self.redis.xgroup_delconsumer(
                self.stream_key, group, consumer,
            ))
        except redis.ResponseError:
            return 0

    def handover_pending(
        self,
        group: str,
        from_consumer: str,
        to_consumer: str,
        batch: int = 100,
    ) -> list[Entry]:
        """Move every PEL entry owned by ``from_consumer`` to ``to_consumer``.

        Enumerates the source consumer's PEL with ``XPENDING ... CONSUMER``
        and reassigns each ID with ``XCLAIM`` at zero idle time so the
        move is unconditional. (``XAUTOCLAIM`` does not filter by source
        consumer, so it cannot be used for a per-consumer handover.)

        Call this before ``delete_consumer`` whenever the source still
        has pending entries — otherwise ``XGROUP DELCONSUMER`` would
        silently destroy them and they could never be recovered.
        """
        claimed_all: list[Entry] = []
        while True:
            rows = self.redis.xpending_range(
                self.stream_key, group, min="-", max="+",
                count=batch, consumername=from_consumer,
            )
            if not rows:
                break
            ids = [row["message_id"] for row in rows]
            claimed = self.redis.xclaim(
                self.stream_key, group, to_consumer,
                min_idle_time=0, message_ids=ids,
            )
            claimed_all.extend(claimed)
            if len(rows) < batch:
                break
        with self._stats_lock:
            self._claimed_total += len(claimed_all)
        return claimed_all

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
