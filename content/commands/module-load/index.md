---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: path
  name: path
  type: string
- display_text: arg
  multiple: true
  name: arg
  optional: true
  type: string
arity: -3
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
command_flags:
- admin
- noscript
- no_async_loading
complexity: O(1)
description: Loads a module.
group: server
hidden: false
linkTitle: MODULE LOAD
since: 4.0.0
summary: Loads a module.
syntax_fmt: MODULE LOAD path [arg [arg ...]]
syntax_str: '[arg [arg ...]]'
title: MODULE LOAD
---
Loads a module from a dynamic library at runtime.

This command loads and initializes the Redis module from the dynamic library
specified by the `path` argument. The `path` should be the absolute path of the
library, including the full filename. Any additional arguments are passed
unmodified to the module.

**Note**: modules can also be loaded at server startup with `loadmodule`
configuration directive in `redis.conf`.

{{< note >}}
As of Redis CE v8.0.0, loading a module using the Redis CLI with configuration parameters is deprecated.
{{< /note >}}