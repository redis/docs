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
description: The Redis errors you're most likely to see, with an example and how to fix each one
hideListLinks: true
linkTitle: Common errors
title: Common Redis errors
weight: 10
---

These pages explain the Redis errors you're most likely to see. Each one shows what the error means, an example, and how to fix it. To find an error that isn't here, see the [list of all error messages](/content/develop/reference/errors/all/_index.md).

## Command errors

- [`ERR unknown command`](/content/develop/reference/errors/common/err-unknown-command.md): The server doesn't recognize the command name.
- [`ERR wrong number of arguments`](/content/develop/reference/errors/common/err-wrong-number-of-arguments.md): A command has too many or too few arguments.
- [`ERR syntax error`](/content/develop/reference/errors/common/err-syntax-error.md): A command's options are misspelled, in the wrong place, or can't be used together.
- [`ERR value is not an integer or out of range`](/content/develop/reference/errors/common/err-not-an-integer.md): A command requires a whole number, but the stored value or an argument is not a whole number.
- [`WRONGTYPE`](/content/develop/reference/errors/common/wrongtype.md): A command was used on a key that holds a different data type.
- [`EXECABORT`](/content/develop/reference/errors/common/execabort.md): A transaction was discarded because one of its commands had an error.
- [`NOSCRIPT`](/content/develop/reference/errors/common/noscript.md): `EVALSHA` asked for a script that isn't in the server's script cache.
- [`BUSYKEY`](/content/develop/reference/errors/common/busykey.md): `RESTORE` tried to create a key that already exists.

## Cluster errors

- [`MOVED`](/content/develop/reference/errors/common/moved.md): The key belongs to a hash slot that another cluster node serves.
- [`ASK`](/content/develop/reference/errors/common/ask.md): The key's hash slot is moving to another cluster node, and the key may already be there.
- [`CROSSSLOT`](/content/develop/reference/errors/common/crossslot.md): A command used keys that belong to different hash slots.
- [`TRYAGAIN`](/content/develop/reference/errors/common/tryagain.md): A command accessed multiple keys while their hash slot was being migrated between cluster nodes.
- [`CLUSTERDOWN`](/content/develop/reference/errors/common/clusterdown.md): The cluster can't serve the command because a hash slot has no working node.

## Memory and persistence errors

- [`OOM`](/content/develop/reference/errors/common/oom.md): Redis has reached its memory limit and can't make room for new data.
- [`MISCONF`](/content/develop/reference/errors/common/misconf.md): Redis stopped accepting writes because it couldn't save your data to disk.

## Connection and security errors

- [`ERR max number of clients reached`](/content/develop/reference/errors/common/err-max-clients.md): The server already has as many connections as its limit allows.
- [`NOAUTH`](/content/develop/reference/errors/common/noauth.md): The server requires a password, and the connection hasn't authenticated.
- [`WRONGPASS`](/content/develop/reference/errors/common/wrongpass.md): The username or password is wrong, or the user is disabled.
- [`NOPERM`](/content/develop/reference/errors/common/noperm.md): The user is authenticated but isn't allowed to run the command or use the key.
- [`DENIED`](/content/develop/reference/errors/common/denied.md): Protected mode refused a connection from another computer, because the server has no password.

## Replication and server state errors

- [`READONLY`](/content/develop/reference/errors/common/readonly.md): A command that changes data was sent to a read-only replica.
- [`MASTERDOWN`](/content/develop/reference/errors/common/masterdown.md): A replica lost its link to its primary and is set not to serve data that may be out of date.
- [`NOREPLICAS`](/content/develop/reference/errors/common/noreplicas.md): The primary accepts writes only when enough replicas are connected, and there aren't enough.
- [`LOADING`](/content/develop/reference/errors/common/loading.md): Redis is still loading its data into memory and can't serve the command yet.
- [`BUSY`](/content/develop/reference/errors/common/busy.md): A Lua script or function has run for too long, and Redis is blocked until it ends.

## Stream errors

- [`NOGROUP`](/content/develop/reference/errors/common/nogroup.md): A stream command named a consumer group or stream that doesn't exist.
- [`BUSYGROUP`](/content/develop/reference/errors/common/busygroup.md): `XGROUP CREATE` tried to create a consumer group that already exists.
