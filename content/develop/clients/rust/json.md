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
description: Learn how to store, read, and update JSON documents with redis-rs.
linkTitle: JSON documents
title: Work with JSON documents
scope: example
relatedPages:
- /develop/data-types/json
- /develop/data-types/json/path
topics:
- JSON
- Rust
weight: 30
---

This example shows how to work with a
[JSON]({{< relref "/develop/data-types/json" >}})
document from Rust using [`redis-rs`]({{< relref "/develop/clients/rust" >}}).
It uses one `bike:1` document to demonstrate a simple workflow:
create the document, read nested fields, update part of the document,
and append data to an array.

Unlike some of the other client examples in this section, this page focuses on
Redis JSON commands directly rather than on Redis Search.

## Install

Add `serde_json` and enable the `json` feature for `redis`.
If you want to use the async API, also enable a runtime integration such as `tokio-comp`.

```toml
[dependencies]
serde_json = "1"

# Sync API
redis = { version = "1.0.4", features = ["json"] }

# Async API with Tokio
tokio = { version = "1", features = ["full"] }
redis = { version = "1.0.4", features = ["json", "tokio-comp"] }
```

## Import the required crates

The example uses `serde_json::json!()` to build the document and the
`JsonCommands` or `JsonAsyncCommands` trait to access Redis JSON commands.

{{< clients-example set="rust_home_json" step="import" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Import the Redis JSON traits and serde_json helpers needed to work with JSON documents in Rust" difficulty="beginner" >}}
{{< /clients-example >}}

## Create some JSON data

Create a sample document representing a bike listing.
The nested `specs` and `inventory` objects and the `colors` array let you see how
JSON paths work with more realistic data than a flat object.

{{< clients-example set="rust_home_json" step="create_data" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Define a nested JSON document with objects and arrays using serde_json::json!" difficulty="beginner" >}}
{{< /clients-example >}}

## Connect to Redis

Connect to your Redis server in the usual way.
See [Connect to the server]({{< relref "/develop/clients/rust" >}})
for more connection options.

{{< clients-example set="rust_home_json" step="connect" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Create a Redis client and open a sync or async connection from Rust" difficulty="beginner" >}}
{{< /clients-example >}}

## Store and retrieve the document

Use [`JSON.SET`]({{< relref "/commands/json.set" >}}) to store the whole document at the root path `$`.
You can then retrieve the document again with [`JSON.GET`]({{< relref "/commands/json.get" >}}).

{{< clients-example set="rust_home_json" step="set_get_doc" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Store a complete JSON document with JSON.SET and fetch it again with JSON.GET" difficulty="beginner" >}}
{{< /clients-example >}}

## Read nested fields

JSON paths let you retrieve only the parts of the document you need.
This is useful when your application only needs a small subset of the data.

{{< clients-example set="rust_home_json" step="get_fields" lang_filter="Rust-Sync,Rust-Async" description="Read nested data: Use JSON paths to retrieve selected fields and arrays without fetching the whole document" difficulty="beginner" >}}
{{< /clients-example >}}

## Update part of the document

You can update individual fields without replacing the whole document.
The example below changes the stock count and then applies a price change with
[`JSON.NUMINCRBY`]({{< relref "/commands/json.numincrby" >}}).

{{< clients-example set="rust_home_json" step="update_fields" lang_filter="Rust-Sync,Rust-Async" description="Update nested values: Modify individual fields in place with JSON.SET and JSON.NUMINCRBY" difficulty="intermediate" >}}
{{< /clients-example >}}

## Append to an array

You can also update arrays in place.
This example adds another color to the bike and then retrieves the updated array.

{{< clients-example set="rust_home_json" step="update_array" lang_filter="Rust-Sync,Rust-Async" description="Update arrays: Append new elements to a JSON array and read back the updated value" difficulty="intermediate" >}}
{{< /clients-example >}}

## More information

See the following pages to learn more:

- [JSON data type]({{< relref "/develop/data-types/json" >}})
- [JSON path syntax]({{< relref "/develop/data-types/json/path" >}})
- [`redis-rs` documentation](https://docs.rs/redis/latest/redis/)
