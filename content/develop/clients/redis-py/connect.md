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
description: Connect your Python application to a Redis database
linkTitle: Connect
title: Connect to the server
weight: 20
---

## Basic connection

Connect to localhost on port 6379, set a value in Redis, and retrieve it. All responses are returned as bytes in Python. To receive decoded strings, set `decode_responses=True`. For more connection options, see [these examples](https://redis.readthedocs.io/en/stable/examples.html).

```python
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
```

> [!NOTE]
> redis-py supports [connection URLs](/content/develop/clients/connection-urls.md#redis-py-python) through `redis.from_url()`.
> A URL can set the host, port, credentials, database, and whether to use TLS,
> so you can use one instead of passing those options separately.

Store and retrieve a simple string.

```python
r.set('foo', 'bar')
# True
r.get('foo')
# bar
```

Store and retrieve a dict.

```python
r.hset('user-session:123', mapping={
    'name': 'John',
    "surname": 'Smith',
    "company": 'Redis',
    "age": 29
})
# True

r.hgetall('user-session:123')
# {'surname': 'Smith', 'name': 'John', 'company': 'Redis', 'age': '29'}
```

## Connect to a Redis cluster

To connect to a Redis cluster, use `RedisCluster`.

```python
from redis.cluster import RedisCluster

rc = RedisCluster(host='localhost', port=16379)

print(rc.get_nodes())
# [[host=127.0.0.1,port=16379,name=127.0.0.1:16379,server_type=primary,redis_connection=Redis<ConnectionPool<Connection<host=127.0.0.1,port=16379,db=0>>>], ...

rc.set('foo', 'bar')
# True

rc.get('foo')
# b'bar'
```
For more information, see [redis-py Clustering](https://redis.readthedocs.io/en/stable/clustering.html).

## Connect to Redis Sentinel

To connect through [Redis Sentinel](/content/operate/oss_and_stack/management/sentinel.md),
create a `Sentinel` object with a list of Sentinel addresses. Then call `master_for()` with
the name of the primary that the Sentinels monitor. The client asks the Sentinels for the
current address of the primary.

```python
from redis.sentinel import Sentinel

sentinel = Sentinel([('localhost', 26379), ('localhost', 26380), ('localhost', 26381)])
r = sentinel.master_for('mymaster', decode_responses=True)

r.set('foo', 'bar')
# True

r.get('foo')
# bar
```

The Sentinels and the data nodes have separate credentials. Pass the Sentinel credentials
in `sentinel_kwargs`, and the credentials for the primary and replicas to `master_for()`:

```python
from redis.sentinel import Sentinel

sentinel = Sentinel(
    [('localhost', 26379), ('localhost', 26380), ('localhost', 26381)],
    sentinel_kwargs={'password': 'sentinel-secret'},  # use your Sentinel password
)
r = sentinel.master_for(
    'mymaster',
    username='default',  # use your Redis user
    password='secret',  # use your Redis password
    decode_responses=True,
)
```

If you set `sentinel_kwargs`, the Sentinel connections don't inherit `socket_timeout` or the
other `socket_*` options, so add any that you need to `sentinel_kwargs`.

To send read-only commands to a replica, use `slave_for()`. Replication is asynchronous, so
a replica can return stale data.

```python
replica = sentinel.slave_for('mymaster', decode_responses=True)

replica.get('foo')
# bar
```

redis-py doesn't listen for failover announcements from the Sentinels. After a failover,
the client keeps using the old primary until Sentinel reconfigures it as a replica and it
starts rejecting writes. Any writes that the old primary accepts during that time are lost.

## Connect to your production Redis with TLS

When you deploy your application, use TLS and follow the [Redis security](/content/operate/oss_and_stack/management/security/_index.md) guidelines.

```python
import redis

r = redis.Redis(
    host="my-redis.cloud.redislabs.com", port=6379,
    username="default", # use your Redis user. More info https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/
    password="secret", # use your Redis password
    ssl=True,
    ssl_certfile="./redis_user.crt",
    ssl_keyfile="./redis_user_private.key",
    ssl_ca_certs="./redis_ca.pem",
)
r.set('foo', 'bar')
# True

r.get('foo')
# b'bar'
```
For more information, see [redis-py TLS examples](https://redis.readthedocs.io/en/stable/examples/ssl_connection_examples.html).

## Connect using client-side caching

Client-side caching is a technique to reduce network traffic between
the client and server, resulting in better performance. See
[Client-side caching introduction](/content/develop/clients/client-side-caching.md)
for more information about how client-side caching works and how to use it effectively.

To enable client-side caching, add some extra parameters when you connect
to the server:

-   `protocol`: (Required) You must pass a value of `3` here because
    client-side caching requires the [RESP3](/content/develop/reference/protocol-spec.md#resp-versions)
    protocol.
-   `cache_config`: (Required) Pass `cache_config=CacheConfig()` here to enable client-side caching.

The example below shows the simplest client-side caching connection to the default host and port,
`localhost:6379`.
All of the connection variants described above accept these parameters, so you can
use client-side caching with a connection pool or a cluster connection in exactly the same way.

> [!NOTE]
> Client-side caching requires redis-py v5.1.0 or later.
> To maximize compatibility with all Redis products, client-side caching
> is supported by Redis v7.4 or later.
>
> The [Redis server products](/content/operate/_index.md) support
> [opt-in/opt-out](/content/develop/reference/client-side-caching.md#opt-in-and-opt-out-caching) mode
> and [broadcasting mode](/content/develop/reference/client-side-caching.md#broadcasting-mode)
> for CSC. From v8.2.0, `redis-py` supports opt-in and opt-out mode (see
> [Choose a tracking mode](#choose-a-tracking-mode)), but it does not
> currently implement broadcasting mode.

```python
import redis
from redis.cache import CacheConfig

r = redis.Redis(
    protocol=3,
    cache_config=CacheConfig(),
    decode_responses=True
)

r.set("city", "New York")
cityNameAttempt1 = r.get("city")    # Retrieved from Redis server and cached
cityNameAttempt2 = r.get("city")    # Retrieved from cache
```

You can see the cache working if you connect to the same Redis database
with [`redis-cli`](/content/develop/tools/cli.md) and run the
[`MONITOR`](/content/commands/monitor.md) command. If you run the
code above with the `cache_config` line commented out, you should see
the following in the CLI among the output from `MONITOR`:

```
1723109720.268903 [...] "SET" "city" "New York"
1723109720.269681 [...] "GET" "city"
1723109720.270205 [...] "GET" "city"
```

The server responds to both `get("city")` calls.
If you run the code again with `cache_config` uncommented, you will see

```
1723110248.712663 [...] "SET" "city" "New York"
1723110248.713607 [...] "GET" "city"
```

The first `get("city")` call contacted the server but the second
call was satisfied by the cache.

### Removing items from the cache

You can remove individual keys from the cache with the
`delete_by_redis_keys()` method. This removes all cached items associated
with the keys, so all results from multi-key commands (such as
[`MGET`](/content/commands/mget.md)) and composite data structures
(such as [hashes](/content/develop/data-types/hashes.md)) will be
cleared at once. The example below shows the effect of removing a single
key from the cache:

```python
r.hget("person:1", "name") # Read from the server
r.hget("person:1", "name") # Read from the cache

r.hget("person:2", "name") # Read from the server
r.hget("person:2", "name") # Read from the cache

cache = r.get_cache()
cache.delete_by_redis_keys(["person:1"])

r.hget("person:1", "name") # Read from the server
r.hget("person:1", "name") # Read from the cache

r.hget("person:2", "name") # Still read from the cache
```

You can also clear all cached items using the `flush()`
method:

```python
r.hget("person:1", "name") # Read from the server
r.hget("person:1", "name") # Read from the cache

r.hget("person:2", "name") # Read from the cache
r.hget("person:2", "name") # Read from the cache

cache = r.get_cache()
cache.flush()

r.hget("person:1", "name") # Read from the server
r.hget("person:1", "name") # Read from the cache

r.hget("person:2", "name") # Read from the server
r.hget("person:2", "name") # Read from the cache
```

The client will also flush the cache automatically
if any connection (including one from a connection pool)
is disconnected.

### Choose a tracking mode

By default, the server remembers (*tracks*) the keys of every read-only command
that the client sends, whether or not the client stores the reply.
From `redis-py` v8.2.0, set `tracking_mode` in `CacheConfig` to
reduce what the server has to remember, and so reduce its memory use and the number of
invalidation messages that the client receives:

| Mode | The server tracks | Use when |
| --- | --- | --- |
| `TrackingMode.PLAIN` (default) | The keys of every read-only command | You cache most of what you read. |
| `TrackingMode.OPTIN` | Only the keys of the reads that the client caches | You cache a small, chosen subset. |
| `TrackingMode.OPTOUT` | The keys of every read-only command, except the reads that the client doesn't cache | You cache nearly everything. |

In `OPTIN` and `OPTOUT` mode, the client sends a
[`CLIENT CACHING`](/content/commands/client-caching.md) `YES` or `NO` command
together with each read that it needs to mark. See
[Opt-in and Opt-out caching](/content/develop/reference/client-side-caching.md#opt-in-and-opt-out-caching)
for details of how the server handles them.

Pass a `TrackingMode` value to `tracking_mode`. The client raises a `TypeError`
if you pass a string. The mode is set when a connection opens, so a change
applies only to new connections.

> [!NOTE]
> A client that has a cache refuses to send
> [`CLIENT CACHING`](/content/commands/client-caching.md),
> [`CLIENT TRACKING`](/content/commands/client-tracking.md),
> and [`RESET`](/content/commands/reset.md), because they change the tracking state
> that the cache depends on. The client raises a `RedisError` if you try.

### Choose which replies to cache

In `OPTIN` and `OPTOUT` mode, use `cache_predicate` to decide which replies to cache.
The predicate takes the command name (for example, `"GET"`) and the tuple of keys that
the command used, and returns `True` to cache the reply.
The client calls it only for commands that are already eligible for caching
and that have keys.

-   In `OPTOUT` mode, the client caches every eligible reply unless the predicate
    returns `False`.
-   In `OPTIN` mode, the client caches only the replies for which the predicate returns
    `True`. With no predicate, `OPTIN` mode caches nothing, and the client
    warns when you create the `CacheConfig`.
-   In `PLAIN` mode, the client ignores the predicate and warns.

The keys arrive in the form you passed them to the command (`str` or `bytes`),
so use `str_if_bytes()` if you need to inspect them.
The example below caches only the keys with a `user:` prefix:

```python
import redis
from redis.cache import CacheConfig, TrackingMode
from redis.utils import str_if_bytes

r = redis.Redis(
    protocol=3,
    decode_responses=True,
    cache_config=CacheConfig(
        tracking_mode=TrackingMode.OPTIN,
        cache_predicate=lambda command, keys: str_if_bytes(keys[0]).startswith("user:"),
    ),
)

r.set("user:1", "Ada")
r.set("session:1", "abc123")

r.get("user:1")       # Retrieved from the server and cached
r.get("user:1")       # Retrieved from the cache

r.get("session:1")    # Retrieved from the server, not cached
r.get("session:1")    # Retrieved from the server again
```

If you run the code with [`MONITOR`](/content/commands/monitor.md), you see that
the client marks only the first `user:1` read for tracking:

```
1795428967.269387 [...] "SET" "user:1" "Ada"
1795428967.295521 [...] "SET" "session:1" "abc123"
1795428967.303353 [...] "CLIENT" "CACHING" "YES"
1795428967.303371 [...] "GET" "user:1"
1795428967.311822 [...] "GET" "session:1"
1795428967.312387 [...] "GET" "session:1"
```

### Choose which commands are eligible

The client caches a reply only if the command's metadata allows it. The command must be
read-only, must not block, and must take at least one key. It must also not be
marked as non-deterministic, a script runner, or `dont_cache`. The client uses the
command metadata that ships with `redis-py`, and it never caches a command that
the metadata doesn't describe, such as a command from a module that `redis-py`
doesn't know about.

To make the client cache such a command, pass a `metadata_resolver` that describes it.
Resolvers chain, and the first match wins, so put your resolver in front of
`StaticMetadataResolver` to override only the commands that you list.
The example below makes the client cache [`VCARD`](/content/commands/vcard.md),
which the shipped metadata doesn't describe.
Pass `keys=` to `execute_command()` so that the client knows which keys the
reply depends on:

```python
import redis
from redis.cache import CacheConfig
from redis.commands.metadata import (
    CommandMetadata,
    DynamicMetadataResolver,
    RequestPolicy,
    ResponsePolicy,
    StaticMetadataResolver,
)

records = {
    "core": {
        "vcard": CommandMetadata(
            request_policy=RequestPolicy.DEFAULT_KEYED,
            response_policy=ResponsePolicy.DEFAULT_KEYED,
            is_readonly=True,
            has_key_argument=True,
            has_complete_metadata=True,
        )
    }
}

resolver = DynamicMetadataResolver(records, fallback=StaticMetadataResolver())

r = redis.Redis(
    protocol=3,
    decode_responses=True,
    cache_config=CacheConfig(),
    metadata_resolver=resolver,
)

r.execute_command("VADD", "points", "VALUES", 2, 0.1, 0.2, "a")

r.execute_command("VCARD", "points", keys=["points"])  # Retrieved from the server and cached
r.execute_command("VCARD", "points", keys=["points"])  # Retrieved from the cache
```

Add records for module commands under the module's lowercase prefix. For example,
use `"graph"` for the `GRAPH.*` commands.

The `Redis` and `RedisCluster` classes accept `metadata_resolver`, and so does `ConnectionPool`
if you supply your own pool. A cluster client also uses the resolver to route commands,
including reads that can go to replicas.
The async client `redis.asyncio.RedisCluster` accepts the argument for routing only, because the
async clients don't support client-side caching.

Earlier versions used `CacheConfig.DEFAULT_ALLOW_LIST` to decide eligibility.
That list is deprecated and the client no longer reads it, so use `metadata_resolver`
instead.

## Connect with a connection pool

For production usage, you should use a connection pool to manage
connections rather than opening and closing connections individually.
A connection pool maintains several open connections and reuses them
efficiently. When you open a connection from a pool, the pool allocates
one of its open connections. When you subsequently close the same connection,
it is not actually closed but simply returned to the pool for reuse.
This avoids the overhead of repeated connecting and disconnecting.
See
[Connection pools and multiplexing](/content/develop/clients/pools-and-muxing.md)
for more information.

Use the following code to connect with a connection pool:

```python
import redis

pool = redis.ConnectionPool().from_url("redis://localhost")
r1 = redis.Redis().from_pool(pool)
r2 = redis.Redis().from_pool(pool)
r3 = redis.Redis().from_pool(pool)

r1.set("wind:1", "Hurricane")
r2.set("wind:2", "Tornado")
r3.set("wind:3", "Mistral")

r1.close()
r2.close()
r3.close()

pool.close()
```

## Retrying connections

A connection will sometimes fail because of a transient problem, such as a
network outage or a server that is temporarily unavailable. In these cases,
retrying the connection after a short delay will usually succeed. `redis-py` uses
a simple retry strategy by default, but there are various ways you can customize
this behavior to suit your use case. See
[Retries](/content/develop/clients/redis-py/produsage.md#retries)
for more information about custom retry strategies, with example code.

## Connect using Smart client handoffs (SCH)

*Smart client handoffs (SCH)* is a feature of Redis Cloud and
Redis Software servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.
See [Smart client handoffs](/content/develop/clients/sch.md)
for more information about SCH.

> [!NOTE]
> Using SCH with redis-py requires v7.0.0 or later for
> standard routing, and v7.2.0 or later for
> [OSS Cluster API](/content/operate/rs/databases/configure/oss-cluster-api.md) connections.

By default, `redis-py` always attempts to connect via SCH but falls back to
a non-SCH connection if the server doesn't support it. However, you can configure SCH
explicitly by passing a `MaintNotificationsConfig` object during the connection,
as shown in the following example:

```py
import redis
from redis.maint_notifications import MaintNotificationsConfig, EndpointType

r = redis.Redis(
    decode_responses=True,
    protocol=3,
    maint_notifications_config=MaintNotificationsConfig(
        proactive_reconnect=True,
        relaxed_timeout=10,
        endpoint_type=EndpointType.EXTERNAL_IP
    ),
    ...
)
```

To disable SCH, pass `enabled=False` in the `MaintNotificationsConfig` object:

```python
r = redis.Redis(
    maint_notifications_config=MaintNotificationsConfig(
        enabled=False,
    ),
    ...
)
```

> [!NOTE]
> SCH requires the [RESP3](/content/develop/reference/protocol-spec.md#resp-versions)
> protocol, so you must set `protocol=3` explicitly when you connect.

The `MaintNotificationsConfig` constructor accepts the following parameters:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `bool` | `True` | Whether or not to enable SCH. |
| `proactive_reconnect` | `bool` | `True` | Whether or not to automatically reconnect when a node is replaced. |
| `endpoint_type` | `EndpointType` | Auto-detect | The type of endpoint to use for the connection. The options are `EndpointType.EXTERNAL_IP`, `EndpointType.INTERNAL_IP`, `EndpointType.EXTERNAL_FQDN`, `EndpointType.INTERNAL_FQDN`, and `EndpointType.NONE`. |
| `relaxed_timeout` | `int` | `20` | The timeout (in seconds) to use while the server is performing maintenance. A value of `-1` disables the relax timeout and just uses the normal timeout during maintenance. |

> [!NOTE]
> Redis Cloud supports relaxed timeouts *only* (and not pre-handoffs) for SCH if you are using
> [Google Cloud Private Service Connect](/content/operate/rc/security/private-service-connect.md)
> or the OSS Cluster API with [AWS PrivateLink](/content/operate/rc/security/aws-privatelink.md)
> (see [Smart client handoffs](/content/develop/clients/sch.md#redis-cloud) for more information).
> To use relaxed timeouts with these connections, you should set `endpoint_type=EndpointType.NONE`
> when you connect. All other configurations have full support for both relaxed timeouts and pre-handoffs.
