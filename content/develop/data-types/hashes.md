---
aliases:
- /data-types/hashes/
- /manual/data-types/hashes/
- /develop/data-types/hash/
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
weight: 50
---

{{< command-group group="hash" title="Hash command summary" show_link=true >}}

Redis hashes are record types structured as collections of field-value pairs.
You can use hashes to represent basic objects and to store groupings of counters, among other things.

{{< clients-example set="hash_tutorial" step="set_get_all" description="Foundational: Set and retrieve hash fields using HSET and HGET (overwrites existing field values)" >}}
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

{{< clients-example set="hash_tutorial" step="hmget" description="Retrieve multiple field values from a hash using HMGET when you need to reduce round trips to the server" buildsUpon="set_get_all" >}}
# Recreate the bike:1 hash so this example runs on its own.
> DEL bike:1
(integer) 1
> HSET bike:1 model Deimos brand Ergonom type 'Enduro bikes' price 4972
(integer) 4
> HMGET bike:1 model price no-such-field
1) "Deimos"
2) "4972"
3) (nil)
{{< /clients-example >}}

There are commands that are able to perform operations on individual fields
as well, like [`HINCRBY`]({{< relref "/commands/hincrby" >}}):

{{< clients-example set="hash_tutorial" step="hincrby" description="Increment hash field values for counters using HINCRBY (creates field if missing, initializes to 0)" buildsUpon="set_get_all" >}}
# Recreate the bike:1 hash so this example runs on its own.
> DEL bike:1
(integer) 1
> HSET bike:1 model Deimos brand Ergonom type 'Enduro bikes' price 4972
(integer) 4
> HINCRBY bike:1 price 100
(integer) 5072
> HINCRBY bike:1 price -100
(integer) 4972
{{< /clients-example >}}

You can find the [full list of hash commands in the documentation]({{< relref "/commands#hash" >}}).

It is worth noting that small hashes (i.e., a few elements with small values) are
encoded in special way in memory that make them very memory efficient.

## Examples

* Store counters for the number of times bike:1 has been ridden, has crashed, or has changed owners:
{{< clients-example set="hash_tutorial" step="incrby_get_mget" description="Practical pattern: Combine HINCRBY and HMGET to track multiple counters when you need atomic updates across multiple fields" difficulty="intermediate" buildsUpon="hincrby, hmget" >}}
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

Redis 7.4 introduced the ability to specify an expiration time or a time-to-live (TTL) value for individual hash fields.
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

Redis 8.0 introduced the following commands:

* [`HGETEX`]({{< relref "/commands/HGETEX" >}}): Get the value of one or more fields of a given hash key and optionally set their expiration time or time-to-live (TTL).
* [`HSETEX`]({{< relref "/commands/HSETEX" >}}): Set the value of one or more fields of a given hash key and optionally set their expiration time or time-to-live (TTL).

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

## Compact hashes

Redis 8.10 introduced *compact hashes*, a way to reduce the memory used by hashes that share the same field names. When many hashes have the same layout (for example, one hash per user, each with `name`, `email`, and `age`), Redis can store the shared set of field names once and keep only the values, plus a small reference to that set, in each key. This is an internal encoding: existing hash commands keep working exactly as before, with the same semantics and replies. The hash just uses less memory.

Compact hashes work best when many keys share the same, mostly stable set of field names. They are a poor fit when field names change often or are unique per key, or for very large hashes. There are two ways to opt in.

### Bulk import with HIMPORT

The [`HIMPORT`]({{< relref "/commands/himport" >}}) command family lets a client import many similarly-shaped hashes efficiently. You declare the shared field names once with [`HIMPORT PREPARE`]({{< relref "/commands/himport-prepare" >}}), then create each key with [`HIMPORT SET`]({{< relref "/commands/himport-set" >}}) by sending only its values. This reduces network traffic and per-command work compared with running [`HSET`]({{< relref "/commands/hset" >}}) once per key, and hints Redis to store the new keys as compact hashes. See [`HIMPORT`]({{< relref "/commands/himport" >}}) for the full workflow and its subcommands.

### Automatic conversion

For workloads that can't adopt a new command, Redis can convert eligible hashes to compact hashes on its own, with no code change. All the following settings default to `0` (off) and can be changed at runtime with [`CONFIG SET`]({{< relref "/commands/config-set" >}}).

#### On the write path

These convert hashes created or modified by normal commands (such as [`HSET`]({{< relref "/commands/hset" >}})), so an existing application gains the memory saving with no code change. They take effect lazily, like `hash-max-listpack-entries`: a change applies to a given hash only on its next write, not the moment you run [`CONFIG SET`]({{< relref "/commands/config-set" >}}).

| Config | Meaning |
|---|---|
| `hash-min-template-entries` | Minimum field count for a hash to be auto-converted to a compact hash on its next write. `0` disables auto-conversion. |
| `hash-max-template-entries` | Maximum field count for auto-conversion: a hash wider than this is left a plain hash (keeps very wide hashes out of the shared registry). `0` means no upper bound. |

A hash is not converted if it uses [field expiration](#field-expiration), even when its field count meets the minimum. After a hash has been converted, it stays a compact hash even if its field count later grows beyond `hash-max-template-entries`.

#### On RDB load

An RDB saved before this feature contains only plain hashes. These configs let Redis convert them to compact hashes *as the RDB loads*, so an upgrade reclaims memory without rewriting data. They apply only to RDBs without compact hashes; an RDB that already contains them is loaded as-is, with no load-time conversion. In effect these are one-time upgrade configs: they have no effect once the RDB contains at least one compact hash.

| Config | Meaning |
|---|---|
| `hash-rdb-load-min-template-entries` | Minimum field count to convert a plain hash to a compact hash during load. `0` disables load-time conversion. |
| `hash-rdb-load-max-template-entries` | Maximum field count for load-time conversion. `0` means no upper bound. |
| `hash-rdb-load-template-disassembly-threshold` | Minimum number of keys that must end up sharing a converted field-name set for it to be kept. `0` keeps every converted set. |

The disassembly threshold avoids wasting memory on field-name sets shared by only a few keys: at the end of the load, if a set is used by fewer keys than the threshold, those keys are converted back to plain hashes and the shared set is freed. It also acts as a safety valve during the load. Redis tracks how many converted sets are still below the threshold; once at least 1,000 have been created, if more than half of them are still below the threshold, Redis assumes the dataset is a poor fit for compact hashes and stops creating new ones partway through the load. From that point, only hashes whose field set matches one already created during this load are converted; the rest stay plain.

## Performance

Most Redis hash commands are O(1).

A few commands, such as [`HKEYS`]({{< relref "/commands/hkeys" >}}), [`HVALS`]({{< relref "/commands/hvals" >}}), [`HGETALL`]({{< relref "/commands/hgetall" >}}), and most of the expiration-related commands, are O(n), where _n_ is the number of field-value pairs.

## Limits

Every hash can store up to 4,294,967,295 (2^32 - 1) field-value pairs.
In practice, your hashes are limited only by the overall memory on the VMs hosting your Redis deployment.

## Learn more

* [Redis Hashes Explained](https://www.youtube.com/watch?v=-KdITaRkQ-U) is a short, comprehensive video explainer covering Redis hashes.
* [Redis University's RU101](https://university.redis.com/courses/ru101/) covers Redis hashes in detail.
