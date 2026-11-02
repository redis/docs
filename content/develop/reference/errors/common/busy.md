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
description: A Lua script or function has run for too long, and Redis is blocked until it ends.
linkTitle: BUSY
title: BUSY error
weight: 54
error:
  prefix: BUSY
  message: BUSY Redis is busy running a script. You can only call SCRIPT KILL or SHUTDOWN NOSAVE.
  match:
  - Redis is busy running a script
  - Redis is busy running a module command
  - UNKILLABLE
  - Script killed by user
---

Redis returns this error when a Lua script or function has run for longer than the `busy-reply-threshold` setting, which is 5 seconds by default. While a script runs, Redis doesn't run any other command. So instead of making other clients wait, Redis answers almost every command with this error, even `PING`.

```
BUSY Redis is busy running a script. You can only call SCRIPT KILL or SHUTDOWN NOSAVE.
```

For a function, the message names `FUNCTION KILL` instead of `SCRIPT KILL`. A module command that runs for a long time causes a similar error: `BUSY Redis is busy running a module command.`

## Example

While another client runs a script that never ends:

```
> GET mykey
(error) BUSY Redis is busy running a script. You can only call SCRIPT KILL or SHUTDOWN NOSAVE.
> SCRIPT KILL
OK
```

## How to fix it

1. Stop the script with [`SCRIPT KILL`](/content/commands/script-kill.md), or stop a function with [`FUNCTION KILL`](/content/commands/function-kill.md). The client that ran the script then gets an error that starts with `ERR Script killed by user with SCRIPT KILL`.
1. If the script has already changed data, Redis can't stop it, because that would leave the change half done. `SCRIPT KILL` then fails:

    ```
    UNKILLABLE Sorry the script already executed write commands against the dataset. You can either wait the script termination or kill the server in a hard way using the SHUTDOWN NOSAVE command.
    ```

    You can either wait for the script to finish, or stop the server with [`SHUTDOWN NOSAVE`](/content/commands/shutdown.md). `SHUTDOWN NOSAVE` loses all changes that weren't saved to disk.
1. Change the script so that it can't run this long. Common causes are a loop that never ends, and a script that processes too many keys or elements in one call. Split large jobs into several smaller calls.

See [Maximum execution time](/content/develop/programmability/_index.md#maximum-execution-time).
