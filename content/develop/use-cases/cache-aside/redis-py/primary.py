"""
Mock primary data store for the cache-aside demo.

This stands in for a slow disk-backed database. Each read sleeps for
``read_latency_ms`` to make the difference between a cache hit and a cache
miss visible in the demo UI. The store keeps an in-process count of how
many primary reads have occurred so the demo can show the cache absorbing
load.
"""

from __future__ import annotations

from threading import Lock
import time
from typing import Optional


class MockPrimaryStore:
    """In-memory stand-in for a slow primary database."""

    def __init__(self, read_latency_ms: int = 150) -> None:
        self.read_latency_ms = read_latency_ms
        self._lock = Lock()
        self._reads = 0
        self._records: dict[str, dict[str, str]] = {
            "p-001": {
                "id": "p-001",
                "name": "Sourdough Loaf",
                "price_cents": "650",
                "stock": "42",
            },
            "p-002": {
                "id": "p-002",
                "name": "Espresso Beans 250g",
                "price_cents": "1495",
                "stock": "120",
            },
            "p-003": {
                "id": "p-003",
                "name": "Olive Oil 500ml",
                "price_cents": "1200",
                "stock": "8",
            },
            "p-004": {
                "id": "p-004",
                "name": "Sea Salt Flakes",
                "price_cents": "475",
                "stock": "60",
            },
        }

    def list_ids(self) -> list[str]:
        return sorted(self._records.keys())

    def read(self, product_id: str) -> Optional[dict[str, str]]:
        """Simulate a slow primary read and return the record, or None."""
        time.sleep(self.read_latency_ms / 1000.0)
        with self._lock:
            self._reads += 1
            record = self._records.get(product_id)
            return dict(record) if record else None

    def update_field(self, product_id: str, field: str, value: str) -> bool:
        """Update a single field on a primary record."""
        with self._lock:
            record = self._records.get(product_id)
            if record is None:
                return False
            record[field] = value
            return True

    def reads(self) -> int:
        with self._lock:
            return self._reads

    def reset_reads(self) -> None:
        with self._lock:
            self._reads = 0
