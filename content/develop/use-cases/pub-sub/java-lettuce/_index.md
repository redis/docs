---
aliases:
- /develop/use-cases/pub-sub/lettuce
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement Redis pub/sub messaging in Java with Lettuce
linkTitle: Lettuce example (Java)
title: Redis pub/sub with Lettuce
weight: 5
---

This guide shows you how to implement a Redis-backed pub/sub broadcaster in Java with the [Lettuce]({{< relref "/develop/clients/lettuce" >}}) client library. It includes a small local web server built on the JDK's `com.sun.net.httpserver` so you can publish messages to named channels, add and remove subscribers live, and watch Redis fan out each message to every interested listener.

## Overview

Pub/sub lets your application broadcast events — chat messages, cache invalidation signals, presence updates, notifications — to many consumers without per-pair wiring. The publisher names a *channel*; every client currently subscribed to that channel receives the message, in publish order, with sub-millisecond fan-out.

That gives you:

* Many-to-many event delivery with no message storage cost in Redis
* Exact-match subscriptions (`SUBSCRIBE orders:new`) for known topics
* Pattern subscriptions (`PSUBSCRIBE notifications:*`) for whole topic hierarchies
* Live server-side introspection through `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, and `PUBSUB NUMPAT`
* At-most-once delivery: subscribers that are offline when a message is published miss it, so durable state should live in keys or a Stream, not in the pub/sub channel itself

In this example, the publisher side calls `PUBLISH` with a JSON-encoded body and counts how many subscribers Redis reported delivering to. Each in-process subscriber owns its own pub/sub connection and a Lettuce listener that pumps incoming messages into a callback.

## How it works

The flow looks like this:

1. The application calls `hub.subscribe(name, channels)` or `hub.psubscribe(name, patterns)`
2. The helper opens a dedicated `StatefulRedisPubSubConnection`, attaches a `RedisPubSubListener`, and issues `SUBSCRIBE` or `PSUBSCRIBE` on it
3. The application (or another process) calls `hub.publish(channel, message)`
4. Redis fans the message out over every subscribing client's open socket
5. Each subscriber's listener wraps the raw message as a `ReceivedMessage`, appends it to a per-subscriber ring buffer, and increments the received counter
6. The publisher receives the integer subscriber count back from `PUBLISH`, which is the number of clients Redis delivered to right then

Pattern subscriptions match channels by glob (`*`, `?`, `[abc]`). A single message that matches both an exact subscription and a pattern subscription is delivered twice — once through `RedisPubSubListener.message(channel, msg)` and once through `RedisPubSubListener.message(pattern, channel, msg)`.

## The pub/sub hub helper

The `RedisPubSubHub` class wraps the publish, subscribe, and introspection operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/pub-sub/java-lettuce/RedisPubSubHub.java)):

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;

import java.util.Arrays;

RedisClient client = RedisClient.create(
    RedisURI.builder().withHost("localhost").withPort(6379).build());
StatefulRedisConnection<String, String> connection = client.connect();
RedisPubSubHub hub = new RedisPubSubHub(client, connection);

// Exact-match subscriber.
hub.subscribe("orders-listener", Arrays.asList("orders:new"));

// Pattern subscriber covering an entire topic hierarchy.
hub.psubscribe("all-notifications", Arrays.asList("notifications:*"));

// Publish — returns Redis' delivered count for this PUBLISH.
java.util.Map<String, Object> payload = new java.util.LinkedHashMap<>();
payload.put("order_id", 42);
payload.put("total", 199.0);
int delivered = hub.publish("orders:new", payload);
System.out.printf("Redis delivered to %d subscriber(s)%n", delivered);

// Look at what each subscriber received.
for (RedisPubSubHub.Subscription sub : hub.subscriptions()) {
    System.out.println(sub.name() + " " + sub.receivedTotal() + " messages");
    for (RedisPubSubHub.ReceivedMessage m : sub.messages(5)) {
        System.out.println("  " + m.channel + " " + m.payload);
    }
}

hub.unsubscribe("orders-listener");
hub.shutdown();  // closes every remaining subscription
connection.close();
client.shutdown();
```

### Data model

Pub/sub has no Redis keyspace footprint of its own — channels are server-side routing entries, not stored values. The hub keeps its own bookkeeping in process memory:

```text
RedisPubSubHub                                    (in-process)
  subscriptions             Map<String, Subscription>
  publishedTotal            AtomicLong
  deliveredTotal            AtomicLong
  channelPublished          Map<channel, Long>

Subscription                                      (in-process, one per subscriber)
  name                      String
  targets                   List<channel | pattern>
  isPattern                 boolean
  buffer                    Deque<ReceivedMessage>      (capped, default 50)
  received                  long
  psConnection              StatefulRedisPubSubConnection<String, String>
  listener                  RedisPubSubListener<String, String>
```

The implementation uses:

* [`PUBLISH`]({{< relref "/commands/publish" >}}) to fan a JSON-encoded message out to every subscriber of a channel
* [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) for exact-match subscribers
* [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) for glob-style pattern subscribers
* [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}) to list the channels with at least one active exact-match subscriber
* [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}) to count subscribers per channel
* [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) to count active pattern subscriptions server-wide
* Lettuce's `RedisPubSubListener` interface to dispatch messages without writing a thread loop by hand — messages are delivered on a Netty event-loop thread

## Publishing messages

`publish()` JSON-encodes the message body, calls `PUBLISH`, and updates the per-channel publish counter:

```java
public int publish(String channel, Object message) {
    String payload = JsonCodec.encode(message);
    long delivered = connection.sync().publish(channel, payload);
    publishedTotal.incrementAndGet();
    deliveredTotal.addAndGet(delivered);
    channelPublished.merge(channel, 1L, Long::sum);
    return (int) delivered;
}
```

The integer returned by `PUBLISH` is what Redis itself reports — the number of subscribers (direct and pattern) that received the message in that call. It's a useful sanity check that the channel name is actually being listened to: a steady stream of `0`s means you have a typo somewhere or your subscriber crashed.

Publishing reuses the shared `StatefulRedisConnection`, which is thread-safe for individual commands, so concurrent HTTP handlers can publish without coordination.

## Subscribing to channels

`subscribe()` creates a named in-process `Subscription` that owns its own pub/sub connection:

```java
public Subscription subscribe(String name, List<String> channels) {
    return register(name, channels, false);
}
```

Inside the `Subscription` constructor, the helper opens a dedicated pub/sub connection, registers a listener, then issues `SUBSCRIBE`:

```java
this.psConnection = client.connectPubSub();

this.psConnection.addListener(new RedisPubSubListener<String, String>() {
    @Override public void message(String channel, String msg) {
        record(channel, null, msg);
    }
    @Override public void message(String pattern, String channel, String msg) {
        record(channel, pattern, msg);
    }
    @Override public void subscribed(String channel, long count) {}
    @Override public void psubscribed(String pattern, long count) {}
    @Override public void unsubscribed(String channel, long count) {}
    @Override public void punsubscribed(String pattern, long count) {}
});

if (isPattern) {
    psConnection.sync().psubscribe(targets.toArray(new String[0]));
} else {
    psConnection.sync().subscribe(targets.toArray(new String[0]));
}
```

A few details matter here:

* Each `Subscription` gets its own `StatefulRedisPubSubConnection` (and therefore its own Redis socket). Lettuce switches a pub/sub connection into subscribe-only mode after the first `SUBSCRIBE` or `PSUBSCRIBE`, so sharing one across business-logic subscribers would couple their lifetimes — closing one would close the channel for the others.
* `RedisPubSubListener` overloads `message()` twice: the two-argument form for plain `SUBSCRIBE` deliveries and the three-argument form for `PSUBSCRIBE` deliveries that carry the originating pattern. The helper routes both into a single `record()` method that writes into a bounded ring buffer.
* Messages arrive on a Netty event-loop thread, not on the calling HTTP handler thread. The buffer is guarded with a `synchronized` block so a polling `/state` request can read it safely while a publish is in flight.
* The constructor uses Lettuce's `sync()` API (not `async()`) so it blocks until Redis acknowledges the SUBSCRIBE for every channel before the `Subscription` is handed back to the caller. With the unawaited `async()` variant, a `PUBLISH` issued immediately after subscribing could race ahead of the acknowledgement and the first message would be lost.

## Pattern subscriptions with PSUBSCRIBE

`psubscribe()` works the same way but routes messages through `PSUBSCRIBE` so each binding is a glob, not a literal channel name:

```java
hub.psubscribe("all-notifications", Arrays.asList("notifications:*"));
hub.psubscribe("cache-invalidator", Arrays.asList("cache:invalidate:*"));
```

When a published channel matches a pattern, Lettuce dispatches through the three-argument `message(String pattern, String channel, String body)` overload and the helper records both the matched channel and the original pattern:

```java
@Override
public void message(String pattern, String channel, String msg) {
    record(channel, pattern, msg);  // exact subscriptions pass null for pattern
}
```

That distinction is useful for routing: a pattern subscriber can do one thing for the whole hierarchy (e.g., increment a counter) and dispatch on the specific channel within its callback (e.g., "invalidate this region's cache").

## Inspecting active subscribers

Redis exposes a small set of pub/sub introspection commands that report on subscriber state without traversing any keyspace:

```java
hub.activeChannels("*");                                            // PUBSUB CHANNELS *
hub.channelSubscriberCounts(Arrays.asList("orders:new"));            // PUBSUB NUMSUB ...
hub.patternSubscriberCount();                                        // PUBSUB NUMPAT
```

Lettuce exposes these as ordinary commands on `RedisCommands`: `pubsubChannels(pattern)`, `pubsubNumsub(channels...)`, and `pubsubNumpat()`. The helper runs each one against the shared `StatefulRedisConnection`.

`PUBSUB CHANNELS` only reports channels with at least one exact-match subscriber — pattern subscribers do not appear here. That's a deliberate Redis design choice: a glob like `*` would otherwise show up as a subscriber to every conceivable channel. `PUBSUB NUMPAT` covers the pattern side as a single global count.

## Stats and history

`stats()` reports publish and receive counters plus the size of the subscription registry:

```java
public Map<String, Object> stats() {
    List<Subscription> subs = subscriptions();
    long received = 0;
    for (Subscription sub : subs) received += sub.receivedTotal();
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("published_total", publishedTotal.get());
    out.put("delivered_total", deliveredTotal.get());           // sum of PUBLISH return values
    out.put("received_total", received);
    out.put("active_subscriptions", (long) subs.size());
    out.put("channel_published", new LinkedHashMap<>(channelPublished));
    out.put("pattern_subscriptions", patternSubscriberCount());
    return out;
}
```

`delivered_total` is what Redis itself counted; `received_total` is what this process's in-memory subscribers saw. In a single-process demo they should track each other closely — a sustained divergence usually means a listener threw, or a subscriber's pub/sub connection dropped while a publisher kept publishing. (Pub/sub is at-most-once: if your subscriber wasn't connected at publish time, the message is gone.)

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work for plain `PUBLISH`/`SUBSCRIBE`; `PUBSUB NUMPAT` is older than that.
* JDK 11 or later.
* The Lettuce JAR (6.1 or later) and its Netty + Reactor dependencies on your classpath. Get them from [Maven Central](https://repo1.maven.org/maven2/io/lettuce/lettuce-core/), or via Maven/Gradle in a project setup.

## Running the demo

### Get the source files

The demo consists of two Java files. Download them from the [`java-lettuce` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/pub-sub/java-lettuce) on GitHub, or grab them with `curl`:

```bash
mkdir pub-sub-demo && cd pub-sub-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/pub-sub/java-lettuce
curl -O $BASE/RedisPubSubHub.java
curl -O $BASE/DemoServer.java
```

You also need a `lib/` directory containing the Lettuce client and its runtime dependencies — at minimum:

* `lettuce-core-6.x.jar`
* `netty-buffer-4.1.x.jar`, `netty-codec-4.1.x.jar`, `netty-common-4.1.x.jar`, `netty-handler-4.1.x.jar`, `netty-resolver-4.1.x.jar`, `netty-transport-4.1.x.jar`, `netty-transport-native-unix-common-4.1.x.jar`
* `reactor-core-3.x.jar`, `reactive-streams-1.0.x.jar`

The simplest way to collect them is with Maven. Create a minimal `pom.xml` declaring `io.lettuce:lettuce-core` as the only dependency, then run `mvn dependency:copy-dependencies -DoutputDirectory=lib`.

### Start the demo server

From the directory containing `RedisPubSubHub.java`, `DemoServer.java`, and `lib/`:

```bash
javac -cp 'lib/*' RedisPubSubHub.java DemoServer.java
java -cp '.:lib/*' DemoServer --port 8099 --redis-host localhost --redis-port 6379
```

You should see:

```text
Redis pub/sub demo server listening on http://127.0.0.1:8099
Using Redis at localhost:6379
Seeded 3 default subscription(s)
```

Open [http://127.0.0.1:8099](http://127.0.0.1:8099) in a browser. You can:

* Publish messages of any text to any channel name in any batch size.
* Add named subscribers that listen on either a specific channel (`orders:new`) or a glob pattern (`notifications:*`). A single subscriber can listen on multiple targets — enter them comma-separated.
* Watch each subscriber's incoming-message panel update every 800 ms.
* See the server-side view: `PUBSUB CHANNELS` lists exact-match channels with subscribers, `PUBSUB NUMSUB` gives per-channel counts, and `PUBSUB NUMPAT` counts active pattern subscriptions.
* Click **Reset** to drop every subscription, zero the counters, and re-seed the three default subscribers.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Production usage

### Pub/sub is at-most-once — pair it with durable state if you need replay

A subscriber that's offline when a message is published misses it permanently. For events you can't afford to lose, write the durable record (the order row, the cache key version, the audit log entry) to its primary store, then `PUBLISH` a notification so live consumers can pick it up immediately. On reconnect, consumers reconcile by reading the durable store, not by waiting for missed pub/sub messages. If you actually need replay or at-least-once delivery, switch to [Redis Streams]({{< relref "/develop/data-types/streams" >}}) with consumer groups.

### Use a separate `StatefulRedisPubSubConnection` per subscriber

Lettuce switches a pub/sub connection into subscribe-only mode after `SUBSCRIBE` or `PSUBSCRIBE`: ordinary commands (`GET`, `HSET`, etc.) on that connection will block or fail. Always create the pub/sub connection from `RedisClient.connectPubSub()` — separate from the connection you use for `PUBLISH` and other commands — and give every business-logic subscriber its own. Sharing one pub/sub connection across subscribers couples their lifetimes (closing one closes the channel for the others) and serialises listener invocations on a single Netty event-loop thread.

### Don't do heavy work inside the listener callback

`RedisPubSubListener.message()` runs on a Netty event-loop thread. If your listener blocks (synchronous HTTP call, big computation, slow JDBC write), it parks an I/O thread that should be handling other connections, and the next message on the same socket waits behind it. For heavier work, the listener should hand the message off to an `ExecutorService` worker pool, a `BlockingQueue`, or — for true durable handoff — a [Redis Streams]({{< relref "/develop/data-types/streams" >}}) consumer group.

### Choose a topic naming convention up front

A flat namespace gets ugly fast — `email`, `email_high_priority`, `email_high_priority_billing`. Pick a colon-separated hierarchy (`notifications:billing:invoice`, `cache:invalidate:products:p-001`) so consumers can subscribe at the right level: a billing service uses `notifications:billing:*`, the audit logger uses `notifications:*`. Glob patterns are evaluated for every published message, so don't go wild with multiple wildcards on hot paths — `*:*:*` matches everything and costs more than a flat `notifications:*` would.

### Tune the subscriber buffer for your traffic shape

The demo caps each subscriber's in-memory message buffer at 50 entries. That's right for showing the recent activity in a UI, but a real subscriber typically processes each message and discards it — the buffer is only there for human inspection. If you keep a buffer, make sure it's bounded; an unbounded ring on a chatty pattern subscriber will eventually OOM the process.

### Sharded pub/sub on a Redis Cluster

On a Redis Cluster, plain `PUBLISH` fans every message out to every node via the cluster bus, which becomes a hotspot at high throughput. Redis 7.0 added [sharded pub/sub]({{< relref "/develop/pubsub#sharded-pubsub" >}}): channels are hashed to slots, and `SPUBLISH` / `SSUBSCRIBE` only touch the shard that owns the slot. Lettuce exposes these as `spublish()` and `ssubscribe()` on the cluster connection. If you're scaling pub/sub on a cluster, prefer the sharded commands and pick channel names whose hash distribution matches your traffic.

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

See the [Lettuce guide]({{< relref "/develop/clients/lettuce" >}}) for full client reference, including the `StatefulRedisPubSubConnection` and `RedisPubSubListener` types used in this example.
