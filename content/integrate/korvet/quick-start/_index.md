---
Title: Get Started
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Install Korvet, run the built-in demo, and connect your own Kafka client.
group: service
hideListLinks: false
linkTitle: Get Started
summary: Korvet provides a Kafka-compatible API backed by Redis Streams, so you
  can use existing Kafka clients and tools with Redis as the storage engine.
type: integration
weight: 10
---

The fastest way to see Korvet in action is the built-in demo:
one command starts everything and streams live data you can explore in the web
UI. From there, the "Hello World" walkthrough connects your own Kafka client.

We recommend going through this section in order:

1. [**Install**]({{< relref "/integrate/korvet/quick-start/install" >}}) Korvet.
2. [**Run the demo**]({{< relref "/integrate/korvet/quick-start/demo" >}}) to see the broker, web UI, tiered
   storage, and a live producer/consumer working together with zero configuration.
3. [**Hello World**]({{< relref "/integrate/korvet/quick-start/hello-world" >}}) to create a topic and produce
   and consume your first records with a standard Kafka client.

## Quickest path

If you just want to see it run and you have Docker available:

```bash
korvet demo
```

This resolves a module-enabled Redis (reusing one that is already running,
otherwise starting a local `redis-server`, otherwise a `redis:8` Docker
container), starts the Korvet broker and web UI, creates a
tiered demo topic, and streams synthetic e-commerce events while a consumer
group reads them. Everything is torn down cleanly on `Ctrl-C`.

See [Run the demo]({{< relref "/integrate/korvet/quick-start/demo" >}}) for the full walkthrough.

## Next steps

- [Running with Docker]({{< relref "/integrate/korvet/quick-start/docker" >}})
- [Configuration guide]({{< relref "/integrate/korvet/quick-start/configuration" >}})
- [Concepts & Architecture]({{< relref "/integrate/korvet/concepts" >}})
- [Using the Kafka API]({{< relref "/integrate/korvet/kafka-api" >}})
