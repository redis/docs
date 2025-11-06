---
acl_categories:
- '@slow'
- '@connection'
arguments:
- arguments:
  - display_text: libname
    name: libname
    token: LIB-NAME
    type: string
  - display_text: libver
    name: libver
    token: LIB-VER
    type: string
  name: attr
  type: oneof
arity: 4
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
complexity: O(1)
description: Sets information specific to the client or connection.
group: connection
hidden: false
hints:
- request_policy:all_nodes
- response_policy:all_succeeded
linkTitle: CLIENT SETINFO
since: 7.2.0
summary: Sets information specific to the client or connection.
syntax_fmt: "CLIENT SETINFO <LIB-NAME\_libname | LIB-VER\_libver>"
syntax_str: ''
title: CLIENT SETINFO
---
The `CLIENT SETINFO` command assigns various info attributes to the current connection which are displayed in the output of [`CLIENT LIST`]({{< relref "/commands/client-list" >}}) and [`CLIENT INFO`]({{< relref "/commands/client-info" >}}).

Client libraries are expected to pipeline this command after authentication on all connections
and ignore failures since they could be connected to an older version that doesn't support them.

Currently the supported attributes are:
* `lib-name` - meant to hold the name of the client library that's in use.
* `lib-ver` - meant to hold the client library's version.

There is no limit to the length of these attributes. However it is not possible to use spaces, newlines, or other non-printable characters that would violate the format of the [`CLIENT LIST`]({{< relref "/commands/client-list" >}}) reply.

[Official client libraries](https://redis.io/docs/latest/develop/connect/clients/) allow extending `lib-name` with a custom suffix to expose additional information about the client. 
For example, high-level libraries like [redis-om-spring](https://github.com/redis/redis-om-spring) can report their version. 
The resulting `lib-name` would be `jedis(redis-om-spring_v1.0.0)`. 
Brace characters are used to delimit the custom suffix and should be avoided in the suffix itself.
We recommend using the following format for the custom suffixes for third-party libraries `(?<custom-name>[ -~]+)[ -~]v(?<custom-version>[\d\.]+)` and use `;` to delimit multiple suffixes.

Note that these attributes are **not** cleared by the RESET command.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="client-setinfo-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the attribute name was successfully set.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the attribute name was successfully set.

{{< /multitabs >}}
