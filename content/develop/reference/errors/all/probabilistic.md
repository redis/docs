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
description: Every error message that probabilistic data type commands return in Redis 8.10
linkTitle: Probabilistic data types
title: Probabilistic data type errors
weight: 5
---

These are the error messages of the [probabilistic data types](/content/develop/data-types/probabilistic/_index.md): Bloom filters, Cuckoo filters, count-min sketches, Top-K, and t-digest. Many start with `ERR`. Others start with the name of the data type, such as `CMS:` or `TopK:`, or have no code at all.

{{< error-catalog module="bloom" summary="true" >}}

## ERR

Errors from Bloom filters, Cuckoo filters, and t-digest mostly start with the general prefix `ERR`. T-digest errors then say `T-Digest:`, as in `ERR T-Digest: error parsing compression parameter`. Most of these errors are about an argument that's invalid or out of range, such as the capacity or the error rate of a filter. Others say that an item already exists, that a key wasn't found, or that a filter that doesn't scale is full. To fix it, compare your command with the syntax on its command page, such as [`BF.RESERVE`](/content/commands/bf.reserve.md) or [`TDIGEST.CREATE`](/content/commands/tdigest.create.md).

This group also has the errors of `CONFIG SET` for these data types' configuration parameters, which start with `ERR CONFIG SET failed`.

{{< error-catalog module="bloom" code="ERR" >}}

## WRONGTYPE

The key holds a different data type than the command works with. For example, you used a Bloom filter command on a key that holds a Cuckoo filter. See [`WRONGTYPE`](/content/develop/reference/errors/common/wrongtype.md).

{{< error-catalog module="bloom" code="WRONGTYPE" >}}

## CMS:

Count-min sketch commands, such as `CMS.INITBYDIM` and `CMS.INCRBY`, start their errors with `CMS:`. Most of them say which argument is invalid, such as the width, the depth, or a number that can't be negative. To fix it, check that argument against the syntax on the command's page, such as [`CMS.INITBYDIM`](/content/commands/cms.initbydim.md).

{{< error-catalog module="bloom" code="CMS:" >}}

## TopK:

Top-K commands, such as `TOPK.RESERVE` and `TOPK.ADD`, start their errors with `TopK:`. Most of them are about an invalid argument of [`TOPK.RESERVE`](/content/commands/topk.reserve.md), such as `k`, the width, or the decay. Others say that the key already exists or doesn't exist.

{{< error-catalog module="bloom" code="TopK:" >}}

## Messages without a code

Some errors, mostly from Cuckoo filters, have no code, such as `Bad capacity` or `Couldn't parse EXPANSION`. Client libraries and the error statistics of [`INFO errorstats`](/content/commands/info.md) treat the first word of the message as the code. Most of these errors are about the arguments of `CF.RESERVE` and `CF.INSERT`. To fix it, check the arguments against the syntax on [`CF.RESERVE`](/content/commands/cf.reserve.md).

{{< error-catalog module="bloom" others="true" >}}
