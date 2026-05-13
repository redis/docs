"""
Redis-backed pub/sub hub helper.

Wraps PUBLISH / SUBSCRIBE / PSUBSCRIBE plus the introspection commands
(PUBSUB CHANNELS, PUBSUB NUMSUB, PUBSUB NUMPAT) into a small, named API
that:

* publishes JSON-encoded messages to a channel and counts how many
  subscribers Redis reported delivering to
* creates named in-process subscribers that own a pubsub object and a
  background dispatch thread, with a callback for each delivered message
* tracks per-channel publish counters and per-subscriber received counts
  for the demo UI

Pub/sub has at-most-once delivery: a message that arrives while a
subscriber is disconnected is gone. If you need persistence or replay,
use Redis Streams instead.
"""

from __future__ import annotations

import collections
import json
import threading
import time
from typing import Callable, Optional

import redis


# Message shape delivered to every Subscription callback. Pattern
# subscriptions carry the original pattern in `pattern`; exact-match
# subscriptions leave it None.
class ReceivedMessage:
    __slots__ = ("channel", "pattern", "payload", "received_at_ms")

    def __init__(
        self,
        channel: str,
        pattern: Optional[str],
        payload: object,
        received_at_ms: int,
    ) -> None:
        self.channel = channel
        self.pattern = pattern
        self.payload = payload
        self.received_at_ms = received_at_ms

    def to_dict(self) -> dict:
        return {
            "channel": self.channel,
            "pattern": self.pattern,
            "payload": self.payload,
            "received_at_ms": self.received_at_ms,
        }


class Subscription:
    """A named in-process subscriber bound to one or more channels or patterns.

    Each ``Subscription`` owns its own ``PubSub`` object (and therefore
    its own Redis connection) and a background thread that pumps incoming
    messages into the registered callback. Subscriptions are independent:
    closing one does not affect another, even if they share channels.
    """

    def __init__(
        self,
        name: str,
        hub: "RedisPubSubHub",
        targets: list[str],
        is_pattern: bool,
        on_message: Optional[Callable[["ReceivedMessage"], None]] = None,
        buffer_size: int = 50,
    ) -> None:
        if not targets:
            raise ValueError("Subscription requires at least one channel or pattern")
        self.name = name
        self.hub = hub
        self.targets = list(targets)
        self.is_pattern = is_pattern
        self._on_message = on_message
        self._buffer: collections.deque[ReceivedMessage] = collections.deque(
            maxlen=buffer_size
        )
        self._lock = threading.Lock()
        self._received = 0
        self._closed = False

        # ignore_subscribe_messages keeps the dispatch loop focused on
        # actual published payloads rather than the subscribe/unsubscribe
        # acknowledgements Redis sends back on the same socket.
        self._pubsub = hub.redis.pubsub(ignore_subscribe_messages=True)
        bindings = {target: self._dispatch for target in self.targets}
        if is_pattern:
            self._pubsub.psubscribe(**bindings)
        else:
            self._pubsub.subscribe(**bindings)

        # run_in_thread starts a daemon thread that calls get_message()
        # in a loop with a short sleep. Each delivered message is routed
        # to the per-channel callback we registered above.
        self._thread = self._pubsub.run_in_thread(sleep_time=0.01, daemon=True)

    # The pubsub object delivers a dict with keys like "type",
    # "channel", "pattern", "data". We re-wrap it as a ReceivedMessage
    # so callers don't have to know the redis-py wire shape.
    def _dispatch(self, raw: dict) -> None:
        channel = raw.get("channel")
        if isinstance(channel, bytes):
            channel = channel.decode("utf-8")
        pattern = raw.get("pattern")
        if isinstance(pattern, bytes):
            pattern = pattern.decode("utf-8")
        data = raw.get("data")
        if isinstance(data, bytes):
            data = data.decode("utf-8")
        try:
            payload = json.loads(data) if isinstance(data, str) else data
        except (json.JSONDecodeError, TypeError):
            payload = data
        message = ReceivedMessage(
            channel=channel or "",
            pattern=pattern,
            payload=payload,
            received_at_ms=int(time.time() * 1000),
        )
        with self._lock:
            self._buffer.appendleft(message)
            self._received += 1
        if self._on_message is not None:
            try:
                self._on_message(message)
            except Exception:
                # The callback is user-supplied; don't let it kill the
                # dispatch thread or block the next message.
                pass

    def messages(self, limit: Optional[int] = None) -> list[ReceivedMessage]:
        with self._lock:
            buf = list(self._buffer)
        if limit is not None:
            buf = buf[:limit]
        return buf

    def received_total(self) -> int:
        with self._lock:
            return self._received

    def reset_received(self) -> None:
        with self._lock:
            self._buffer.clear()
            self._received = 0

    def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        try:
            self._thread.stop()
        except Exception:
            pass
        try:
            self._pubsub.close()
        except Exception:
            pass

    def is_alive(self) -> bool:
        return not self._closed and self._thread.is_alive()

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "targets": list(self.targets),
            "is_pattern": self.is_pattern,
            "received_total": self.received_total(),
            "alive": self.is_alive(),
        }


class RedisPubSubHub:
    """Publish/subscribe helper with publisher counters and subscriber registry."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        buffer_size: int = 50,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost",
            port=6379,
            decode_responses=True,
        )
        self.buffer_size = buffer_size

        self._subs_lock = threading.Lock()
        self._subscriptions: dict[str, Subscription] = {}

        self._stats_lock = threading.Lock()
        self._published_total = 0
        self._delivered_total = 0
        self._channel_published: dict[str, int] = collections.defaultdict(int)

    def publish(self, channel: str, message: object) -> int:
        """Publish ``message`` to ``channel`` and return Redis' delivered count.

        ``message`` is JSON-encoded so callers can pass dicts, lists, or
        scalars without converting on every call. The returned integer
        is what Redis itself reports: the number of clients that were
        subscribed (directly or via pattern) at the moment the message
        was fanned out.
        """
        payload = json.dumps(message, default=str)
        delivered = int(self.redis.publish(channel, payload))
        with self._stats_lock:
            self._published_total += 1
            self._delivered_total += delivered
            self._channel_published[channel] += 1
        return delivered

    def subscribe(
        self,
        name: str,
        channels: list[str],
        on_message: Optional[Callable[["ReceivedMessage"], None]] = None,
    ) -> Subscription:
        """Register a named exact-match subscription on one or more channels."""
        return self._register(name, channels, is_pattern=False, on_message=on_message)

    def psubscribe(
        self,
        name: str,
        patterns: list[str],
        on_message: Optional[Callable[["ReceivedMessage"], None]] = None,
    ) -> Subscription:
        """Register a named pattern subscription on one or more glob patterns."""
        return self._register(name, patterns, is_pattern=True, on_message=on_message)

    def _register(
        self,
        name: str,
        targets: list[str],
        is_pattern: bool,
        on_message: Optional[Callable[["ReceivedMessage"], None]],
    ) -> Subscription:
        with self._subs_lock:
            if name in self._subscriptions:
                raise ValueError(f"subscription named '{name}' already exists")
            sub = Subscription(
                name=name,
                hub=self,
                targets=targets,
                is_pattern=is_pattern,
                on_message=on_message,
                buffer_size=self.buffer_size,
            )
            self._subscriptions[name] = sub
            return sub

    def unsubscribe(self, name: str) -> bool:
        """Close and remove the named subscription. Returns True if it existed."""
        with self._subs_lock:
            sub = self._subscriptions.pop(name, None)
        if sub is None:
            return False
        sub.close()
        return True

    def subscriptions(self) -> list[Subscription]:
        with self._subs_lock:
            return list(self._subscriptions.values())

    def get_subscription(self, name: str) -> Optional[Subscription]:
        with self._subs_lock:
            return self._subscriptions.get(name)

    def active_channels(self, pattern: str = "*") -> list[str]:
        """List server-side channels with at least one subscriber (PUBSUB CHANNELS)."""
        channels = self.redis.pubsub_channels(pattern)
        return sorted(
            (c.decode("utf-8") if isinstance(c, bytes) else c) for c in channels
        )

    def channel_subscriber_counts(self, channels: list[str]) -> dict[str, int]:
        """Count subscribers per channel (PUBSUB NUMSUB).

        Reports only exact-match subscriptions — pattern subscribers are
        counted separately via :meth:`pattern_subscriber_count`.
        """
        if not channels:
            return {}
        result = self.redis.pubsub_numsub(*channels)
        return {
            (c.decode("utf-8") if isinstance(c, bytes) else c): int(n)
            for c, n in result
        }

    def pattern_subscriber_count(self) -> int:
        """Total active pattern subscriptions across all clients (PUBSUB NUMPAT)."""
        return int(self.redis.pubsub_numpat())

    def stats(self) -> dict:
        """Combined publish and subscribe counters plus the current registry size."""
        with self._stats_lock:
            published_total = self._published_total
            delivered_total = self._delivered_total
            channel_published = dict(self._channel_published)
        with self._subs_lock:
            subs = list(self._subscriptions.values())
        received_total = sum(s.received_total() for s in subs)
        return {
            "published_total": published_total,
            "delivered_total": delivered_total,
            "received_total": received_total,
            "active_subscriptions": len(subs),
            "channel_published": channel_published,
            "pattern_subscriptions": self.pattern_subscriber_count(),
        }

    def reset_stats(self) -> None:
        with self._stats_lock:
            self._published_total = 0
            self._delivered_total = 0
            self._channel_published.clear()
        for sub in self.subscriptions():
            sub.reset_received()

    def shutdown(self) -> None:
        """Close every active subscription. Safe to call more than once."""
        with self._subs_lock:
            subs = list(self._subscriptions.values())
            self._subscriptions.clear()
        for sub in subs:
            sub.close()
