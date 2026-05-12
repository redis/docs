---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement Redis pub/sub messaging in Rust with redis-rs
linkTitle: redis-rs example (Rust)
title: Redis pub/sub with redis-rs
weight: 9
---

This guide shows you how to implement a Redis-backed pub/sub broadcaster in Rust with the [redis](https://crates.io/crates/redis) crate (redis-rs). It includes a small local web server built on [axum](https://github.com/tokio-rs/axum) so you can publish messages to named channels, add and remove subscribers live, and watch Redis fan out each message to every interested listener.

## Overview

Pub/sub lets your application broadcast events — chat messages, cache invalidation signals, presence updates, notifications — to many consumers without per-pair wiring. The publisher names a *channel*; every client currently subscribed to that channel receives the message, in publish order, with sub-millisecond fan-out.

That gives you:

* Many-to-many event delivery with no message storage cost in Redis
* Exact-match subscriptions (`SUBSCRIBE orders:new`) for known topics
* Pattern subscriptions (`PSUBSCRIBE notifications:*`) for whole topic hierarchies
* Live server-side introspection through `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, and `PUBSUB NUMPAT`
* At-most-once delivery: subscribers that are offline when a message is published miss it, so durable state should live in keys or a Stream, not in the pub/sub channel itself

In this example, the publisher side calls `PUBLISH` with a JSON-encoded body and counts how many subscribers Redis reported delivering to. Each in-process subscriber owns its own Redis pub/sub connection and a Tokio task that pumps incoming messages into a ring buffer.

## How it works

The flow looks like this:

1. The application calls `hub.subscribe(name, channels)` or `hub.psubscribe(name, patterns)`
2. The helper opens a dedicated `redis::aio::PubSub` connection from the shared `Client`, calls `subscribe` or `psubscribe` for each target, and spawns a Tokio task that loops on `pubsub.on_message()`
3. The application (or another process) calls `hub.publish(channel, &message)`
4. Redis fans the message out over every subscribing client's open socket
5. Each subscriber's task wraps the raw message as a `ReceivedMessage`, prepends it to a per-subscriber ring buffer, and bumps the received counter
6. The publisher receives the integer subscriber count back from `PUBLISH`, which is the number of clients Redis delivered to right then

Pattern subscriptions match channels by glob (`*`, `?`, `[abc]`). A single message that matches both an exact subscription and a pattern subscription is delivered twice — once as a `message` and once as a `pmessage`.

## The pub/sub hub helper

The `PubSubHub` struct wraps the publish, subscribe, and introspection operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/pub-sub/rust/pubsub_hub.rs)):

```rust
use redis::Client;
use serde_json::json;

mod pubsub_hub;
use pubsub_hub::{PubSubHub, DEFAULT_BUFFER_SIZE};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::open("redis://localhost:6379/")?;
    let hub = PubSubHub::new(client, DEFAULT_BUFFER_SIZE).await?;

    // Exact-match subscriber
    hub.subscribe("orders-listener", vec!["orders:new".to_string()]).await?;

    // Pattern subscriber covering an entire topic hierarchy
    hub.psubscribe("all-notifications", vec!["notifications:*".to_string()]).await?;

    // Publish — returns Redis' delivered count for this PUBLISH
    let delivered = hub.publish("orders:new", &json!({ "order_id": 42, "total": 199.0 })).await?;
    println!("Redis delivered to {} subscriber(s)", delivered);

    // Look at what each subscriber received
    for sub in hub.subscriptions() {
        println!("{} {} messages", sub.name(), sub.received_total());
        for m in sub.messages(Some(5)) {
            println!("  {} {}", m.channel, m.payload);
        }
    }

    hub.unsubscribe("orders-listener").await;
    hub.shutdown().await;  // closes every remaining subscription
    Ok(())
}
```

### Data model

Pub/sub has no Redis keyspace footprint of its own — channels are server-side routing entries, not stored values. The hub keeps its own bookkeeping in process memory:

```text
PubSubHub                                (in-process, Arc<HubInner>)
  subscriptions             HashMap<String, Arc<Subscription>>
  published_total           AtomicU64
  delivered_total           AtomicU64
  channel_published         HashMap<channel, count>

Subscription                             (in-process, one per subscriber)
  name                      String
  targets                   Vec<String>
  is_pattern                bool
  buffer                    VecDeque<ReceivedMessage>     (capped, default 50)
  received                  AtomicU64
  pubsub                    redis::aio::PubSub             (owned by a tokio task)
  stop_tx                   oneshot::Sender<()>            (for clean shutdown)
```

The implementation uses:

* [`PUBLISH`]({{< relref "/commands/publish" >}}) to fan a JSON-encoded message out to every subscriber of a channel
* [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) for exact-match subscribers
* [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) for glob-style pattern subscribers
* [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}) to list the channels with at least one active exact-match subscriber
* [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}) to count subscribers per channel
* [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) to count active pattern subscriptions server-wide
* `redis::aio::PubSub::on_message()` to obtain a `Stream<Item = Msg>` and forward each delivered message into the subscriber's buffer

## Publishing messages

`publish()` JSON-encodes the message body, calls `PUBLISH`, and updates the per-channel publish counter:

```rust
pub async fn publish(&self, channel: &str, message: &Value) -> RedisResult<i64> {
    let payload = serde_json::to_string(message)
        .unwrap_or_else(|_| serde_json::to_string(&Value::Null).unwrap());
    let mut conn = self.inner.publisher.clone();
    let delivered: i64 = conn.publish(channel, payload).await?;
    self.inner.published_total.fetch_add(1, Ordering::Relaxed);
    self.inner.delivered_total.fetch_add(delivered as u64, Ordering::Relaxed);
    let mut chan = self.inner.channel_published.lock().unwrap();
    *chan.entry(channel.to_string()).or_insert(0) += 1;
    Ok(delivered)
}
```

The integer returned by `PUBLISH` is what Redis itself reports — the number of subscribers (direct and pattern) that received the message in that call. It's a useful sanity check that the channel name is actually being listened to: a steady stream of `0`s means you have a typo somewhere or your subscriber crashed.

A single `ConnectionManager` is reused for every publish. `ConnectionManager` is `Clone`, transparently reconnects on transient failures, and multiplexes commands over a single TCP connection, so it's the right shared resource for non-blocking commands. Pub/sub connections, in contrast, must be dedicated per subscriber — see below.

## Subscribing to channels

`subscribe()` creates a named in-process `Subscription` that owns its own pub/sub connection and dispatch task:

```rust
pub async fn subscribe(
    &self,
    name: &str,
    channels: Vec<String>,
) -> Result<Arc<Subscription>, HubError> {
    self.register(name, channels, false).await
}
```

Inside `register`, the helper opens a fresh pub/sub connection, binds each target, and spawns a Tokio task to pump messages:

```rust
let mut pubsub = self.inner.client.get_async_pubsub().await?;
if is_pattern {
    for pattern in &targets { pubsub.psubscribe(pattern).await?; }
} else {
    for channel in &targets { pubsub.subscribe(channel).await?; }
}

let (stop_tx, stop_rx) = oneshot::channel();
let sub_for_task = sub.clone();
let handle = tokio::spawn(async move {
    {
        let mut stop_rx = stop_rx;
        let mut stream = pubsub.on_message();
        loop {
            tokio::select! {
                biased;
                _ = &mut stop_rx => break,
                next = stream.next() => match next {
                    Some(msg) => dispatch(&sub_for_task, &msg),
                    None => break,
                }
            }
        }
    }
    // After the stream borrow ends, unsubscribe cleanly before drop.
    for target in &targets_for_task {
        if is_pattern {
            let _ = pubsub.punsubscribe(target).await;
        } else {
            let _ = pubsub.unsubscribe(target).await;
        }
    }
});
```

A few details matter here:

* `client.get_async_pubsub()` returns a `redis::aio::PubSub` that owns its own connection. The connection switches into subscribe-only mode the moment you call `subscribe`/`psubscribe`, so it cannot be reused for ordinary commands — that's why the hub keeps a separate `ConnectionManager` for `PUBLISH` and the introspection commands.
* `pubsub.on_message()` returns a `Stream<Item = Msg>` that **borrows** from `pubsub`. The spawned task therefore has to own the `PubSub` and use the stream locally; if you tried to move the `PubSub` out of the task mid-loop, the borrow checker would refuse. Confining the stream to an inner block lets the task call `unsubscribe` on the `PubSub` after the loop ends.
* `tokio::select!` with a `oneshot::Receiver<()>` gives clean shutdown. When `close()` fires the sender, the loop exits at the next poll, the task unsubscribes for tidiness, and the `PubSub` is dropped — Redis releases the channel slot as soon as the socket closes.

## Pattern subscriptions with PSUBSCRIBE

`psubscribe()` works the same way but routes each binding through `PSUBSCRIBE` so it's a glob, not a literal channel name:

```rust
hub.psubscribe("all-notifications", vec!["notifications:*".to_string()]).await?;
hub.psubscribe("cache-invalidator", vec!["cache:invalidate:*".to_string()]).await?;
```

When a published channel matches a pattern, the `redis::Msg` carries both the matched channel and the original pattern. `dispatch()` lifts them onto the `ReceivedMessage`:

```rust
fn dispatch(sub: &Arc<Subscription>, msg: &redis::Msg) {
    let channel = msg.get_channel_name().to_string();
    let pattern = msg.get_pattern::<String>().ok();
    let raw_payload: String = msg.get_payload().unwrap_or_default();
    let payload: Value = serde_json::from_str(&raw_payload).unwrap_or(Value::String(raw_payload));
    // ... push onto the bounded ring buffer, bump the counter ...
}
```

That distinction is useful for routing: a pattern subscriber can do one thing for the whole hierarchy (e.g., increment a counter) and dispatch on the specific channel within its callback (e.g., "invalidate this region's cache").

## Inspecting active subscribers

Redis exposes a small set of pub/sub introspection commands that report on subscriber state without traversing any keyspace. The hub wraps them as plain async methods:

```rust
hub.active_channels("*").await?;             // PUBSUB CHANNELS *
hub.channel_subscriber_counts(&channels).await?;  // PUBSUB NUMSUB ch1 ch2 ...
hub.pattern_subscriber_count().await?;       // PUBSUB NUMPAT
```

`PUBSUB CHANNELS` only reports channels with at least one exact-match subscriber — pattern subscribers do not appear here. That's a deliberate Redis design choice: a glob like `*` would otherwise show up as a subscriber to every conceivable channel. `PUBSUB NUMPAT` covers the pattern side as a single global count.

## Stats and history

`stats()` reports publish and receive counters plus the size of the subscription registry:

```rust
pub async fn stats(&self) -> Stats {
    let subs = self.subscriptions();
    let received_total: u64 = subs.iter().map(|s| s.received_total()).sum();
    let channel_published = self.inner.channel_published.lock().unwrap().clone();
    let pattern_subscriptions = self.pattern_subscriber_count().await.unwrap_or(0);
    Stats {
        published_total: self.inner.published_total.load(Ordering::Relaxed),
        delivered_total: self.inner.delivered_total.load(Ordering::Relaxed),
        received_total,
        active_subscriptions: subs.len() as u64,
        channel_published,
        pattern_subscriptions,
    }
}
```

`delivered_total` is what Redis itself counted; `received_total` is what this process's in-memory subscribers saw. In a single-process demo they should track each other closely — a sustained divergence usually means a dispatch task panicked, or a subscriber's task died while a publisher kept publishing. (Pub/sub is at-most-once: if your subscriber wasn't connected at publish time, the message is gone.)

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work for plain `PUBLISH`/`SUBSCRIBE`; `PUBSUB NUMPAT` is older than that.
* A Rust toolchain (rustup + cargo) capable of building the 2021 edition.
* The `redis` crate at version 0.27+ with the `tokio-comp`, `aio`, and `connection-manager` features, plus `tokio`, `axum`, `serde`, `serde_json`, and `futures-util` (declared in `Cargo.toml`).

## Running the demo

### Get the source files

The demo consists of three files. Download them from the [`rust` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/pub-sub/rust) on GitHub, or grab them with `curl`:

```bash
mkdir pub-sub-demo && cd pub-sub-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/pub-sub/rust
curl -O $BASE/Cargo.toml
curl -O $BASE/pubsub_hub.rs
curl -O $BASE/demo_server.rs
```

### Start the demo server

From that directory:

```bash
cargo run --release
```

You should see:

```text
Redis pub/sub demo server listening on http://127.0.0.1:8103
Using Redis at localhost:6379
Seeded 3 default subscription(s)
```

Open [http://127.0.0.1:8103](http://127.0.0.1:8103) in a browser. You can:

* Publish messages of any text to any channel name in any batch size.
* Add named subscribers that listen on either a specific channel (`orders:new`) or a glob pattern (`notifications:*`). A single subscriber can listen on multiple targets — enter them comma-separated.
* Watch each subscriber's incoming-message panel update every 800 ms.
* See the server-side view: `PUBSUB CHANNELS` lists exact-match channels with subscribers, `PUBSUB NUMSUB` gives per-channel counts, and `PUBSUB NUMPAT` counts active pattern subscriptions.
* Click **Reset** to drop every subscription, zero the counters, and re-seed the three default subscribers.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`, or use the `REDIS_HOST` / `REDIS_PORT` environment variables. `--port` and `--host` change the HTTP bind.

## Production usage

### Pub/sub is at-most-once — pair it with durable state if you need replay

A subscriber that's offline when a message is published misses it permanently. For events you can't afford to lose, write the durable record (the order row, the cache key version, the audit log entry) to its primary store, then `PUBLISH` a notification so live consumers can pick it up immediately. On reconnect, consumers reconcile by reading the durable store, not by waiting for missed pub/sub messages. If you actually need replay or at-least-once delivery, switch to [Redis Streams]({{< relref "/develop/data-types/streams" >}}) with consumer groups.

### Use a separate connection per subscriber

A `redis::aio::PubSub` switches its connection into subscribe-only mode: ordinary commands (`GET`, `HSET`, etc.) on the same connection will fail. Always create the `PubSub` from a `Client` that can spare another connection, and — as the helper does — give every subscriber its own `PubSub`. Sharing one `PubSub` across business-logic subscribers couples their lifetimes (closing one closes the channel for the others) and serialises their dispatch on a single tokio task.

For everything that *isn't* a subscribe — `PUBLISH`, `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, `PUBSUB NUMPAT` — use the shared `ConnectionManager`. It transparently reconnects on transient failures and is cheap to clone for use across many concurrent tokio tasks. For very high-throughput workloads, look at [`bb8-redis`](https://crates.io/crates/bb8-redis) or [`deadpool-redis`](https://crates.io/crates/deadpool-redis) for explicit pooling.

### Stream borrowing — the on_message() pattern

`pubsub.on_message()` returns a `Stream<Item = redis::Msg>` whose lifetime is tied to the `PubSub`. That means you cannot move the `PubSub` out of the spawned task while the stream is live — the borrow checker will refuse. The two workable patterns are:

* Own the `PubSub` inside the task and confine `on_message()` to an inner scope, the way the helper does. That lets you call `unsubscribe` on the `PubSub` after the loop ends and before the connection drops.
* Convert each incoming `Msg` into an owned `ReceivedMessage` immediately, so the task never has to hand a borrowed value across `await` points.

Don't try to pass the stream itself across thread boundaries; copy the data out, push it into a `tokio::sync::mpsc` channel, or — as here — into a `Mutex<VecDeque>`, and process from there.

### Choose a topic naming convention up front

A flat namespace gets ugly fast — `email`, `email_high_priority`, `email_high_priority_billing`. Pick a colon-separated hierarchy (`notifications:billing:invoice`, `cache:invalidate:products:p-001`) so consumers can subscribe at the right level: a billing service uses `notifications:billing:*`, the audit logger uses `notifications:*`. Glob patterns are evaluated for every published message, so don't go wild with multiple wildcards on hot paths — `*:*:*` matches everything and costs more than a flat `notifications:*` would.

### Don't do heavy work in the dispatch task

Each subscriber's task reads messages from a single socket. If the work it does per message blocks (synchronous HTTP call inside the loop, big computation, slow DB write through a sync API), the next message waits behind it and the subscriber's effective throughput drops to whatever that latency is. For heavier work, the dispatch should hand the message off to a worker pool — a `tokio::sync::mpsc` to a separate set of consumer tasks, an [`axum`](https://github.com/tokio-rs/axum) background task, or — for true durable handoff — a [Redis Streams]({{< relref "/develop/data-types/streams" >}}) consumer group.

### Tune the subscriber buffer for your traffic shape

The demo caps each subscriber's in-memory message buffer at 50. That's right for showing the recent activity in a UI, but a real subscriber typically processes each message and discards it — the buffer is only there for human inspection. If you keep a buffer, make sure it's bounded; an unbounded `VecDeque` on a chatty pattern subscriber will eventually OOM the process.

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

See the [redis crate on crates.io](https://crates.io/crates/redis) for the full client reference, including the [`redis::aio::PubSub`](https://docs.rs/redis/latest/redis/aio/struct.PubSub.html) type and the [`Stream`-based `on_message`](https://docs.rs/redis/latest/redis/aio/struct.PubSub.html#method.on_message) helper.
