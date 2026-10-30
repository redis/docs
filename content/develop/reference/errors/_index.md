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
description: What common Redis error messages mean and how to fix them
hideListLinks: true
linkTitle: Errors
title: Redis error messages
weight: 8
---

When a command fails, Redis replies with an error message instead of a result. This section explains the [most common errors](/content/develop/reference/errors/common/_index.md), and lists [every error message](/content/develop/reference/errors/all/_index.md) that Redis 8.10 can return.

To find an error, paste it in the box. You can paste the whole line from your terminal or logs, including the exception name that your client library adds. The box searches both the common errors and the list of all error messages.

{{< error-lookup >}}

## How Redis reports errors

Error messages from the Redis server start with an uppercase word, called the error prefix. A description follows the prefix:

```
WRONGTYPE Operation against a key holding the wrong kind of value
```

The prefix tells you the kind of error, so your code can check it without reading the description. `ERR` is the general-purpose prefix. When an error starts with `ERR`, the description tells you what went wrong.

Errors from Redis Search, JSON, and the other features that come with Redis don't always follow this rule. Most Redis Search errors start with a code such as `SEARCH_INDEX_NOT_FOUND`. Some JSON, probabilistic data type, and time series errors have no prefix at all, such as `Bad capacity`. Client libraries then treat the first word of the message as the prefix.

How you see the error depends on your tool:

- `redis-cli` shows `(error)` in front of the message.
- Client libraries raise an exception, or return an error value, that contains the message. Some libraries turn common prefixes into their own exception classes and drop the prefix from the message. For example, redis-py reports "`READONLY You can't write against a read only replica.`" as "`ReadOnlyError: You can't write against a read only replica.`".

To learn how to handle errors in your app, see [Error handling](/content/develop/clients/error-handling.md). To learn how errors are sent over the network, see [Simple errors](/content/develop/reference/protocol-spec.md#simple-errors) in the Redis serialization protocol (RESP) specification.

## Common errors

[Common errors](/content/develop/reference/errors/common/_index.md) explains the errors you're most likely to see, such as [`WRONGTYPE`](/content/develop/reference/errors/common/wrongtype.md), [`MOVED`](/content/develop/reference/errors/common/moved.md), and [`NOAUTH`](/content/develop/reference/errors/common/noauth.md). Each page shows what the error means, an example, and how to fix it.

## All error messages

The [list of all error messages](/content/develop/reference/errors/all/_index.md) shows every error that Redis 8.10 can return, and the commands that return it. It has a page for each part of Redis:

- [Redis server](/content/develop/reference/errors/all/redis.md)
- [Vector sets](/content/develop/reference/errors/all/vector-sets.md)
- [Redis Search](/content/develop/reference/errors/all/search.md)
- [JSON](/content/develop/reference/errors/all/json.md)
- [Probabilistic data types](/content/develop/reference/errors/all/probabilistic.md)
- [Time series](/content/develop/reference/errors/all/time-series.md)
