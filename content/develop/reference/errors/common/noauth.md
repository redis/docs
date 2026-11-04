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
description: The server requires a password, and the connection hasn't authenticated.
linkTitle: NOAUTH
title: NOAUTH error
weight: 41
error:
  prefix: NOAUTH
  message: NOAUTH Authentication required.
  match:
  - Authentication required
  - HELLO must be called with the client already authenticated
---

Redis returns this error when the server requires a password, but your connection hasn't sent one yet. Until the connection authenticates, the server refuses almost every command, even `PING`.

```
NOAUTH Authentication required.
```

In redis-py, this error is `AuthenticationError: Authentication required.`

If the first command is [`HELLO`](/content/commands/hello.md), the error also says how to authenticate in the same command: `NOAUTH HELLO must be called with the client already authenticated, otherwise the HELLO <proto> AUTH <user> <pass> option can be used to authenticate the client and select the RESP protocol version at the same time`.

## Example

```
> GET mykey
(error) NOAUTH Authentication required.
> AUTH <password>
OK
> GET mykey
"value"
```

## How to fix it

Authenticate before you send other commands. Use [`AUTH`](/content/commands/auth.md) with a password. If the server has access control list (ACL) users, give a username and a password: `AUTH <username> <password>`.

- **In `redis-cli`,** give the credentials when you connect: `redis-cli --user <username> --pass <password>`. To type the password at a prompt instead, use `--askpass`.
- **In a client library,** set the password, and the username if you have one, in the connection options. Most libraries also accept them in a connection URL: `redis://<username>:<password>@<host>:<port>`.

If you sent a password and got a different error, see [`WRONGPASS`](/content/develop/reference/errors/common/wrongpass.md). For more about passwords and users, see [Authentication](/content/operate/oss_and_stack/management/security/_index.md#authentication).
