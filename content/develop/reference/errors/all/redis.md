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
description: Every error message that the Redis 8.10 server returns
linkTitle: Redis server
title: Redis server errors
weight: 1
---

These are the error messages of the Redis server itself. Each one starts with an error code, also called the error prefix. Most use the general code `ERR`. The others have a code that names the kind of error, such as `WRONGTYPE` or `MOVED`.

When an error happens inside a Lua script or function, Redis adds where it happened to the message, such as `script: <sha1>, on @user_script:1.` Some messages only come from a server that runs as Redis Sentinel, or as part of a cluster.

{{< error-catalog module="core" summary="true" >}}

## Commands

### WRONGTYPE

A command was used on a key that holds a different data type, or a HyperLogLog command was used on a string that isn't a HyperLogLog. See [`WRONGTYPE`](/content/develop/reference/errors/common/wrongtype.md) for how to fix it.

{{< error-catalog module="core" code="WRONGTYPE" >}}

### EXECABORT

A transaction was discarded, either because one of its commands couldn't be queued, or because Redis refused the `EXEC` command itself. See [`EXECABORT`](/content/develop/reference/errors/common/execabort.md) for how to fix it.

{{< error-catalog module="core" code="EXECABORT" >}}

### NOSCRIPT

`EVALSHA` asked for a script that isn't in the server's script cache. See [`NOSCRIPT`](/content/develop/reference/errors/common/noscript.md) for how to fix it.

{{< error-catalog module="core" code="NOSCRIPT" >}}

### BUSYKEY

`RESTORE` tried to create a key that already exists. See [`BUSYKEY`](/content/develop/reference/errors/common/busykey.md) for how to fix it.

{{< error-catalog module="core" code="BUSYKEY" >}}

### INVALIDOBJ

A HyperLogLog command, such as `PFADD` or `PFCOUNT`, found that the HyperLogLog stored in the key is corrupted. Redis stores a HyperLogLog as a string, so a string command such as `SETRANGE` or `APPEND` can damage it. To fix it, delete the key and add the elements again.

{{< error-catalog module="core" code="INVALIDOBJ" >}}

### IOERR

[`MIGRATE`](/content/commands/migrate.md) couldn't connect to the target server, or reading from it or writing to it failed or took too long. To fix it, check the host and port of the target, check that the target server is running and that this server can reach it, and pass a longer timeout if the keys are large.

{{< error-catalog module="core" code="IOERR" >}}

## Scripts and functions

### BUSY

A Lua script, function, or module command has run for too long, and Redis is blocked until it ends. See [`BUSY`](/content/develop/reference/errors/common/busy.md) for how to fix it.

{{< error-catalog module="core" code="BUSY" >}}

### UNKILLABLE

`SCRIPT KILL` or `FUNCTION KILL` can't stop the script that's running. Either the script has already changed data, so stopping it would leave the change half done, or the script came from the primary through replication. See [`BUSY`](/content/develop/reference/errors/common/busy.md#how-to-fix-it) for your options.

{{< error-catalog module="core" code="UNKILLABLE" >}}

### NOTBUSY

You ran [`SCRIPT KILL`](/content/commands/script-kill.md) or [`FUNCTION KILL`](/content/commands/function-kill.md), but no script or function is running. It may have finished already, so there's nothing to stop.

{{< error-catalog module="core" code="NOTBUSY" >}}

## Clusters

### MOVED

The key belongs to a hash slot that another cluster node serves. See [`MOVED`](/content/develop/reference/errors/common/moved.md) for how to fix it.

{{< error-catalog module="core" code="MOVED" >}}

### ASK

The key's hash slot is moving to another cluster node, and the key may already be there. See [`ASK`](/content/develop/reference/errors/common/ask.md) for how to fix it.

{{< error-catalog module="core" code="ASK" >}}

### CROSSSLOT

A command used keys that belong to different hash slots. See [`CROSSSLOT`](/content/develop/reference/errors/common/crossslot.md) for how to fix it.

{{< error-catalog module="core" code="CROSSSLOT" >}}

### TRYAGAIN

A command with several keys ran while their hash slot was moving between nodes, or a write reached a node while it was deleting all the keys of that slot. See [`TRYAGAIN`](/content/develop/reference/errors/common/tryagain.md) for how to fix it.

{{< error-catalog module="core" code="TRYAGAIN" >}}

### CLUSTERDOWN

The cluster can't serve the command because a hash slot has no working node. See [`CLUSTERDOWN`](/content/develop/reference/errors/common/clusterdown.md) for how to fix it.

{{< error-catalog module="core" code="CLUSTERDOWN" >}}

### NOTREADY

The nodes of a cluster send each other `CLUSTER SYNCSLOTS` while they move hash slots. A node returns this error when it isn't ready to move slots yet. Apps don't send this command, so you only see this error in the logs of cluster tools.

{{< error-catalog module="core" code="NOTREADY" >}}

## Memory and persistence

### OOM

Redis has reached its memory limit and can't make room for new data. See [`OOM`](/content/develop/reference/errors/common/oom.md) for how to fix it.

{{< error-catalog module="core" code="OOM" >}}

### MISCONF

Redis stopped accepting writes because it couldn't save your data to disk. See [`MISCONF`](/content/develop/reference/errors/common/misconf.md) for how to fix it.

{{< error-catalog module="core" code="MISCONF" >}}

## Connections and security

### NOAUTH

The server requires a password, and the connection hasn't authenticated. See [`NOAUTH`](/content/develop/reference/errors/common/noauth.md) for how to fix it.

{{< error-catalog module="core" code="NOAUTH" >}}

### WRONGPASS

The username or password is wrong, or the user is disabled. See [`WRONGPASS`](/content/develop/reference/errors/common/wrongpass.md) for how to fix it.

{{< error-catalog module="core" code="WRONGPASS" >}}

### NOPERM

The user is authenticated but isn't allowed to run the command, use the key, or use the channel. See [`NOPERM`](/content/develop/reference/errors/common/noperm.md) for how to fix it.

{{< error-catalog module="core" code="NOPERM" >}}

### DENIED

Protected mode refused a connection from another computer, because the server has no password. See [`DENIED`](/content/develop/reference/errors/common/denied.md) for how to fix it.

{{< error-catalog module="core" code="DENIED" >}}

### NOPROTO

[`HELLO`](/content/commands/hello.md) asked for a version of the Redis serialization protocol (RESP) that the server doesn't support. Redis supports versions 2 and 3. To fix it, send `HELLO 2` or `HELLO 3`.

{{< error-catalog module="core" code="NOPROTO" >}}

## Replication and server state

### READONLY

A command that changes data was sent to a read-only replica. See [`READONLY`](/content/develop/reference/errors/common/readonly.md) for how to fix it.

{{< error-catalog module="core" code="READONLY" >}}

### MASTERDOWN

A replica lost its link to its primary and is set not to serve data that may be out of date. See [`MASTERDOWN`](/content/develop/reference/errors/common/masterdown.md) for how to fix it.

{{< error-catalog module="core" code="MASTERDOWN" >}}

### NOREPLICAS

The primary accepts writes only when enough replicas are connected, and there aren't enough. See [`NOREPLICAS`](/content/develop/reference/errors/common/noreplicas.md) for how to fix it.

{{< error-catalog module="core" code="NOREPLICAS" >}}

### LOADING

Redis is still loading its data into memory and can't serve the command yet. See [`LOADING`](/content/develop/reference/errors/common/loading.md) for how to fix it.

{{< error-catalog module="core" code="LOADING" >}}

### UNBLOCKED

A blocking command, such as `BLPOP`, stopped waiting before it got a result. Either another client stopped it with [`CLIENT UNBLOCK`](/content/commands/client-unblock.md) and the `ERROR` option, or the server became a replica while the command was waiting, for example, during a failover. To fix it, send the command again. If the server became a replica, send it to the new primary.

{{< error-catalog module="core" code="UNBLOCKED" >}}

## Streams

### NOGROUP

A stream command named a consumer group or stream that doesn't exist. See [`NOGROUP`](/content/develop/reference/errors/common/nogroup.md) for how to fix it.

{{< error-catalog module="core" code="NOGROUP" >}}

### BUSYGROUP

`XGROUP CREATE` tried to create a consumer group that already exists. See [`BUSYGROUP`](/content/develop/reference/errors/common/busygroup.md) for how to fix it.

{{< error-catalog module="core" code="BUSYGROUP" >}}

## Redis Sentinel

These errors only come from a server that runs as [Redis Sentinel](/content/operate/oss_and_stack/management/sentinel.md).

### INPROG

[`SENTINEL FAILOVER`](/content/operate/oss_and_stack/management/sentinel.md) asked for a failover of a primary that's already failing over. Wait for the running failover to finish.

{{< error-catalog module="core" code="INPROG" >}}

### NOGOODSLAVE

`SENTINEL FAILOVER` found no replica that it can promote to primary. For example, the replicas are disconnected, or their `replica-priority` is `0`, which means they must never be promoted. To fix it, check the replicas with `SENTINEL REPLICAS <primary-name>`, and bring at least one of them back.

{{< error-catalog module="core" code="NOGOODSLAVE" >}}

### NOQUORUM

`SENTINEL CKQUORUM` found that not enough Sentinels are reachable. Either there are too few to reach the quorum that you set for this primary, or too few to form the majority that must authorize a failover. To fix it, check that your Sentinels are running and can reach each other.

{{< error-catalog module="core" code="NOQUORUM" >}}

## ERR

`ERR` is the general-purpose code. The description after it says what went wrong, and it usually names the command, argument, or setting at fault. Five common `ERR` errors have their own pages:

- [`ERR unknown command`](/content/develop/reference/errors/common/err-unknown-command.md)
- [`ERR wrong number of arguments`](/content/develop/reference/errors/common/err-wrong-number-of-arguments.md)
- [`ERR syntax error`](/content/develop/reference/errors/common/err-syntax-error.md)
- [`ERR value is not an integer or out of range`](/content/develop/reference/errors/common/err-not-an-integer.md)
- [`ERR max number of clients reached`](/content/develop/reference/errors/common/err-max-clients.md)

For any other `ERR` error, compare your command with the syntax on its command page. Most of these messages are listed with the commands that return them.

{{< error-catalog module="core" code="ERR" >}}
