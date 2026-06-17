---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement Redis pub/sub messaging in Ruby with redis-rb
linkTitle: redis-rb example (Ruby)
title: Redis pub/sub with redis-rb
weight: 8
---

This guide shows you how to implement a Redis-backed pub/sub broadcaster in Ruby with [`redis-rb`]({{< relref "/develop/clients/ruby" >}}). It includes a small local web server built with the Ruby standard library [`webrick`](https://github.com/ruby/webrick) so you can publish messages to named channels, add and remove subscribers live, and watch Redis fan out each message to every interested listener.

## Overview

Pub/sub lets your application broadcast events — chat messages, cache invalidation signals, presence updates, notifications — to many consumers without per-pair wiring. The publisher names a *channel*; every client currently subscribed to that channel receives the message, in publish order, with sub-millisecond fan-out.

That gives you:

* Many-to-many event delivery with no message storage cost in Redis
* Exact-match subscriptions (`SUBSCRIBE orders:new`) for known topics
* Pattern subscriptions (`PSUBSCRIBE notifications:*`) for whole topic hierarchies
* Live server-side introspection through `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, and `PUBSUB NUMPAT`
* At-most-once delivery: subscribers that are offline when a message is published miss it, so durable state should live in keys or a Stream, not in the pub/sub channel itself

In this example, the publisher side calls `PUBLISH` with a JSON-encoded body and counts how many subscribers Redis reported delivering to. Each in-process subscriber owns its own Redis connection and a background Ruby `Thread` that pumps incoming messages into a callback.

## How it works

The flow looks like this:

1. The application calls `hub.subscribe(name:, channels:)` or `hub.psubscribe(name:, patterns:)`
2. The helper creates a fresh `Redis` client for the subscriber, spawns a Ruby `Thread`, and inside that thread calls `redis.subscribe(*channels)` (or `redis.psubscribe(*patterns)`), which blocks the connection in subscribe-only mode
3. The application (or another process) calls `hub.publish(channel, message)` on the hub's plain (non-subscriber) Redis client
4. Redis fans the message out over every subscribing client's open socket
5. Each subscriber's worker thread receives the message inside the `on.message` / `on.pmessage` callback, wraps it as a `ReceivedMessage`, and pushes it into a per-subscriber ring buffer
6. The publisher receives the integer subscriber count back from `PUBLISH`, which is the number of clients Redis delivered to right then

Pattern subscriptions match channels by glob (`*`, `?`, `[abc]`). A single message that matches both an exact subscription and a pattern subscription is delivered twice — once as a `message` and once as a `pmessage`.

## The pub/sub hub helper

The `RedisPubSubHub` class wraps the publish, subscribe, and introspection operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/pub-sub/ruby/pubsub_hub.rb)):

```ruby
require 'redis'
require_relative 'pubsub_hub'

hub = PubSubHub::RedisPubSubHub.new(
  redis_options: { host: 'localhost', port: 6379 }
)

# Exact-match subscriber
hub.subscribe(name: 'orders-listener', channels: ['orders:new'])

# Pattern subscriber covering an entire topic hierarchy
hub.psubscribe(name: 'all-notifications', patterns: ['notifications:*'])

# Publish — returns Redis' delivered count for this PUBLISH
delivered = hub.publish('orders:new', { 'order_id' => 42, 'total' => 199.0 })
puts "Redis delivered to #{delivered} subscriber(s)"

# Look at what each subscriber received
hub.subscriptions.each do |sub|
  puts "#{sub.name} #{sub.received_total} messages"
  sub.messages(5).each do |message|
    puts "  #{message.channel} #{message.payload.inspect}"
  end
end

hub.unsubscribe('orders-listener')
hub.shutdown  # closes every remaining subscription
```

### Data model

Pub/sub has no Redis keyspace footprint of its own — channels are server-side routing entries, not stored values. The hub keeps its own bookkeeping in process memory:

```text
RedisPubSubHub                          (in-process)
  subscriptions             Hash{String => Subscription}
  published_total           Integer
  delivered_total           Integer
  channel_published         Hash{channel => count}

Subscription                            (in-process, one per subscriber)
  name                      String
  targets                   Array<channel | pattern>
  is_pattern?               Boolean
  buffer                    Array<ReceivedMessage>     (capped, default 50)
  received_total            Integer
  redis                     Redis                       (its own connection)
  thread                    Thread                       (blocks on subscribe)
```

The implementation uses:

* [`PUBLISH`]({{< relref "/commands/publish" >}}) to fan a JSON-encoded message out to every subscriber of a channel
* [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) for exact-match subscribers
* [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) for glob-style pattern subscribers
* [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}) to list the channels with at least one active exact-match subscriber
* [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}) to count subscribers per channel
* [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) to count active pattern subscriptions server-wide
* A Ruby `Thread` per subscriber, each with its own `Redis` instance, so `redis.subscribe` can monopolise its connection without blocking the rest of the process

## Publishing messages

`publish` JSON-encodes the message body, calls `PUBLISH`, and updates the per-channel publish counter:

```ruby
def publish(channel, message)
  payload = JSON.generate(message)
  delivered = @redis.publish(channel, payload).to_i
  @stats_lock.synchronize do
    @published_total += 1
    @delivered_total += delivered
    @channel_published[channel] += 1
  end
  delivered
end
```

The integer returned by `PUBLISH` is what Redis itself reports — the number of subscribers (direct and pattern) that received the message in that call. It's a useful sanity check that the channel name is actually being listened to: a steady stream of `0`s means you have a typo somewhere or your subscriber crashed.

## Subscribing to channels

`subscribe` creates a named in-process `Subscription` that owns its own `Redis` client and a worker thread. Inside `Subscription#initialize` (the relevant excerpt):

```ruby
@redis = Redis.new(redis_options)
@thread = Thread.new do
  @redis.subscribe(*@targets) do |on|
    on.subscribe   { |_channel, _count| @ready_latch.push(true) }
    on.message     { |channel, raw|    dispatch(channel: channel, pattern: nil, raw: raw) }
    on.unsubscribe { |_channel, _count| }
  end
end
@ready_latch.pop  # block until the server acks SUBSCRIBE
```

A few details matter here:

* **Each Subscription gets its own Redis client.** In redis-rb 5.x, `Redis#subscribe` puts its connection into subscribe-only mode: ordinary commands (`GET`, `HSET`) on the same connection will raise. Sharing one client across subscribers would also couple their lifetimes — unsubscribing one would close the channel for the others.
* **The thread blocks inside `subscribe`.** Unlike redis-py's `pubsub.run_in_thread()`, redis-rb's subscribe loop *is* the worker — it doesn't return until the server has unsubscribed the connection. That's why the helper spawns one `Thread` per subscriber and stores it.
* **A `Queue` latch lets the constructor wait for the first SUBSCRIBE ack.** Without it, a `publish` issued immediately after `subscribe` could race the subscribe handshake and arrive before Redis knew about the client. Blocking on the `on.subscribe` callback before returning from `initialize` removes that race.

## Pattern subscriptions with PSUBSCRIBE

`psubscribe` works the same way but routes messages through `PSUBSCRIBE` so each binding is a glob, not a literal channel name:

```ruby
hub.psubscribe(name: 'all-notifications', patterns: ['notifications:*'])
hub.psubscribe(name: 'cache-invalidator', patterns: ['cache:invalidate:*'])
```

When a published channel matches a pattern, redis-rb invokes the `on.pmessage` callback with both the matched channel and the original pattern:

```ruby
@redis.psubscribe(*@targets) do |on|
  on.pmessage do |pattern, channel, raw|
    dispatch(channel: channel, pattern: pattern, raw: raw)
  end
end
```

That distinction is useful for routing: a pattern subscriber can do one thing for the whole hierarchy (e.g., increment a counter) and dispatch on the specific channel within its callback (e.g., "invalidate this region's cache").

## Unsubscribing without sentinel messages

`hub.unsubscribe(name)` (and `hub.shutdown` for everything) needs to break the worker thread out of its blocking `subscribe` call. The cleanest way in redis-rb 5.x is to call `unsubscribe` (or `punsubscribe`) on the *same* subscriber connection from another thread — redis-rb sends the command down the open subscribe socket, Redis responds with the unsubscribe acknowledgement, the subscribe block returns, and the worker thread exits:

```ruby
def close
  return if @closed
  @closed = true
  if @is_pattern
    @redis.punsubscribe
  else
    @redis.unsubscribe
  end
  @thread.join(2)
  @redis.close
end
```

That avoids the older "publish a STOP sentinel and unsubscribe from inside the handler" pattern, which pollutes the user-facing channel namespace with control messages.

## Inspecting active subscribers

Redis exposes a small set of pub/sub introspection commands that report on subscriber state without traversing any keyspace:

```ruby
hub.active_channels                       # PUBSUB CHANNELS *
hub.channel_subscriber_counts(channels)   # PUBSUB NUMSUB ch1 ch2 ...
hub.pattern_subscriber_count              # PUBSUB NUMPAT
```

`PUBSUB CHANNELS` only reports channels with at least one exact-match subscriber — pattern subscribers do not appear here. That's a deliberate Redis design choice: a glob like `*` would otherwise show up as a subscriber to every conceivable channel. `PUBSUB NUMPAT` covers the pattern side as a single global count.

Note that redis-rb returns `PUBSUB NUMSUB` as an alternating `[channel, count, channel, count, …]` array; the helper pairs the elements up into a hash before returning to keep the wire shape consistent with the other clients.

## Stats and history

`stats` reports publish and receive counters plus the size of the subscription registry:

```ruby
def stats
  published_total, delivered_total, channel_published =
    @stats_lock.synchronize do
      [@published_total, @delivered_total, @channel_published.dup]
    end
  subs = subscriptions
  {
    'published_total'       => published_total,
    'delivered_total'       => delivered_total,           # sum of PUBLISH return values
    'received_total'        => subs.sum(&:received_total),
    'active_subscriptions'  => subs.length,
    'channel_published'     => channel_published,
    'pattern_subscriptions' => pattern_subscriber_count
  }
end
```

`delivered_total` is what Redis itself counted; `received_total` is what this process's in-memory subscribers saw. In a single-process demo they should track each other closely — a sustained divergence usually means a callback raised, or a subscriber crashed while a publisher kept publishing. (Pub/sub is at-most-once: if your subscriber wasn't connected at publish time, the message is gone.)

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work for plain `PUBLISH`/`SUBSCRIBE`; `PUBSUB NUMPAT` is older than that.
* Ruby 3.0 or later.
* The [`redis-rb`](https://github.com/redis/redis-rb) gem (5.x). Install it with:

  ```bash
  gem install redis
  ```

* The [`webrick`](https://github.com/ruby/webrick) gem (it was extracted from the Ruby standard library in Ruby 3.0):

  ```bash
  gem install webrick
  ```

## Running the demo

### Get the source files

The demo consists of two Ruby files. Download them from the [`ruby` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/pub-sub/ruby) on GitHub, or grab them with `curl`:

```bash
mkdir pub-sub-demo && cd pub-sub-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/pub-sub/ruby
curl -O $BASE/pubsub_hub.rb
curl -O $BASE/demo_server.rb
```

### Start the demo server

From that directory:

```bash
gem install redis webrick
ruby demo_server.rb
```

You should see:

```text
Redis pub/sub demo server listening on http://127.0.0.1:8102
Using Redis at localhost:6379
Seeded 3 default subscription(s)
```

Open [http://127.0.0.1:8102](http://127.0.0.1:8102) in a browser. You can:

* Publish messages of any text to any channel name in any batch size.
* Add named subscribers that listen on either a specific channel (`orders:new`) or a glob pattern (`notifications:*`). A single subscriber can listen on multiple targets — enter them comma-separated.
* Watch each subscriber's incoming-message panel update every 800 ms.
* See the server-side view: `PUBSUB CHANNELS` lists exact-match channels with subscribers, `PUBSUB NUMSUB` gives per-channel counts, and `PUBSUB NUMPAT` counts active pattern subscriptions.
* Click **Reset** to drop every subscription, zero the counters, and re-seed the three default subscribers.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`. The HTTP bind host and port can be overridden with `--host` and `--port`.

## Production usage

### Pub/sub is at-most-once — pair it with durable state if you need replay

A subscriber that's offline when a message is published misses it permanently. For events you can't afford to lose, write the durable record (the order row, the cache key version, the audit log entry) to its primary store, then `PUBLISH` a notification so live consumers can pick it up immediately. On reconnect, consumers reconcile by reading the durable store, not by waiting for missed pub/sub messages. If you actually need replay or at-least-once delivery, switch to [Redis Streams]({{< relref "/develop/data-types/streams" >}}) with consumer groups.

### Give every subscriber its own Redis connection

In redis-rb 5.x, `Redis#subscribe` blocks the calling thread *and* monopolises the underlying connection — any non-pub/sub command issued on the same client will raise. The helper sidesteps that by creating a fresh `Redis` client for every `Subscription`, and using a separate plain client on the hub for `PUBLISH` and the `PUBSUB CHANNELS` / `NUMSUB` / `NUMPAT` introspection commands. In a long-running service, treat each subscriber as owning its connection for the duration of its subscription, and pool connections separately for command-mode work.

### Choose a topic naming convention up front

A flat namespace gets ugly fast — `email`, `email_high_priority`, `email_high_priority_billing`. Pick a colon-separated hierarchy (`notifications:billing:invoice`, `cache:invalidate:products:p-001`) so consumers can subscribe at the right level: a billing service uses `notifications:billing:*`, the audit logger uses `notifications:*`. Glob patterns are evaluated for every published message, so don't go wild with multiple wildcards on hot paths — `*:*:*` matches everything and costs more than a flat `notifications:*` would.

### Don't do heavy work in the subscribe block

The worker thread reads messages from a single socket inside the `on.message` / `on.pmessage` callback. If the callback blocks (synchronous HTTP call, big computation, slow DB write), the next message waits behind it and the subscriber's effective throughput drops to whatever the callback's latency is. For heavier work, the callback should hand the message off to a worker pool (a [`Concurrent::ThreadPoolExecutor`](https://github.com/ruby-concurrency/concurrent-ruby), a Sidekiq job, …) or — for true durable handoff — a [Redis Streams]({{< relref "/develop/data-types/streams" >}}) consumer group.

### Tune the subscriber buffer for your traffic shape

The demo caps each subscriber's in-memory message buffer at 50. That's right for showing the recent activity in a UI, but a real subscriber typically processes each message and discards it — the buffer is only there for human inspection. If you keep a buffer, make sure it's bounded; an unbounded ring on a chatty pattern subscriber will eventually OOM the process.

### Use the GIL-friendly cooperative concurrency model

Ruby (MRI) threads release the GIL on blocking I/O, so a per-subscriber thread sleeping inside a socket read does not stall the rest of the process. That's why one Ruby thread per active subscriber is a workable model even at hundreds of subscribers — you're not consuming a CPU thread, just a `Redis` connection. If you instead need thousands of subscribers per process, consider switching to one of the fibre-based async drivers (e.g. [`async-redis`](https://github.com/socketry/async-redis)) so subscriber sockets can multiplex inside a single reactor.

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

See the [`redis-rb` documentation]({{< relref "/develop/clients/ruby" >}}) for full client reference, including the [`Redis#subscribe`](https://www.rubydoc.info/gems/redis/Redis#subscribe-instance_method) and [`Redis#psubscribe`](https://www.rubydoc.info/gems/redis/Redis#psubscribe-instance_method) helpers.
