---
Title: Run the Demo
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: The korvet demo command starts a complete, self-contained Korvet showcase
  with a single command.
linkTitle: Run the Demo
weight: 20
---

The `korvet demo` command starts a complete, self-contained Korvet
showcase with a single command. It is the fastest way to see how the broker,
web UI, and tiered storage work together.

## Prerequisites

- [Install Korvet]({{< relref "/integrate/korvet/quick-start/install" >}}) — on macOS and
  Linux, `brew install redis/tap/korvet`.
- A way for the demo to reach a **module-enabled** Redis 8+ — one with the
  RediSearch (`FT.*`) and RedisJSON (`JSON.*`) commands. Any of: a module-enabled
  Redis already running, a module-enabled `redis-server` binary on your `PATH`
  (the Redis Open Source cask provides one; see
  [Install]({{< relref "/integrate/korvet/quick-start/install" >}})), or Docker. The demo tries them in that
  order.

{{< note >}}
The Homebrew **core** `redis` formula ships without those modules, so a
`redis-server` from it is not sufficient — the demo would skip it and fall back
to Docker. For a Docker-free run, install the module-enabled cask
(`brew install --cask redis`).
{{< /note >}}

## Start the demo

```bash
brew install redis/tap/korvet
korvet demo
```

This single command:

1. **Resolves Redis** — reuses a module-enabled Redis already running at
   `redis://localhost:6379`, otherwise starts a throwaway local `redis-server`
   (only if it is module-enabled), otherwise falls back to a `redis:8` Docker
   container.
2. **Starts the broker and web UI** in-process, pointed at a local-filesystem
   Iceberg cold tier under `/tmp/korvet-demo`.
3. **Creates a tiered demo topic** (`events`, 3 partitions) with a short
   `segment.ms` so data reaches the cold tier within seconds.
4. **Streams synthetic JSON e-commerce events** into the topic while a consumer
   group of two members reads them.

On an interactive terminal the demo shows a full-screen live dashboard. When
output is piped or `--verbose` is set, it prints a plain walkthrough and streams
logs to the console instead.

## What you'll see

| | |
|---|---|
| Kafka bootstrap | `localhost:9092` — connect any Kafka client or app here |
| Web UI | `http://localhost:8080` — explore topics, messages, consumer groups, and lag |
| Iceberg cold tier | `/tmp/korvet-demo` — watch the warehouse fill as segments offload |

In the web UI, explore:

- The `events` topic and its JSON messages.
- The `demo-consumers` consumer group — its members, partition assignment,
  committed offsets, and lag.
- The cold-tier warehouse filling up as sealed segments offload to Iceberg.

## Useful options

| | |
|---|---|
| `--records <count>` | Produce a fixed number of events, or `0` to stream continuously (default). |
| `--rate <events/sec>` | Approximate produce rate. Default: `50`. |
| `--timeout <duration>` | Auto-shutdown after a duration, e.g. `10m`. |
| `--kafka-port` / `--http-port` | Override the broker and UI ports (default `9092` / `8080`). |
| `--redis-uri <uri>` | Reuse a Redis already running at this URI. |
| `--data-dir <dir>` | Directory for Redis data and the Iceberg warehouse. Default: `/tmp/korvet-demo` (reset each run). |
| `--verbose` | Stream full broker and Kafka-client logs instead of the live dashboard. |

## Stop the demo

Press `Ctrl-C`. Redis, the broker, and the web UI all shut down cleanly.

## Next steps

- [Hello World]({{< relref "/integrate/korvet/quick-start/hello-world" >}}) — create a topic and produce
  and consume records with your own Kafka client.
- [Concepts & Architecture]({{< relref "/integrate/korvet/concepts" >}})
- [Tiered Storage]({{< relref "/integrate/korvet/storage" >}})
