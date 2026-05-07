---
aliases:
- /connect/clients/ruby/
- /clients/ruby/
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

`redis-rb` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

## Install

To install `redis-rb`, run the following command:

```bash
gem install redis
```

## Connect and test

Connect to localhost on port 6379:

{{< jupyter-example set="landing" step="connect" lang_filter="Ruby" description="Foundational: Connect to a Redis server and establish a client connection" difficulty="beginner" />}}

Store and retrieve a simple string.

{{< jupyter-example set="landing" step="set_get_string" depends="connect" lang_filter="Ruby" description="Foundational: Set and retrieve string values using SET and GET commands" difficulty="beginner" />}}

Store and retrieve a dict.

{{< jupyter-example set="landing" step="hash_operations" depends="connect" lang_filter="Ruby" description="Foundational: Store and retrieve hash data structures using HSET and HGETALL" difficulty="beginner" />}}

Close the connection when you're done.

{{< jupyter-example set="landing" step="close" depends="connect" lang_filter="Ruby" description="Foundational: Properly close a Redis client connection to release resources" difficulty="beginner" />}}

## More information

The
[GitHub repository](https://github.com/redis/redis-rb) for `redis-rb` has a
set of [examples](https://github.com/redis/redis-rb/tree/master/examples)
and further information about using redis-rb.
