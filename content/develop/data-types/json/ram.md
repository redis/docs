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
description: Debugging memory consumption
linkTitle: Memory Usage
title: Redis JSON RAM Usage
weight: 6
---

Every key in Redis takes memory and requires at least the amount of RAM to store the key name, as
well as some per-key overhead that Redis uses. On top of that, the value in the key also requires
RAM.

Redis JSON stores JSON values as binary data after deserialization. This representation is often more
expensive, size-wise, than the serialized form. All JSON values occupy at least 8 bytes (on 64-bit architectures) because each is represented as a thin wrapper around a pointer. The type information is stored in the lower bits of the pointer, which are guaranteed to be zero due to alignment restrictions. This allows those bits to be repurposed to store some auxiliary data.

For some types of JSON values, 8 bytes is all that’s needed. Nulls and booleans don’t require any additional storage. Small integers are stored in static memory because they’re frequently used, so they also use only the initial 8 bytes. Similarly, empty strings, arrays, and objects don’t require any bookkeeping. Instead, they point to static instances of a _null_ string, array, or object. Here are some examples that use the [JSON.DEBUG MEMORY]({{< relref "/commands/json.debug-memory >}}) command to report on memory consumption:

```
127.0.0.1:6379> JSON.SET boolean . 'true'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY boolean
(integer) 8

127.0.0.1:6379> JSON.SET null . null
OK
127.0.0.1:6379> JSON.DEBUG MEMORY null
(integer) 8

127.0.0.1:6379> JSON.SET emptystring . '""'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY emptystring
(integer) 8

127.0.0.1:6379> JSON.SET emptyarr . '[]'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY emptyarr
(integer) 8

127.0.0.1:6379> JSON.SET emptyobj . '{}'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY emptyobj
(integer) 8
```

This RAM requirement is the same for all scalar values, but strings require additional space
depending on their length. For example, a 3-character string will use 3 additional bytes:

```
127.0.0.1:6379> JSON.SET foo . '"bar"'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY foo
(integer) 11
```

In the following four examples, each array requires 56 bytes. This breaks down as:
- 8 bytes for the initial array value pointer
- 16 bytes of metadata: 8 bytes for the allocated capacity and 8 bytes for the point-in-time size of the array
- 32 bytes for the array. The initial capacity of an array is 4. Therefore, the calculation is `4 * 8` bytes

```
127.0.0.1:6379> JSON.SET arr . '[""]'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY arr
(integer) 56
```

```
127.0.0.1:6379> JSON.SET arr . '["", ""]'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY arr
(integer) 56
```

```
127.0.0.1:6379> JSON.SET arr . '["", "", ""]'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY arr
(integer) 56
```

```
127.0.0.1:6379> JSON.SET arr . '["", "", "", ""]'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY arr
(integer) 56
```

Once the current capacity is insufficient to fit a new value, the array reallocates to double its capacity. An array with 5 elements will have a capacity of 8, therefore consuming `8 + 16 + 8 * 8 = 88` bytes.

```
127.0.0.1:6379> JSON.SET arr . '["", "", "", "", ""]'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY arr
(integer) 88
```

Because reallocation operations can be expensive, Redis grows JSON arrays geometrically rather than linearly. This approach spreads the cost across many insertions.

This table gives the size (in bytes) of a few of the test files from the [module repo](https://github.com/RedisJSON/RedisJSON/tree/master/tests/files), stored using
JSON. The _MessagePack_ column is for reference purposes and reflects the length of the value when stored using [MessagePack](https://msgpack.org/index.html).

| File                                    | File size | Redis JSON | MessagePack |
| --------------------------------------- | --------- | ---------- | ----------- |
| /tests/files/pass-100.json              | 381       | 1069       | 140         |
| /tests/files/pass-jsonsl-1.json         | 1387      | 2190       | 757         |
| /tests/files/pass-json-parser-0000.json | 3718      | 5469       | 2393        |
| /tests/files/pass-jsonsl-yahoo2.json    | 22466     | 26901      | 16869       |
| /tests/files/pass-jsonsl-yelp.json      | 46333     | 57513      | 35529       |

> Note: In the current version, deleting values from containers **does not** free the container's
allocated memory.
