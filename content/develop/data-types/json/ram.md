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

Redis JSON stores JSON values as binary data after deserializing them. This representation is often more
expensive, size-wise, than the serialized form. The JSON data type uses at least 8 bytes (on
64-bit architectures) for every value, as can be seen by sampling an empty string with the
[`JSON.DEBUG MEMORY`]({{< relref "commands/json.debug-memory/" >}}) command:

```
127.0.0.1:6379> JSON.SET emptystring . '""'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY emptystring
(integer) 8
```

This RAM requirement is the same for all scalar values, but strings require additional space
depending on their actual length. For example, a 3-character string will use 3 additional bytes:

```
127.0.0.1:6379> JSON.SET foo . '"bar"'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY foo
(integer) 11
```

Empty containers take up 8 bytes to set up:

```
127.0.0.1:6379> JSON.SET arr . '[]'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY arr
(integer) 8
127.0.0.1:6379> JSON.SET obj . '{}'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY obj
(integer) 8
```

In the following four examples, each array requires 56 bytes, because the array is created with a default capacity of 4.
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

An array with five elements will allocate four more bytes than the previous examples:

```
127.0.0.1:6379> JSON.SET arr . '["", "", "", "", ""]'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY arr
(integer) 88
```

This table gives the size (in bytes) of a few of the test files from the [module repo](https://github.com/RedisJSON/RedisJSON), stored using
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
