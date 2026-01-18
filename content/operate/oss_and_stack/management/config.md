---
aliases:
- /operate/oss_and_stack/management/config-file
categories:
- docs
- operate
- stack
- oss
description: Overview of redis.conf, the Redis configuration file
linkTitle: Configuration
title: Redis configuration
weight: 2
---

Redis is able to start without a configuration file using a built-in default
configuration, however this setup is only recommended for testing and
development purposes.

The proper way to configure Redis is by providing a Redis configuration file,
usually called `redis.conf`. Beginning with Redis 8 in Redis Open Source, there are two configuration files:
* `redis.conf` - contains the configuration settings for Redis server only.
* `redis-full.conf` - contains configuration settings for Redis server and all available components: Redis Query Engine, Redis time series, and Redis probabilistic data structures. This file has as its first line `include redis.conf`, which pulls in the Redis server configuration settings at startup. Use `redis-full.conf` when you want to enable all available components. The file contains four `loadmodule` directives, one for each component, and also loads Redis JSON (though JSON has no configuration parameters).

If you are building Redis from source and choose to build Redis server without the available components, you can use `redis.conf` as your configuration file.

Each configuration file contains a number of directives that have a very simple format:

    keyword argument1 argument2 ... argumentN

This is an example of a configuration directive:

    replicaof 127.0.0.1 6380

It is possible to provide strings containing spaces as arguments using
(double or single) quotes, as in the following example:

    requirepass "hello world"

Single-quoted string can contain characters escaped by backslashes, and
double-quoted strings can additionally include any ASCII symbols encoded using
backslashed hexadecimal notation "\\xff".

The list of configuration directives, along with comments describing their meaning and intended usage, is available in the self-documented sample files `redis.conf` and `redis-full.conf` files shipped with the Redis distributions.

* Configuration files for Redis 8.4: [redis-full.conf](https://raw.githubusercontent.com/redis/redis/8.4/redis-full.conf) and [redis.conf](https://raw.githubusercontent.com/redis/redis/8.4/redis.conf).
* Configuration files for Redis 8.2: [redis-full.conf](https://raw.githubusercontent.com/redis/redis/8.2/redis-full.conf) and [redis.conf](https://raw.githubusercontent.com/redis/redis/8.2/redis.conf).
* Configuration files for Redis 8.0: [redis-full.conf](https://raw.githubusercontent.com/redis/redis/8.0/redis-full.conf) and [redis.conf](https://raw.githubusercontent.com/redis/redis/8.0/redis.conf).
* Configuration file for Redis 7.4: [redis.conf](https://raw.githubusercontent.com/redis/redis/7.4/redis.conf).
* Configuration file for Redis 7.2: [redis.conf](https://raw.githubusercontent.com/redis/redis/7.2/redis.conf).
* Configuration file for Redis 7.0: [redis.conf](https://raw.githubusercontent.com/redis/redis/7.0/redis.conf).
* Configuration file for Redis 6.2: [redis.conf](https://raw.githubusercontent.com/redis/redis/6.2/redis.conf).

Passing arguments using the command line
---

You can also pass Redis configuration parameters
using the command line directly. This is very useful for testing purposes.
The following is an example that starts a new Redis instance using port 6380
as a replica of the instance running at 127.0.0.1 port 6379.

    ./redis-server --port 6380 --replicaof 127.0.0.1 6379

The format of the arguments passed using the command line is exactly the same
as the one used in the redis.conf file, with the exception that the keyword
is prefixed with `--`.

Note that internally this generates an in-memory temporary config file
(possibly concatenating the config file passed by the user, if any) where
arguments are translated into the format of redis.conf.

Changing Redis configuration while the server is running
---

It is possible to reconfigure Redis on the fly without stopping and restarting
the service, or querying the current configuration programmatically using the
special commands [`CONFIG SET`](/commands/config-set) and [`CONFIG GET`](/commands/config-get).

Not all of the configuration directives are supported in this way, but most
are supported as expected.
Please refer to the [`CONFIG SET`](/commands/config-set) and [`CONFIG GET`](/commands/config-get) pages for more information.

Note that modifying the configuration on the fly does not affect the
`redis.conf` and `redis-full.conf` files, so at the next restart of Redis, the old configuration will
be used instead.

Make sure to also modify the configuration files accordingly to the configuration
you set using [`CONFIG SET`](/commands/config-set).
You can do it manually, or you can use [`CONFIG REWRITE`](/commands/config-rewrite), which will automatically scan your configuration files and update the fields that don't match the current configuration value.
Fields set to the default value are not added.
Comments inside your configuration file are retained.

Configuring Redis as a cache
---

If you plan to use Redis as a cache where every key will have an
expire set, you may consider using the following configuration instead
(assuming a max memory limit of 2 megabytes as an example):

    maxmemory 2mb
    maxmemory-policy allkeys-lru

In this configuration there is no need for the application to set a
time to live for keys using the [`EXPIRE`](/commands/expire) command (or equivalent) since
all the keys will be evicted using an approximated LRU algorithm as long
as we hit the 2 megabyte memory limit.

Basically, in this configuration Redis acts in a similar way to memcached.
We have more extensive documentation about using Redis as an LRU cache [here]({{< relref "/develop/reference/eviction" >}}).
