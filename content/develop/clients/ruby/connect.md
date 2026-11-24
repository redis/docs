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
description: Connect your Ruby application to a Redis database
linkTitle: Connect
title: Connect to the server
weight: 1
---

## Basic connection

Create a `Redis` object with the host, port, and database number of your server. The
defaults are `localhost`, port 6379, and database 0. If you don't pass a host, port, socket
path, or URL, the client uses the URL in the `REDIS_URL` environment variable, if it's set.

```ruby
require "redis"

r = Redis.new(host: "localhost", port: 6379, db: 0)
```

Store and retrieve a string to test the connection.

```ruby
r.set("foo", "bar")
# => "OK"

r.get("foo")
# => "bar"
```

To connect as an [access control list (ACL)](/content/operate/oss_and_stack/management/security/acl.md)
user, pass `username` and `password`:

```ruby
r = Redis.new(
  host: "localhost",
  port: 6379,
  username: "default", # use your Redis user
  password: "secret",  # use your Redis password
)
```

You can also pass the connection details as a `redis://` URL. If you pass other options
with `url`, such as `password`, those options override the values in the URL.

```ruby
r = Redis.new(url: "redis://default:secret@localhost:6379/0")
```

The client URL-decodes the username and password, so you must URL-encode any special
characters in them, such as `@`, `:`, `/`, or `+`:

```ruby
require "uri"

password = URI.encode_www_form_component("p@ss/word+1")
r = Redis.new(url: "redis://default:#{password}@localhost:6379")
```

To connect through a Unix socket, pass the socket path in `path`, or use a `unix://` URL:

```ruby
r = Redis.new(path: "/var/run/redis/redis.sock")

r = Redis.new(url: "unix:///var/run/redis/redis.sock")
```

## Connect to a Redis cluster

Cluster support is in the separate `redis-clustering` gem:

```bash
gem install redis-clustering
```

Create a `Redis::Cluster` object with a list of cluster nodes. The list doesn't need to
include every node, because the client discovers the rest of the cluster from the nodes
you list.

```ruby
require "redis-clustering"

rc = Redis::Cluster.new(nodes: [
  "redis://localhost:16379",
  "redis://localhost:16380",
  "redis://localhost:16381",
])

rc.set("foo", "bar")
# => "OK"

rc.get("foo")
# => "bar"
```

To send read-only commands to replicas, set `replica: true`. Use `replica_affinity` to
choose a replica: `:random` (the default) picks a random replica, `:random_with_primary`
picks from the replicas and the primary, and `:latency` picks the replica with the lowest
latency. Replication is asynchronous, so a replica can return stale data.

```ruby
rc = Redis::Cluster.new(
  nodes: ["redis://localhost:16379"],
  replica: true,
  replica_affinity: :latency,
)
```

## Connect to Redis Sentinel

To connect through [Redis Sentinel](/content/operate/oss_and_stack/management/sentinel.md),
pass `sentinels` and `name` to `Redis.new`. Set `name` to the name of the primary that the
Sentinels monitor. The client asks the Sentinels for the current address of the primary.

```ruby
require "redis"

SENTINELS = [
  { host: "localhost", port: 26379 },
  { host: "localhost", port: 26380 },
  { host: "localhost", port: 26381 },
]

r = Redis.new(name: "mymaster", sentinels: SENTINELS)

r.set("foo", "bar")
# => "OK"

r.get("foo")
# => "bar"
```

The Sentinels and the data nodes have separate credentials, and neither inherits the
other's. Set `sentinel_password` (and `sentinel_username`, if your Sentinels use ACL users)
for the Sentinels, and `username` and `password` for the primary and replicas:

```ruby
r = Redis.new(
  name: "mymaster",
  sentinels: SENTINELS,
  sentinel_password: "sentinel-secret", # use your Sentinel password
  username: "default",                  # use your Redis user
  password: "secret",                   # use your Redis password
)
```

The Sentinel connections use your other options, such as the timeouts and `ssl`.

To connect to a replica, set `role: :replica`. The client connects to a random replica.
Replication is asynchronous, so a replica can return stale data, and writes fail with
`Redis::ReadOnlyError`.

```ruby
replica = Redis.new(name: "mymaster", sentinels: SENTINELS, role: :replica)

replica.get("foo")
# => "bar"
```

redis-rb doesn't listen for failover announcements from the Sentinels. After a failover,
the client keeps using the old primary until Sentinel reconfigures it as a replica and it
starts rejecting writes. The client then reconnects to the new primary. Any writes that the
old primary accepts during that time are lost.

## Connect to your production Redis with TLS

When you deploy your application, use Transport Layer Security (TLS) and follow the
[Redis security](/content/operate/oss_and_stack/management/security/_index.md) guidelines.

Set `ssl: true`, or use a `rediss://` URL, and pass the TLS settings in `ssl_params`. Set
`ca_file` to the certificate authority (CA) certificate that signed the server's
certificate:

```ruby
r = Redis.new(
  url: "rediss://default:secret@my-redis.example.com:6379",
  ssl_params: { ca_file: "./redis_ca.pem" },
)
```

If the server requires clients to authenticate with a certificate, also pass the client
certificate and private key in `cert` and `key`:

```ruby
r = Redis.new(
  host: "my-redis.example.com",
  port: 6379,
  username: "default", # use your Redis user
  password: "secret",  # use your Redis password
  ssl: true,
  ssl_params: {
    ca_file: "./redis_ca.pem",
    cert: OpenSSL::X509::Certificate.new(File.read("./redis_user.crt")),
    key: OpenSSL::PKey.read(File.read("./redis_user_private.key")),
  },
)

r.set("foo", "bar")
# => "OK"

r.get("foo")
# => "bar"
```

`cert` and `key` also accept file paths, such as `cert: "./redis_user.crt"`. If you use the
`hiredis` driver, `cert` and `key` must be file paths.

## Connect with a connection pool

A `Redis` object holds a single connection, and a lock serializes access to it. You can
share one object between threads safely, but each thread waits for the others to finish
their commands. To run commands from several threads in parallel, use a pool of `Redis`
objects from the `connection_pool` gem:

```bash
gem install connection_pool
```

Create a `ConnectionPool` and call `with` to check out a connection for a block of
commands:

```ruby
require "connection_pool"
require "redis"

pool = ConnectionPool.new(size: 5, timeout: 5) do
  Redis.new(host: "localhost", port: 6379)
end

pool.with do |r|
  r.set("foo", "bar")
  r.get("foo")
end
# => "bar"
```

`ConnectionPool::Wrapper` wraps a pool in an object that you call like a `Redis` object.
Each method call checks out a connection for that call only, so consecutive calls can run on
different connections. Use `with` when several commands must run on the same connection.

```ruby
redis = ConnectionPool::Wrapper.new(size: 5, timeout: 5) do
  Redis.new(host: "localhost", port: 6379)
end

redis.set("foo", "bar")
redis.get("foo")
# => "bar"
```

See [Connection pools and multiplexing](/content/develop/clients/pools-and-muxing.md) for
more information.

## Timeouts and reconnection

The connect, read, and write timeouts default to 1 second. Set `timeout` to change all
three, or set `connect_timeout`, `read_timeout`, and `write_timeout` individually. All
values are in seconds.

```ruby
r = Redis.new(
  host: "localhost",
  port: 6379,
  connect_timeout: 0.5,
  read_timeout: 2.0,
  write_timeout: 2.0,
)
```

After a connection error, the client reconnects and retries the command once by default.
Set `reconnect_attempts` to an `Integer` to change the number of retries, or to an `Array`
of delays in seconds to wait before each retry:

```ruby
r = Redis.new(host: "localhost", port: 6379, reconnect_attempts: [0.05, 0.25, 1.0])
```

A retry can run a command twice: if the connection fails after the server runs a command
but before the client reads the reply, the client sends the command again. For commands
that aren't idempotent, such as `INCR` or `LPUSH`, set `reconnect_attempts: 0`, or run them
inside `without_reconnect`:

```ruby
r.without_reconnect do
  r.incr("counter")
end
```

## Protocol

Starting with redis-rb 6.0, the client uses
[RESP3](/content/develop/reference/protocol-spec.md#resp-versions) (Redis serialization
protocol version 3) by default. If the server doesn't support RESP3, the client falls
back to RESP2 and prints a warning. To use RESP2, set `protocol: 2`:

```ruby
r = Redis.new(host: "localhost", port: 6379, protocol: 2)
```
