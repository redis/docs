---
aliases: /develop/connect/clients/go
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
description: Connect your Go application to a Redis database
linkTitle: go-redis (Go)
title: go-redis guide (Go)
weight: 7
---

[`go-redis`](https://github.com/redis/go-redis) is the [Go](https://go.dev/) client for Redis.
The sections below explain how to install `go-redis` and connect your application to a Redis database.

`go-redis` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

## Install

`go-redis` supports the last two Go versions. You can only use it from within
a Go module, so you must initialize a Go module before you start, or add your code to
an existing module:

```
go mod init github.com/my/repo
```

Use the `go get` command to install `go-redis/v9`:

```
go get github.com/redis/go-redis/v9
```

## Connect

The following example shows the simplest way to connect to a Redis server.
First, import the `go-redis` package:

{{< clients-example set="landing" step="import" lang_filter="Go" >}}
{{< /clients-example >}}

Then connect to localhost on port 6379 and add a
[context](https://golang.org/pkg/context/) object:

{{< clients-example set="landing" step="connect" lang_filter="Go" >}}
{{< /clients-example >}}

You can also connect using a connection string:

```go
opt, err := redis.ParseURL("redis://<user>:<pass>@localhost:6379/<db>")
if err != nil {
	panic(err)
}

client := redis.NewClient(opt)
```

After connecting, you can test the connection by  storing and retrieving
a simple [string]({{< relref "/develop/data-types/strings" >}}):

{{< clients-example set="landing" step="set_get_string" lang_filter="Go" >}}
{{< /clients-example >}}

You can also easily store and retrieve a [hash]({{< relref "/develop/data-types/hashes" >}}):

{{< clients-example set="landing" step="set_get_hash" lang_filter="Go" >}}
{{< /clients-example >}}

 Use
 [struct tags](https://stackoverflow.com/questions/10858787/what-are-the-uses-for-struct-tags-in-go)
 of the form `redis:"<field-name>"` with the `Scan()` method to parse fields from
 a hash directly into corresponding struct fields:

{{< clients-example set="landing" step="get_hash_scan" lang_filter="Go" >}}
{{< /clients-example >}}

Close the connection when you're done using a `Close()` call:

{{< clients-example set="landing" step="close" lang_filter="Go" >}}
{{< /clients-example >}}

In the common case where you want to close the connection at the end of the
function where you opened it, you may find it convenient to use a `defer`
statement right after connecting:

```go
func main() {    
    rdb := redis.NewClient(&redis.Options{
        ...
    })
    defer rdb.Close()
    ...
}
```

## Observability

`go-redis` supports [OpenTelemetry](https://opentelemetry.io/) instrumentation.
to monitor performance and trace the execution of Redis commands.
For example, the following code instruments Redis commands to collect traces, logs, and metrics:

```go
import (
    "github.com/redis/go-redis/v9"
    "github.com/redis/go-redis/extra/redisotel/v9"
)

client := redis.NewClient(&redis.Options{...})

// Enable tracing instrumentation.
if err := redisotel.InstrumentTracing(client); err != nil {
	panic(err)
}

// Enable metrics instrumentation.
if err := redisotel.InstrumentMetrics(client); err != nil {
	panic(err)
}
```

See the `go-redis` [GitHub repo](https://github.com/redis/go-redis/blob/master/example/otel/README.md).
for more OpenTelemetry examples.

## More information

See the other pages in this section for more information and examples.
Further examples are available at the [`go-redis`](https://redis.uptrace.dev/guide/) website
and the [GitHub repository](https://github.com/redis/go-redis).
