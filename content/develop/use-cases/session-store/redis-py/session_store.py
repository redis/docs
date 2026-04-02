"""
Redis-backed session storage for Python web applications.

This module stores session data in Redis hashes and uses key expiration
to remove inactive sessions automatically.
"""

from __future__ import annotations

from datetime import datetime, timezone
import secrets
from typing import Optional

import redis


RESERVED_SESSION_FIELDS = {"created_at", "last_accessed_at", "session_ttl"}


class RedisSessionStore:
    """Store session data in Redis using hash keys and TTL-based expiration."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        prefix: str = "session:",
        ttl: int = 1800,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost",
            port=6379,
            decode_responses=True,
        )
        self.prefix = prefix
        self.ttl = ttl

    def _normalize_ttl(self, ttl: Optional[int] = None) -> int:
        value = self.ttl if ttl is None else ttl
        normalized = int(value)
        if normalized < 1:
            raise ValueError("TTL must be at least 1 second")
        return normalized

    def _session_key(self, session_id: str) -> str:
        return f"{self.prefix}{session_id}"

    def _timestamp(self) -> str:
        return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    def create_session(
        self,
        data: Optional[dict[str, str]] = None,
        ttl: Optional[int] = None,
    ) -> str:
        """Create a new session and return its opaque session ID."""
        session_id = secrets.token_urlsafe(32)
        key = self._session_key(session_id)
        now = self._timestamp()
        session_ttl = self._normalize_ttl(ttl)

        payload: dict[str, str] = {}
        if data:
            payload.update(
                {
                    field: str(value)
                    for field, value in data.items()
                    if field not in RESERVED_SESSION_FIELDS
                }
            )
        payload.update(
            {
                "created_at": now,
                "last_accessed_at": now,
                "session_ttl": str(session_ttl),
            }
        )

        pipeline = self.redis.pipeline()
        pipeline.hset(key, mapping=payload)
        pipeline.expire(key, session_ttl)
        pipeline.execute()

        return session_id

    def get_configured_ttl(self, session_id: str) -> Optional[int]:
        """Return the configured TTL for a session, or None if it does not exist."""
        key = self._session_key(session_id)
        if self.redis.exists(key) != 1:
            return None

        stored_ttl = self.redis.hget(key, "session_ttl")
        if stored_ttl is None:
            return self.ttl

        return self._normalize_ttl(int(stored_ttl))

    def get_session(
        self,
        session_id: str,
        refresh_ttl: bool = True,
    ) -> Optional[dict[str, str]]:
        """Return session data for a session ID, or None if it does not exist."""
        key = self._session_key(session_id)

        if self.redis.exists(key) != 1:
            return None

        session_ttl = self.get_configured_ttl(session_id)
        if session_ttl is None:
            return None

        if not refresh_ttl:
            session = self.redis.hgetall(key)
            return session or None

        now = self._timestamp()
        pipeline = self.redis.pipeline()
        pipeline.hset(key, mapping={"last_accessed_at": now})
        pipeline.expire(key, session_ttl)
        pipeline.hgetall(key)
        _, _, session = pipeline.execute()

        return session or None

    def update_session(self, session_id: str, data: dict[str, str]) -> bool:
        """Update session fields and refresh the TTL."""
        key = self._session_key(session_id)

        if self.redis.exists(key) != 1:
            return False

        session_ttl = self.get_configured_ttl(session_id)
        if session_ttl is None:
            return False

        if not data:
            return True

        payload = {field: str(value) for field, value in data.items()}
        payload["last_accessed_at"] = self._timestamp()

        pipeline = self.redis.pipeline()
        pipeline.hset(key, mapping=payload)
        pipeline.expire(key, session_ttl)
        pipeline.execute()

        return True

    def increment_field(
        self,
        session_id: str,
        field: str,
        amount: int = 1,
    ) -> Optional[int]:
        """Increment a numeric session field and refresh the TTL."""
        key = self._session_key(session_id)

        if self.redis.exists(key) != 1:
            return None

        session_ttl = self.get_configured_ttl(session_id)
        if session_ttl is None:
            return None

        pipeline = self.redis.pipeline()
        pipeline.hincrby(key, field, amount)
        pipeline.hset(key, mapping={"last_accessed_at": self._timestamp()})
        pipeline.expire(key, session_ttl)
        new_value, _, _ = pipeline.execute()

        return int(new_value)

    def set_session_ttl(self, session_id: str, ttl: int) -> bool:
        """Update the configured TTL for a session and apply it immediately."""
        key = self._session_key(session_id)

        if self.redis.exists(key) != 1:
            return False

        session_ttl = self._normalize_ttl(ttl)
        pipeline = self.redis.pipeline()
        pipeline.hset(
            key,
            mapping={
                "session_ttl": str(session_ttl),
                "last_accessed_at": self._timestamp(),
            },
        )
        pipeline.expire(key, session_ttl)
        pipeline.execute()
        return True

    def delete_session(self, session_id: str) -> bool:
        """Delete a session from Redis."""
        return self.redis.delete(self._session_key(session_id)) == 1

    def get_ttl(self, session_id: str) -> int:
        """Return the remaining TTL for a session in seconds."""
        return int(self.redis.ttl(self._session_key(session_id)))
