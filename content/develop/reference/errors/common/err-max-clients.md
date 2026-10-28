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
description: The server already has as many connections as its limit allows.
linkTitle: ERR max number of clients
title: ERR max number of clients reached
weight: 40
error:
  prefix: ERR
  message: ERR max number of clients reached
  match:
  - max number of clients reached
---

Redis returns this error when a new client connects, but the server already has as many connections as its limit allows. The limit is the `maxclients` setting, which is 10,000 by default. Redis sends the error and then closes the new connection.

```
ERR max number of clients reached
```

In redis-py, this error is `ConnectionError: max number of clients reached`.

## How to fix it

1. Check how many clients are connected with [`INFO clients`](/content/commands/info.md). `connected_clients` shows the number of connections, and `maxclients` shows the limit.
1. Find out where the connections come from with [`CLIENT LIST`](/content/commands/client-list.md). Each line shows a connection's address in `addr`, its name in `name`, and how many seconds it has been idle in `idle`. Many connections from the same app that stay idle for a long time usually mean that the app doesn't close them.
1. Fix the cause:
    - **Your app opens a new connection for each request.** Create one client, or one connection pool, when your app starts, and reuse it. For example, see [Connect with a connection pool](/content/develop/clients/redis-py/connect.md#connect-with-a-connection-pool) for redis-py.
    - **Many copies of your app each keep a large pool.** The total number of connections is the pool size multiplied by the number of copies. Make the pools smaller.
    - **Idle connections never close.** By default, Redis never closes idle connections. Set `timeout` to the number of seconds after which Redis closes an idle connection. See [Client timeouts](/content/develop/reference/clients.md#client-timeouts).
    - **You need more connections.** Raise `maxclients`. Each connection also uses a file descriptor, so check the operating system's limit too. See [Maximum concurrent connected clients](/content/develop/reference/clients.md#maximum-concurrent-connected-clients).
