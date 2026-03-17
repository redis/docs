---
aliases: /develop/connect/clients/python/redis-py
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
description: Connect your Python application to a Redis database
linkTitle: redis-py (Python)
title: redis-py guide (Python)
weight: 1
---

[redis-py](https://github.com/redis/redis-py) is the Python client for Redis. 
The sections below explain how to install `redis-py` and connect your application
to a Redis database.

`redis-py` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

You can also access Redis with an object-mapping client interface. See
[RedisOM for Python]({{< relref "/integrate/redisom-for-python" >}})
for more information.

## Install

To install `redis-py`, enter:

```bash
pip install redis
```

For faster performance, install Redis with [`hiredis`](https://github.com/redis/hiredis) support. This provides a compiled response parser, and for most cases requires zero code changes. By default, if `hiredis` >= 1.0 is available, `redis-py` attempts to use it for response parsing.

{{% alert title="Note" %}}
The Python `distutils` packaging scheme is no longer part of Python 3.12 and greater. If you're having difficulties getting `redis-py` installed in a Python 3.12 environment, consider updating to a recent release of `redis-py`.
{{% /alert %}}

```bash
pip install redis[hiredis]
```

## Connect and test

Connect to localhost on port 6379, set a value in Redis, and retrieve it. All responses are returned as bytes in Python. To receive decoded strings, set `decode_responses=True`. For more connection options, see [these examples](https://redis.readthedocs.io/en/stable/examples.html).

{{< jupyter-example source="local_examples/client-specific/redis-py/landing.py" step="connect" id="connect" title="Connect to a Redis server and establish a client connection" binder="python-landing" quickstart_url="/develop/clients/redis-py/" quickstart_title="Python Quick-Start" >}}

Store and retrieve a simple string.

{{< jupyter-example source="local_examples/client-specific/redis-py/landing.py" step="set_get_string" depends="connect" title="Set and retrieve string values using SET and GET commands" binder="python-landing" quickstart_url="/develop/clients/redis-py/" quickstart_title="Python Quick-Start" >}}

Store and retrieve a dict.

{{< jupyter-example source="local_examples/client-specific/redis-py/landing.py" step="hash_operations" depends="connect" title="Store and retrieve hash data structures using HSET and HGETALL" binder="python-landing" quickstart_url="/develop/clients/redis-py/" quickstart_title="Python Quick-Start" >}}

Close the connection when you're done.

{{< jupyter-example source="local_examples/client-specific/redis-py/landing.py" step="close" depends="connect" title="Close the Redis connection" binder="python-landing" no_output="true" quickstart_url="/develop/clients/redis-py/" quickstart_title="Python Quick-Start" >}}

## More information

The [`redis-py`](https://redis.readthedocs.io/en/stable/index.html) website
has a [command reference](https://redis.readthedocs.io/en/stable/commands.html)
and some [tutorials](https://redis.readthedocs.io/en/stable/examples.html) for
various tasks. There are also some examples in the
[GitHub repository](https://github.com/redis/redis-py) for `redis-py`.
 
See also the other pages in this section for more information and examples: