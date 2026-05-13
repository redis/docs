"""
Mock primary data store for the prefetch-cache demo.

This stands in for a source-of-truth database (Postgres, MySQL, Mongo,
etc.) that holds reference data the application serves to users.

Every mutation appends a change event to an in-process queue, which the
sync worker drains and applies to Redis. In a real system the queue is
replaced by a CDC pipeline — Redis Data Integration, Debezium plus a
lightweight consumer, or an equivalent tool that tails the source's
binlog/WAL and pushes changes into Redis.

The store also exposes ``read_latency_ms`` so the demo can illustrate
how much slower a direct primary read would be than a Redis hit.
"""

from __future__ import annotations

from queue import Empty, Queue
from threading import Lock
import time
from typing import Iterable, Optional


CHANGE_OP_UPSERT = "upsert"
CHANGE_OP_DELETE = "delete"


class MockPrimaryStore:
    """In-memory stand-in for a primary database of reference data."""

    def __init__(self, read_latency_ms: int = 80) -> None:
        self.read_latency_ms = read_latency_ms
        self._lock = Lock()
        self._reads = 0
        self._changes: Queue[dict] = Queue()
        self._records: dict[str, dict[str, str]] = {
            "cat-001": {
                "id": "cat-001",
                "name": "Beverages",
                "display_order": "1",
                "featured": "true",
                "parent_id": "",
            },
            "cat-002": {
                "id": "cat-002",
                "name": "Bakery",
                "display_order": "2",
                "featured": "true",
                "parent_id": "",
            },
            "cat-003": {
                "id": "cat-003",
                "name": "Pantry Staples",
                "display_order": "3",
                "featured": "false",
                "parent_id": "",
            },
            "cat-004": {
                "id": "cat-004",
                "name": "Frozen",
                "display_order": "4",
                "featured": "false",
                "parent_id": "",
            },
            "cat-005": {
                "id": "cat-005",
                "name": "Specialty Cheeses",
                "display_order": "5",
                "featured": "false",
                "parent_id": "cat-002",
            },
        }

    def list_ids(self) -> list[str]:
        with self._lock:
            return sorted(self._records.keys())

    def list_records(self) -> list[dict[str, str]]:
        """Return every record. Used by the cache's bulk-load path on startup."""
        time.sleep(self.read_latency_ms / 1000.0)
        with self._lock:
            self._reads += 1
            return [dict(record) for record in self._records.values()]

    def read(self, entity_id: str) -> Optional[dict[str, str]]:
        """Single-record read. Not on the demo's normal read path."""
        time.sleep(self.read_latency_ms / 1000.0)
        with self._lock:
            self._reads += 1
            record = self._records.get(entity_id)
            return dict(record) if record else None

    def add_record(self, record: dict[str, str]) -> bool:
        entity_id = record.get("id", "").strip()
        if not entity_id:
            return False
        with self._lock:
            if entity_id in self._records:
                return False
            self._records[entity_id] = dict(record)
        self._emit_change(CHANGE_OP_UPSERT, entity_id, dict(record))
        return True

    def update_field(self, entity_id: str, field: str, value: str) -> bool:
        with self._lock:
            record = self._records.get(entity_id)
            if record is None:
                return False
            record[field] = value
            snapshot = dict(record)
        self._emit_change(CHANGE_OP_UPSERT, entity_id, snapshot)
        return True

    def delete_record(self, entity_id: str) -> bool:
        with self._lock:
            if entity_id not in self._records:
                return False
            del self._records[entity_id]
        self._emit_change(CHANGE_OP_DELETE, entity_id, None)
        return True

    def next_change(self, timeout: float) -> Optional[dict]:
        """Block up to ``timeout`` seconds for the next change event."""
        try:
            return self._changes.get(timeout=timeout)
        except Empty:
            return None

    def reads(self) -> int:
        with self._lock:
            return self._reads

    def reset_reads(self) -> None:
        with self._lock:
            self._reads = 0

    def _emit_change(
        self,
        op: str,
        entity_id: str,
        fields: Optional[dict[str, str]],
    ) -> None:
        self._changes.put(
            {
                "op": op,
                "id": entity_id,
                "fields": fields,
                "timestamp_ms": time.time() * 1000.0,
            }
        )
