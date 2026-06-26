---
aliases:
- /develop/use-cases/pub-sub/node-redis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement Redis pub/sub messaging in Node.js with node-redis
linkTitle: node-redis example (Node.js)
title: Redis pub/sub with node-redis
weight: 2
---

This guide shows you how to implement a Redis-backed pub/sub broadcaster in Node.js with [`node-redis`]({{< relref "/develop/clients/nodejs" >}}). It includes a small local web server built with the Node.js standard `http` module so you can publish messages to named channels, add and remove subscribers live, and watch Redis fan out each message to every interested listener.

## Overview

Pub/sub lets your application broadcast events — chat messages, cache invalidation signals, presence updates, notifications — to many consumers without per-pair wiring. The publisher names a *channel*; every client currently subscribed to that channel receives the message, in publish order, with sub-millisecond fan-out.

That gives you:

* Many-to-many event delivery with no message storage cost in Redis
* Exact-match subscriptions (`SUBSCRIBE orders:new`) for known topics
* Pattern subscriptions (`PSUBSCRIBE notifications:*`) for whole topic hierarchies
* Live server-side introspection through `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, and `PUBSUB NUMPAT`
* At-most-once delivery: subscribers that are offline when a message is published miss it, so durable state should live in keys or a Stream, not in the pub/sub channel itself

In this example, the publisher side calls `PUBLISH` with a JSON-encoded body and counts how many subscribers Redis reported delivering to. Each in-process subscriber owns its own Redis connection (obtained via `client.duplicate()`) and a listener callback that handles every delivered message.

## How it works

The flow looks like this:

1. The application calls `hub.subscribe(name, channels)` or `hub.psubscribe(name, patterns)`
2. The helper duplicates the hub's Redis client to get a dedicated subscribe-mode connection, then binds each target to a dispatch callback via `client.subscribe(channel, listener)` or `client.pSubscribe(pattern, listener)`
3. The application (or another process) calls `hub.publish(channel, message)`
4. Redis fans the message out over every subscribing client's open socket
5. Each subscriber's listener wraps the raw message as a `ReceivedMessage`, appends it to a per-subscriber ring buffer, and invokes the optional callback
6. The publisher receives the integer subscriber count back from `PUBLISH`, which is the number of clients Redis delivered to right then

Pattern subscriptions match channels by glob (`*`, `?`, `[abc]`). A single message that matches both an exact subscription and a pattern subscription is delivered twice — once to the exact subscriber and once to the pattern subscriber.

## The pub/sub hub helper

The `RedisPubSubHub` class wraps the publish, subscribe, and introspection operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/pub-sub/nodejs/pubsub_hub.js)):

```javascript
const { createClient } = require("redis");
const { RedisPubSubHub } = require("./pubsub_hub");

const client = createClient({ url: "redis://localhost:6379" });
await client.connect();
const hub = new RedisPubSubHub(client);

// Exact-match subscriber
await hub.subscribe("orders-listener", ["orders:new"]);

// Pattern subscriber covering an entire topic hierarchy
await hub.psubscribe("all-notifications", ["notifications:*"]);

// Publish — returns Redis' delivered count for this PUBLISH
const delivered = await hub.publish("orders:new", { order_id: 42, total: 199.0 });
console.log(`Redis delivered to ${delivered} subscriber(s)`);

// Look at what each subscriber received
for (const sub of hub.subscriptions()) {
  console.log(sub.name, sub.receivedTotal(), "messages");
  for (const message of sub.messages(5)) {
    console.log("  ", message.channel, message.payload);
  }
}

await hub.unsubscribe("orders-listener");
await hub.shutdown(); // closes every remaining subscription
```

### Data model

Pub/sub has no Redis keyspace footprint of its own — channels are server-side routing entries, not stored values. The hub keeps its own bookkeeping in process memory:

```text
RedisPubSubHub                          (in-process)
  subscriptions             Map<string, Subscription>
  published_total           number
  delivered_total           number
  channel_published         Map<channel, count>

Subscription                            (in-process, one per subscriber)
  name                      string
  targets                   string[]      (channels or patterns)
  isPattern                 boolean
  buffer                    ReceivedMessage[]  (capped, default 50)
  received                  number
  client                    RedisClient        (dedicated, subscribe-mode)
```

The implementation uses:

* [`PUBLISH`]({{< relref "/commands/publish" >}}) to fan a JSON-encoded message out to every subscriber of a channel
* [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) for exact-match subscribers
* [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) for glob-style pattern subscribers
* [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}) to list the channels with at least one active exact-match subscriber
* [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}) to count subscribers per channel
* [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) to count active pattern subscriptions server-wide
* node-redis 5.x's listener-based `subscribe` / `pSubscribe` API to dispatch messages without writing a polling loop by hand

## Publishing messages

`publish()` JSON-encodes the message body, calls `PUBLISH`, and updates the per-channel publish counter:

```javascript
async publish(channel, message) {
  const payload = JSON.stringify(message);
  const delivered = Number(await this.redis.publish(channel, payload));
  this._published_total += 1;
  this._delivered_total += delivered;
  this._channel_published.set(
    channel,
    (this._channel_published.get(channel) || 0) + 1,
  );
  return delivered;
}
```

The integer returned by `PUBLISH` is what Redis itself reports — the number of subscribers (direct and pattern) that received the message in that call. It's a useful sanity check that the channel name is actually being listened to: a steady stream of `0`s means you have a typo somewhere or your subscriber crashed.

## Subscribing to channels

`subscribe()` creates a named in-process `Subscription` that owns its own connection and listener:

```javascript
async subscribe(name, channels, onMessage = null) {
  return this._register(name, channels, false, onMessage);
}
```

Inside `Subscription._connect`, the helper duplicates the hub's client to get a dedicated connection and registers a listener for each target:

```javascript
this._client = hubClient.duplicate();
await this._client.connect();
for (const channel of this.targets) {
  await this._client.subscribe(channel, (message, channel) =>
    this._dispatch(message, channel),
  );
}
```

A few details matter here:

* **Each `Subscription` owns its own connection.** In node-redis 5.x, a client used for `subscribe` / `pSubscribe` is in subscribe-only mode for the lifetime of those bindings — regular commands (`GET`, `SET`, …) on the same client will throw. The hub keeps one regular client for `PUBLISH` and the `PUBSUB *` introspection commands; every subscription duplicates it to get a fresh socket.
* **The listener receives `(message, channel)` already decoded as strings.** Pass `bufferMode = true` as the third argument if you need raw `Buffer`s instead — the demo doesn't.
* **Closing one subscription doesn't affect another.** Each `Subscription.close()` unsubscribes its own connection and then `quit()`s it; the hub's regular client and every other subscription keep going.

## Pattern subscriptions with PSUBSCRIBE

`psubscribe()` works the same way but routes messages through `PSUBSCRIBE` so each binding is a glob, not a literal channel name:

```javascript
await hub.psubscribe("all-notifications", ["notifications:*"]);
await hub.psubscribe("cache-invalidator", ["cache:invalidate:*"]);
```

For pattern subscriptions the dispatch callback needs to know both the matched channel and the originating pattern. node-redis only delivers `(message, channel)` to the listener, so the helper binds the pattern explicitly via a closure:

```javascript
for (const pattern of this.targets) {
  await this._client.pSubscribe(pattern, (message, channel) => {
    this._dispatch(message, channel, pattern);
  });
}
```

That distinction is useful for routing: a pattern subscriber can do one thing for the whole hierarchy (e.g., increment a counter) and dispatch on the specific channel within its callback (e.g., "invalidate this region's cache").

## Inspecting active subscribers

Redis exposes a small set of pub/sub introspection commands that report on subscriber state without traversing any keyspace:

```javascript
await hub.activeChannels();                 // PUBSUB CHANNELS *
await hub.channelSubscriberCounts(channels); // PUBSUB NUMSUB ch1 ch2 ...
await hub.patternSubscriberCount();          // PUBSUB NUMPAT
```

`PUBSUB CHANNELS` only reports channels with at least one exact-match subscriber — pattern subscribers do not appear here. That's a deliberate Redis design choice: a glob like `*` would otherwise show up as a subscriber to every conceivable channel. `PUBSUB NUMPAT` covers the pattern side as a single global count.

## Stats and history

`stats()` reports publish and receive counters plus the size of the subscription registry:

```javascript
async stats() {
  const subs = this.subscriptions();
  const received_total = subs.reduce((sum, s) => sum + s.receivedTotal(), 0);
  const channel_published = {};
  for (const [channel, count] of this._channel_published.entries()) {
    channel_published[channel] = count;
  }
  return {
    published_total: this._published_total,
    delivered_total: this._delivered_total,
    received_total,
    active_subscriptions: subs.length,
    channel_published,
    pattern_subscriptions: await this.patternSubscriberCount(),
  };
}
```

`delivered_total` is what Redis itself counted; `received_total` is what this process's in-memory subscribers saw. In a single-process demo they should track each other closely — a sustained divergence usually means a listener threw, or a subscriber crashed while a publisher kept publishing. (Pub/sub is at-most-once: if your subscriber wasn't connected at publish time, the message is gone.)

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work for plain `PUBLISH`/`SUBSCRIBE`; `PUBSUB NUMPAT` is older than that.
* Node.js 18 or later.
* The [`node-redis`](https://github.com/redis/node-redis) client at version 5.x. The demo's `package.json` declares `"redis": "^5.0.0"`.

## Running the demo

### Get the source files

The demo consists of three files. Download them from the [`nodejs` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/pub-sub/nodejs) on GitHub, or grab them with `curl`:

```bash
mkdir pub-sub-demo && cd pub-sub-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/pub-sub/nodejs
curl -O $BASE/package.json
curl -O $BASE/pubsub_hub.js
curl -O $BASE/demo_server.js
npm install
```

### Start the demo server

From that directory:

```bash
node demo_server.js
```

You should see:

```text
Redis pub/sub demo server listening on http://127.0.0.1:8096
Using Redis at localhost:6379
Seeded 3 default subscription(s)
```

Open [http://127.0.0.1:8096](http://127.0.0.1:8096) in a browser. You can:

* Publish messages of any text to any channel name in any batch size.
* Add named subscribers that listen on either a specific channel (`orders:new`) or a glob pattern (`notifications:*`). A single subscriber can listen on multiple targets — enter them comma-separated.
* Watch each subscriber's incoming-message panel update every 800 ms.
* See the server-side view: `PUBSUB CHANNELS` lists exact-match channels with subscribers, `PUBSUB NUMSUB` gives per-channel counts, and `PUBSUB NUMPAT` counts active pattern subscriptions.
* Click **Reset** to drop every subscription, zero the counters, and re-seed the three default subscribers.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`. Use `--port` to change the HTTP listen port.

## Production usage

### Pub/sub is at-most-once — pair it with durable state if you need replay

A subscriber that's offline when a message is published misses it permanently. For events you can't afford to lose, write the durable record (the order row, the cache key version, the audit log entry) to its primary store, then `PUBLISH` a notification so live consumers can pick it up immediately. On reconnect, consumers reconcile by reading the durable store, not by waiting for missed pub/sub messages. If you actually need replay or at-least-once delivery, switch to [Redis Streams]({{< relref "/develop/data-types/streams" >}}) with consumer groups.

### Use a dedicated connection per subscriber

A node-redis client used for `subscribe` / `pSubscribe` is in subscribe-only mode for the lifetime of those bindings: ordinary commands (`GET`, `HSET`, …) on the same client throw. Always duplicate the client — as the helper does with `client.duplicate()` — so each subscriber has its own socket. Sharing one subscriber socket across unrelated callers couples their lifetimes (unsubscribing one drops the channel for the others) and serialises every listener on a single connection's event loop.

### Choose a topic naming convention up front

A flat namespace gets ugly fast — `email`, `email_high_priority`, `email_high_priority_billing`. Pick a colon-separated hierarchy (`notifications:billing:invoice`, `cache:invalidate:products:p-001`) so consumers can subscribe at the right level: a billing service uses `notifications:billing:*`, the audit logger uses `notifications:*`. Glob patterns are evaluated for every published message, so don't go wild with multiple wildcards on hot paths — `*:*:*` matches everything and costs more than a flat `notifications:*` would.

### Don't do heavy work in the listener callback

node-redis dispatches incoming messages on the event loop. If your listener does synchronous heavy work (big JSON parse, sync crypto, blocking computation), the next message waits behind it and the subscriber's effective throughput drops to whatever the listener's latency is. For heavier work, the listener should push the message onto a worker queue or hand it off to an async pipeline — for true durable handoff, write it onto a [Redis Streams]({{< relref "/develop/data-types/streams" >}}) consumer group.

### Tune the subscriber buffer for your traffic shape

The demo caps each subscriber's in-memory message buffer at 50. That's right for showing the recent activity in a UI, but a real subscriber typically processes each message and discards it — the buffer is only there for human inspection. If you keep a buffer, make sure it's bounded; an unbounded array on a chatty pattern subscriber will eventually OOM the Node process.

### Reconnection and listener re-registration

node-redis 5.x reconnects automatically and re-registers active `subscribe` / `pSubscribe` listeners after the new connection is up, so you don't have to write the recovery path by hand. What it doesn't replay is messages that arrived during the disconnect — those are gone. If your consumers can't tolerate those gaps, treat pub/sub as the live-notification layer and reconcile from a durable source on every reconnect.

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

See the [`node-redis` documentation]({{< relref "/develop/clients/nodejs" >}}) for full client reference, including the [pub/sub guide](https://github.com/redis/node-redis/blob/master/docs/pub-sub.md) covering the listener-based `subscribe` / `pSubscribe` API and reconnection behaviour.
