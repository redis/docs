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
linkTitle: Redis Python library
title: Redis Python library guide
weight: 1
---

[redis-py](https://github.com/redis/redis-py) is the Python client for Redis. 
The sections below explain how to install `redis-py` and connect your application
to a Redis database.

`redis-py` requires a running Redis or [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) server. See [Getting started]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis installation instructions.

You can also access Redis with an object-mapping client interface. See
[RedisOM for Python]({{< relref "/integrate/redisom-for-python" >}})
for more information.

## Install

To install `redis-py`, enter:

```bash
pip install redis
```

For faster performance, install Redis with [`hiredis`](https://github.com/redis/hiredis) support. This provides a compiled response parser, and for most cases requires zero code changes. By default, if `hiredis` >= 1.0 is available, `redis-py` attempts to use it for response parsing.

{{% alert title="Note" %}}
The Python `distutils` packaging scheme is no longer part of Python 3.12 and greater. If you're having difficulties getting `redis-py` installed in a Python 3.12 environment, consider updating to a recent release of `redis-py`.
{{% /alert %}}

```bash
pip install redis[hiredis]
```

## Connect

Connect to localhost on port 6379, set a value in Redis, and retrieve it. All responses are returned as bytes in Python. To receive decoded strings, set `decode_responses=True`. For more connection options, see [these examples](https://redis.readthedocs.io/en/stable/examples.html).

```python
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
```

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

### Connect to a Redis cluster

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
For more information, see [redis-py Clustering](https://redis-py.readthedocs.io/en/stable/clustering.html).

### Connect to your production Redis with TLS

When you deploy your application, use TLS and follow the [Redis security]({{< relref "/operate/oss_and_stack/management/security/" >}}) guidelines.

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
For more information, see [redis-py TLS examples](https://redis-py.readthedocs.io/en/stable/examples/ssl_connection_examples.html).

## Connect using client-side caching

*Client-side caching* is a technique to reduce network traffic between
the client and server, resulting in better performance. See
[Client-side caching introduction]({{< relref "/develop/connect/clients/client-side-caching" >}})
for more information about how client-side caching works and how to use it effectively.

To enable client-side caching, add some extra parameters when you connect
to the server:

-   `protocol`: (Required) You must pass a value of `3` here because
    client-side caching requires the [RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
    protocol.
-   `cache_config`: (Required) Pass `cache_config=CacheConfig()` here to enable client-side caching.

The example below shows the simplest client-side caching connection to the default host and port,
`localhost:6379`.
All of the connection variants described above accept these parameters, so you can
use client-side caching with a connection pool or a cluster connection in exactly the same way.

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
with [`redis-cli`]({{< relref "/develop/connect/cli" >}}) and run the
[`MONITOR`]({{< relref "/commands/monitor" >}}) command. If you run the
code above with the `cache_config` line commented out, you should see
the following in the CLI among the output from `MONITOR`:

```
1723109720.268903 [...] "SET" "city" "New York"
1723109720.269681 [...] "GET" "city"
1723109720.270205 [...] "GET" "city"
```

This shows that the server responds to both `get("city")` calls.
If you run the code again with `cache_config` uncommented, you will see

```
1723110248.712663 [...] "SET" "city" "New York"
1723110248.713607 [...] "GET" "city"
```

This shows that the first `get("city")` call contacted the server but the second
call was satisfied by the cache.

### Removing items from the cache

You can remove individual keys from the cache with the
`delete_by_redis_keys()` method. This removes all cached items associated
with the keys, so all results from multi-key commands (such as
[`MGET`]({{< relref "/commands/mget" >}})) and composite data structures
(such as [hashes]({{< relref "/develop/data-types/hashes" >}})) will be
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


## Example: Indexing and querying JSON documents

Make sure that you have Redis Stack and `redis-py` installed. Import dependencies:

```python
import redis
from redis.commands.json.path import Path
import redis.commands.search.aggregation as aggregations
import redis.commands.search.reducers as reducers
from redis.commands.search.field import TextField, NumericField, TagField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redis.commands.search.query import NumericFilter, Query
```

Connect to your Redis database.

```python
r = redis.Redis(host='localhost', port=6379)
```

Let's create some test data to add to your database.

```python
user1 = {
    "name": "Paul John",
    "email": "paul.john@example.com",
    "age": 42,
    "city": "London"
}
user2 = {
    "name": "Eden Zamir",
    "email": "eden.zamir@example.com",
    "age": 29,
    "city": "Tel Aviv"
}
user3 = {
    "name": "Paul Zamir",
    "email": "paul.zamir@example.com",
    "age": 35,
    "city": "Tel Aviv"
}
```

Define indexed fields and their data types using `schema`. Use JSON path expressions to map specific JSON elements to the schema fields.

```python
schema = (
    TextField("$.name", as_name="name"), 
    TagField("$.city", as_name="city"), 
    NumericField("$.age", as_name="age")
)
```

Create an index. In this example, all JSON documents with the key prefix `user:` will be indexed. For more information, see [Query syntax]({{< relref "/develop/interact/search-and-query/query/" >}}). 

```python
rs = r.ft("idx:users")
rs.create_index(
    schema,
    definition=IndexDefinition(
        prefix=["user:"], index_type=IndexType.JSON
    )
)
# b'OK'
```

Use [`JSON.SET`]({{< baseurl >}}/commands/json.set/) to set each user value at the specified path.

```python
r.json().set("user:1", Path.root_path(), user1)
r.json().set("user:2", Path.root_path(), user2)
r.json().set("user:3", Path.root_path(), user3)
```

Let's find user `Paul` and filter the results by age.

```python
res = rs.search(
    Query("Paul @age:[30 40]")
)
# Result{1 total, docs: [Document {'id': 'user:3', 'payload': None, 'json': '{"name":"Paul Zamir","email":"paul.zamir@example.com","age":35,"city":"Tel Aviv"}'}]}
```

Query using JSON Path expressions.

```python
rs.search(
    Query("Paul").return_field("$.city", as_field="city")
).docs
# [Document {'id': 'user:1', 'payload': None, 'city': 'London'}, Document {'id': 'user:3', 'payload': None, 'city': 'Tel Aviv'}]
```

Aggregate your results using [`FT.AGGREGATE`]({{< baseurl >}}/commands/ft.aggregate/).

```python
req = aggregations.AggregateRequest("*").group_by('@city', reducers.count().alias('count'))
print(rs.aggregate(req).rows)
# [[b'city', b'Tel Aviv', b'count', b'2'], [b'city', b'London', b'count', b'1']]
```

## Learn more

* [Command reference](https://redis-py.readthedocs.io/en/stable/commands.html)
* [Tutorials](https://redis.readthedocs.io/en/stable/examples.html)
* [GitHub](https://github.com/redis/redis-py)
 
