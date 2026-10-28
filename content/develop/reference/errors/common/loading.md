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
description: Redis is still loading its data into memory and can't serve the command yet.
linkTitle: LOADING
title: LOADING error
weight: 53
error:
  prefix: LOADING
  message: LOADING Redis is loading the dataset in memory
  match:
  - Redis is loading the dataset in memory
  - BusyLoadingError
---

Redis returns this error while it's loading your data into memory. This happens when the server starts and reads its data files from disk. It can also happen on a replica while it loads a full copy of the data from its primary. Most commands fail until loading finishes.

```
LOADING Redis is loading the dataset in memory
```

In redis-py, this error is `BusyLoadingError: Redis is loading the dataset in memory`.

## Example

A few commands, such as `PING`, still work while Redis is loading:

```
> GET mykey
(error) LOADING Redis is loading the dataset in memory
> PING
PONG
```

## How to fix it

Wait for loading to finish, and then send the command again. The bigger your dataset is, the longer loading takes. To follow the progress, run [`INFO persistence`](/content/commands/info.md). `loading:1` means that Redis is still loading, and `loading_eta_seconds` estimates the time left.

- **Make your app retry.** Treat this error as temporary, and retry the command after a delay. See [Retry with backoff](/content/develop/clients/error-handling.md#pattern-3-retry-with-backoff).
- **Don't use `PING` alone to check that the server is ready.** `PING` works during loading, so a health check that only sends `PING` can report the server as ready too early. Check that `INFO persistence` shows `loading:0`.
