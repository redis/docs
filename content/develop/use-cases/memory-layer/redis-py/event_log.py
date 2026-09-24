"""
Append-only event log for an agent thread, backed by a Redis Stream.

Each thread gets a stream at ``agent:events:{thread_id}``. Every
action the agent takes (a user turn arriving, a memory being
recalled, a memory being written, a tool being called) is one
``XADD`` to that stream. Replay with ``XREVRANGE`` for the most
recent N events; bound retention with ``XTRIM MAXLEN ~`` so the log
stays cheap regardless of how long the thread has been running.

The stream is independent of the session hash (``session_store.py``)
and the long-term memory store (``long_term_memory.py``): it answers
the "what just happened" question without competing with either of
those for indexing or memory budget. Consumer groups (not used in
this demo) would let downstream workers — summarizers,
consolidators, audit pipelines — replay the log without losing
position.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Optional

import redis


# Approximate cap on stream length. ``MAXLEN ~`` lets Redis trim in
# whole-node units instead of exactly-N units, which is much cheaper
# at the cost of overshooting the bound by up to a node's worth.
DEFAULT_MAXLEN = 1000


@dataclass
class AgentEvent:
    event_id: str
    thread_id: str
    action: str
    detail: str
    ts: float

    def to_dict(self) -> dict:
        return {
            "event_id": self.event_id,
            "thread_id": self.thread_id,
            "action": self.action,
            "detail": self.detail,
            "ts": self.ts,
        }


class AgentEventLog:
    """Append, replay, and bound the per-thread event stream."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        key_prefix: str = "agent:events:",
        max_len: int = DEFAULT_MAXLEN,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost", port=6379, decode_responses=False,
        )
        self.key_prefix = key_prefix
        self.max_len = max_len

    def stream_key(self, thread_id: str) -> str:
        return f"{self.key_prefix}{thread_id}"

    def record(
        self,
        thread_id: str,
        action: str,
        detail: str = "",
    ) -> str:
        """Append one event and return its stream id.

        ``maxlen=~N`` keeps the stream bounded with near-zero
        overhead; an exact bound (``maxlen=N`` without the tilde)
        forces a scan and is rarely worth the cost.
        """
        return _d(
            self.redis.xadd(
                self.stream_key(thread_id),
                {"action": action, "detail": detail, "ts": repr(time.time())},
                maxlen=self.max_len,
                approximate=True,
            )
        )

    def recent(self, thread_id: str, count: int = 20) -> list[AgentEvent]:
        """Return the most recent events, newest first."""
        rows = self.redis.xrevrange(
            self.stream_key(thread_id), count=count,
        )
        out: list[AgentEvent] = []
        for entry_id, fields in rows:
            data = {_d(k): _d(v) for k, v in fields.items()}
            out.append(AgentEvent(
                event_id=_d(entry_id),
                thread_id=thread_id,
                action=data.get("action", ""),
                detail=data.get("detail", ""),
                ts=float(data.get("ts", "0") or 0),
            ))
        return out

    def length(self, thread_id: str) -> int:
        return int(self.redis.xlen(self.stream_key(thread_id)))

    def clear(self, thread_id: str) -> bool:
        return bool(self.redis.delete(self.stream_key(thread_id)))


def _d(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value
