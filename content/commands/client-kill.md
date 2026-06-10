---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
- '@connection'
arguments:
- arguments:
  - deprecated_since: 2.8.12
    display_text: ip:port
    name: old-format
    type: string
  - arguments:
    - display_text: client-id
      name: client-id
      optional: true
      since: 2.8.12
      token: ID
      type: integer
    - arguments:
      - display_text: normal
        name: normal
        token: NORMAL
        type: pure-token
      - display_text: master
        name: master
        since: 3.2.0
        token: MASTER
        type: pure-token
      - display_text: slave
        name: slave
        token: SLAVE
        type: pure-token
      - display_text: replica
        name: replica
        since: 5.0.0
        token: REPLICA
        type: pure-token
      - display_text: pubsub
        name: pubsub
        token: PUBSUB
        type: pure-token
      name: client-type
      optional: true
      since: 2.8.12
      token: TYPE
      type: oneof
    - display_text: username
      name: username
      optional: true
      token: USER
      type: string
    - display_text: ip:port
      name: addr
      optional: true
      token: ADDR
      type: string
    - display_text: ip:port
      name: laddr
      optional: true
      since: 6.2.0
      token: LADDR
      type: string
    - arguments:
      - display_text: 'yes'
        name: 'yes'
        token: 'YES'
        type: pure-token
      - display_text: 'no'
        name: 'no'
        token: 'NO'
        type: pure-token
      name: skipme
      optional: true
      token: SKIPME
      type: oneof
    - display_text: maxage
      name: maxage
      optional: true
      since: 7.4.0
      token: MAXAGE
      type: integer
    multiple: true
    name: new-format
    type: oneof
  name: filter
  type: oneof
arity: -3
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
- admin
- noscript
- loading
- stale
complexity: O(N) where N is the number of client connections
description: Terminates open connections.
group: connection
hidden: false
history:
- - 2.8.12
  - Added new filter format.
- - 2.8.12
  - '`ID` option.'
- - 3.2.0
  - Added `master` type in for `TYPE` option.
- - 5.0.0
  - Replaced `slave` `TYPE` with `replica`. `slave` still supported for backward compatibility.
- - 6.2.0
  - '`LADDR` option.'
- - 7.4.0
  - '`MAXAGE` option.'
linkTitle: CLIENT KILL
railroad_diagram: /images/railroad/client-kill.svg
since: 2.4.0
summary: Terminates open connections.
syntax_fmt: "CLIENT KILL <ip:port | <[ID\_client-id] | [TYPE\_<NORMAL | MASTER |\n\
  \  SLAVE | REPLICA | PUBSUB>] | [USER\_username] | [ADDR\_ip:port] |\n  [LADDR\_\
  ip:port] | [SKIPME\_<YES | NO>] | [MAXAGE\_maxage]\n  [[ID\_client-id] | [TYPE\_\
  <NORMAL | MASTER | SLAVE | REPLICA |\n  PUBSUB>] | [USER\_username] | [ADDR\_ip:port]\
  \ | [LADDR\_ip:port] |\n  [SKIPME\_<YES | NO>] | [MAXAGE\_maxage] ...]>>"
title: CLIENT KILL
---
The `CLIENT KILL` command closes a given client connection. This command support two formats, the old format:

    CLIENT KILL addr:port

The `ip:port` should match a line returned by the [`CLIENT LIST`]({{< relref "/commands/client-list" >}}) command (`addr` field).

The new format:

    CLIENT KILL <filter> <value> ... ... <filter> <value>

With the new form it is possible to kill clients by different attributes
instead of killing just by address. See below for the list of supported filters.

It is possible to provide multiple filters at the same time. Multiple filters are combined using logical AND.

    CLIENT KILL addr 127.0.0.1:12345 type pubsub

is valid and will kill only a pubsub client with the specified address.

When the new form is used the command no longer returns `OK` or an error, but instead the number of killed clients, which may be zero.

## Optional arguments

Provide the legacy `ip:port` argument to close a client by address, or one or more of the following filters, which can be combined to select the clients to close.

<details open><summary><code>ip:port</code></summary>

Close the client at the given address. This is the legacy single-argument form.

</details>

<details open><summary><code>ID client-id</code></summary>

Close only the client with the given unique ID.

</details>

<details open><summary><code>TYPE NORMAL | MASTER | SLAVE | REPLICA | PUBSUB</code></summary>

Close only clients of the given type.

</details>

<details open><summary><code>USER username</code></summary>

Close only clients authenticated as the given ACL user.

</details>

<details open><summary><code>ADDR ip:port</code></summary>

Close only clients connected from the given address.

</details>

<details open><summary><code>LADDR ip:port</code></summary>

Close only clients connected to the given local (server) address.

</details>

<details open><summary><code>SKIPME YES | NO</code></summary>

Whether to skip the calling client (`YES`, the default) or allow it to be closed too (`NO`).

</details>

<details open><summary><code>MAXAGE maxage</code></summary>

Close only clients older than the given age, in seconds.

</details>

## Details

### CLIENT KILL and Redis Sentinel

Recent versions of Redis Sentinel (Redis 2.8.12 or greater) use CLIENT KILL
in order to kill clients when an instance is reconfigured, in order to
force clients to perform the handshake with one Sentinel again and update
its configuration.

### Notes

Due to the single-threaded nature of Redis, it is not possible to
kill a client connection while it is executing a command. From
the client point of view, the connection can never be closed
in the middle of the execution of a command. However, the client
will notice the connection has been closed only when the
next command is sent (and results in network error).

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="client-kill-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` when called in 3 argument format and the connection has been closed.
* [Integer reply](../../develop/reference/protocol-spec#integers): when called in filter/value format, the number of clients killed.

-tab-sep-

One of the following:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` when called in 3 argument format and the connection has been closed.
* [Integer reply](../../develop/reference/protocol-spec#integers): when called in filter/value format, the number of clients killed.

{{< /multitabs >}}
