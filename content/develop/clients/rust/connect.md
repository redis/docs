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
linkTitle: Connect
title: Connect to the server
weight: 10
---

## Basic connection

Synchronous connections need only `redis = "1.7.1"` in your `Cargo.toml` file. For
asynchronous connections, also enable the `tokio-comp` feature and add
[`tokio`](https://tokio.rs/):

```toml
[dependencies]
redis = { version = "1.7.1", features = ["tokio-comp"] }
tokio = { version = "1", features = ["full"] }
```

The following example opens a synchronous connection, then stores and retrieves a
[string](/content/develop/data-types/strings/_index.md):

```rust
use redis::Commands;

fn main() -> redis::RedisResult<()> {
    let client = redis::Client::open("redis://localhost:6379/")?;
    let mut con = client.get_connection()?;

    let _: () = con.set("foo", "bar")?;
    let val: String = con.get("foo")?;
    println!("foo: {val}"); // foo: bar
    Ok(())
}
```

The asynchronous version uses `get_multiplexed_async_connection()`:

```rust
use redis::AsyncCommands;

#[tokio::main]
async fn main() -> redis::RedisResult<()> {
    let client = redis::Client::open("redis://localhost:6379/")?;
    let mut con = client.get_multiplexed_async_connection().await?;

    let _: () = con.set("foo", "bar").await?;
    let val: String = con.get("foo").await?;
    println!("foo: {val}"); // foo: bar
    Ok(())
}
```

To connect as an [access control list (ACL)](/content/operate/oss_and_stack/management/security/acl.md)
user, add the username and password to the URL. The path selects the database number:

```rust
let client = redis::Client::open("redis://<username>:<password>@localhost:6379/0")?;
```

You can also build the connection details in code with `ConnectionInfo` and
`RedisConnectionInfo`:

```rust
use redis::{ConnectionAddr, IntoConnectionInfo, RedisConnectionInfo};

let info = ConnectionAddr::Tcp("localhost".to_string(), 6379)
    .into_connection_info()?
    .set_redis_settings(
        RedisConnectionInfo::default()
            .set_username("default") // use your Redis user
            .set_password("secret") // use your Redis password
            .set_db(0),
    );
let client = redis::Client::open(info)?;
```

To connect through a Unix socket, use a `redis+unix://` URL. A Unix socket URL takes the
username, password, and database number as the `user`, `pass`, and `db` query parameters.
This differs from a `redis://` URL, which takes the credentials before the host and the
database number from the path.

```rust
let client = redis::Client::open("redis+unix:///tmp/redis.sock?user=<username>&pass=<password>&db=0")?;
```

To authenticate with Microsoft Entra ID, see
[Connect to Azure Managed Redis](/content/develop/clients/rust/amr.md).

## Connect to a Redis cluster

To connect to a Redis cluster, enable the `cluster` feature:

```toml
[dependencies]
redis = { version = "1.7.1", features = ["cluster"] }
```

Then pass one or more cluster nodes to `ClusterClient::new()`. The client discovers the
rest of the cluster from these nodes:

```rust
use redis::cluster::ClusterClient;
use redis::Commands;

fn main() -> redis::RedisResult<()> {
    let nodes = vec![
        "redis://localhost:16379/",
        "redis://localhost:16380/",
        "redis://localhost:16381/",
    ];
    let client = ClusterClient::new(nodes)?;
    let mut con = client.get_connection()?;

    let _: () = con.set("foo", "bar")?;
    let val: String = con.get("foo")?;
    println!("foo: {val}"); // foo: bar
    Ok(())
}
```

For asynchronous connections, enable the `cluster-async` and `tokio-comp` features instead,
and call `get_async_connection()`:

```rust
let mut con = client.get_async_connection().await?;
```

By default, the client sends every command to the primary node. To send read-only
commands to replicas, create the client with `ClusterClientBuilder` and set a read
routing strategy. `RandomReplicaStrategy` sends each read to a random replica of the
key's shard, and `RoundRobinReplicaStrategy` rotates through them. Writes still go to the
primary. Replication is asynchronous, so a replica can return stale data.

```rust
use redis::cluster::ClusterClientBuilder;
use redis::cluster_read_routing::RandomReplicaStrategy;

let client = ClusterClientBuilder::new(nodes)
    .read_routing_strategy(RandomReplicaStrategy)
    .build()?;
let mut con = client.get_connection()?;

let val: String = con.get("foo")?; // Read from a replica
```

## Connect to Redis Sentinel

To connect through [Redis Sentinel](/content/operate/oss_and_stack/management/sentinel.md),
enable the `sentinel` feature:

```toml
[dependencies]
redis = { version = "1.7.1", features = ["sentinel"] }
```

Then create a client with `SentinelClientBuilder`. Pass one or more Sentinel addresses,
the name of the primary that the Sentinels monitor, and `SentinelServerType::Master`.
Each call to `get_connection()` asks the Sentinels for the current primary and checks
its role before it connects:

```rust
use redis::sentinel::{SentinelClientBuilder, SentinelServerType};
use redis::{Commands, ConnectionAddr};

fn main() -> redis::RedisResult<()> {
    let sentinels = vec![
        ConnectionAddr::Tcp("localhost".to_string(), 26379),
        ConnectionAddr::Tcp("localhost".to_string(), 26380),
        ConnectionAddr::Tcp("localhost".to_string(), 26381),
    ];
    let mut client =
        SentinelClientBuilder::new(sentinels, "mymaster", SentinelServerType::Master)?.build()?;
    let mut con = client.get_connection()?;

    let _: () = con.set("foo", "bar")?;
    let val: String = con.get("foo")?;
    println!("foo: {val}"); // foo: bar
    Ok(())
}
```

The Sentinels and the data nodes have separate credentials. Use the
`set_client_to_sentinel_*` methods for the Sentinels, and the `set_client_to_redis_*`
methods for the primary and replicas:

```rust
let mut client = SentinelClientBuilder::new(sentinels, "mymaster", SentinelServerType::Master)?
    .set_client_to_sentinel_password("sentinel-secret") // use your Sentinel password
    .set_client_to_redis_username("default") // use your Redis user
    .set_client_to_redis_password("secret") // use your Redis password
    .build()?;
```

To connect to a replica instead, pass `SentinelServerType::Replica`. The client connects
to a replica chosen at random, and writes on that connection fail. Replication is
asynchronous, so a replica can return stale data.

```rust
let mut replica =
    SentinelClientBuilder::new(sentinels, "mymaster", SentinelServerType::Replica)?.build()?;
let mut con = replica.get_connection()?;

let val: String = con.get("foo")?;
```

A connection from `get_connection()` doesn't reconnect, and redis-rs doesn't listen for
failover announcements from the Sentinels. After a failover, the connection keeps using
the old primary until Sentinel reconfigures it as a replica and closes the connection.
Any writes that the old primary accepts during that time are lost. When a command fails
with a connection error, call `get_connection()` again to connect to the new primary.

## Connect to your production Redis with TLS

When you deploy your application, use Transport Layer Security (TLS) and follow the
[Redis security](/content/operate/oss_and_stack/management/security/_index.md) guidelines.

Custom certificates need the rustls backend, so enable the `tls-rustls` feature, or
`tokio-rustls-comp` for asynchronous connections. Also add the `rustls` crate, which
provides the cryptography:

```toml
[dependencies]
redis = { version = "1.7.1", features = ["tls-rustls"] }
rustls = "0.23"
```

If a certificate authority (CA) in your system's trust store signed the server's
certificate, a `rediss://` URL is all you need. To use Mozilla's root certificates
instead of the system trust store, enable the `tls-rustls-webpki-roots` feature.

```rust
let client = redis::Client::open("rediss://<username>:<password>@my-redis.example.com:6379")?;
```

To use your own CA certificate, or a client certificate and key for mutual TLS, pass the
Privacy-Enhanced Mail (PEM) files to `Client::build_with_tls()` in a `TlsCertificates`
object. rustls chooses a crypto provider automatically only when your dependencies enable
exactly one, and the connection panics otherwise, so the following example installs one
before it connects:

```rust
use redis::{ClientTlsConfig, Commands, TlsCertificates};
use std::fs;

fn main() -> redis::RedisResult<()> {
    // Install a crypto provider for rustls before you connect.
    rustls::crypto::aws_lc_rs::default_provider()
        .install_default()
        .expect("Failed to install the rustls crypto provider");

    let client = redis::Client::build_with_tls(
        "rediss://<username>:<password>@my-redis.example.com:6379",
        TlsCertificates {
            client_tls: Some(ClientTlsConfig {
                client_cert: fs::read("redis_user.crt")?,
                client_key: fs::read("redis_user_private.key")?,
            }),
            root_cert: Some(fs::read("redis_ca.pem")?),
        },
    )?;
    let mut con = client.get_connection()?;

    let _: () = con.set("foo", "bar")?;
    let val: String = con.get("foo")?;
    println!("foo: {val}"); // foo: bar
    Ok(())
}
```

## Connect using client-side caching

Client-side caching is a technique to reduce network traffic between
the client and server, resulting in better performance. See
[Client-side caching introduction](/content/develop/clients/client-side-caching.md)
for more information about how client-side caching works and how to use it effectively.

> [!NOTE]
> Client-side caching is an
> [experimental feature](https://docs.rs/redis/1.7.1/redis/caching/index.html) of
> redis-rs. To maximize compatibility with all Redis products, client-side caching
> is supported by Redis v7.4 or later.
>
> Client-side caching requires version 3 of the
> [Redis serialization protocol (RESP3)](/content/develop/reference/protocol-spec.md#resp-versions),
> and connecting with caching enabled over RESP2 fails with an error. It's
> available only for asynchronous connections: `MultiplexedConnection`,
> `ConnectionManager`, and the asynchronous `ClusterConnection`.

Enable the `cache-aio` feature:

```toml
[dependencies]
redis = { version = "1.7.1", features = ["tokio-comp", "cache-aio"] }
tokio = { version = "1", features = ["full"] }
```

Then pass a `CacheConfig` in an `AsyncConnectionConfig` when you connect.
`CacheConfig::new()` enables caching with the default settings. Use
`get_cache_statistics()` to check that the second `get()` call is served from the cache:

```rust
use redis::caching::CacheConfig;
use redis::{AsyncCommands, AsyncConnectionConfig};

#[tokio::main]
async fn main() -> redis::RedisResult<()> {
    let client = redis::Client::open("redis://localhost:6379/?protocol=resp3")?;
    let config = AsyncConnectionConfig::new().set_cache_config(CacheConfig::new());
    let mut con = client.get_multiplexed_async_connection_with_config(&config).await?;

    let _: () = con.set("city", "New York").await?;
    let _: String = con.get("city").await?; // Retrieved from the server and cached
    let _: String = con.get("city").await?; // Retrieved from the cache

    let stats = con.get_cache_statistics().unwrap();
    println!("hits: {}, misses: {}", stats.hit, stats.miss); // hits: 1, misses: 1
    Ok(())
}
```

## Connection management and pooling

A `MultiplexedConnection` is cheap to clone, and all the clones share one underlying
connection, so you don't need a connection pool for asynchronous connections. Give each task
its own clone:

```rust
let con = client.get_multiplexed_async_connection().await?;

let tasks: Vec<_> = (1..=3)
    .map(|i| {
        let mut con = con.clone(); // Shares the same underlying connection
        tokio::spawn(async move { con.incr::<_, _, i64>("counter", i).await })
    })
    .collect();
for task in tasks {
    task.await.unwrap()?;
}
```

### Reconnect automatically

A `MultiplexedConnection` doesn't reconnect after the connection drops. To reconnect
automatically, enable the `connection-manager` feature:

```toml
[dependencies]
redis = { version = "1.7.1", features = ["tokio-comp", "connection-manager"] }
tokio = { version = "1", features = ["full"] }
```

Then use a `ConnectionManager`, which you can clone in the same way. The command that
encounters the disconnection still fails, and the manager reconnects in the background
for the next command, so retry where that matters. To change the retry and timeout
settings, pass a `ConnectionManagerConfig` to `get_connection_manager_with_config()`.

```rust
let client = redis::Client::open("redis://localhost:6379/")?;
let mut con = client.get_connection_manager().await?;

let _: () = con.set("foo", "bar").await?;
```

### Pool synchronous connections

For synchronous connections, use an [r2d2](https://docs.rs/r2d2) pool to handle
disconnections and share connections between threads. Enable the `r2d2` feature and add
the `r2d2` crate:

```toml
[dependencies]
redis = { version = "1.7.1", features = ["r2d2"] }
r2d2 = "0.8"
```

The pool opens `max_size` connections when you build it. The default is 10.

```rust
use redis::Commands;

let client = redis::Client::open("redis://localhost:6379/")?;
let pool = r2d2::Pool::builder().max_size(15).build(client).unwrap();

let mut con = pool.get().unwrap();
let _: () = con.set("foo", "bar")?;
```

## Timeouts

Asynchronous connections time out after 1 second when they connect, and after 500
milliseconds when they wait for a response. To change these timeouts, pass an
`AsyncConnectionConfig` when you connect. Pass `None` to disable a timeout.
`ConnectionManagerConfig` has the same defaults and setters.

```rust
use redis::AsyncConnectionConfig;
use std::time::Duration;

let config = AsyncConnectionConfig::new()
    .set_connection_timeout(Some(Duration::from_secs(5)))
    .set_response_timeout(Some(Duration::from_secs(2)));
let mut con = client.get_multiplexed_async_connection_with_config(&config).await?;
```

The response timeout also applies to blocking commands. With the default timeout, a
[`BLPOP`](/content/commands/blpop.md) that waits longer than 500 milliseconds fails with a
timeout error. Other commands on the same connection also time out until the server
finishes the blocking command, because the server doesn't process them in the meantime.
Send blocking commands on a separate connection, with a response timeout longer than the
command's own timeout, or none:

```rust
let config = AsyncConnectionConfig::new().set_response_timeout(None);
let mut con = client.get_multiplexed_async_connection_with_config(&config).await?;

// Waits up to 5 seconds for an item.
let item: Option<(String, String)> = con.blpop("queue", 5.0).await?;
```

Synchronous connections have no timeouts by default. `get_connection_with_timeout()`
limits the time to connect, and `set_read_timeout()` and `set_write_timeout()` limit each
read and write on the connection:

```rust
use std::time::Duration;

let con = client.get_connection_with_timeout(Duration::from_secs(5))?;
con.set_read_timeout(Some(Duration::from_secs(2)))?;
con.set_write_timeout(Some(Duration::from_secs(2)))?;
```

## Protocol

redis-rs uses the [RESP2](/content/develop/reference/protocol-spec.md#resp-versions)
protocol by default. To use RESP3, add `protocol=resp3` to the URL:

```rust
let client = redis::Client::open("redis://localhost:6379/?protocol=resp3")?;
```

You can also set the protocol with `RedisConnectionInfo`:

```rust
use redis::{ConnectionAddr, IntoConnectionInfo, ProtocolVersion, RedisConnectionInfo};

let info = ConnectionAddr::Tcp("localhost".to_string(), 6379)
    .into_connection_info()?
    .set_redis_settings(RedisConnectionInfo::default().set_protocol(ProtocolVersion::RESP3));
let client = redis::Client::open(info)?;
```

For cluster and Sentinel clients, use `ClusterClientBuilder::use_protocol()` and
`SentinelClientBuilder::set_client_to_redis_protocol()`.
