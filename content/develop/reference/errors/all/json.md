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
description: Every error message that JSON commands return in Redis 8.10
linkTitle: JSON
title: JSON errors
weight: 4
---

These are the error messages of the [JSON](/content/develop/data-types/json/_index.md) commands, such as `JSON.SET` and `JSON.GET`. Many start with `ERR`, and some start with `WRONGTYPE`. Others have no code at all.

{{< error-catalog module="json" summary="true" >}}

## ERR

Most JSON errors start with the general prefix `ERR`. Many of them say that a path doesn't exist, or that the value at the path isn't the type that the command needs, as in `ERR Path does not exist or not an array`. To fix it, check the path. To see the type of the value at a path, run [`JSON.TYPE`](/content/commands/json.type.md).

{{< error-catalog module="json" code="ERR" >}}

## Err

Two errors start with `Err`, not `ERR`. Client libraries that compare codes exactly treat `Err` as a different code. You get these errors when `JSON.SET`, `JSON.MERGE`, or `JSON.MSET` adds a new value at a path that doesn't exist yet. A path that adds a value can't contain wildcards or filters, and it must end with an object key, such as `$.address.city`. To fix it, change the path to meet these rules.

{{< error-catalog module="json" code="Err" >}}

## WRONGTYPE

The value at the path has a different JSON type than the command needs. For example, `JSON.STRAPPEND` needs a string, and `JSON.ARRINDEX` needs an array. The message names the type that the command expected. To fix it, check the type of the value with `JSON.TYPE`, and use a command for that type.

These errors are about the value inside the JSON document. When the key itself holds a different data type, JSON commands return `Existing key has wrong Redis type` instead.

{{< error-catalog module="json" code="WRONGTYPE" >}}

## Messages without a code

These messages have no code. Client libraries and the error statistics of [`INFO errorstats`](/content/commands/info.md) treat the first word of the message as the code. They include three common kinds of errors:

- `Existing key has wrong Redis type` means that the key holds a different data type, not a JSON document. See [`WRONGTYPE`](/content/develop/reference/errors/common/wrongtype.md).
- An error in a path, such as `$.a[0`, starts with `Error occurred at position`, followed by what the path parser expected.
- An error in the JSON value that you send includes the JSON parser's description, such as `expected value at line 1 column 1`.

{{< error-catalog module="json" others="true" >}}
