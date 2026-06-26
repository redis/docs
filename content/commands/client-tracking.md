---
acl_categories:
- '@slow'
- '@connection'
arguments:
- arguments:
  - display_text: 'on'
    name: 'on'
    token: 'ON'
    type: pure-token
  - display_text: 'off'
    name: 'off'
    token: 'OFF'
    type: pure-token
  name: status
  type: oneof
- display_text: client-id
  name: client-id
  optional: true
  token: REDIRECT
  type: integer
- display_text: prefix
  multiple: true
  multiple_token: true
  name: prefix
  optional: true
  token: PREFIX
  type: string
- display_text: bcast
  name: bcast
  optional: true
  token: BCAST
  type: pure-token
- display_text: optin
  name: optin
  optional: true
  token: OPTIN
  type: pure-token
- display_text: optout
  name: optout
  optional: true
  token: OPTOUT
  type: pure-token
- display_text: noloop
  name: noloop
  optional: true
  token: NOLOOP
  type: pure-token
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
- noscript
- loading
- stale
complexity: O(1). Some options may introduce additional complexity.
description: Controls server-assisted client-side caching for the connection.
group: connection
hidden: false
linkTitle: CLIENT TRACKING
railroad_diagram: /images/railroad/client-tracking.svg
since: 6.0.0
summary: Controls server-assisted client-side caching for the connection.
syntax_fmt: "CLIENT TRACKING <ON | OFF> [REDIRECT\_client-id] [PREFIX\_prefix\n  [PREFIX\
  \ prefix ...]] [BCAST] [OPTIN] [OPTOUT] [NOLOOP]"
title: CLIENT TRACKING
---
This command enables the tracking feature of the Redis server, which is used
for [server assisted client side caching]({{< relref "/develop/clients/client-side-caching#tracking" >}}).

When tracking is enabled Redis remembers the keys that the connection
requested, in order to send later invalidation messages when such keys are
modified. Invalidation messages are sent in the same connection (only available
when the RESP3 protocol is used) or redirected in a different connection
(available with RESP2 and Pub/Sub). You can use broadcasting mode to receive notifications for all keys that match the key prefixes you subscribe to, regardless of which keys you request. For details, see [the client-side caching documentation]({{< relref "/develop/reference/client-side-caching" >}}). This page only describes the options for this subcommand.

In order to enable tracking, use:

    CLIENT TRACKING ON ... options ...

The feature will remain active in the current connection for all its life,
unless tracking is turned off with `CLIENT TRACKING OFF` at some point.

## Required arguments

<details open><summary><code>ON | OFF</code></summary>

Turn key-invalidation tracking on or off for the connection.

</details>

## Optional arguments

<details open><summary><code>REDIRECT client-id</code></summary>

Send invalidation messages to the connection with the specified ID. The connection must exist. You can get the ID of a connection using [`CLIENT ID`]({{< relref "/commands/client-id" >}}). If the redirected connection terminates while in RESP3 mode, the connection with tracking enabled receives tracking-redir-broken push messages to signal the disconnection.

</details>

<details open><summary><code>PREFIX prefix [PREFIX prefix ...]</code></summary>

Track only keys that start with one of the specified prefixes. Use with the `BCAST` argument. You can specify this option multiple times to track multiple prefixes. If you enable broadcasting without this option, Redis sends invalidation messages for every key. You can’t remove a single prefix; to remove all prefixes, disable and re-enable tracking. This option adds O(N^2) time complexity, where N is the total number of tracked prefixes.

</details>

<details open><summary><code>BCAST</code></summary>

Enable broadcasting mode. In this mode, Redis sends invalidation messages for all keys, or for keys that match a specified PREFIX, instead of only the keys that the connection reads. Without broadcasting mode, Redis tracks the keys fetched by read-only commands and sends invalidation messages only for those keys.

</details>

<details open><summary><code>OPTIN</code></summary>

Track keys only for read commands that immediately follow a `CLIENT CACHING YES`.

</details>

<details open><summary><code>OPTOUT</code></summary>

Track all read keys except those for commands that immediately follow a `CLIENT CACHING NO`.

</details>

<details open><summary><code>NOLOOP</code></summary>

Do not send invalidation messages for keys modified by this connection. In the default tracking mode, modifying a tracked key removes it from the invalidation table, even when `NOLOOP` suppresses the message. To track the key for future invalidations, read the key again.

</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="client-tracking-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the connection was successfully put in tracking mode or if the tracking mode was successfully disabled. Otherwise, an error is returned.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the connection was successfully put in tracking mode or if the tracking mode was successfully disabled. Otherwise, an error is returned.

{{< /multitabs >}}
