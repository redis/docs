"""
Working-memory store for an agent session, backed by a Redis Hash.

Each session is one Hash document at ``agent:session:{thread_id}``.
The hash holds the running scratchpad, the current goal, a rolling
window of recent turns (serialized as a JSON list to fit in one
field), and a few audit fields. One ``HGETALL`` returns the whole
session in a single round trip on every step of the agent loop.

Every write refreshes the key's TTL with ``EXPIRE``, so idle sessions
fall off without a separate cleanup job and active sessions stay
alive as long as the agent keeps touching them. A separate
``LongTermMemory`` (see ``long_term_memory.py``) is what survives
beyond a session's TTL.

The turn window is bounded to ``MAX_TURNS`` in application code; the
hash itself doesn't grow, so the working set per thread stays
constant regardless of how long the agent has been running.
"""

from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field
from typing import Optional

import redis


# How many recent turns to keep inline on the session hash. Older
# turns flow through the event log (see ``event_log.py``) and the
# long-term memory store (see ``long_term_memory.py``).
MAX_TURNS = 20


@dataclass
class SessionTurn:
    role: str       # "user" | "assistant" | "tool"
    content: str
    ts: float

    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content, "ts": self.ts}

    @classmethod
    def from_dict(cls, data: dict) -> "SessionTurn":
        return cls(
            role=data.get("role", ""),
            content=data.get("content", ""),
            ts=float(data.get("ts", 0.0)),
        )


@dataclass
class SessionState:
    thread_id: str
    user: str = "default"
    agent: str = "default"
    goal: str = ""
    scratchpad: str = ""
    turn_count: int = 0
    created_ts: float = 0.0
    last_active_ts: float = 0.0
    recent_turns: list[SessionTurn] = field(default_factory=list)
    ttl_seconds: int = 0

    def to_dict(self) -> dict:
        return {
            "thread_id": self.thread_id,
            "user": self.user,
            "agent": self.agent,
            "goal": self.goal,
            "scratchpad": self.scratchpad,
            "turn_count": self.turn_count,
            "created_ts": self.created_ts,
            "last_active_ts": self.last_active_ts,
            "recent_turns": [t.to_dict() for t in self.recent_turns],
            "ttl_seconds": self.ttl_seconds,
        }


class AgentSession:
    """Load, write, and bound the working-memory hash for one thread."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        key_prefix: str = "agent:session:",
        default_ttl_seconds: int = 3600,
        max_turns: int = MAX_TURNS,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost", port=6379, decode_responses=False,
        )
        self.key_prefix = key_prefix
        self.default_ttl_seconds = default_ttl_seconds
        self.max_turns = max_turns

    def session_key(self, thread_id: str) -> str:
        return f"{self.key_prefix}{thread_id}"

    def new_thread_id(self) -> str:
        return uuid.uuid4().hex[:12]

    def start(
        self,
        thread_id: str,
        user: str = "default",
        agent: str = "default",
        goal: str = "",
        ttl_seconds: int | None = None,
    ) -> SessionState:
        """Create a fresh working memory for a thread.

        Overwrites any existing session at the same key. The agent
        normally calls this once per thread at the first turn and
        relies on ``load`` / ``append_turn`` for subsequent steps.
        """
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl_seconds
        now = time.time()
        state = SessionState(
            thread_id=thread_id,
            user=user,
            agent=agent,
            goal=goal,
            scratchpad="",
            turn_count=0,
            created_ts=now,
            last_active_ts=now,
            recent_turns=[],
            ttl_seconds=ttl,
        )
        self._write(state, ttl)
        return state

    def load(self, thread_id: str) -> SessionState | None:
        """Return the session state, or ``None`` if it has expired."""
        key = self.session_key(thread_id)
        raw = self.redis.hgetall(key)
        if not raw:
            return None
        data = {_d(k): _d(v) for k, v in raw.items()}
        ttl = self.redis.ttl(key)
        turns_blob = data.get("recent_turns", "[]")
        try:
            turns = [SessionTurn.from_dict(t) for t in json.loads(turns_blob)]
        except json.JSONDecodeError:
            turns = []
        return SessionState(
            thread_id=thread_id,
            user=data.get("user", "default"),
            agent=data.get("agent", "default"),
            goal=data.get("goal", ""),
            scratchpad=data.get("scratchpad", ""),
            turn_count=int(data.get("turn_count", "0") or 0),
            created_ts=float(data.get("created_ts", "0") or 0),
            last_active_ts=float(data.get("last_active_ts", "0") or 0),
            recent_turns=turns,
            ttl_seconds=int(ttl) if ttl and ttl > 0 else 0,
        )

    def append_turn(
        self,
        thread_id: str,
        role: str,
        content: str,
        ttl_seconds: int | None = None,
    ) -> SessionState:
        """Append a turn, bound the rolling window, refresh the TTL.

        Read-modify-write is acceptable for a single-threaded demo;
        production agents that share a thread across workers would
        wrap this in ``WATCH`` / ``MULTI`` or a Lua script to avoid
        last-writer-wins on the turn list.
        """
        state = self.load(thread_id)
        if state is None:
            state = self.start(thread_id, ttl_seconds=ttl_seconds)
        state.recent_turns.append(
            SessionTurn(role=role, content=content, ts=time.time())
        )
        if len(state.recent_turns) > self.max_turns:
            state.recent_turns = state.recent_turns[-self.max_turns:]
        state.turn_count += 1
        state.last_active_ts = time.time()
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl_seconds
        state.ttl_seconds = ttl
        self._write(state, ttl)
        return state

    def set_scratchpad(
        self,
        thread_id: str,
        text: str,
        ttl_seconds: int | None = None,
    ) -> SessionState | None:
        """Update the agent's running scratchpad and refresh TTL."""
        state = self.load(thread_id)
        if state is None:
            return None
        state.scratchpad = text
        state.last_active_ts = time.time()
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl_seconds
        state.ttl_seconds = ttl
        self._write(state, ttl)
        return state

    def delete(self, thread_id: str) -> bool:
        """Drop the session immediately. Returns ``True`` if it existed."""
        return bool(self.redis.delete(self.session_key(thread_id)))

    def list_threads(self, limit: int = 100) -> list[str]:
        """Return active thread ids (for the demo's thread switcher)."""
        out: list[str] = []
        for key in self.redis.scan_iter(match=f"{self.key_prefix}*", count=200):
            thread_id = _d(key)[len(self.key_prefix):]
            out.append(thread_id)
            if len(out) >= limit:
                break
        return out

    def _write(self, state: SessionState, ttl: int) -> None:
        key = self.session_key(state.thread_id)
        mapping = {
            "thread_id": state.thread_id,
            "user": state.user,
            "agent": state.agent,
            "goal": state.goal,
            "scratchpad": state.scratchpad,
            "turn_count": str(state.turn_count),
            "created_ts": repr(state.created_ts),
            "last_active_ts": repr(state.last_active_ts),
            "recent_turns": json.dumps([t.to_dict() for t in state.recent_turns]),
        }
        # MULTI/EXEC so HSET and EXPIRE either both apply or neither
        # does. A connection drop between the two writes would
        # otherwise leave the session without a TTL.
        pipe = self.redis.pipeline(transaction=True)
        pipe.hset(key, mapping=mapping)
        pipe.expire(key, ttl)
        pipe.execute()


def _d(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value
