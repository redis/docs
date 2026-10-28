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
description: Protected mode refused a connection from another computer, because the server has no password.
linkTitle: DENIED
title: DENIED error
weight: 44
error:
  prefix: DENIED
  message: "DENIED Redis is running in protected mode because protected mode is enabled and no password is set for the default user. In this mode connections are only accepted from the loopback interface. ..."
  match:
  - Redis is running in protected mode
---

Redis sends this error when a client on another computer connects to a server in protected mode. Protected mode is on by default. While it's on, and the default user has no password, Redis only accepts connections from its own computer, through the loopback interface (`127.0.0.1` or `::1`). It sends this error to any other connection, and then closes the connection.

```
DENIED Redis is running in protected mode because protected mode is enabled and no password is set for the default user. In this mode connections are only accepted from the loopback interface. If you want to connect from external computers to Redis you may adopt one of the following solutions: 1) Just disable protected mode sending the command 'CONFIG SET protected-mode no' from the loopback interface by connecting to Redis from the same host the server is running, however MAKE SURE Redis is not publicly accessible from internet if you do so. Use CONFIG REWRITE to make this change permanent. 2) Alternatively you can just disable the protected mode by editing the Redis configuration file, and setting the protected mode option to 'no', and then restarting the server. 3) If you started the server manually just for testing, restart it with the '--protected-mode no' option. 4) Set up an authentication password for the default user. NOTE: You only need to do one of the above things in order for the server to start accepting connections from the outside.
```

Some client libraries don't show this message. For example, redis-py only reports `ConnectionError: Connection closed by server.`

## How to fix it

Protected mode keeps a server that has no password away from the network. The safest fix is to set a password. Protected mode then lets other computers connect, as long as they authenticate:

1. On the server's own computer, connect with `redis-cli` and set a password for the default user:

    ```
    > CONFIG SET requirepass <password>
    OK
    ```

    To keep the password after a restart, also set `requirepass <password>` in the configuration file. For separate users with their own passwords, see [ACL](/content/operate/oss_and_stack/management/security/acl.md).
1. Give the password to your app or client. See [`NOAUTH`](/content/develop/reference/errors/common/noauth.md#how-to-fix-it).

If the server can only be reached from a network you trust, for example, while you test, you can turn protected mode off instead. Set `protected-mode no` in the configuration file, or start the server with `--protected-mode no`. Make sure that the server isn't reachable from the internet.

See [Protected mode](/content/operate/oss_and_stack/management/security/_index.md#protected-mode).
