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
completion or error status, and possibly other metadata.

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
