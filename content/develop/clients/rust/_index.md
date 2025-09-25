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

Add the `redis` crate as a dependency in your `Cargo.toml` file:

```toml
[dependencies]
redis = "0.32.5"
```

## Connect

Start by importing the `Commands` trait from the `redis` crate:

{{< clients-example set="landing" step="import" lang_filter="Rust-Sync" >}}
{{< /clients-example >}}

The following example shows the simplest way to connect to a Redis server:

{{< clients-example set="landing" step="connect" lang_filter="Rust-Sync" >}}
{{< /clients-example >}}

After connecting, you can test the connection by  storing and retrieving
a simple [string]({{< relref "/develop/data-types/strings" >}}):

{{< clients-example set="landing" step="set_get_string" lang_filter="Rust-Sync" >}}
{{< /clients-example >}}

You can also easily store and retrieve a [hash]({{< relref "/develop/data-types/hashes" >}}):

{{< clients-example set="landing" step="set_get_hash" lang_filter="Rust-Sync" >}}
{{< /clients-example >}}

## More information

See the [`redis-rs`](https://docs.rs/redis/latest/redis/) documentation
and the [GitHub repository](https://github.com/redis-rs/redis-rs) for more
information and examples.
