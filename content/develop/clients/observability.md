---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Monitor your client's activity for optimization and debugging.
linkTitle: Observability
title: Observability
scope: overview
relatedPages:
- /develop/clients/redis-py/produsage
- /develop/clients/nodejs/produsage
- /develop/clients/go/produsage
topics:
- observability
- monitoring
- performance
- metrics
- logging
- tracing
weight: 60
---

Some Redis client libraries implement the [OpenTelemetry](https://opentelemetry.io/) (OTel)
observability framework to let you gather performance metrics and execution traces
for your application. This can help you optimize performance and pinpoint problems
quickly. Currently, the following clients support OTel:

- [redis-py]({{< relref "/develop/clients/redis-py#observability" >}})
- [go-redis]({{< relref "/develop/clients/go#observability" >}})
- [node-redis]({{< relref "/develop/clients/nodejs#observability" >}})

## Tracing overview

An execution trace is a record of the sequence of steps that the Redis
client takes as it executes a command. Each step or *span* (in OTel terminology)
represents a specific operation, such as sending a command to the server
or waiting for a reply. In the trace, each span is recorded using an identifier
to represent the type of operation along with its start and finish time, its
completion or error status, and other information about the operation.

For example, a simple trace for a `GET` command might look like this:

```hierarchy
"redis.connection.command":
    _meta:
        description: "Execute GET command"
    "redis.connection.send":
        _meta:
            description: "Send command to server"
    "redis.connection.receive":
        _meta:
            description: "Wait for and receive reply"
```

In this trace, the top-level span `redis.connection.command` represents the overall
operation of executing the command. It contains two child spans: `redis.connection.send`
(sending the command to the server) and `redis.connection.receive` (waiting for and
receiving the reply). Each span would be recorded with its start time, end time, and
status information.

A span can sometimes be broken down into sub-tasks (such as steps taken
while calling an external service), each of which is a span in its own right.
The full trace is therefore best understood as a tree of nested spans.

For example, a more complex trace for a pipelined operation might look like this:

```hierarchy
"redis.pipeline.execute":
    _meta:
        description: "Execute pipeline with multiple commands"
    "redis.connection.send":
        _meta:
            description: "Send all commands in batch"
        "redis.connection.pack":
            _meta:
                description: "Serialize commands to protocol format"
        "redis.connection.write":
            _meta:
                description: "Write data to socket"
    "redis.connection.receive":
        _meta:
            description: "Receive all replies"
        "redis.connection.read":
            _meta:
                description: "Read data from socket"
        "redis.connection.parse":
            _meta:
                description: "Parse protocol responses"
```

This trace shows how the `redis.connection.send` and `redis.connection.receive` spans
are themselves broken down into more granular operations. The `send` span includes
packing the commands into the Redis protocol format and writing to the socket, while
the `receive` span includes reading from the socket and parsing the responses.

By examining the sequence of spans in a trace, you can determine where an
error (if any) occurred and how long each step took to execute. Since the
information in each trace is recorded, you can also use monitoring tools
such as [Uptrace](https://uptrace.dev/) to aggregate the data from many traces
over time. This can help you find operations that are slow on average
compared to others (suggesting a performance bottleneck that could be optimized)
or that have a high error rate (suggesting a deeper problem that could be fixed
to improve reliability).

### Elements of a span

Each span in a trace contains the following information:

- **Span ID**: A unique identifier for the span within the trace.
- **Trace ID**: A unique identifier for the entire trace.
- **Trace flags**: Boolean properties of the span, such as sampling status.
- **Trace state**: An optional value specific to the vendor or application.
- **Span name (operation name)**: A string that identifies the type of operation
  represented by the span. For example, `redis.connection.command` or
  `redis.connection.send`.
- **Parent span ID**: The ID of the span that is the immediate parent of this span in
  the trace tree. The top-level span in a trace has no parent and is called the *root span*.
- **Span kind**: An enum value indicating the relationship of this span to others in the trace.
  The available kinds are `client`, `server`, `producer`, `consumer`, and `internal`. See
  [Span kind](https://uptrace.dev/opentelemetry/distributed-tracing#span-kind) in the
  OpenTelemetry docs for more information.
- **Start and end timestamps**: The time at which the span started and finished executing.
- **Status**: An enum value indicating the success or failure of the operation. The available
  statuses are `ok`, `error`, and `unset`.
- **Attributes**: A set of key-value pairs that provide additional information about the operation.
- **Events**: A list of events that occurred during the span's lifetime. Each event has a single
  timestamp (since they represent immediate occurrences rather than durations) and a name, and may
  also have a set of attributes.
- **Links**: A list of links to other spans that are related to this one.

See [Spans](https://uptrace.dev/opentelemetry/distributed-tracing#spans) in the
OpenTelemetry docs for more information.

## Redis metric groups

In Redis clients, the metrics collected by OTel are organized into the following
metric groups:

- [`resiliency`](#group-resiliency): data related to the availablility and health of the Redis connection.
- [`connection-basic`](#group-connection-basic): minimal metrics about Redis connections made by the client.
- [`connection-advanced`](#group-connection-advanced): more detailed metrics about Redis connections.
- [`command`](#group-command): metrics about Redis commands executed by the client.
- [`client-side-caching`](#group-client-side-caching): metrics about
  [client-side caching]({{< relref "/develop/clients/client-side-caching" >}}) operations.
- [`streaming`](#group-streaming): metrics about
  [stream]({{< relref "/develop/data-types/streams" >}}) operations.
- [`pubsub`](#group-pubsub): metrics about
  [pub/sub]({{< relref "/develop/pubsub" >}}) operations.

When you configure the client to activate OTel, you can select which metric groups
you are interested in, although all metrics in the group will be collected even
if you don't use them. The metrics in each group are described in more detail below.

{{< otel-metric-groups >}}
