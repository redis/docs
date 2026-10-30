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
description: Redis has reached its memory limit and can't make room for new data.
linkTitle: OOM
title: OOM error
weight: 30
error:
  prefix: OOM
  message: OOM command not allowed when used memory > 'maxmemory'.
  match:
  - command not allowed when used memory
  - can not run it when used memory
  - OutOfMemoryError
---

Redis returns this error when it has reached its memory limit and can't free memory for the command. The limit is the `maxmemory` setting. Commands that add data fail, but commands that read or delete data still work. OOM stands for out of memory.

```
OOM command not allowed when used memory > 'maxmemory'.
```

In redis-py, this error is `OutOfMemoryError: command not allowed when used memory > 'maxmemory'.`

A Lua function, or a script that starts with a `#!lua` line, gets the same error before it starts, unless it has the `allow-oom` or `no-writes` flag. A script without that line gets the error when it calls a command that adds data, with the script's details added to the end.

## Example

```
> SET newkey "value"
(error) OOM command not allowed when used memory > 'maxmemory'.
> GET oldkey
"value"
```

## How to fix it

First, check how much memory Redis uses with [`INFO memory`](/content/commands/info.md). Compare `used_memory_human` with the limit in `maxmemory_human`, and look at `maxmemory_policy`. The policy decides what Redis does when it reaches the limit. With the default policy, `noeviction`, Redis never removes keys to make room. It returns this error instead.

Then choose a fix:

- **Let Redis remove keys.** If you use Redis as a cache, set an eviction policy such as `allkeys-lru`. Redis then removes the least recently used keys to make room for new ones. See [Eviction policies](/content/develop/reference/eviction/index.md#eviction-policies).
- **Set expiry times on your keys.** The `volatile-*` policies only remove keys that have an expiry time, also called a time to live (TTL). When no key has one, Redis can't free any memory and returns this error, as with `noeviction`.
- **Raise the memory limit** with `maxmemory`, if the machine has enough memory. See [Using the `maxmemory` configuration directive](/content/develop/reference/eviction/index.md#maxmem).
- **Use less memory.** Delete keys you no longer need. See [Memory optimization](/content/operate/oss_and_stack/management/optimization/memory-optimization.md) for ways to store the same data in less memory.
