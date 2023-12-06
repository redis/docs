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
The `CLIENT SETINFO` command assigns various info attributes to the current connection which are displayed in the output of [`CLIENT LIST`](/commands/client-list) and [`CLIENT INFO`](/commands/client-info).

Client libraries are expected to pipeline this command after authentication on all connections
and ignore failures since they could be connected to an older version that doesn't support them.

Currently the supported attributes are:
* `lib-name` - meant to hold the name of the client library that's in use.
* `lib-ver` - meant to hold the client library's version.

There is no limit to the length of these attributes. However it is not possible to use spaces, newlines, or other non-printable characters that would violate the format of the [`CLIENT LIST`](/commands/client-list) reply.

Note that these attributes are **not** cleared by the RESET command.
