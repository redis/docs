---
acl_categories:
- '@slow'
- '@connection'
arity: 2
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
description: Returns the client ID to which the connection's tracking notifications
  are redirected.
group: connection
hidden: false
linkTitle: CLIENT GETREDIR
since: 6.0.0
summary: Returns the client ID to which the connection's tracking notifications are
  redirected.
syntax_fmt: CLIENT GETREDIR
syntax_str: ''
title: CLIENT GETREDIR
---
This command returns the client ID we are redirecting our
[tracking]({{< relref "/develop/clients/client-side-caching#tracking" >}}) notifications to. We set a client
to redirect to when using [`CLIENT TRACKING`]({{< relref "/commands/client-tracking" >}}) to enable tracking. However in
order to avoid forcing client libraries implementations to remember the
ID notifications are redirected to, this command exists in order to improve
introspection and allow clients to check later if redirection is active
and towards which client ID.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="client-getredir-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` when not redirecting notifications to any client.
* [Integer reply](../../develop/reference/protocol-spec#integers): `-1` if client tracking is not enabled.
* [Integer reply](../../develop/reference/protocol-spec#integers): the ID of the client to which notification are being redirected.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` when not redirecting notifications to any client.
* [Integer reply](../../develop/reference/protocol-spec#integers): `-1` if client tracking is not enabled.
* [Integer reply](../../develop/reference/protocol-spec#integers): the ID of the client to which notification are being redirected.

{{< /multitabs >}}
