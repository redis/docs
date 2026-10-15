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
description: Learn the Redis connection URL format and how each client library interprets it
linkTitle: Connection URLs
title: Connection URLs
weight: 35
---

Most Redis client libraries can connect using a URL such as
`redis://default:<password>@<host>:6379/0`. Only the basic form of the URL
means the same thing in every client. Everything else, including how you
set timeouts, TLS options, and the RESP protocol version, is specific to
each client library.

The `redis` and `rediss` URL schemes have a
[provisional IANA registration](https://www.iana.org/assignments/uri-schemes/prov/redis),
but this is not a formal standard. The registration describes the basic form
and says that query parameters are implementation-defined and not portable
between clients.

## URL format

The basic form of a Redis URL is:

```
redis[s]://[[<username>][:<password>]@][<host>][:<port>][/<db-number>]
```

| Part | Meaning | Default |
| :-- | :-- | :-- |
| `redis` or `rediss` | Use `redis` for a plain TCP connection and `rediss` for a TLS connection. | (required) |
| `<username>` | Username for [ACL authentication](/content/operate/oss_and_stack/management/security/acl.md). | `default` |
| `<password>` | Password for authentication. | No authentication |
| `<host>` | Hostname or IP address of the server. Enclose an IPv6 address in square brackets, for example `[::1]`. | `localhost` |
| `<port>` | Port number of the server. | `6379` |
| `<db-number>` | Number of the logical database to select. | `0` |

## Write portable URLs

Follow these rules to write a URL that works the same way in every client
that accepts URLs:

- **Use a lowercase scheme.** Lettuce, Predis, and synchronous redis-py
  reject `REDIS://`, and ioredis only enables TLS for a lowercase `rediss://`.
- **Always include the port.** Jedis rejects a URL without one.
- **Always include the username with the password.** Write
  `redis://default:<password>@<host>:6379` rather than leaving out the username.
  The form `redis://:<password>@<host>` also means "password only" in every client.
  However, the form `redis://<value>@<host>`, without a colon, is not portable:

  | Client | `<value>` in `redis://<value>@<host>` means |
  | :-- | :-- |
  | redis-py, node-redis, ioredis, go-redis, redis-rs, Predis | Username, with no password |
  | Lettuce, redis-rb | Password |
  | Jedis | Error |

- **Percent-encode special characters in the username and password.**
  Encode any character that has a special meaning in URLs, such as `@`, `:`, `/`,
  `?`, `#`, `%`, and `+`. For example, the password `p@ss:w+rd` becomes
  `p%40ss%3Aw%2Brd`. See [Predis](#predis-php) and [redis-rb](#redis-rb-ruby)
  for exceptions.
- **Select the database with the path, not a query parameter.**
  `redis://<host>:6379/2` selects database 2 in every client. The `?db=` query
  parameter is ignored by some clients and has a different name in others.
- **Don't put query parameters in a URL that more than one client reads.**
  Clients recognize different parameter names, and they handle a name they
  don't recognize differently:

  | Behavior for an unknown query parameter | Clients |
  | :-- | :-- |
  | Ignored | node-redis, Jedis, Lettuce, redis-rs, redis-rb |
  | Passed to the client as an option | redis-py, ioredis, Predis |
  | Error | go-redis |

- **Don't set the same option in both the URL and the client's options.**
  Clients disagree about which one takes precedence.

A URL often contains a password, so treat it as a secret. For example, keep it
out of logs and error messages.

## Client support

The following table summarizes how each client library handles URLs. See the
sections after the table for details.

| Client | URL entry point | Schemes | Unix socket | Database in query | RESP version in query |
| :-- | :-- | :-- | :-- | :-- | :-- |
| [redis-py](#redis-py-python) | `redis.from_url()` | `redis`, `rediss`, `unix` | `unix:///<path>?db=<n>` | `?db=` | `?protocol=2` or `3` |
| [node-redis](#node-redis-javascript) | `createClient({ url })` | `redis`, `rediss`, `unix` | `unix:///<path>?db=<n>` | Unix socket only | Not supported |
| [ioredis](#ioredis-javascript) | `new Redis(url)` | `redis`, `rediss` | `/<path>?db=<n>` (no scheme) | `?db=` | Not supported |
| [Jedis](#jedis-java) | `RedisClient.create(url)` | `redis`, `rediss` | Not supported | Not supported | `?protocol=2` or `3` |
| [Lettuce](#lettuce-java) | `RedisURI.create(url)` | `redis`, `rediss`, `redis-socket`, `redis-sentinel`, `rediss-sentinel`, and others | `redis-socket:///<path>?database=<n>` | `?database=` or `?db=` | Not supported |
| [go-redis](#go-redis-go) | `redis.ParseURL()` | `redis`, `rediss`, `unix` | `unix:///<path>?db=<n>` | `?db=` | `?protocol=2` or `3` |
| [redis-rs](#redis-rs-rust) | `Client::open(url)` | `redis`, `rediss`, `unix`, `redis+unix` | `unix:///<path>?db=<n>` | Unix socket only | `?protocol=2` or `3` |
| [redis-rb](#redis-rb-ruby) | `Redis.new(url: url)` | `redis`, `rediss`, `unix` | `unix:///<path>?db=<n>` | `?db=` | Not supported |
| [Predis](#predis-php) | `new Predis\Client(url)` | `redis`, `rediss`, `tcp`, `tls`, `unix` | `unix:///<path>?database=<n>` | `?database=` | `?protocol=3` |
| [SE.Redis and NRedisStack](#stackexchangeredis-and-nredisstack-net) | Not supported | | | | |
| [hiredis](#hiredis-c) | Not supported | | | | |

The `rediss` scheme turns on TLS, but most clients only let you configure
certificates in code. See the TLS section of each client's connection page,
for example
[Connect to your production Redis with TLS](/content/develop/clients/redis-py/connect.md#connect-to-your-production-redis-with-tls)
for redis-py.

## redis-py (Python)

Pass the URL to `redis.from_url()`, `Redis.from_url()`, or
`ConnectionPool.from_url()`. The `redis.asyncio` module has the same functions.

```python
import redis

r = redis.from_url("rediss://default:<password>@<host>:6379/0?protocol=3")
```

- Query parameters become keyword arguments for the connection. redis-py
  converts the types of the parameters it recognizes, such as `socket_timeout`,
  `socket_connect_timeout`, `health_check_interval`, `protocol`, and
  `ssl_check_hostname`. It passes any other parameter as a string, and reports
  an error for an unknown name when it creates the first connection.
- Pass Boolean options that redis-py doesn't convert, such as
  `decode_responses`, as keyword arguments rather than in the URL. For example,
  `?decode_responses=False` passes the string `"False"`, which Python treats as
  true.
- A query parameter overrides the keyword argument with the same name.
  If you specify both `?db=` and a path, `?db=` wins.
- For TLS connections, you can set `ssl_cert_reqs` (`none`, `optional`, or
  `required`) and `ssl_check_hostname` in the query.
- `RedisCluster.from_url()` accepts only database 0 and doesn't support Unix
  sockets. There is no URL form for Sentinel.

See the
[`from_url()` reference](https://redis.readthedocs.io/en/stable/connections.html#redis.Redis.from_url)
for more information.

## node-redis (JavaScript)

Pass the URL in the `url` option of `createClient()`:

```js
import { createClient } from 'redis';

const client = createClient({
  url: 'rediss://default:<password>@<host>:6379/0'
});
```

- node-redis ignores all query parameters in `redis://` and `rediss://` URLs.
  Set other options, such as `RESP`, in the options object.
- Values in the URL override the `username`, `password`, and `database`
  options.
- For a Unix socket, use `unix:///<path>`. You can add the database with
  `?db=<n>`.
- For a cluster, set `url` for each of the `rootNodes`. The credentials in
  these URLs are only used for the initial connections, so set credentials for
  the other nodes in the `defaults` option. There is no URL form for Sentinel.

## ioredis (JavaScript)

Pass the URL as an argument to the `Redis` constructor:

```js
import Redis from 'ioredis';

const redis = new Redis('rediss://default:<password>@<host>:6379/0');
```

- ioredis doesn't reject other schemes. It adds `redis://` to the start of
  any string that doesn't begin with `redis://` or `rediss://`, so a URL such as
  `unix:///tmp/redis.sock` is read as a host named `unix`.
- For a Unix socket, pass the socket path without a scheme, for example
  `new Redis('/tmp/redis.sock?db=1')`.
- ioredis passes query parameters to the client as options, with string
  values. Set non-string options, such as `protocol`, in the options object
  instead.
- If you pass the URL before the options object, values in the URL take
  precedence.
- A `rediss://` URL for a cluster startup node doesn't turn on TLS. Set the
  `tls` option in `redisOptions` instead.

## Jedis (Java)

Pass the URL to `RedisClient.create()`:

```java
RedisClient jedis = RedisClient.create("rediss://default:<password>@<host>:6379/0");
```

- The URL must include a port.
- For a password with no username, use `redis://:<password>@<host>:<port>`.
  A URL such as `redis://<password>@<host>:<port>`, without a colon, is an error.
- The only query parameter is `protocol`, with the value `2` or `3`.
  Jedis ignores any other parameter, including `db`.
- Don't add a slash after the database number. Jedis can't parse
  `redis://<host>:6379/1/?protocol=3`.
- There is no URL form for a Unix socket, a cluster, or Sentinel.

## Lettuce (Java)

Pass the URL to `RedisURI.create()` or `RedisClient.create()`:

```java
RedisClient client = RedisClient.create("rediss://default:<password>@<host>:6379/0");
```

- Lettuce recognizes these schemes:
  - `redis` for TCP.
  - `rediss` or `redis+ssl` for TLS, and `redis+tls` for TLS with STARTTLS.
  - `redis-socket` or `redis+socket` for a Unix socket.
  - `redis-sentinel` or `rediss-sentinel` for Sentinel.
- Lettuce reads `redis://<password>@<host>`, without a colon, as a password.
- Lettuce recognizes these query parameters:
  - `timeout`: a number with an optional unit suffix, such as `10s`. With no
    suffix, the unit is milliseconds.
  - `database` or `db`: the database number. This takes precedence over the
    path.
  - `clientName`, `libraryName`, and `libraryVersion`.
  - `verifyPeer`: `NONE`, `CA`, or `FULL`.
  - `sentinelMasterId`: the master name, for Sentinel.
- For Sentinel, list the Sentinel hosts separated by commas and name the
  master, for example
  `redis-sentinel://<password>@<host1>:26379,<host2>:26379/0?sentinelMasterId=mymaster`.
  The password in the URL is for the data nodes, not the Sentinels.
- For a cluster, pass `RedisClusterClient.create()` a URL with the seed nodes
  separated by commas, for example `redis://<password>@<host1>:7000,<host2>:7001`.
  Lettuce doesn't apply `clientName` or the database from this URL to the
  cluster nodes.

See [URI syntax](https://redis.github.io/lettuce/user-guide/connecting-redis/)
in the Lettuce documentation for more information.

## go-redis (Go)

Parse the URL with `redis.ParseURL()` and pass the result to
`redis.NewClient()`:

```go
opt, err := redis.ParseURL("rediss://default:<password>@<host>:6379/0?protocol=3")
if err != nil {
    panic(err)
}

client := redis.NewClient(opt)
```

- Query parameters set fields of `redis.Options`, using names in snake case
  such as `dial_timeout`, `read_timeout`, `pool_size`, `client_name`, and
  `protocol`. `ParseURL()` returns an error for any parameter it doesn't
  recognize.
- A duration parameter such as `dial_timeout` takes a number of seconds, such as
  `5`, or a Go duration string, such as `500ms`.
- For a `rediss` URL, `skip_verify=true` turns off certificate verification.
  `skip_verify` is an error in a `redis` URL.
- For a cluster, use `redis.ParseClusterURL()` and add the other seed nodes with
  `addr=<host>:<port>` parameters. This function ignores the path and returns
  an error for `db`.
- For Sentinel, use `redis.ParseFailoverURL()`. The credentials in the URL are
  for the Sentinels. Set the master name with `master_name=`, the master's
  credentials with `username=` and `password=`, and other Sentinels with
  `addr=`.

See the [`ParseURL()` reference](https://pkg.go.dev/github.com/redis/go-redis/v9#ParseURL)
for the full list of parameters.

## redis-rs (Rust)

Pass the URL to `Client::open()`:

```rust
let client = redis::Client::open("rediss://default:<password>@<host>:6379/0?protocol=3")?;
```

- The URL must include a host.
- The only query parameter for a TCP connection is `protocol`, with the value
  `2`, `3`, `resp2`, or `resp3`. If you don't set it, redis-rs uses RESP2.
- To skip certificate verification for a `rediss` URL, add the fragment
  `#insecure` to the end of the URL. With the `tls-rustls` feature, this also
  needs the `tls-rustls-insecure` feature.
- For a Unix socket, use `unix:///<path>` or `redis+unix:///<path>`. Pass the
  database and credentials as the `db`, `user`, and `pass` query parameters,
  not in the address.
- For a cluster, pass a URL for each node to `ClusterClient::new()`. The URLs
  must all have the same credentials, protocol, and TLS mode.

See the [crate documentation](https://docs.rs/redis/latest/redis/) for more
information.

## redis-rb (Ruby)

Pass the URL in the `url` option of `Redis.new`:

```ruby
require 'redis'

r = Redis.new(url: 'rediss://default:<password>@<host>:6379/0')
```

- If you don't pass `url`, `host`, `port`, or `path`, redis-rb reads the URL from
  the `REDIS_URL` environment variable.
- Options that you pass to `Redis.new` take precedence over values in the URL.
- The only query parameter is `db`. Set other options, such as `protocol`, in
  `Redis.new`.
- redis-rb reads `redis://<password>@<host>`, without a colon, as a password.
- redis-rb decodes percent-encoding in the password, but not in the username.
- For Sentinel, put the master name in place of the host and pass the
  Sentinels in the `sentinels` option, for example
  `Redis.new(url: 'redis://mymaster', sentinels: [...])`.

## Predis (PHP)

Pass the URL to the `Predis\Client` constructor:

```php
$client = new Predis\Client('rediss://default:<password>@<host>:6379/0');
```

- Predis only reads the credentials and database from the address for the
  `redis` and `rediss` schemes. For `tcp`, `tls`, and `unix`, use the
  `username`, `password`, and `database` query parameters.
- Predis doesn't decode percent-encoding in the username or password in the
  address. If your password contains special characters, pass it as a
  percent-encoded `password` query parameter instead.
- The query parameter for the database is `database`, not `db`.
- Predis passes all query parameters to the connection, for example
  `timeout`, `read_write_timeout`, `persistent`, and `protocol`.
- You can set TLS options with `ssl` parameters, for example
  `?ssl[cafile]=<path-to-ca-file>&ssl[verify_peer]=1`.

## StackExchange.Redis and NRedisStack (.NET)

StackExchange.Redis doesn't accept URLs. It uses its own configuration string
format, which is a comma-separated list of endpoints and `key=value` options.
NRedisStack connects through StackExchange.Redis and uses the same format.

```csharp
ConnectionMultiplexer redis = ConnectionMultiplexer.Connect(
    "<host>:6379,user=default,password=<password>,ssl=true,defaultDatabase=0"
);
```

If you have a URL, convert it to a configuration string:

| URL part | Configuration string |
| :-- | :-- |
| `rediss` scheme | `ssl=true` |
| `<host>:<port>` | `<host>:<port>` |
| `<username>` | `user=<username>` |
| `<password>` | `password=<password>` |
| `/<db-number>` | `defaultDatabase=<db-number>` |
| `?protocol=3` | `protocol=resp3` |

Always include the port. If you set `ssl=true` and leave out the port,
StackExchange.Redis uses port 6380, not 6379. Don't percent-encode the values.
The configuration string format has no way to escape a comma in a value.

See [Configuration](https://seredis.dev/Configuration) in the
StackExchange.Redis documentation for the full list of options.

## hiredis (C)

hiredis doesn't accept URLs. Pass the host and port to `redisConnect()`, or the
socket path to `redisConnectUnix()`. You can also use `redisConnectWithOptions()`
with a `redisOptions` struct. See [Connect](/content/develop/clients/hiredis/connect.md)
for examples.
