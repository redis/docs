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
description: Every error message that vector set commands return in Redis 8.10
linkTitle: Vector sets
title: Vector set errors
weight: 2
---

These are the error messages of the [vector set](/content/develop/data-types/vector-sets/_index.md) commands, such as `VADD` and `VSIM`. Vector set commands can also return the general errors of the [Redis server](/content/develop/reference/errors/all/redis.md), such as `WRONGTYPE`.

{{< error-catalog module="vectorset" summary="true" >}}

## ERR

All vector set errors use the general prefix `ERR`, and the description says what went wrong. Most of them are about the arguments of `VADD` and `VSIM`. For example, the vector has a different number of dimensions than the set, or a `FILTER` expression has a syntax error. To fix it, compare your command with the syntax on its command page, such as [`VADD`](/content/commands/vadd.md) or [`VSIM`](/content/commands/vsim.md).

{{< error-catalog module="vectorset" code="ERR" >}}
