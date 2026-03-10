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
description: Connect your Ruby application to a Redis database
linkTitle: redis-rb (Ruby)
title: redis-rb guide (Ruby)
weight: 11
---

[redis-rb](https://github.com/redis/redis-rb) is the Ruby client for Redis.
The sections below explain how to install `redis-rb` and connect your application
to a Redis database.

{{< note >}}Although we provide basic documentation for `redis-rb`, it is a third-party
client library and is not developed or supported directly by Redis.
{{< /note >}}

`redis-rb` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

## Install

To install `redis-rb`, run the following command:

```bash
gem install redis
```

## Connect and test

Connect to localhost on port 6379:

{{< clients-example set="landing" step="connect" lang_filter="Ruby" description="Foundational: Connect to a Redis server and establish a client connection" difficulty="beginner" >}}
{{< /clients-example >}}

Store and retrieve a simple string.

{{< clients-example set="landing" step="set_get_string" lang_filter="Ruby" description="Foundational: Set and retrieve string values using SET and GET commands" difficulty="beginner" >}}
{{< /clients-example >}}

Store and retrieve a dict.

{{< clients-example set="landing" step="hash_operations" lang_filter="Ruby" description="Foundational: Store and retrieve hash data structures using HSET and HGETALL" difficulty="beginner" >}}
{{< /clients-example >}}

Close the connection when you're done.

{{< clients-example set="landing" step="close" lang_filter="Ruby" description="Foundational: Properly close a Redis client connection to release resources" difficulty="beginner" >}}
{{< /clients-example >}}

## More information

The
[GitHub repository](https://github.com/redis/redis-rb) for `redis-rb` has a
set of [examples](https://github.com/redis/redis-rb/tree/master/examples)
and further information about using redis-rb.
