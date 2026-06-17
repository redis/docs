---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement Redis pub/sub messaging in Go with go-redis
linkTitle: go-redis example (Go)
title: Redis pub/sub with go-redis
weight: 3
---

This guide shows you how to implement a Redis-backed pub/sub broadcaster in Go with [`go-redis`]({{< relref "/develop/clients/go" >}}). It includes a small local web server built with the Go standard library so you can publish messages to named channels, add and remove subscribers live, and watch Redis fan out each message to every interested listener.

## Overview

Pub/sub lets your application broadcast events — chat messages, cache invalidation signals, presence updates, notifications — to many consumers without per-pair wiring. The publisher names a *channel*; every client currently subscribed to that channel receives the message, in publish order, with sub-millisecond fan-out.

That gives you:

* Many-to-many event delivery with no message storage cost in Redis
* Exact-match subscriptions (`SUBSCRIBE orders:new`) for known topics
* Pattern subscriptions (`PSUBSCRIBE notifications:*`) for whole topic hierarchies
* Live server-side introspection through `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, and `PUBSUB NUMPAT`
* At-most-once delivery: subscribers that are offline when a message is published miss it, so durable state should live in keys or a Stream, not in the pub/sub channel itself

In this example, the publisher side calls `PUBLISH` with a JSON-encoded body and counts how many subscribers Redis reported delivering to. Each in-process subscriber owns its own Redis connection plus a background goroutine that reads from the go-redis message channel and pushes each delivery into a per-subscriber ring buffer.

## How it works

The flow looks like this:

1. The application calls `hub.Subscribe(ctx, name, channels)` or `hub.PSubscribe(ctx, name, patterns)`
2. The helper opens a `*redis.PubSub` (one Redis connection per subscriber), reads its `Channel()` in a goroutine, and registers the new `Subscription` under its name
3. The application (or another process) calls `hub.Publish(ctx, channel, message)`
4. Redis fans the message out over every subscribing client's open socket
5. Each subscriber's goroutine wraps the raw `*redis.Message` as a `ReceivedMessage`, appends it to a bounded per-subscriber buffer, and bumps the atomic counter
6. The publisher receives the integer subscriber count back from `PUBLISH`, which is the number of clients Redis delivered to right then

Pattern subscriptions match channels by glob (`*`, `?`, `[abc]`). A single message that matches both an exact subscription and a pattern subscription is delivered twice — once as a `message` and once as a `pmessage`. The helper exposes which pattern matched (if any) through `ReceivedMessage.Pattern`.

## The pub/sub hub helper

The `RedisPubSubHub` type wraps the publish, subscribe, and introspection operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/pub-sub/go/pubsub_hub.go)):

```go
import (
    "context"

    "github.com/redis/go-redis/v9"
    "pubsub"
)

client := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
hub := pubsub.NewRedisPubSubHub(client, 50)
ctx := context.Background()

// Exact-match subscriber
hub.Subscribe(ctx, "orders-listener", []string{"orders:new"})

// Pattern subscriber covering an entire topic hierarchy
hub.PSubscribe(ctx, "all-notifications", []string{"notifications:*"})

// Publish — returns Redis' delivered count for this PUBLISH
delivered, _ := hub.Publish(ctx, "orders:new", map[string]any{
    "order_id": 42,
    "total":    199.0,
})
fmt.Printf("Redis delivered to %d subscriber(s)\n", delivered)

// Look at what each subscriber received
for _, sub := range hub.Subscriptions() {
    fmt.Println(sub.Name(), sub.ReceivedTotal(), "messages")
    for _, msg := range sub.Messages(5) {
        fmt.Println("  ", msg.Channel, msg.Payload)
    }
}

hub.Unsubscribe("orders-listener")
hub.Shutdown() // closes every remaining subscription
```

### Data model

Pub/sub has no Redis keyspace footprint of its own — channels are server-side routing entries, not stored values. The hub keeps its own bookkeeping in process memory:

```text
RedisPubSubHub                          (in-process)
  subscriptions             map[string]*Subscription
  publishedTotal            int64
  deliveredTotal            int64
  channelPublished          map[channel]int

Subscription                            (in-process, one per subscriber)
  name                      string
  targets                   []string  (channels or patterns)
  isPattern                 bool
  buffer                    []*ReceivedMessage (capped, default 50)
  received                  int64                (atomic)
  pubsub                    *redis.PubSub        (owns one connection)
  goroutine                 reads ps.Channel()
```

The implementation uses:

* [`PUBLISH`]({{< relref "/commands/publish" >}}) to fan a JSON-encoded message out to every subscriber of a channel
* [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) for exact-match subscribers
* [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) for glob-style pattern subscribers
* [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}) to list the channels with at least one active exact-match subscriber
* [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}) to count subscribers per channel
* [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) to count active pattern subscriptions server-wide
* The go-redis `*redis.PubSub.Channel()` helper, which spins up an internal goroutine that pumps messages off the socket into a Go channel — so the helper just ranges over that channel and never touches `Receive()` or `ReceiveMessage()` directly

## Publishing messages

`Publish()` JSON-encodes the message body, calls `PUBLISH`, and updates the per-channel publish counter:

```go
func (h *RedisPubSubHub) Publish(ctx context.Context, channel string, message interface{}) (int64, error) {
    payload, err := json.Marshal(message)
    if err != nil {
        return 0, err
    }
    delivered, err := h.client.Publish(ctx, channel, payload).Result()
    if err != nil {
        return 0, err
    }
    h.statsMu.Lock()
    h.publishedTotal++
    h.deliveredTotal += delivered
    h.channelPublished[channel]++
    h.statsMu.Unlock()
    return delivered, nil
}
```

The integer returned by `PUBLISH` is what Redis itself reports — the number of subscribers (direct and pattern) that received the message in that call. It's a useful sanity check that the channel name is actually being listened to: a steady stream of `0`s means you have a typo somewhere or your subscriber crashed.

## Subscribing to channels

`Subscribe()` creates a named in-process `Subscription` that owns its own `*redis.PubSub` and dispatch goroutine:

```go
func (h *RedisPubSubHub) Subscribe(ctx context.Context, name string, channels []string) (*Subscription, error) {
    return h.register(ctx, name, channels, false)
}
```

Inside `register`, the helper opens a `PubSub`, reads its `Channel()` to get a buffered Go channel of incoming messages, and starts a goroutine that pumps each delivery into the subscription's ring buffer:

```go
var ps *redis.PubSub
if isPattern {
    ps = h.client.PSubscribe(ctx, targets...)
} else {
    ps = h.client.Subscribe(ctx, targets...)
}
sub := &Subscription{
    name:      name,
    targets:   targets,
    isPattern: isPattern,
    pubsub:    ps,
    ch:        ps.Channel(),
    // ...
}
go sub.run()
```

A few details matter here:

* Each `Subscription` gets its own `*redis.PubSub` (and therefore its own connection from the client pool). Sharing one across business subscribers would couple their lifetimes — closing one would close the channel for the others.
* `ps.Channel()` is the right API to use here: go-redis runs an internal goroutine that pumps off the socket into a buffered Go channel and reconnects on transient failures. The helper just ranges over that channel.
* Closing the `PubSub` (via `sub.Close()`) closes its underlying message channel, which causes the `range` loop in `sub.run()` to terminate cleanly. The helper waits on a `done` channel to be sure the goroutine has finished before returning from `Close()`.

The dispatch goroutine wraps each `*redis.Message` as a `ReceivedMessage` and tries to decode the payload as JSON, falling back to the raw string if it doesn't parse:

```go
func (s *Subscription) dispatch(msg *redis.Message) {
    var pattern *string
    if msg.Pattern != "" {
        p := msg.Pattern
        pattern = &p
    }
    var payload interface{}
    if err := json.Unmarshal([]byte(msg.Payload), &payload); err != nil {
        payload = msg.Payload
    }
    wrapped := &ReceivedMessage{
        Channel:      msg.Channel,
        Pattern:      pattern,
        Payload:      payload,
        ReceivedAtMs: time.Now().UnixMilli(),
    }
    // ... prepend to bounded buffer, increment atomic counter ...
}
```

## Pattern subscriptions with PSUBSCRIBE

`PSubscribe()` works the same way but routes messages through `PSUBSCRIBE` so each binding is a glob, not a literal channel name:

```go
hub.PSubscribe(ctx, "all-notifications", []string{"notifications:*"})
hub.PSubscribe(ctx, "cache-invalidator", []string{"cache:invalidate:*"})
```

When a published channel matches a pattern, go-redis populates both `Message.Channel` (the actual channel) and `Message.Pattern` (the pattern that matched). Exact-match deliveries leave `Pattern` as the empty string, so the helper carries the pattern as a `*string` and serialises it as `null` in JSON for exact matches:

```go
type ReceivedMessage struct {
    Channel      string      `json:"channel"`
    Pattern      *string     `json:"pattern"`
    Payload      interface{} `json:"payload"`
    ReceivedAtMs int64       `json:"received_at_ms"`
}
```

That distinction is useful for routing: a pattern subscriber can do one thing for the whole hierarchy (e.g., increment a counter) and dispatch on the specific channel within its handler (e.g., "invalidate this region's cache").

## Inspecting active subscribers

Redis exposes a small set of pub/sub introspection commands that report on subscriber state without traversing any keyspace:

```go
hub.ActiveChannels(ctx, "*")                                  // PUBSUB CHANNELS *
hub.ChannelSubscriberCounts(ctx, []string{"orders:new", ...}) // PUBSUB NUMSUB ch1 ch2 ...
hub.PatternSubscriberCount(ctx)                               // PUBSUB NUMPAT
```

`PUBSUB CHANNELS` only reports channels with at least one exact-match subscriber — pattern subscribers do not appear here. That's a deliberate Redis design choice: a glob like `*` would otherwise show up as a subscriber to every conceivable channel. `PUBSUB NUMPAT` covers the pattern side as a single global count.

## Stats and history

`Stats()` reports publish and receive counters plus the size of the subscription registry:

```go
func (h *RedisPubSubHub) Stats(ctx context.Context) Stats {
    // ... snapshot counters under statsMu ...
    subs := h.Subscriptions()
    var received int64
    for _, sub := range subs {
        received += sub.ReceivedTotal()
    }
    patternSubs, _ := h.PatternSubscriberCount(ctx)
    return Stats{
        PublishedTotal:       published,
        DeliveredTotal:       delivered,
        ReceivedTotal:        received,
        ActiveSubscriptions:  len(subs),
        ChannelPublished:     perChannel,
        PatternSubscriptions: patternSubs,
    }
}
```

`DeliveredTotal` is what Redis itself counted; `ReceivedTotal` is what this process's in-memory subscribers saw. In a single-process demo they should track each other closely — a sustained divergence usually means a subscriber goroutine exited, or a subscriber crashed while a publisher kept publishing. (Pub/sub is at-most-once: if your subscriber wasn't connected at publish time, the message is gone.)

The `Stats` struct uses `json:"..."` tags with snake_case names so the demo UI's shared JavaScript can read the same wire shape across every client port.

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work for plain `PUBLISH`/`SUBSCRIBE`; `PUBSUB NUMPAT` is older than that.
* Go 1.23 or later (matching the version declared in this port's `go.mod`).
* The `go-redis` client. The included `go.mod` pins:

  ```text
  require github.com/redis/go-redis/v9 v9.18.0
  ```

## Running the demo

### Get the source files

The demo consists of three Go files plus a `go.mod` and `go.sum`. Download them from the [`go` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/pub-sub/go) on GitHub, or grab them with `curl`:

```bash
mkdir pub-sub-demo && cd pub-sub-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/pub-sub/go
curl -O $BASE/pubsub_hub.go
curl -O $BASE/demo_server.go
curl -O $BASE/go.mod
curl -O $BASE/go.sum
```

### Start the demo server

Go's `package main` can't live in the same directory as `package pubsub`, so create a tiny `main.go` in a subdirectory that calls the demo entry point:

```bash
mkdir -p cmd/demo
cat > cmd/demo/main.go <<'EOF'
package main

import "pubsub"

func main() { pubsub.RunDemoServer() }
EOF
```

Then build and run:

```bash
go mod tidy
go run ./cmd/demo
```

You should see:

```text
Redis pub/sub demo server listening on http://127.0.0.1:8097
Using Redis at localhost:6379
Seeded 3 default subscription(s)
```

Open [http://127.0.0.1:8097](http://127.0.0.1:8097) in a browser. You can:

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

A go-redis `*redis.PubSub` puts its connection into subscribe-only mode: ordinary commands (`Get`, `HSet`, etc.) using that connection will hang. Every call to `client.Subscribe(...)` / `client.PSubscribe(...)` checks out a fresh connection from the pool, so size the pool generously when you have many subscribers, and don't share one `PubSub` object across business subscribers (closing it would close the channel for all of them).

### Prefer `*redis.PubSub.Channel()` over a hand-written `ReceiveMessage` loop

`Channel()` runs an internal goroutine that pumps the socket into a buffered Go channel and transparently reconnects on transient failures. A hand-written `for { ReceiveMessage(ctx) }` loop has to handle reconnect, timeouts, and back-pressure itself. Use `Channel()` unless you genuinely need fine-grained control over the read loop, in which case `ReceiveTimeout()` plus your own reconnect logic is the next step down.

### Choose a topic naming convention up front

A flat namespace gets ugly fast — `email`, `email_high_priority`, `email_high_priority_billing`. Pick a colon-separated hierarchy (`notifications:billing:invoice`, `cache:invalidate:products:p-001`) so consumers can subscribe at the right level: a billing service uses `notifications:billing:*`, the audit logger uses `notifications:*`. Glob patterns are evaluated for every published message, so don't go wild with multiple wildcards on hot paths — `*:*:*` matches everything and costs more than a flat `notifications:*` would.

### Don't do heavy work in the dispatch goroutine

The dispatch goroutine reads messages from a single Go channel. If your handler blocks (synchronous HTTP call, big computation, slow DB write), the next message waits behind it and the subscriber's effective throughput drops to whatever the handler's latency is. For heavier work, the handler should hand the message off to a worker pool, a buffered job channel, or — for true durable handoff — a [Redis Streams]({{< relref "/develop/data-types/streams" >}}) consumer group.

### Tune the subscriber buffer for your traffic shape

The demo caps each subscriber's in-memory message buffer at 50. That's right for showing the recent activity in a UI, but a real subscriber typically processes each message and discards it — the buffer is only there for human inspection. If you keep a buffer, make sure it's bounded; an unbounded ring on a chatty pattern subscriber will eventually OOM the process. Likewise, `Channel()` accepts a `redis.WithChannelSize(size)` option if you need a larger or smaller internal buffer between the socket reader and your consumer goroutine.

### Sharded pub/sub on a Redis Cluster

On a Redis Cluster, plain `PUBLISH` fans every message out to every node via the cluster bus, which becomes a hotspot at high throughput. Redis 7.0 added [sharded pub/sub]({{< relref "/develop/pubsub#sharded-pubsub" >}}): channels are hashed to slots, and `SPUBLISH` / `SSUBSCRIBE` only touch the shard that owns the slot. go-redis exposes the matching `SPublish`, `SSubscribe`, `PubSubShardChannels`, and `PubSubShardNumSub` methods on the cluster client. If you're scaling pub/sub on a cluster, prefer the sharded commands and pick channel names whose hash distribution matches your traffic.

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

See the [`go-redis` documentation]({{< relref "/develop/clients/go" >}}) for full client reference.
