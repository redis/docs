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
description: The user is authenticated but isn't allowed to run the command or use the key.
linkTitle: NOPERM
title: NOPERM error
weight: 43
error:
  prefix: NOPERM
  message: NOPERM User <username> has no permissions to run the '<command>' command
  match:
  - has no permissions to run
  - No permissions to access
  - NoPermissionError
---

Redis returns this error when you're authenticated, but your user's access control list (ACL) rules don't allow what you asked for. The message says what was refused, a command or a key:

```
NOPERM User app has no permissions to run the 'set' command
NOPERM No permissions to access a key
```

In redis-py, this error is `NoPermissionError`, followed by the message without the `NOPERM` prefix.

## Example

The user `app` can only run `GET`, and only on keys that start with `allowed:`:

```
> ACL SETUSER app on ><password> +get ~allowed:*
OK
> AUTH app <password>
OK
> SET allowed:1 "x"
(error) NOPERM User app has no permissions to run the 'set' command
> GET other
(error) NOPERM No permissions to access a key
```

## How to fix it

1. Find out what was refused. As an administrator, run [`ACL LOG`](/content/commands/acl-log.md). Each entry shows the user, the `reason`, such as `command` or `key`, and the `object`, which is the command or key name.
1. Check which user your app is connected as with [`ACL WHOAMI`](/content/commands/acl-whoami.md).
1. Connect as a user that has the permission, or change the user's rules with [`ACL SETUSER`](/content/commands/acl-setuser.md). For example, `ACL SETUSER app +set` lets the user run `SET`, and `ACL SETUSER app ~other` lets it use the key `other`.

See [ACL rules](/content/operate/oss_and_stack/management/security/acl.md#acl-rules) and [Key permissions](/content/operate/oss_and_stack/management/security/acl.md#key-permissions).
