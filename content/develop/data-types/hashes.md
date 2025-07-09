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
description: 'Introduction to Redis hashes

  '
linkTitle: Hashes
title: Redis hashes
weight: 40
---

Redis hashes are record types structured as collections of field-value pairs.
You can use hashes to represent basic objects and to store groupings of counters, among other things.

{{< clients-example hash_tutorial set_get_all >}}
> HSET bike:1 model Deimos brand Ergonom type 'Enduro bikes' price 4972
(integer) 4
> HGET bike:1 model
"Deimos"
> HGET bike:1 price
"4972"
> HGETALL bike:1
1) "model"
2) "Deimos"
3) "brand"
4) "Ergonom"
5) "type"
6) "Enduro bikes"
7) "price"
8) "4972"

{{< /clients-example >}}

While hashes are handy to represent *objects*, actually the number of fields you can
put inside a hash has no practical limits (other than available memory), so you can use
hashes in many different ways inside your application.

The command [`HSET`]({{< relref "/commands/hset" >}}) sets multiple fields of the hash, while [`HGET`]({{< relref "/commands/hget" >}}) retrieves
a single field. [`HMGET`]({{< relref "/commands/hmget" >}}) is similar to [`HGET`]({{< relref "/commands/hget" >}}) but returns an array of values:

{{< clients-example hash_tutorial hmget >}}
> HMGET bike:1 model price no-such-field
1) "Deimos"
2) "4972"
3) (nil)
{{< /clients-example >}}

There are commands that are able to perform operations on individual fields
as well, like [`HINCRBY`]({{< relref "/commands/hincrby" >}}):

{{< clients-example hash_tutorial hincrby >}}
> HINCRBY bike:1 price 100
(integer) 5072
> HINCRBY bike:1 price -100
(integer) 4972
{{< /clients-example >}}

You can find the [full list of hash commands in the documentation]({{< relref "/commands#hash" >}}).

It is worth noting that small hashes (i.e., a few elements with small values) are
encoded in special way in memory that make them very memory efficient.

## Basic commands

* [`HSET`]({{< relref "/commands/hset" >}}): sets the value of one or more fields on a hash.
* [`HGET`]({{< relref "/commands/hget" >}}): returns the value at a given field.
* [`HMGET`]({{< relref "/commands/hmget" >}}): returns the values at one or more given fields.
* [`HINCRBY`]({{< relref "/commands/hincrby" >}}): increments the value at a given field by the integer provided.

See the [complete list of hash commands]({{< relref "/commands/" >}}?group=hash).

## Examples

* Store counters for the number of times bike:1 has been ridden, has crashed, or has changed owners:
{{< clients-example hash_tutorial incrby_get_mget >}}
> HINCRBY bike:1:stats rides 1
(integer) 1
> HINCRBY bike:1:stats rides 1
(integer) 2
> HINCRBY bike:1:stats rides 1
(integer) 3
> HINCRBY bike:1:stats crashes 1
(integer) 1
> HINCRBY bike:1:stats owners 1
(integer) 1
> HGET bike:1:stats rides
"3"
> HMGET bike:1:stats owners crashes
1) "1"
2) "1"
{{< /clients-example >}}

## Field expiration

New in Redis Open Source 7.4 is the ability to specify an expiration time or a time-to-live (TTL) value for individual hash fields.
This capability is comparable to [key expiration]({{< relref "/develop/using-commands/keyspace#key-expiration" >}}) and includes a number of similar commands.

Use the following commands to set either an exact expiration time or a TTL value for specific fields:

* [`HEXPIRE`]({{< relref "/commands/hexpire" >}}): set the remaining TTL in seconds.
* [`HPEXPIRE`]({{< relref "/commands/hpexpire" >}}): set the remaining TTL in milliseconds.
* [`HEXPIREAT`]({{< relref "/commands/hexpireat" >}}): set the expiration time to a timestamp[^1] specified in seconds.
* [`HPEXPIREAT`]({{< relref "/commands/hpexpireat" >}}): set the expiration time to a timestamp specified in milliseconds.

[^1]: all timestamps are specified in seconds or milliseconds since the [Unix epoch](https://en.wikipedia.org/wiki/Unix_time).

Use the following commands to retrieve either the exact time when or the remaining TTL until specific fields will expire:

* [`HEXPIRETIME`]({{< relref "/commands/hexpiretime" >}}): get the expiration time as a timestamp in seconds.
* [`HPEXPIRETIME`]({{< relref "/commands/hpexpiretime" >}}): get the expiration time as a timestamp in milliseconds.
* [`HTTL`]({{< relref "/commands/httl" >}}): get the remaining TTL in seconds.
* [`HPTTL`]({{< relref "/commands/hpttl" >}}): get the remaining TTL in milliseconds.

Use the following command to remove the expiration of specific fields:

* [`HPERSIST`]({{< relref "/commands/hpersist" >}}): remove the expiration.

### Common field expiration use cases

1. **Event Tracking**: Use a hash key to store events from the last hour. Set each event's TTL to one hour. Use `HLEN` to count events from the past hour.

1. **Fraud Detection**: Create a hash with hourly counters for events. Set each field's TTL to 48 hours. Query the hash to get the number of events per hour for the last 48 hours.

1. **Customer Session Management**: Store customer data in hash keys. Create a new hash key for each session and add a session field to the customer’s hash key. Expire both the session key and the session field in the customer’s hash key automatically when the session expires.

1. **Active Session Tracking**: Store all active sessions in a hash key. Set each session's TTL to expire automatically after inactivity. Use `HLEN` to count active sessions.

### Field expiration examples

Support for hash field expiration in the official client libraries is not yet available, but you can test hash field expiration now with beta versions of the [Python (redis-py)](https://github.com/redis/redis-py) and [Java (Jedis)](https://github.com/redis/jedis) client libraries.

Following are some Python examples that demonstrate how to use field expiration.

Consider a hash data set for storing sensor data that has the following structure:

```python
event = {
    'air_quality': 256,
    'battery_level':89
}

r.hset('sensor:sensor1', mapping=event)
```

In the examples below, you will likely need to refresh the `sensor:sensor1` key after its fields expire.

Set and retrieve the TTL for multiple fields in a hash:

```python
# set the TTL for two hash fields to 60 seconds
r.hexpire('sensor:sensor1', 60, 'air_quality', 'battery_level')
ttl = r.httl('sensor:sensor1', 'air_quality', 'battery_level')
print(ttl)
# prints [60, 60]
```

Set and retrieve a hash field's TTL in milliseconds:

```python
# set the TTL of the 'air_quality' field in milliseconds
r.hpexpire('sensor:sensor1', 60000, 'air_quality')
# and retrieve it
pttl = r.hpttl('sensor:sensor1', 'air_quality')
print(pttl)
# prints [59994] # your actual value may vary
```

Set and retrieve a hash field’s expiration timestamp:

```python
# set the expiration of 'air_quality' to now + 24 hours
# (similar to setting the TTL to 24 hours)
r.hexpireat('sensor:sensor1', 
    datetime.now() + timedelta(hours=24), 
    'air_quality')
# and retrieve it
expire_time = r.hexpiretime('sensor:sensor1', 'air_quality')
print(expire_time)
# prints [1717668041] # your actual value may vary
```

## Performance

Most Redis hash commands are O(1).

A few commands, such as [`HKEYS`]({{< relref "/commands/hkeys" >}}), [`HVALS`]({{< relref "/commands/hvals" >}}), [`HGETALL`]({{< relref "/commands/hgetall" >}}), and most of the expiration-related commands, are O(n), where _n_ is the number of field-value pairs.

## Limits

Every hash can store up to 4,294,967,295 (2^32 - 1) field-value pairs.
In practice, your hashes are limited only by the overall memory on the VMs hosting your Redis deployment.

## Learn more

* [Redis Hashes Explained](https://www.youtube.com/watch?v=-KdITaRkQ-U) is a short, comprehensive video explainer covering Redis hashes.
* [Redis University's RU101](https://university.redis.com/courses/ru101/) covers Redis hashes in detail.