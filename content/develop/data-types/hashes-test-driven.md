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
description: 'Introduction to Redis hashes generated from a doc test suite

  '
linkTitle: Hashes test draft
title: Redis hashes test-driven draft
weight: 41
---

{{< command-group group="hash" title="Hash command summary" show_link=true >}}

Redis hashes are record-like data types structured as collections of field-value pairs.
They are useful when you want to store related values together under one Redis key, such as the attributes of an object or a group of counters.

For example, a bicycle can be represented as a hash whose fields describe the model, brand, type, and price:

```text
> HSET bike:1 model Deimos brand Ergonom type "Enduro bikes" price 4972
(integer) 4
> HGET bike:1 model
"Deimos"
> HGET bike:1 price
"4972"
```

The [`HSET`]({{< relref "/commands/hset" >}}) command sets one or more field-value pairs on a hash key.
The command returns the number of fields that were added.
If you set an existing field, Redis overwrites that field's value.

Although hashes are a natural fit for object-like records, they are not limited to small objects.
A single hash can contain many fields, and in practice the main limit is the memory available to your Redis deployment.
Small hashes with small values can be especially memory efficient because Redis stores them with a compact internal encoding.

## Read hash fields

Use [`HGET`]({{< relref "/commands/hget" >}}) when you need one field from a hash:

```text
> HGET bike:1 model
"Deimos"
```

Use [`HMGET`]({{< relref "/commands/hmget" >}}) when you need several fields from the same hash in a single command.
`HMGET` returns an array of values in the same order as the requested fields.
If a requested field does not exist, Redis returns a nil value for that position.

```text
> HMGET bike:1 model price no-such-field
1) "Deimos"
2) "4972"
3) (nil)
```

Use commands such as [`HGETALL`]({{< relref "/commands/hgetall" >}}), [`HKEYS`]({{< relref "/commands/hkeys" >}}), and [`HVALS`]({{< relref "/commands/hvals" >}}) to inspect the whole hash or list all fields or values.
These commands are convenient for small hashes, but they scan over the hash contents, so consider their cost before using them on very large hashes.

## Counters in hashes

Hash fields can store numeric values and act as counters.
Use [`HINCRBY`]({{< relref "/commands/hincrby" >}}) to increment or decrement an integer field atomically:

```text
> HINCRBY bike:1:stats rides 1
(integer) 1
> HINCRBY bike:1:stats rides 1
(integer) 2
> HINCRBY bike:1:stats crashes 1
(integer) 1
> HINCRBY bike:1:stats rides -1
(integer) 1
```

If the field does not exist, `HINCRBY` creates it and treats the starting value as `0` before applying the increment.
This makes hashes a compact way to group related counters, such as ride counts, hourly event totals, or per-user activity counts.

## Field expiration

Hash field expiration lets you set an expiration time or time-to-live (TTL) on individual fields in a hash.
This is similar to [key expiration]({{< relref "/develop/using-commands/keyspace#key-expiration" >}}), but it applies to selected fields instead of the entire key.

Use these commands to set field-level TTLs or exact expiration times:

* [`HEXPIRE`]({{< relref "/commands/hexpire" >}}): set a field TTL in seconds.
* [`HPEXPIRE`]({{< relref "/commands/hpexpire" >}}): set a field TTL in milliseconds.
* [`HEXPIREAT`]({{< relref "/commands/hexpireat" >}}): set a field expiration timestamp in seconds since the Unix epoch.
* [`HPEXPIREAT`]({{< relref "/commands/hpexpireat" >}}): set a field expiration timestamp in milliseconds since the Unix epoch.

Use these commands to inspect field expiration:

* [`HEXPIRETIME`]({{< relref "/commands/hexpiretime" >}}): get the field expiration timestamp in seconds.
* [`HPEXPIRETIME`]({{< relref "/commands/hpexpiretime" >}}): get the field expiration timestamp in milliseconds.
* [`HTTL`]({{< relref "/commands/httl" >}}): get the remaining field TTL in seconds.
* [`HPTTL`]({{< relref "/commands/hpttl" >}}): get the remaining field TTL in milliseconds.

Use [`HPERSIST`]({{< relref "/commands/hpersist" >}}) to remove the expiration from one or more fields without changing their values.

For example, you can keep a field for one hour and then check its remaining TTL:

```text
> HSET events:recent event:1001 checkout
(integer) 1
> HEXPIRE events:recent 3600 FIELDS 1 event:1001
1) (integer) 1
> HTTL events:recent FIELDS 1 event:1001
1) (integer) 3600
```

Redis 8.0 adds [`HGETEX`]({{< relref "/commands/hgetex" >}}) and [`HSETEX`]({{< relref "/commands/hsetex" >}}).
These commands get or set one or more hash fields while optionally setting their expiration time or TTL.

Field expiration is useful when values in the same logical group have different lifetimes.
Common patterns include:

* Event tracking: store recent events as fields and expire each field after a fixed window, such as one hour.
* Fraud detection: store hourly counters as hash fields and expire each counter after the investigation window, such as 48 hours.
* Session management: store session metadata in fields that expire when the session expires.
* Active session tracking: store each active session as a field and expire it automatically after inactivity.

Support for hash field expiration in official client libraries may not yet be generally available in all stable clients.
The Redis documentation references beta versions of the Python (`redis-py`) and Java (`Jedis`) clients for testing this feature.

## Performance

Most Redis hash commands are O(1), including common single-field operations such as `HSET`, `HGET`, and `HINCRBY`.

Commands that must visit many fields are O(n), where _n_ is the number of field-value pairs in the hash.
This includes [`HKEYS`]({{< relref "/commands/hkeys" >}}), [`HVALS`]({{< relref "/commands/hvals" >}}), [`HGETALL`]({{< relref "/commands/hgetall" >}}), and most expiration-related commands.

## Limits

Every Redis hash can store up to 4,294,967,295 field-value pairs, which is `2^32 - 1`.
In practice, hashes are limited by the memory available to your Redis deployment and by the access patterns your application needs to support.

## Learn more

* [Redis hash command reference]({{< relref "/commands" >}}?group=hash)
* [Redis key expiration]({{< relref "/develop/using-commands/keyspace#key-expiration" >}})
