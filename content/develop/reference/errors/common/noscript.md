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
description: EVALSHA asked for a script that isn't in the server's script cache.
linkTitle: NOSCRIPT
title: NOSCRIPT error
weight: 16
error:
  prefix: NOSCRIPT
  message: NOSCRIPT No matching script. Please use EVAL.
  match:
  - No matching script
  - NoScriptError
---

Redis returns this error when you run a Lua script with [`EVALSHA`](/content/commands/evalsha.md), but the server doesn't have the script in its script cache. `EVALSHA` runs a script by its SHA1 digest, a short code calculated from the script's source. The server only knows the digest of a script that it has already loaded.

```
NOSCRIPT No matching script. Please use EVAL.
```

In redis-py, this error is `NoScriptError: No matching script. Please use EVAL.`

## Example

```
> EVALSHA ffffffffffffffffffffffffffffffffffffffff 0
(error) NOSCRIPT No matching script. Please use EVAL.
```

## How to fix it

The script cache isn't saved with your data. It's emptied when the server restarts, when a replica becomes the primary, and when someone runs [`SCRIPT FLUSH`](/content/commands/script-flush.md). So your code must expect this error at any time:

- **Handle the error in your code.** When you get `NOSCRIPT`, load the script with [`SCRIPT LOAD`](/content/commands/script-load.md), or run it once with [`EVAL`](/content/commands/eval.md). Then call `EVALSHA` again. Most client libraries can do this for you. For example, the script object that redis-py's `register_script()` returns loads the script again when it gets this error.
- **Use functions instead.** [Functions](/content/develop/programmability/functions-intro.md) are saved and replicated with your data, so they're still there after a restart or a failover.

See [Script cache](/content/develop/programmability/eval-intro.md#script-cache).
