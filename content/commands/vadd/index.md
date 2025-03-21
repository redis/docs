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
complexity: O(log(N)) for each element added, where N is the number of elements in the vector set.
description: Add one or more elements to a vector set, or update its vector if it already exists.
group: vector_set
hidden: false
linkTitle: VADD
since: 1.0.0
summary: Add one or more elements to a vector set, or update its vector if it already exists
syntax_fmt: "VADD key [REDUCE dim] FP32|VALUES vector element [CAS] [NOQUANT | Q8 | BIN]\n  [EF build-exploration-factor] [SETATTR <attributes>] [M <numlinks>]"
title: VADD
---
Sets the specified fields to their respective values in the hash stored at `key`.

This command overwrites the values of specified fields that exist in the hash.
If `key` doesn't exist, a new key holding a hash is created.

## Examples

{{< clients-example cmds_hash hset >}}
> HSET myhash field1 "Hello"
(integer) 1
> HGET myhash field1
"Hello"
> HSET myhash field2 "Hi" field3 "World"
(integer) 2
> HGET myhash field2
"Hi"
> HGET myhash field3
"World"
> HGETALL myhash
1) "field1"
2) "Hello"
3) "field2"
4) "Hi"
5) "field3"
6) "World"
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
HSET myhash field1 "Hello"
HGET myhash field1
HSET myhash field2 "Hi" field3 "World"
HGET myhash field2
HGET myhash field3
HGETALL myhash
{{% /redis-cli %}}