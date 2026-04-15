"""
Redis-backed leaderboard implementation using a sorted set and user metadata hashes.
"""

from __future__ import annotations

from typing import Iterable, Optional

import redis


class RedisLeaderboard:
    """Store leaderboard scores in a sorted set and metadata in Redis hashes."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        key: str = "leaderboard:demo",
        max_entries: int = 100,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost",
            port=6379,
            decode_responses=True,
        )
        self.key = key
        self.max_entries = self._normalize_positive_int(max_entries, "max_entries")

    def _normalize_positive_int(self, value: int, field_name: str) -> int:
        normalized = int(value)
        if normalized < 1:
            raise ValueError(f"{field_name} must be at least 1")
        return normalized

    def _metadata_key(self, user_id: str) -> str:
        return f"{self.key}:user:{user_id}"

    def _coerce_metadata(
        self,
        metadata: Optional[dict[str, object]] = None,
    ) -> dict[str, str]:
        if not metadata:
            return {}
        return {field: str(value) for field, value in metadata.items()}

    def _delete_metadata_for_users(self, user_ids: Iterable[str]) -> None:
        keys = [self._metadata_key(user_id) for user_id in user_ids]
        if keys:
            self.redis.delete(*keys)

    def _hydrate_entries(
        self,
        entries: list[tuple[str, float]],
        start_rank: int,
    ) -> list[dict[str, object]]:
        if not entries:
            return []

        user_ids = [user_id for user_id, _ in entries]
        metadata_keys = [self._metadata_key(user_id) for user_id in user_ids]
        with self.redis.pipeline() as pipeline:
            for metadata_key in metadata_keys:
                pipeline.hgetall(metadata_key)
            metadata_results = pipeline.execute()

        hydrated_entries: list[dict[str, object]] = []
        for index, ((user_id, score), metadata) in enumerate(
            zip(entries, metadata_results),
            start=start_rank,
        ):
            hydrated_entries.append(
                {
                    "rank": index,
                    "user_id": user_id,
                    "score": float(score),
                    "metadata": metadata or {},
                }
            )

        return hydrated_entries

    def _trim_to_max_entries(self) -> list[str]:
        overflow = self.redis.zcard(self.key) - self.max_entries
        if overflow <= 0:
            return []

        trimmed_user_ids = self.redis.zrange(self.key, 0, overflow - 1)
        if not trimmed_user_ids:
            return []

        with self.redis.pipeline() as pipeline:
            pipeline.zremrangebyrank(self.key, 0, overflow - 1)
            pipeline.execute()

        self._delete_metadata_for_users(trimmed_user_ids)
        return [str(user_id) for user_id in trimmed_user_ids]

    def upsert_user(
        self,
        user_id: str,
        score: float,
        metadata: Optional[dict[str, object]] = None,
    ) -> dict[str, object]:
        """Create or update a leaderboard entry and associated metadata."""
        metadata_key = self._metadata_key(user_id)
        payload = self._coerce_metadata(metadata)

        with self.redis.pipeline() as pipeline:
            pipeline.zadd(self.key, {user_id: float(score)})
            if payload:
                pipeline.hset(metadata_key, mapping=payload)
            pipeline.execute()

        trimmed_user_ids = self._trim_to_max_entries()
        entry = self.get_user_entry(user_id)
        if entry is None:
            return {
                "user_id": user_id,
                "score": float(score),
                "metadata": payload,
                "trimmed_user_ids": trimmed_user_ids,
            }

        entry["trimmed_user_ids"] = trimmed_user_ids
        return entry

    def increment_score(
        self,
        user_id: str,
        amount: float,
        metadata: Optional[dict[str, object]] = None,
    ) -> dict[str, object]:
        """Increment a user's score and optionally update their metadata."""
        metadata_key = self._metadata_key(user_id)
        payload = self._coerce_metadata(metadata)

        with self.redis.pipeline() as pipeline:
            pipeline.zincrby(self.key, float(amount), user_id)
            if payload:
                pipeline.hset(metadata_key, mapping=payload)
            result = pipeline.execute()

        new_score = float(result[0])
        trimmed_user_ids = self._trim_to_max_entries()
        entry = self.get_user_entry(user_id)
        if entry is None:
            return {
                "user_id": user_id,
                "score": new_score,
                "metadata": payload,
                "trimmed_user_ids": trimmed_user_ids,
            }

        entry["trimmed_user_ids"] = trimmed_user_ids
        return entry

    def set_max_entries(self, max_entries: int) -> list[str]:
        """Update the leaderboard size limit and trim immediately if needed."""
        self.max_entries = self._normalize_positive_int(max_entries, "max_entries")
        return self._trim_to_max_entries()

    def get_top(self, count: int) -> list[dict[str, object]]:
        """Return the top-scoring leaderboard entries."""
        normalized_count = self._normalize_positive_int(count, "count")
        entries = self.redis.zrange(
            self.key,
            0,
            normalized_count - 1,
            desc=True,
            withscores=True,
        )
        return self._hydrate_entries(entries, start_rank=1)

    def get_around_rank(self, rank: int, count: int) -> list[dict[str, object]]:
        """Return leaderboard entries centered around a 1-based rank."""
        normalized_rank = self._normalize_positive_int(rank, "rank")
        normalized_count = self._normalize_positive_int(count, "count")
        total_entries = self.redis.zcard(self.key)
        if total_entries == 0:
            return []

        if total_entries <= normalized_count:
            entries = self.redis.zrange(
                self.key,
                0,
                -1,
                desc=True,
                withscores=True,
            )
            return self._hydrate_entries(entries, start_rank=1)

        half_window = normalized_count // 2
        start = max(0, normalized_rank - 1 - half_window)
        start = min(start, total_entries - normalized_count)
        end = start + normalized_count - 1
        entries = self.redis.zrange(
            self.key,
            start,
            end,
            desc=True,
            withscores=True,
        )
        return self._hydrate_entries(entries, start_rank=start + 1)

    def get_rank(self, user_id: str) -> Optional[int]:
        """Return a user's 1-based rank from the top."""
        rank = self.redis.zrevrank(self.key, user_id)
        if rank is None:
            return None
        return int(rank) + 1

    def get_user_metadata(self, user_id: str) -> dict[str, str]:
        """Return stored metadata for a user ID."""
        return self.redis.hgetall(self._metadata_key(user_id))

    def get_user_entry(self, user_id: str) -> Optional[dict[str, object]]:
        """Return a single leaderboard entry, including score, rank, and metadata."""
        with self.redis.pipeline() as pipeline:
            pipeline.zscore(self.key, user_id)
            pipeline.zrevrank(self.key, user_id)
            pipeline.hgetall(self._metadata_key(user_id))
            score, rank, metadata = pipeline.execute()

        if score is None or rank is None:
            return None

        return {
            "rank": int(rank) + 1,
            "user_id": user_id,
            "score": float(score),
            "metadata": metadata or {},
        }

    def list_all(self) -> list[dict[str, object]]:
        """Return the full leaderboard from highest to lowest score."""
        entries = self.redis.zrange(self.key, 0, -1, desc=True, withscores=True)
        return self._hydrate_entries(entries, start_rank=1)

    def get_size(self) -> int:
        """Return the number of entries currently on the leaderboard."""
        return int(self.redis.zcard(self.key))

    def delete_user(self, user_id: str) -> bool:
        """Remove a user from the leaderboard and delete their metadata."""
        with self.redis.pipeline() as pipeline:
            pipeline.zrem(self.key, user_id)
            pipeline.delete(self._metadata_key(user_id))
            removed_count, _ = pipeline.execute()
        return bool(removed_count)

    def clear(self) -> None:
        """Remove all leaderboard scores and metadata for this leaderboard."""
        user_ids = self.redis.zrange(self.key, 0, -1)
        with self.redis.pipeline() as pipeline:
            pipeline.delete(self.key)
            if user_ids:
                pipeline.delete(*[self._metadata_key(user_id) for user_id in user_ids])
            pipeline.execute()
