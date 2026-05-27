---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement Redis pub/sub messaging in C# with StackExchange.Redis
linkTitle: StackExchange.Redis example (C#)
title: Redis pub/sub with StackExchange.Redis
weight: 6
---

This guide shows you how to implement a Redis-backed pub/sub broadcaster in C# with [StackExchange.Redis](https://stackexchange.github.io/StackExchange.Redis/). It includes a small ASP.NET Core minimal-API web server so you can publish messages to named channels, add and remove subscribers live, and watch Redis fan out each message to every interested listener.

## Overview

Pub/sub lets your application broadcast events — chat messages, cache invalidation signals, presence updates, notifications — to many consumers without per-pair wiring. The publisher names a *channel*; every client currently subscribed to that channel receives the message, in publish order, with sub-millisecond fan-out.

That gives you:

* Many-to-many event delivery with no message storage cost in Redis
* Exact-match subscriptions (`SUBSCRIBE orders:new`) for known topics
* Pattern subscriptions (`PSUBSCRIBE notifications:*`) for whole topic hierarchies
* Live server-side introspection through `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, and `PUBSUB NUMPAT`
* At-most-once delivery: subscribers that are offline when a message is published miss it, so durable state should live in keys or a Stream, not in the pub/sub channel itself

In this example, the publisher side calls `PUBLISH` with a JSON-encoded body and counts how many subscribers Redis reported delivering to. Every subscriber's handler is wired to a single shared subscribe connection managed transparently by `ConnectionMultiplexer`.

## How it works

The flow looks like this:

1. The application calls `hub.Subscribe(name, channels)` or `hub.PSubscribe(name, patterns)`
2. The helper wraps each target in a `RedisChannel.Literal()` or `RedisChannel.Pattern()` value and attaches a handler via `ISubscriber.Subscribe(...)`
3. The application (or another process) calls `hub.Publish(channel, message)`
4. Redis fans the message out over the multiplexer's shared subscribe socket
5. The multiplexer routes each incoming message to every matching handler, where the helper wraps it as a `ReceivedMessage`, appends it to a per-subscription ring buffer, and bumps the received counter
6. The publisher receives the integer subscriber count back from `PUBLISH`, which is the number of clients Redis delivered to right then

Pattern subscriptions match channels by glob (`*`, `?`, `[abc]`). A single message that matches both an exact subscription and a pattern subscription is delivered twice — once to the channel handler and once to the pattern handler.

## The pub/sub hub helper

The `RedisPubSubHub` class wraps the publish, subscribe, and introspection operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/pub-sub/dotnet/RedisPubSubHub.cs)):

```csharp
using PubSubDemo;
using StackExchange.Redis;

var multiplexer = ConnectionMultiplexer.Connect("localhost:6379");
var hub = new RedisPubSubHub(multiplexer);

// Exact-match subscriber
hub.Subscribe("orders-listener", new[] { "orders:new" });

// Pattern subscriber covering an entire topic hierarchy
hub.PSubscribe("all-notifications", new[] { "notifications:*" });

// Publish — returns Redis' delivered count for this PUBLISH
var delivered = hub.Publish("orders:new",
    new { order_id = 42, total = 199.0 });
Console.WriteLine($"Redis delivered to {delivered} subscriber(s)");

// Look at what each subscriber received
foreach (var sub in hub.Subscriptions())
{
    Console.WriteLine($"{sub.Name} {sub.ReceivedTotal} messages");
    foreach (var msg in sub.Messages(limit: 5))
    {
        Console.WriteLine($"  {msg.Channel} {msg.Payload}");
    }
}

hub.Unsubscribe("orders-listener");
hub.Shutdown(); // closes every remaining subscription
```

### Data model

Pub/sub has no Redis keyspace footprint of its own — channels are server-side routing entries, not stored values. The hub keeps its own bookkeeping in process memory:

```text
RedisPubSubHub                          (in-process)
  _subscriptions            ConcurrentDictionary<string, Subscription>
  _publishedTotal           long
  _deliveredTotal           long
  _channelPublished         ConcurrentDictionary<string, long>

Subscription                            (in-process, one per subscriber)
  Name                      string
  Targets                   IReadOnlyList<string>
  IsPattern                 bool
  _buffer                   LinkedList<ReceivedMessage>      (capped, default 50)
  _received                 long
  _bindings                 RedisChannel[]                    (one per target)
  _handler                  Action<RedisChannel, RedisValue>  (shared multiplexer)
```

The implementation uses:

* [`PUBLISH`]({{< relref "/commands/publish" >}}) to fan a JSON-encoded message out to every subscriber of a channel
* [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) for exact-match subscribers (via `RedisChannel.Literal`)
* [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) for glob-style pattern subscribers (via `RedisChannel.Pattern`)
* [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}) to list the channels with at least one active exact-match subscriber
* [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}) to count subscribers per channel
* [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) to count active pattern subscriptions server-wide
* `ConnectionMultiplexer`'s shared subscribe connection: every subscription added via `ISubscriber.Subscribe(...)` rides on the same socket, so adding a fifth subscriber doesn't open a fifth connection

## Publishing messages

`Publish()` JSON-encodes the message body, calls `PUBLISH`, and updates the per-channel publish counter:

```csharp
public long Publish(string channel, object? message)
{
    var payload = JsonSerializer.Serialize(message);
    var delivered = _subscriber.Publish(RedisChannel.Literal(channel), payload);
    Interlocked.Increment(ref _publishedTotal);
    Interlocked.Add(ref _deliveredTotal, delivered);
    _channelPublished.AddOrUpdate(channel, 1, (_, current) => current + 1);
    return delivered;
}
```

The integer returned by `PUBLISH` is what Redis itself reports — the number of subscribers (direct and pattern) that received the message in that call. It's a useful sanity check that the channel name is actually being listened to: a steady stream of `0`s means you have a typo somewhere or your subscriber crashed.

A small note about StackExchange.Redis 2.7+: `RedisChannel` no longer has an implicit conversion from `string`, so you have to spell out whether the channel is a literal name or a glob pattern. That's by design — it's the same type used for both `SUBSCRIBE` and `PSUBSCRIBE`, and the wrong choice would silently route a literal channel through pattern matching (or vice versa). Use `RedisChannel.Literal("channel:name")` for `PUBLISH` and exact-match `SUBSCRIBE`, and `RedisChannel.Pattern("channel:*")` for `PSUBSCRIBE`.

## Subscribing to channels

`Subscribe()` creates a named in-process `Subscription`. Internally, the `Subscription` constructor builds a `RedisChannel.Literal` for each target and attaches a single handler delegate via `ISubscriber.Subscribe`:

```csharp
public Subscription Subscribe(string name, IEnumerable<string> channels) =>
    Register(name, channels, isPattern: false);

// Inside Subscription's constructor:
_handler = OnMessage;
foreach (var binding in _bindings)
{
    _subscriber.Subscribe(binding, _handler);
}
```

A few details matter here:

* StackExchange.Redis multiplexes every subscription in the process onto a **single shared subscribe connection** managed by the `ConnectionMultiplexer`. Unlike redis-py or node-redis, you don't open a new TCP connection per subscriber — adding a thousand `Subscribe()` calls still costs one socket. This also means a single subscriber's `Unsubscribe(binding, handler)` only detaches its own handler; the shared subscribe socket stays up for the others.
* The handler is stored as a field so the same delegate instance is used to subscribe and unsubscribe — StackExchange.Redis matches by delegate identity when detaching.
* The handler signature is `Action<RedisChannel, RedisValue>`. Do not block in this handler: it runs on a ThreadPool worker that's shared across every subscription in the process. Buffer the message and return quickly, as the helper does.

## Pattern subscriptions with PSUBSCRIBE

`PSubscribe()` works the same way but wraps each target in `RedisChannel.Pattern` so the underlying command is `PSUBSCRIBE`:

```csharp
hub.PSubscribe("all-notifications", new[] { "notifications:*" });
hub.PSubscribe("cache-invalidator", new[] { "cache:invalidate:*" });
```

When a published channel matches a pattern, the handler receives the *actual* matched channel name — not the pattern. The pattern itself is implicit in the registration. The helper records both, by running the matched channel back through a small glob matcher to find which of the subscription's registered patterns it satisfies:

```csharp
private void OnMessage(RedisChannel actualChannel, RedisValue value)
{
    string? pattern = null;
    if (IsPattern)
    {
        var name = (string)actualChannel!;
        pattern = MatchPattern(name) ?? Targets[0];
    }
    // ...wrap as ReceivedMessage with both channel and pattern...
}
```

That distinction is useful for routing: a pattern subscriber can do one thing for the whole hierarchy (e.g., increment a counter) and dispatch on the specific channel within its handler (e.g., "invalidate this region's cache").

## Inspecting active subscribers

Redis exposes a small set of pub/sub introspection commands that report on subscriber state without traversing any keyspace:

```csharp
hub.ActiveChannels();                  // PUBSUB CHANNELS *
hub.ChannelSubscriberCounts(channels); // PUBSUB NUMSUB ch1 ch2 ...
hub.PatternSubscriberCount();          // PUBSUB NUMPAT
```

`PUBSUB CHANNELS` is a server-wide command, not connection-scoped, so `IServer.SubscriptionChannels(pattern)` in StackExchange.Redis requires a specific endpoint — the helper resolves the multiplexer's first endpoint and calls it there. The helper also filters out the library-internal `__Booksleeve_MasterChanged` channel that the multiplexer maintains for replica-change notifications.

`PUBSUB CHANNELS` only reports channels with at least one exact-match subscriber — pattern subscribers do not appear here. That's a deliberate Redis design choice: a glob like `*` would otherwise show up as a subscriber to every conceivable channel. `PUBSUB NUMPAT` covers the pattern side as a single global count.

`PUBSUB NUMSUB` doesn't have a first-class wrapper in StackExchange.Redis, so the helper drops down to `IDatabase.Execute("PUBSUB", "NUMSUB", ch1, ch2, ...)` and parses the flat array Redis returns.

## Stats and history

`Stats()` reports publish and receive counters plus the size of the subscription registry:

```csharp
public Dictionary<string, object> Stats()
{
    var subs = _subscriptions.Values.ToArray();
    var channelPublished = _channelPublished
        .ToDictionary(kv => kv.Key, kv => kv.Value);
    var receivedTotal = subs.Sum(s => s.ReceivedTotal);

    return new Dictionary<string, object>
    {
        ["published_total"] = Interlocked.Read(ref _publishedTotal),
        ["delivered_total"] = Interlocked.Read(ref _deliveredTotal),
        ["received_total"] = receivedTotal,
        ["active_subscriptions"] = (long)subs.Length,
        ["channel_published"] = channelPublished,
        ["pattern_subscriptions"] = PatternSubscriberCount(),
    };
}
```

`delivered_total` is what Redis itself counted; `received_total` is what this process's in-memory subscribers saw. In a single-process demo they should track each other closely — a sustained divergence usually means a handler threw, or a subscriber was closed while a publisher kept publishing. (Pub/sub is at-most-once: if your subscriber wasn't attached at publish time, the message is gone.)

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work for plain `PUBLISH`/`SUBSCRIBE`; `PUBSUB NUMPAT` is older than that.
* [.NET SDK 8.0](https://dotnet.microsoft.com/) or later.
* The [StackExchange.Redis](https://www.nuget.org/packages/StackExchange.Redis) client (version 2.7 or newer). The included `PubSubDemo.csproj` already lists it as a `PackageReference`; `dotnet run` resolves it on first invocation.

## Running the demo

### Get the source files

The demo consists of three C# files plus a `.csproj`. Download them from the [`dotnet` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/pub-sub/dotnet) on GitHub, or grab them with `curl`:

```bash
mkdir pub-sub-demo && cd pub-sub-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/pub-sub/dotnet
curl -O $BASE/PubSubDemo.csproj
curl -O $BASE/RedisPubSubHub.cs
curl -O $BASE/Program.cs
```

### Start the demo server

From that directory:

```bash
dotnet run
```

The first run pulls the NuGet packages, so it takes a few seconds; subsequent runs start immediately. You should see:

```text
Redis pub/sub demo server listening on http://0.0.0.0:8100
Using Redis at localhost:6379
Seeded 3 default subscription(s)
```

Open [http://localhost:8100](http://localhost:8100) in a browser. You can:

* Publish messages of any text to any channel name in any batch size.
* Add named subscribers that listen on either a specific channel (`orders:new`) or a glob pattern (`notifications:*`). A single subscriber can listen on multiple targets — enter them comma-separated.
* Watch each subscriber's incoming-message panel update every 800 ms.
* See the server-side view: `PUBSUB CHANNELS` lists exact-match channels with subscribers, `PUBSUB NUMSUB` gives per-channel counts, and `PUBSUB NUMPAT` counts active pattern subscriptions.
* Click **Reset** to drop every subscription, zero the counters, and re-seed the three default subscribers.

If your Redis server is running elsewhere, pass `--redis-host` and `--redis-port`. To listen on a different HTTP port, use `dotnet run --urls http://localhost:9000` or the `--port` flag.

## Production usage

### Pub/sub is at-most-once — pair it with durable state if you need replay

A subscriber that's offline when a message is published misses it permanently. For events you can't afford to lose, write the durable record (the order row, the cache key version, the audit log entry) to its primary store, then `PUBLISH` a notification so live consumers can pick it up immediately. On reconnect, consumers reconcile by reading the durable store, not by waiting for missed pub/sub messages. If you actually need replay or at-least-once delivery, switch to [Redis Streams]({{< relref "/develop/data-types/streams" >}}) with consumer groups.

### One ConnectionMultiplexer for the whole process

`ConnectionMultiplexer` is expensive to create and thread-safe to share — open it once at startup and hand out `IDatabase` and `ISubscriber` references everywhere. Behind the scenes, the multiplexer keeps a small fixed pool of sockets (one for regular commands, one for subscribe-mode, plus a few for clusters) and pipelines every command over them. Opening a fresh multiplexer per request would waste connections and lose the pipelining win.

### Subscriptions share one subscribe connection — handler hygiene matters

Where redis-py and node-redis open a fresh TCP connection for every subscriber, StackExchange.Redis multiplexes every `ISubscriber.Subscribe(...)` registration onto a single shared subscribe socket. That's cheaper and simpler, but it means a slow handler blocks the dispatch path for every other subscription in the process until it returns. The demo's `OnMessage` buffers and returns immediately. In production, do the same: if you need heavier work, dispatch the buffered message to a `Channel<T>`, a `Task.Run`, or a Redis Streams consumer group, and let the handler hand off and return.

The .NET ThreadPool grows by ~2 threads/second under load, which can briefly delay handlers if a single multiplexer is fanning out to hundreds of subscriptions during a burst. The demo bumps the floor with `ThreadPool.SetMinThreads(64, 64)` at startup — keep that line, or the equivalent, in any pub/sub-heavy service.

### Choose a topic naming convention up front

A flat namespace gets ugly fast — `email`, `email_high_priority`, `email_high_priority_billing`. Pick a colon-separated hierarchy (`notifications:billing:invoice`, `cache:invalidate:products:p-001`) so consumers can subscribe at the right level: a billing service uses `notifications:billing:*`, the audit logger uses `notifications:*`. Glob patterns are evaluated for every published message, so don't go wild with multiple wildcards on hot paths — `*:*:*` matches everything and costs more than a flat `notifications:*` would.

### Use the matched channel, not the pattern, for routing inside a handler

For a pattern subscription, the handler's `RedisChannel` argument is the *actual* matched channel — `notifications:billing:invoice`, not `notifications:*`. Dispatch on the matched channel inside the handler if you need per-key routing. The original pattern is implicit in the registration; the helper recovers it for the UI by glob-matching, but production code rarely needs to.

### Tune the subscriber buffer for your traffic shape

The demo caps each subscription's in-memory message buffer at 50. That's right for showing the recent activity in a UI, but a real subscriber typically processes each message and discards it — the buffer is only there for human inspection. If you keep a buffer, make sure it's bounded; an unbounded ring on a chatty pattern subscriber will eventually OOM the process.

### Sharded pub/sub on a Redis Cluster

On a Redis Cluster, plain `PUBLISH` fans every message out to every node via the cluster bus, which becomes a hotspot at high throughput. Redis 7.0 added [sharded pub/sub]({{< relref "/develop/pubsub#sharded-pubsub" >}}): channels are hashed to slots, and `SPUBLISH` / `SSUBSCRIBE` only touch the shard that owns the slot. StackExchange.Redis exposes the sharded variants via `ISubscriber.Publish(..., flags: CommandFlags.None)` on a cluster-aware multiplexer once your topology is sharded; pick channel names whose hash distribution matches your traffic.

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

See the [StackExchange.Redis documentation](https://stackexchange.github.io/StackExchange.Redis/) for full client reference, including the [`ISubscriber` interface](https://stackexchange.github.io/StackExchange.Redis/PubSubOrder.html) and the multiplexer's shared subscribe-connection model.
