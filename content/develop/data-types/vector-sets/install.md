---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
description: Install and run the Redis vector sets module
linkTitle: Installation
title: Installation
weight: 5
---

{{< note >}}
To reviewers: it is understood that this page may not be needed.
{{< /note >}}

## Build the module

To build the Vector sets module, clone the [repository](https://github.com/redis/vector-sets) and run:

```bash
make
```

## Load the module into Redis

You can load the compiled module into Redis in one of two ways:

### Start Redis with the module:

```bash
redis-server --loadmodule vset.so
```

### Or add the module to your `redis.conf` file:

Add the following line to your `redis.conf` file:

```
loadmodule /path/to/vset.so
```

Then, restart your Redis server.

## Run the test suite

To run the tests, launch a Redis server with:

```bash
./redis-server --save "" --enable-debug-command yes
```

Then execute the tests using:

```bash
./test.py
```
