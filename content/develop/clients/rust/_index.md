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
description: Connect your Rust application to a Redis database
linkTitle: redis-rs (Rust)
title: redis-rs guide (Rust)
weight: 9
---

[`redis-rs`](https://github.com/redis-rs/redis-rs) is the [Rust](https://www.rust-lang.org/) client for Redis.
The sections below explain how to install `redis-rs` and connect your application to a Redis database.

{{< note >}}Although we provide basic documentation for `redis-rs`, it is a third-party
client library and is not developed or supported directly by Redis.
{{< /note >}}

`redis-rs` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

## Install

To use the synchronous API, add the `redis` crate as a dependency in your
`Cargo.toml` file:

```toml
[dependencies]
redis = "0.32.5"
```

If you want to use the asynchronous API, you should also enable either
[`tokio`](https://tokio.rs/) or [`smol`](https://crates.io/crates/smol)
as your async platform:

```toml
[dependencies]
# if you use tokio
tokio = { version = "1.32.0", features = ["full"] }
redis = { version = "0.32.5", features = ["tokio-comp"] }

# if you use smol
smol = "2.0.2"
redis = { version = "0.32.5", features = ["smol-comp"] }
```

## Connect

Start by importing the `Commands` or `AsyncCommands` trait from the `redis` crate:

{{< clients-example set="landing" step="import" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Import the Commands trait to access Redis command methods" difficulty="beginner" >}}
{{< /clients-example >}}

The following example shows the simplest way to connect to a Redis server:

{{< clients-example set="landing" step="connect" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Connect to a Redis server and establish a client connection" difficulty="beginner" >}}
{{< /clients-example >}}

After connecting, you can test the connection by  storing and retrieving
a simple [string]({{< relref "/develop/data-types/strings" >}}):

{{< clients-example set="landing" step="set_get_string" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Set and retrieve string values using SET and GET commands" difficulty="beginner" >}}
{{< /clients-example >}}

You can also easily store and retrieve a [hash]({{< relref "/develop/data-types/hashes" >}}):

{{< clients-example set="landing" step="set_get_hash" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Store and retrieve hash data structures using HSET and HGETALL" difficulty="beginner" >}}
{{< /clients-example >}}

## More information

See the [`redis-rs`](https://docs.rs/redis/latest/redis/) documentation
and the [GitHub repository](https://github.com/redis-rs/redis-rs) for more
information and examples.
