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

Hash field expiration is supported by the official client libraries. The examples below
demonstrate the field expiration commands using a hash that stores sensor data with the
following structure:

| Field           | Value |
| :-------------- | :---- |
| `air_quality`   | 256   |
| `battery_level` | 89    |

Because the fields expire, each example recreates the `sensor:sensor1` hash first so that
it runs on its own.

Set a TTL of 60 seconds for two fields of a hash and then retrieve the remaining TTL for
those fields:

{{< clients-example set="hash_tutorial" step="hexpire" lang_filter="Python, Node.js, Java-Sync, Java-Async, Java-Reactive, Go, C#-Sync (SE.Redis), PHP, Rust-Sync, Rust-Async" description="Field expiration: Set a TTL in seconds on individual hash fields using HEXPIRE, then read the remaining TTL with HTTL" difficulty="intermediate" buildsUpon="set_get_all" >}}
> DEL sensor:sensor1
(integer) 1
> HSET sensor:sensor1 air_quality 256 battery_level 89
(integer) 2
> HEXPIRE sensor:sensor1 60 FIELDS 2 air_quality battery_level
1) (integer) 1
2) (integer) 1
> HTTL sensor:sensor1 FIELDS 2 air_quality battery_level
1) (integer) 60
2) (integer) 60
{{< /clients-example >}}

Set a hash field's TTL in milliseconds and then retrieve the remaining TTL in milliseconds:

{{< clients-example set="hash_tutorial" step="hpexpire" lang_filter="Python, Node.js, Java-Sync, Java-Async, Java-Reactive, Go, C#-Sync (SE.Redis), PHP, Rust-Sync, Rust-Async" description="Field expiration: Set a TTL in milliseconds on a hash field using HPEXPIRE, then read the remaining TTL with HPTTL" difficulty="intermediate" buildsUpon="set_get_all" >}}
> DEL sensor:sensor1
(integer) 1
> HSET sensor:sensor1 air_quality 256 battery_level 89
(integer) 2
> HPEXPIRE sensor:sensor1 60000 FIELDS 1 air_quality
1) (integer) 1
> HPTTL sensor:sensor1 FIELDS 1 air_quality
1) (integer) 59994
{{< /clients-example >}}

Set a hash field's expiration to a specific timestamp and then retrieve that expiration
time (both as a Unix time in seconds):

{{< clients-example set="hash_tutorial" step="hexpireat" lang_filter="Python, Node.js, Java-Sync, Java-Async, Java-Reactive, Go, C#-Sync (SE.Redis), PHP, Rust-Sync, Rust-Async" description="Field expiration: Set an absolute expiration timestamp on a hash field using HEXPIREAT, then read it back with HEXPIRETIME" difficulty="intermediate" buildsUpon="set_get_all" >}}
> DEL sensor:sensor1
(integer) 1
> HSET sensor:sensor1 air_quality 256 battery_level 89
(integer) 2
# Set the expiration to a Unix time in the future
# (1719855517 is just an example; use a timestamp appropriate for your use case).
> HEXPIREAT sensor:sensor1 1719855517 FIELDS 1 air_quality
1) (integer) 1
> HEXPIRETIME sensor:sensor1 FIELDS 1 air_quality
1) (integer) 1719855517
{{< /clients-example >}}

## Performance

Most Redis hash commands are O(1).

A few commands, such as [`HKEYS`]({{< relref "/commands/hkeys" >}}), [`HVALS`]({{< relref "/commands/hvals" >}}), [`HGETALL`]({{< relref "/commands/hgetall" >}}), and most of the expiration-related commands, are O(n), where _n_ is the number of field-value pairs.

## Limits

Every hash can store up to 4,294,967,295 (2^32 - 1) field-value pairs.
In practice, your hashes are limited only by the overall memory on the VMs hosting your Redis deployment.

## Learn more

* [Redis Hashes Explained](https://www.youtube.com/watch?v=-KdITaRkQ-U) is a short, comprehensive video explainer covering Redis hashes.
* [Redis University's RU101](https://university.redis.com/courses/ru101/) covers Redis hashes in detail.
