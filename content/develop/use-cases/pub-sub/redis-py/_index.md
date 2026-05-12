---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement Redis pub/sub messaging in Python with redis-py
linkTitle: redis-py example (Python)
title: Redis pub/sub with redis-py
weight: 1
---

This guide shows you how to implement a Redis-backed pub/sub broadcaster in Python with [`redis-py`]({{< relref "/develop/clients/redis-py" >}}). It includes a small local web server built with the Python standard library so you can publish messages to named channels, add and remove subscribers live, and watch Redis fan out each message to every interested listener.

## Overview

Pub/sub lets your application broadcast events — chat messages, cache invalidation signals, presence updates, notifications — to many consumers without per-pair wiring. The publisher names a *channel*; every client currently subscribed to that channel receives the message, in publish order, with sub-millisecond fan-out.

That gives you:

* Many-to-many event delivery with no message storage cost in Redis
* Exact-match subscriptions (`SUBSCRIBE orders:new`) for known topics
* Pattern subscriptions (`PSUBSCRIBE notifications:*`) for whole topic hierarchies
* Live server-side introspection through `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, and `PUBSUB NUMPAT`
* At-most-once delivery: subscribers that are offline when a message is published miss it, so durable state should live in keys or a Stream, not in the pub/sub channel itself

In this example, the publisher side calls `PUBLISH` with a JSON-encoded body and counts how many subscribers Redis reported delivering to. Each in-process subscriber owns its own Redis connection and a background thread that pumps incoming messages into a callback.

## How it works

The flow looks like this:

1. The application calls `hub.subscribe(name, channels)` or `hub.psubscribe(name, patterns)`
2. The helper creates a redis-py `PubSub` object, binds each target to a dispatch callback, and starts a background thread on `run_in_thread()`
3. The application (or another process) calls `hub.publish(channel, message)`
4. Redis fans the message out over every subscribing client's open socket
5. Each subscriber's dispatch thread wraps the raw message as a `ReceivedMessage`, appends it to a per-subscriber ring buffer, and invokes the optional callback
6. The publisher receives the integer subscriber count back from `PUBLISH`, which is the number of clients Redis delivered to right then

Pattern subscriptions match channels by glob (`*`, `?`, `[abc]`). A single message that matches both an exact subscription and a pattern subscription is delivered twice — once as a `message` and once as a `pmessage`.

## The pub/sub hub helper

The `RedisPubSubHub` class wraps the publish, subscribe, and introspection operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/pub-sub/redis-py/pubsub_hub.py)):

```python
import redis
from pubsub_hub import RedisPubSubHub

r = redis.Redis(host="localhost", port=6379, decode_responses=True)
hub = RedisPubSubHub(redis_client=r)

# Exact-match subscriber
hub.subscribe(name="orders-listener", channels=["orders:new"])

# Pattern subscriber covering an entire topic hierarchy
hub.psubscribe(name="all-notifications", patterns=["notifications:*"])

# Publish — returns Redis' delivered count for this PUBLISH
delivered = hub.publish("orders:new", {"order_id": 42, "total": 199.0})
print(f"Redis delivered to {delivered} subscriber(s)")

# Look at what each subscriber received
for sub in hub.subscriptions():
    print(sub.name, sub.received_total(), "messages")
    for message in sub.messages(limit=5):
        print("  ", message.channel, message.payload)

hub.unsubscribe("orders-listener")
hub.shutdown()  # closes every remaining subscription
```

### Data model

Pub/sub has no Redis keyspace footprint of its own — channels are server-side routing entries, not stored values. The hub keeps its own bookkeeping in process memory:

```text
RedisPubSubHub                          (in-process)
  subscriptions             dict[str, Subscription]
  published_total           int
  delivered_total           int
  channel_published         dict[channel -> count]

Subscription                            (in-process, one per subscriber)
  name                      str
  targets                   list[channel | pattern]
  is_pattern                bool
  buffer                    deque[ReceivedMessage]      (capped, default 50)
  received_total            int
  pubsub                    redis.client.PubSub          (owns one connection)
  thread                    PubSubWorkerThread           (run_in_thread)
```

The implementation uses:

* [`PUBLISH`]({{< relref "/commands/publish" >}}) to fan a JSON-encoded message out to every subscriber of a channel
* [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) for exact-match subscribers
* [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) for glob-style pattern subscribers
* [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}) to list the channels with at least one active exact-match subscriber
* [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}) to count subscribers per channel
* [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) to count active pattern subscriptions server-wide
* The redis-py `pubsub.run_in_thread()` helper to dispatch messages from each subscriber's own connection without writing the thread loop by hand

## Publishing messages

`publish()` JSON-encodes the message body, calls `PUBLISH`, and updates the per-channel publish counter:

```python
def publish(self, channel: str, message: object) -> int:
    payload = json.dumps(message, default=str)
    delivered = int(self.redis.publish(channel, payload))
    with self._stats_lock:
        self._published_total += 1
        self._delivered_total += delivered
        self._channel_published[channel] += 1
    return delivered
```

The integer returned by `PUBLISH` is what Redis itself reports — the number of subscribers (direct and pattern) that received the message in that call. It's a useful sanity check that the channel name is actually being listened to: a steady stream of `0`s means you have a typo somewhere or your subscriber crashed.

## Subscribing to channels

`subscribe()` creates a named in-process `Subscription` that owns its own `PubSub` object and dispatch thread:

```python
def subscribe(self, name: str, channels: list[str], on_message=None) -> Subscription:
    return self._register(name, channels, is_pattern=False, on_message=on_message)
```

Inside `Subscription.__init__`, the helper binds each target to a callback and starts a background thread:

```python
self._pubsub = hub.redis.pubsub(ignore_subscribe_messages=True)
bindings = {target: self._dispatch for target in self.targets}
if is_pattern:
    self._pubsub.psubscribe(**bindings)
else:
    self._pubsub.subscribe(**bindings)
self._thread = self._pubsub.run_in_thread(sleep_time=0.01, daemon=True)
```

A few details matter here:

* `pubsub(ignore_subscribe_messages=True)` skips the `subscribe`/`unsubscribe` acknowledgements Redis sends back on the same socket, so the dispatch callback only ever sees real published payloads.
* Each `Subscription` gets its own `PubSub` (and therefore its own Redis connection). Sharing one connection across subscribers would couple their lifetimes — closing one would close the channel for the others.
* `run_in_thread` runs a short poll loop (`sleep_time=0.01`) rather than blocking on `listen()`. That's the cleanest way to support `subscription.close()` without leaving a thread stuck inside a blocking socket read.

## Pattern subscriptions with PSUBSCRIBE

`psubscribe()` works the same way but routes messages through `PSUBSCRIBE` so each binding is a glob, not a literal channel name:

```python
hub.psubscribe(name="all-notifications", patterns=["notifications:*"])
hub.psubscribe(name="cache-invalidator", patterns=["cache:invalidate:*"])
```

When a published channel matches a pattern, the dispatch callback receives both the matched channel and the original pattern:

```python
def _dispatch(self, raw: dict) -> None:
    channel = raw.get("channel")   # the actual channel the message was sent to
    pattern = raw.get("pattern")   # the pattern that matched (None for exact subs)
    data    = raw.get("data")
    ...
```

That distinction is useful for routing: a pattern subscriber can do one thing for the whole hierarchy (e.g., increment a counter) and dispatch on the specific channel within its callback (e.g., "invalidate this region's cache").

## Inspecting active subscribers

Redis exposes a small set of pub/sub introspection commands that report on subscriber state without traversing any keyspace:

```python
hub.active_channels()                  # PUBSUB CHANNELS *
hub.channel_subscriber_counts(chs)     # PUBSUB NUMSUB ch1 ch2 ...
hub.pattern_subscriber_count()         # PUBSUB NUMPAT
```

`PUBSUB CHANNELS` only reports channels with at least one exact-match subscriber — pattern subscribers do not appear here. That's a deliberate Redis design choice: a glob like `*` would otherwise show up as a subscriber to every conceivable channel. `PUBSUB NUMPAT` covers the pattern side as a single global count.

## Stats and history

`stats()` reports publish and receive counters plus the size of the subscription registry:

```python
def stats(self) -> dict:
    return {
        "published_total": self._published_total,
        "delivered_total": self._delivered_total,         # sum of PUBLISH return values
        "received_total": sum(s.received_total() for s in self.subscriptions()),
        "active_subscriptions": len(self.subscriptions()),
        "channel_published": dict(self._channel_published),
        "pattern_subscriptions": self.pattern_subscriber_count(),
    }
```

`delivered_total` is what Redis itself counted; `received_total` is what this process's in-memory subscribers saw. In a single-process demo they should track each other closely — a sustained divergence usually means a callback raised, or a subscriber crashed while a publisher kept publishing. (Pub/sub is at-most-once: if your subscriber wasn't connected at publish time, the message is gone.)

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work for plain `PUBLISH`/`SUBSCRIBE`; `PUBSUB NUMPAT` is older than that.
* Python 3.9 or later.
* The `redis-py` client. Install it with:

  ```bash
  pip install "redis>=5.0"
  ```

## Running the demo

### Get the source files

The demo consists of two Python files. Download them from the [`redis-py` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/pub-sub/redis-py) on GitHub, or grab them with `curl`:

```bash
mkdir pub-sub-demo && cd pub-sub-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/pub-sub/redis-py
curl -O $BASE/pubsub_hub.py
curl -O $BASE/demo_server.py
```

### Start the demo server

From that directory:

```bash
python3 demo_server.py
```

You should see:

```text
Redis pub/sub demo server listening on http://127.0.0.1:8095
Using Redis at localhost:6379
Seeded 3 default subscription(s)
```

Open [http://127.0.0.1:8095](http://127.0.0.1:8095) in a browser. You can:

* Publish messages of any text to any channel name in any batch size.
* Add named subscribers that listen on either a specific channel (`orders:new`) or a glob pattern (`notifications:*`). A single subscriber can listen on multiple targets — enter them comma-separated.
* Watch each subscriber's incoming-message panel update every 800 ms.
* See the server-side view: `PUBSUB CHANNELS` lists exact-match channels with subscribers, `PUBSUB NUMSUB` gives per-channel counts, and `PUBSUB NUMPAT` counts active pattern subscriptions.
* Click **Reset** to drop every subscription, zero the counters, and re-seed the three default subscribers.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Production usage

### Pub/sub is at-most-once — pair it with durable state if you need replay

A subscriber that's offline when a message is published misses it permanently. For events you can't afford to lose, write the durable record (the order row, the cache key version, the audit log entry) to its primary store, then `PUBLISH` a notification so live consumers can pick it up immediately. On reconnect, consumers reconcile by reading the durable store, not by waiting for missed pub/sub messages. If you actually need replay or at-least-once delivery, switch to [Redis Streams]({{< relref "/develop/data-types/streams" >}}) with consumer groups.

### Use a separate connection (or `PubSub` object) per subscriber

A redis-py `PubSub` puts its connection into subscribe-only mode: ordinary commands (`GET`, `HSET`, etc.) on the same connection will hang. Always create the `PubSub` from a client whose pool can spare a connection, or — as the helper does — give every subscriber its own `PubSub`. Sharing one `PubSub` across business-logic subscribers couples their lifetimes (closing one closes the channel for the others) and serialises their callbacks on a single dispatch thread.

### Choose a topic naming convention up front

A flat namespace gets ugly fast — `email`, `email_high_priority`, `email_high_priority_billing`. Pick a colon-separated hierarchy (`notifications:billing:invoice`, `cache:invalidate:products:p-001`) so consumers can subscribe at the right level: a billing service uses `notifications:billing:*`, the audit logger uses `notifications:*`. Glob patterns are evaluated for every published message, so don't go wild with multiple wildcards on hot paths — `*:*:*` matches everything and costs more than a flat `notifications:*` would.

### Don't do heavy work in the dispatch callback

The dispatch thread reads messages from a single socket. If the callback blocks (synchronous HTTP call, big computation, slow DB write), the next message waits behind it and the subscriber's effective throughput drops to whatever the callback's latency is. For heavier work, the callback should hand the message off to a worker pool, a queue, or — for true durable handoff — a [Redis Streams]({{< relref "/develop/data-types/streams" >}}) consumer group.

### Tune the subscriber buffer for your traffic shape

The demo caps each subscriber's in-memory message buffer at 50. That's right for showing the recent activity in a UI, but a real subscriber typically processes each message and discards it — the buffer is only there for human inspection. If you keep a buffer, make sure it's bounded; an unbounded ring on a chatty pattern subscriber will eventually OOM the process.

### Sharded pub/sub on a Redis Cluster

On a Redis Cluster, plain `PUBLISH` fans every message out to every node via the cluster bus, which becomes a hotspot at high throughput. Redis 7.0 added [sharded pub/sub]({{< relref "/develop/pubsub#sharded-pubsub" >}}): channels are hashed to slots, and `SPUBLISH` / `SSUBSCRIBE` only touch the shard that owns the slot. If you're scaling pub/sub on a cluster, prefer the sharded commands and pick channel names whose hash distribution matches your traffic.

### Inspect pub/sub state directly in Redis

Because pub/sub has no keyspace, `KEYS`/`SCAN` won't show you anything. Use the introspection commands instead:

```bash
# Which channels currently have at least one exact-match subscriber?
redis-cli pubsub channels '*'

# How many subscribers does each channel have?
redis-cli pubsub numsub orders:new notifications:billing chat:lobby

# How many active pattern subscriptions across the whole server?
redis-cli pubsub numpat

# Subscribe interactively from the CLI to watch traffic on a pattern
redis-cli psubscribe 'orders:*'
```

`redis-cli` in subscribe mode only exits with `Ctrl-C` — it can't issue any other commands while subscribed.

## Learn more

This example uses the following Redis commands:

* [`PUBLISH`]({{< relref "/commands/publish" >}}) to fan a message out to every subscriber of a channel.
* [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) and [`UNSUBSCRIBE`]({{< relref "/commands/unsubscribe" >}}) for exact-match topic subscriptions.
* [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) and [`PUNSUBSCRIBE`]({{< relref "/commands/punsubscribe" >}}) for glob-style pattern subscriptions.
* [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}) to list channels with at least one active exact-match subscriber.
* [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}) to count subscribers per named channel.
* [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) to count active pattern subscriptions server-wide.

See the [`redis-py` documentation]({{< relref "/develop/clients/redis-py" >}}) for full client reference, including the [`PubSub` class](https://redis.readthedocs.io/en/stable/advanced_features.html#publish-subscribe) and the `run_in_thread()` dispatch helper.
