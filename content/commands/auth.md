---
acl_categories:
- '@fast'
- '@connection'
arguments:
- display_text: username
  name: username
  optional: true
  since: 6.0.0
  type: string
- display_text: password
  name: password
  type: string
arity: -2
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
command_flags:
- noscript
- loading
- stale
- fast
- no_auth
- allow_busy
complexity: O(N) where N is the number of passwords defined for the user
description: Authenticates the connection.
group: connection
hidden: false
history:
- - 6.0.0
  - Added ACL style (username and password).
linkTitle: AUTH
since: 1.0.0
summary: Authenticates the connection.
syntax_fmt: AUTH [username] password
syntax_str: password
title: AUTH
---
The AUTH command authenticates the current connection in two cases:

1. If the Redis server is password protected via the `requirepass` option.
2. A Redis 6.0 instance, or greater, is using the [Redis ACL system]({{< relref "/operate/oss_and_stack/management/security/acl" >}}).

Redis versions prior of Redis 6 were only able to understand the one argument
version of the command:

{{< clients-example cmds_cnxmgmt auth1 >}}
AUTH "temp-pass"
{{< /clients-example >}}

This form just authenticates against the password set with `requirepass`.
In this configuration Redis will deny any command executed by the just
connected clients, unless the connection gets authenticated via `AUTH`.

If the password provided via AUTH matches the password in the configuration file, the server replies with the `OK` status code and starts accepting commands.
Otherwise, an error is returned and the clients needs to try a new password.

When Redis ACLs are used, the command should be given in an extended way:

{{< clients-example cmds_cnxmgmt auth2 >}}
AUTH "test-user" "strong_password"
{{< /clients-example >}}

In order to authenticate the current connection with one of the connections
defined in the ACL list (see [`ACL SETUSER`]({{< relref "/commands/acl-setuser" >}})) and the official [ACL guide]({{< relref "/operate/oss_and_stack/management/security/acl" >}}) for more information.

When ACLs are used, the single argument form of the command, where only the password is specified, assumes that the implicit username is "default".

## Security notice

Because of the high performance nature of Redis, it is possible to try
a lot of passwords in parallel in very short time, so make sure to generate a
strong and very long password so that this attack is infeasible.
A good way to generate strong passwords is via the [`ACL GENPASS`]({{< relref "/commands/acl-genpass" >}}) command.

## Return information

{{< multitabs id="auth-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`, or an error if the password, or username/password pair, is invalid.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`, or an error if the password, or username/password pair, is invalid.

{{< /multitabs >}}
