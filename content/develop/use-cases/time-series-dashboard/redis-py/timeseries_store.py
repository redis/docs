"""
Redis TimeSeries helpers for the rolling three-sensor dashboard demo.
"""

from __future__ import annotations

import time
from typing import Any

import redis
from redis.exceptions import ResponseError

from sensor_simulator import SensorDefinition


SAMPLE_INTERVAL_MS = 500
WINDOW_MS = 12_000
BUCKET_MS = 3_000
RETENTION_MS = 12_000


class RedisTimeSeriesStore:
    """Wrap direct Redis TimeSeries commands for the dashboard demo."""

    def __init__(self, redis_client: redis.Redis, sensors: list[SensorDefinition]) -> None:
        self.redis = redis_client
        self.sensors = sensors

    @staticmethod
    def _to_int(value: Any) -> int:
        return int(value)

    @staticmethod
    def _to_float(value: Any) -> float:
        return float(value)

    def ensure_schema(self) -> None:
        """Create all sensor time series if they do not already exist."""
        for sensor in self.sensors:
            args: list[Any] = ["TS.CREATE", sensor.key, "RETENTION", RETENTION_MS, "LABELS"]
            for label, value in sensor.labels.items():
                args.extend([label, value])

            try:
                self.redis.execute_command(*args)
            except ResponseError as exc:
                if "key already exists" not in str(exc).lower():
                    raise

    def add_samples(self, samples: list[tuple[SensorDefinition, float]]) -> None:
        """Batch-ingest one sample per sensor with a shared timestamp."""
        if not samples:
            return

        timestamp_ms = int(time.time() * 1000)
        args: list[Any] = ["TS.MADD"]
        for sensor, value in samples:
            args.extend([sensor.key, timestamp_ms, value])

        self.redis.execute_command(*args)

    def _range(self, sensor: SensorDefinition, start_ms: int, end_ms: int) -> list[dict[str, float]]:
        points = self.redis.execute_command("TS.RANGE", sensor.key, start_ms, end_ms)
        return [
            {"timestamp": self._to_int(timestamp_ms), "value": self._to_float(value)}
            for timestamp_ms, value in points
        ]

    def _aggregate(
        self,
        sensor: SensorDefinition,
        start_ms: int,
        end_ms: int,
        aggregation: str,
    ) -> list[dict[str, float]]:
        points = self.redis.execute_command(
            "TS.RANGE",
            sensor.key,
            start_ms,
            end_ms,
            "AGGREGATION",
            aggregation,
            BUCKET_MS,
        )
        return [
            {"timestamp": self._to_int(timestamp_ms), "value": self._to_float(value)}
            for timestamp_ms, value in points
        ]

    def _latest(self, sensor: SensorDefinition) -> dict[str, Any] | None:
        sample = self.redis.execute_command("TS.GET", sensor.key)
        if not sample:
            return None
        timestamp_ms, value = sample
        return {
            "timestamp": self._to_int(timestamp_ms),
            "value": self._to_float(value),
        }

    def dashboard_snapshot(self) -> dict[str, Any]:
        """Return everything the UI needs for the rolling graph demo."""
        now_ms = int(time.time() * 1000)
        start_ms = now_ms - WINDOW_MS
        sensors_payload: list[dict[str, Any]] = []

        for sensor in self.sensors:
            raw_points = self._range(sensor, start_ms, now_ms)
            min_points = self._aggregate(sensor, start_ms, now_ms, "min")
            max_points = self._aggregate(sensor, start_ms, now_ms, "max")
            avg_points = self._aggregate(sensor, start_ms, now_ms, "avg")
            latest = self._latest(sensor)

            buckets: list[dict[str, Any]] = []
            for index, avg_point in enumerate(avg_points):
                bucket_start = avg_point["timestamp"]
                bucket_end = min(bucket_start + BUCKET_MS, now_ms)
                buckets.append(
                    {
                        "start": bucket_start,
                        "end": bucket_end,
                        "avg": avg_point["value"],
                        "min": min_points[index]["value"] if index < len(min_points) else None,
                        "max": max_points[index]["value"] if index < len(max_points) else None,
                    }
                )

            sensors_payload.append(
                {
                    "sensor_id": sensor.sensor_id,
                    "zone": sensor.zone,
                    "unit": sensor.unit,
                    "latest": latest,
                    "raw_points": raw_points,
                    "buckets": buckets,
                }
            )

        return {
            "now": now_ms,
            "window_ms": WINDOW_MS,
            "bucket_ms": BUCKET_MS,
            "sample_interval_ms": SAMPLE_INTERVAL_MS,
            "retention_ms": RETENTION_MS,
            "sensors": sensors_payload,
        }
