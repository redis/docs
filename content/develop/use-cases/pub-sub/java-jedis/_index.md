---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement Redis pub/sub messaging in Java with Jedis
linkTitle: Jedis example (Java)
title: Redis pub/sub with Jedis
weight: 4
---

This guide shows you how to implement a Redis-backed pub/sub broadcaster in Java with [`Jedis`]({{< relref "/develop/clients/jedis" >}}). It includes a small local web server built with Java's built-in `HttpServer` so you can publish messages to named channels, add and remove subscribers live, and watch Redis fan out each message to every interested listener.

## Overview

Pub/sub lets your application broadcast events — chat messages, cache invalidation signals, presence updates, notifications — to many consumers without per-pair wiring. The publisher names a *channel*; every client currently subscribed to that channel receives the message, in publish order, with sub-millisecond fan-out.

That gives you:

* Many-to-many event delivery with no message storage cost in Redis
* Exact-match subscriptions (`SUBSCRIBE orders:new`) for known topics
* Pattern subscriptions (`PSUBSCRIBE notifications:*`) for whole topic hierarchies
* Live server-side introspection through `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, and `PUBSUB NUMPAT`
* At-most-once delivery: subscribers that are offline when a message is published miss it, so durable state should live in keys or a Stream, not in the pub/sub channel itself

In this example, the publisher side calls `PUBLISH` with a JSON-encoded body and counts how many subscribers Redis reported delivering to. Each in-process subscriber owns its own `Jedis` connection from the pool and a dedicated worker thread that pumps incoming messages into a buffer.

## How it works

The flow looks like this:

1. The application calls `hub.subscribe(name, channels)` or `hub.psubscribe(name, patterns)`
2. The helper acquires a dedicated `Jedis` connection from the pool, builds a `JedisPubSub` listener, and starts a daemon thread that calls `jedis.subscribe(listener, channels...)` (or `psubscribe(...)`) — both calls block for the lifetime of the subscription
3. The application (or another process) calls `hub.publish(channel, message)`
4. Redis fans the message out over every subscribing client's open socket
5. The listener's `onMessage` (or `onPMessage`) callback fires on the subscriber thread, wraps the raw message as a `ReceivedMessage`, and appends it to a per-subscriber ring buffer
6. The publisher receives the integer subscriber count back from `PUBLISH`, which is the number of clients Redis delivered to right then

Pattern subscriptions match channels by glob (`*`, `?`, `[abc]`). A single message that matches both an exact subscription and a pattern subscription is delivered twice — once as an `onMessage` and once as an `onPMessage`.

## The pub/sub hub helper

The `RedisPubSubHub` class wraps the publish, subscribe, and introspection operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/pub-sub/java-jedis/RedisPubSubHub.java)):

```java
import java.util.List;
import java.util.Map;
import redis.clients.jedis.JedisPool;

public class Main {
    public static void main(String[] args) {
        JedisPool pool = new JedisPool("localhost", 6379);
        RedisPubSubHub hub = new RedisPubSubHub(pool);

        // Exact-match subscriber
        hub.subscribe("orders-listener", List.of("orders:new"));

        // Pattern subscriber covering an entire topic hierarchy
        hub.psubscribe("all-notifications", List.of("notifications:*"));

        // Publish — returns Redis' delivered count for this PUBLISH
        int delivered = hub.publish("orders:new", Map.of("order_id", 42, "total", 199.0));
        System.out.printf("Redis delivered to %d subscriber(s)%n", delivered);

        // Look at what each subscriber received
        for (RedisPubSubHub.Subscription sub : hub.subscriptions()) {
            System.out.printf("%s %d messages%n", sub.name(), sub.receivedTotal());
            for (RedisPubSubHub.ReceivedMessage m : sub.messages(5)) {
                System.out.printf("   %s %s%n", m.channel(), m.payload());
            }
        }

        hub.unsubscribe("orders-listener");
        hub.shutdown();  // closes every remaining subscription
    }
}
```

### Data model

Pub/sub has no Redis keyspace footprint of its own — channels are server-side routing entries, not stored values. The hub keeps its own bookkeeping in process memory:

```text
RedisPubSubHub                          (in-process)
  subscriptions             Map<String, Subscription>
  publishedTotal            AtomicLong
  deliveredTotal            AtomicLong
  channelPublished          Map<String, Long>      (per-channel publish counts)

Subscription                            (in-process, one per subscriber)
  name                      String
  targets                   List<String>            (channels or patterns)
  isPattern                 boolean
  buffer                    Deque<ReceivedMessage>  (capped, default 50)
  received                  long
  listener                  JedisPubSub             (subscribed on its own connection)
  thread                    Thread                  (blocks inside jedis.subscribe())
```

The implementation uses:

* [`PUBLISH`]({{< relref "/commands/publish" >}}) to fan a JSON-encoded message out to every subscriber of a channel
* [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) for exact-match subscribers
* [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) for glob-style pattern subscribers
* [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}) to list the channels with at least one active exact-match subscriber
* [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}) to count subscribers per channel
* [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) to count active pattern subscriptions server-wide
* Jedis' `JedisPubSub` listener subclass plus a dedicated daemon thread per subscriber so the blocking `subscribe()`/`psubscribe()` call does not freeze the rest of the application

## Publishing messages

`publish()` JSON-encodes the message body, calls `PUBLISH`, and updates the per-channel publish counter:

```java
public int publish(String channel, Object message) {
    String payload = JsonUtil.toJson(message);
    long delivered;
    try (Jedis jedis = pool.getResource()) {
        delivered = jedis.publish(channel, payload);
    }
    publishedTotal.incrementAndGet();
    deliveredTotal.addAndGet(delivered);
    channelPublished.merge(channel, 1L, Long::sum);
    return (int) delivered;
}
```

The integer returned by `PUBLISH` is what Redis itself reports — the number of subscribers (direct and pattern) that received the message in that call. It's a useful sanity check that the channel name is actually being listened to: a steady stream of `0`s means you have a typo somewhere or your subscriber crashed.

## Subscribing to channels

`subscribe()` creates a named in-process `Subscription` that owns its own `Jedis` connection and a dedicated worker thread:

```java
public Subscription subscribe(String name, List<String> channels) {
    return register(name, channels, false);
}
```

Inside the `Subscription` constructor, the helper builds a `JedisPubSub` listener and starts the dispatch thread:

```java
this.jedis = pool.getResource();

this.listener = new JedisPubSub() {
    @Override
    public void onMessage(String channel, String message) {
        dispatch(channel, null, message);
    }
    @Override
    public void onPMessage(String pattern, String channel, String message) {
        dispatch(channel, pattern, message);
    }
};

final String[] targetArr = this.targets.toArray(new String[0]);
this.thread = new Thread(() -> {
    if (isPattern) {
        jedis.psubscribe(listener, targetArr);
    } else {
        jedis.subscribe(listener, targetArr);
    }
}, "pubsub-" + name);
this.thread.setDaemon(true);
this.thread.start();
```

A few details matter here:

* `jedis.subscribe(...)` and `jedis.psubscribe(...)` **block the calling thread** until the listener unsubscribes from every target. Running each subscription on its own thread is the only way to keep the rest of the application responsive — there is no "run in background" helper in Jedis.
* Each `Subscription` gets its own `Jedis` connection from the pool. A connection that has issued `SUBSCRIBE` or `PSUBSCRIBE` is switched into subscribe-only mode, so other commands on the same connection would fail. Sharing one connection across subscribers would also couple their lifetimes — unsubscribing one would tear down the channel for the others.
* The `JedisPubSub` listener is the same object on both threads: it's safe to call `listener.unsubscribe()` from a different thread because Jedis ships the unsubscribe command back over the listener's own socket. After the unsubscribe round-trip completes, the blocking `subscribe()` call returns and the worker thread exits.

## Pattern subscriptions with PSUBSCRIBE

`psubscribe()` works the same way but routes messages through `PSUBSCRIBE` so each binding is a glob, not a literal channel name:

```java
hub.psubscribe("all-notifications", List.of("notifications:*"));
hub.psubscribe("cache-invalidator", List.of("cache:invalidate:*"));
```

When a published channel matches a pattern, the `onPMessage` callback receives both the matched channel and the original pattern:

```java
@Override
public void onPMessage(String pattern, String channel, String message) {
    dispatch(channel, pattern, message);
}
```

That distinction is useful for routing: a pattern subscriber can do one thing for the whole hierarchy (e.g., increment a counter) and dispatch on the specific channel within its callback (e.g., "invalidate this region's cache").

## Inspecting active subscribers

Redis exposes a small set of pub/sub introspection commands that report on subscriber state without traversing any keyspace:

```java
hub.activeChannels("*");                  // PUBSUB CHANNELS *
hub.channelSubscriberCounts(channels);    // PUBSUB NUMSUB ch1 ch2 ...
hub.patternSubscriberCount();             // PUBSUB NUMPAT
```

`PUBSUB CHANNELS` only reports channels with at least one exact-match subscriber — pattern subscribers do not appear here. That's a deliberate Redis design choice: a glob like `*` would otherwise show up as a subscriber to every conceivable channel. `PUBSUB NUMPAT` covers the pattern side as a single global count.

Each of these commands acquires a regular (non-subscribe) `Jedis` connection from the pool with try-with-resources, so the bookkeeping calls never compete with the dedicated subscriber connections.

## Stats and history

`stats()` reports publish and receive counters plus the size of the subscription registry:

```java
public Map<String, Object> stats() {
    List<Subscription> subs = subscriptions();
    long receivedTotal = 0;
    for (Subscription sub : subs) {
        receivedTotal += sub.receivedTotal();
    }
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("published_total", publishedTotal.get());
    out.put("delivered_total", deliveredTotal.get());          // sum of PUBLISH return values
    out.put("received_total", receivedTotal);
    out.put("active_subscriptions", (long) subs.size());
    out.put("channel_published", new LinkedHashMap<>(channelPublished));
    out.put("pattern_subscriptions", patternSubscriberCount());
    return out;
}
```

`delivered_total` is what Redis itself counted; `received_total` is what this process's in-memory subscribers saw. In a single-process demo they should track each other closely — a sustained divergence usually means a callback raised, or a subscriber crashed while a publisher kept publishing. (Pub/sub is at-most-once: if your subscriber wasn't connected at publish time, the message is gone.)

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work for plain `PUBLISH`/`SUBSCRIBE`; `PUBSUB NUMPAT` is older than that.
* Java 17 or later.
* Jedis 5.x on the classpath. The smallest workable classpath is the Jedis jar plus its two transitive dependencies, `commons-pool2` and `slf4j-api`.

If you use Maven:

```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>5.1.2</version>
</dependency>
```

If you use Gradle:

```groovy
implementation 'redis.clients:jedis:5.1.2'
```

## Running the demo

### Get the source files

The demo consists of three Java source files. Download them from the [`java-jedis` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/pub-sub/java-jedis) on GitHub, or grab them with `curl`:

```bash
mkdir pub-sub-demo && cd pub-sub-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/pub-sub/java-jedis
curl -O $BASE/RedisPubSubHub.java
curl -O $BASE/DemoServer.java
curl -O $BASE/JsonUtil.java
```

You also need the three jars on the classpath. Grab them from [Maven Central](https://search.maven.org/) — search for `jedis`, `commons-pool2`, and `slf4j-api`, then download each jar from the artefact page — or copy them out of an existing local `~/.m2/repository` checkout if you've used these libraries before:

* `jedis-5.1.2.jar`
* `commons-pool2-2.12.0.jar`
* `slf4j-api-2.0.13.jar`

(Any 5.x Jedis release works; the transitive versions of `commons-pool2` and `slf4j-api` are pinned by the Jedis POM, so use the versions listed in the Jedis 5.1.2 [Maven page](https://search.maven.org/artifact/redis.clients/jedis/5.1.2/jar) if you want an exact match. Other recent patch versions of either library work fine.)

### Start the demo server

A local demo server is included to show the hub in action ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/pub-sub/java-jedis/DemoServer.java)). Compile and run with `javac` and `java`, listing each jar on the classpath:

```bash
javac -cp jedis-5.1.2.jar:commons-pool2-2.12.0.jar:slf4j-api-2.0.13.jar \
      JsonUtil.java RedisPubSubHub.java DemoServer.java

java  -cp .:jedis-5.1.2.jar:commons-pool2-2.12.0.jar:slf4j-api-2.0.13.jar \
      DemoServer --port 8098
```

You should see:

```text
Redis pub/sub demo server listening on http://127.0.0.1:8098
Using Redis at localhost:6379
Seeded 3 default subscription(s)
```

Open [http://127.0.0.1:8098](http://127.0.0.1:8098) in a browser. You can:

* Publish messages of any text to any channel name in any batch size.
* Add named subscribers that listen on either a specific channel (`orders:new`) or a glob pattern (`notifications:*`). A single subscriber can listen on multiple targets — enter them comma-separated.
* Watch each subscriber's incoming-message panel update every 800 ms.
* See the server-side view: `PUBSUB CHANNELS` lists exact-match channels with subscribers, `PUBSUB NUMSUB` gives per-channel counts, and `PUBSUB NUMPAT` counts active pattern subscriptions.
* Click **Reset** to drop every subscription, zero the counters, and re-seed the three default subscribers.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Production usage

### Pub/sub is at-most-once — pair it with durable state if you need replay

A subscriber that's offline when a message is published misses it permanently. For events you can't afford to lose, write the durable record (the order row, the cache key version, the audit log entry) to its primary store, then `PUBLISH` a notification so live consumers can pick it up immediately. On reconnect, consumers reconcile by reading the durable store, not by waiting for missed pub/sub messages. If you actually need replay or at-least-once delivery, switch to [Redis Streams]({{< relref "/develop/data-types/streams" >}}) with consumer groups.

### Give every subscriber its own Jedis connection

A `Jedis` instance that has called `subscribe(...)` or `psubscribe(...)` is in subscribe-only mode: any other command on the same connection will fail. Always pull the subscriber's connection from the pool with `pool.getResource()` and dedicate it to that subscriber until it's torn down. The helper does this for you — every `Subscription` opens a fresh connection and owns it for the subscription's lifetime — but if you write your own subscriber code, the same rule applies.

A related corollary: never let the pool size cap your subscriber count. If you have 100 long-lived subscribers in one process, `JedisPoolConfig.setMaxTotal(...)` needs to allow at least 100 connections for the subscribers plus whatever your publishers and bookkeeping calls need. Set it generously; idle subscriber connections cost almost nothing on the Redis side.

### Unsubscribe through the listener, not the connection

`jedis.subscribe(listener, channels...)` blocks until the listener calls `listener.unsubscribe()` (or `listener.punsubscribe()` for a pattern subscription). It's safe to call those methods from any thread: Jedis ships the unsubscribe command back over the listener's socket, Redis acknowledges, and then the blocking `subscribe()` call returns and the worker thread exits.

Closing the underlying `Jedis` instance directly works as a fallback — the socket read errors out and the blocking call returns — but it's a less clean shutdown and produces a stack trace in the logs. The helper does both: it calls `listener.unsubscribe()` first, then closes the connection from the worker thread's `finally` block as a belt-and-braces guard.

### Choose a topic naming convention up front

A flat namespace gets ugly fast — `email`, `email_high_priority`, `email_high_priority_billing`. Pick a colon-separated hierarchy (`notifications:billing:invoice`, `cache:invalidate:products:p-001`) so consumers can subscribe at the right level: a billing service uses `notifications:billing:*`, the audit logger uses `notifications:*`. Glob patterns are evaluated for every published message, so don't go wild with multiple wildcards on hot paths — `*:*:*` matches everything and costs more than a flat `notifications:*` would.

### Don't do heavy work in `onMessage` / `onPMessage`

The `JedisPubSub` callbacks run on the subscriber thread that owns the connection. If a callback blocks (synchronous HTTP call, big computation, slow DB write), the next message waits behind it and the subscriber's effective throughput drops to whatever the callback's latency is. For heavier work, the callback should hand the message off to a worker pool (`Executors.newFixedThreadPool(...)`) or a queue, or — for true durable handoff — a [Redis Streams]({{< relref "/develop/data-types/streams" >}}) consumer group.

### Tune the subscriber buffer for your traffic shape

The demo caps each subscriber's in-memory message buffer at 50. That's right for showing the recent activity in a UI, but a real subscriber typically processes each message and discards it — the buffer is only there for human inspection. If you keep a buffer, make sure it's bounded; an unbounded ring on a chatty pattern subscriber will eventually OOM the process.

### Sharded pub/sub on a Redis Cluster

On a Redis Cluster, plain `PUBLISH` fans every message out to every node via the cluster bus, which becomes a hotspot at high throughput. Redis 7.0 added [sharded pub/sub]({{< relref "/develop/pubsub#sharded-pubsub" >}}): channels are hashed to slots, and `SPUBLISH` / `SSUBSCRIBE` only touch the shard that owns the slot. Jedis 5.x exposes `jedis.spublish(...)` and a `JedisShardedPubSub` listener subclass. If you're scaling pub/sub on a cluster, prefer the sharded commands and pick channel names whose hash distribution matches your traffic.

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

See the [Jedis documentation]({{< relref "/develop/clients/jedis" >}}) for full client reference, including the [`JedisPubSub` listener](https://github.com/redis/jedis/blob/master/src/main/java/redis/clients/jedis/JedisPubSub.java) abstract class.
