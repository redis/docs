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
description: Every error message that time series commands return in Redis 8.10
linkTitle: Time series
title: Time series errors
weight: 6
---

These are the error messages of the [time series](/content/develop/data-types/timeseries/_index.md) commands, such as `TS.ADD` and `TS.RANGE`. Most of them start with `ERR TSDB:`. A few start with `TSDB:` alone, and some start with `WRONGTYPE` or `NOPERM`.

{{< error-catalog module="timeseries" summary="true" >}}

## ERR TSDB:

Most time series errors start with `ERR TSDB:`, followed by the problem. Many say that the command couldn't parse an argument, as in `ERR TSDB: Couldn't parse RETENTION`, or that two arguments can't be used together. Others say that the key doesn't exist, that it already exists, or that it isn't a time series. To fix it, compare your command with the syntax on its command page, such as [`TS.CREATE`](/content/commands/ts.create.md) or [`TS.RANGE`](/content/commands/ts.range.md).

{{< error-catalog module="timeseries" code="ERR TSDB:" >}}

## ERR

A few errors use the general prefix `ERR` without `TSDB:`. They include the wrong number of arguments for a command, and errors of `CONFIG SET` for the time series configuration parameters, which start with `ERR CONFIG SET failed`. Most commands also report a key of the wrong data type as `ERR WRONGTYPE`. See [`WRONGTYPE`](/content/develop/reference/errors/common/wrongtype.md).

{{< error-catalog module="timeseries" code="ERR" >}}

## TSDB:

A few errors start with `TSDB:` without `ERR`, so client libraries see `TSDB:` as the code. They come from `TS.ADD`, `TS.INCRBY`, `TS.DECRBY`, `TS.READ`, `TS.CREATE`, and `TS.ALTER`. For example, `TS.INCRBY` can't add a sample with a timestamp older than the newest sample, and the `BLOCK` option of [`TS.READ`](/content/commands/ts.read.md) needs valid numbers.

{{< error-catalog module="timeseries" code="TSDB:" >}}

## NOPERM

Commands that find keys by their labels, such as `TS.MRANGE` and `TS.QUERYINDEX`, check your permission for every key that matches the filter. You get this error when your user isn't allowed to read, or write, one or more of those keys. To fix it, give the user access to the keys, or use a filter that only matches keys the user can access. See [`NOPERM`](/content/develop/reference/errors/common/noperm.md).

{{< error-catalog module="timeseries" code="NOPERM" >}}

## WRONGTYPE

`TS.READ` returns this error, without `ERR` in front, when the key holds a different data type. See [`WRONGTYPE`](/content/develop/reference/errors/common/wrongtype.md).

{{< error-catalog module="timeseries" code="WRONGTYPE" >}}

## Messages without a code

These messages have no code. Client libraries and the error statistics of [`INFO errorstats`](/content/commands/info.md) treat the first word of the message as the code. They come from commands that read keys on several shards of a cluster, such as `TS.MGET` and `TS.MRANGE`. You get them when a shard doesn't reply in time, when the cluster changes during the command, or when you run such a command inside a transaction or a script.

{{< error-catalog module="timeseries" others="true" >}}
