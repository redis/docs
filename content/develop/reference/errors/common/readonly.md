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
description: A command that changes data was sent to a read-only replica.
linkTitle: READONLY
title: READONLY error
weight: 50
error:
  prefix: READONLY
  message: READONLY You can't write against a read only replica.
  match:
  - You can't write against a read only replica
  - Can not run script with write flag on readonly replica
  - ReadOnlyError
---

Redis returns this error when you send a command that changes data to a replica. A replica keeps a copy of a primary's data, and by default it's read-only. Only the primary accepts writes.

```
READONLY You can't write against a read only replica.
```

In redis-py, this error is `ReadOnlyError: You can't write against a read only replica.`

A Lua function, or a script that starts with a `#!lua` line, gets the same error on a replica before it starts, unless it has the `no-writes` flag. A script without that line gets the error when it calls a command that changes data, with the script's details added to the end.

## Example

```
> SET mykey "value"
(error) READONLY You can't write against a read only replica.
> GET mykey
"value"
```

## How to fix it

Check which node you're connected to with [`ROLE`](/content/commands/role.md). A replica replies with `slave` as the first item.

- **You meant to connect to the primary.** Check the host and port in your app's configuration.
- **The primary changed.** After a failover, a replica becomes the new primary, and the old primary can come back as a replica. An app that connects to a fixed address then ends up on a replica. Use a client that finds the current primary for you, through [Redis Sentinel](/content/operate/oss_and_stack/management/sentinel.md).

Don't make the replica writable to work around this error. The `replica-read-only no` setting exists for historical reasons, and writes to a replica can make its data differ from the primary's. See [Read-only replica](/content/operate/oss_and_stack/management/replication.md#read-only-replica).
