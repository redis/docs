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
description: The username or password is wrong, or the user is disabled.
linkTitle: WRONGPASS
title: WRONGPASS error
weight: 42
error:
  prefix: WRONGPASS
  message: WRONGPASS invalid username-password pair or user is disabled.
  match:
  - invalid username-password pair
  - called without any password configured
---

Redis returns this error from [`AUTH`](/content/commands/auth.md) or [`HELLO`](/content/commands/hello.md) when it can't authenticate you. For security, the message is the same in each of these cases:

- The password is wrong.
- The user doesn't exist.
- The user exists, but it's disabled.

```
WRONGPASS invalid username-password pair or user is disabled.
```

In redis-py, this error is `AuthenticationError: invalid username-password pair or user is disabled.`

## How to fix it

- **Check the credentials that your app uses.** Look for a password from a different environment, a space or newline at the end of the password, or a missing username. Without a username, `AUTH` checks the password of the `default` user.
- **Check that the user exists and is enabled.** An administrator can list the users with [`ACL USERS`](/content/commands/acl-users.md), and see a user's settings with [`ACL GETUSER`](/content/commands/acl-getuser.md). A disabled user has the `off` flag. To enable it, run `ACL SETUSER <username> on`.

You get a different error when you send a password to a server that doesn't have one:

```
ERR AUTH <password> called without any password configured for the default user. Are you sure your configuration is correct?
```

In that case, either remove the password from your app's configuration, or set a password on the server. See [access control lists (ACLs)](/content/operate/oss_and_stack/management/security/acl.md).
