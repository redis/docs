---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- arguments:
  - display_text: count
    name: count
    type: integer
  - display_text: reset
    name: reset
    token: RESET
    type: pure-token
  name: operation
  optional: true
  type: oneof
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
- admin
- noscript
- loading
- stale
complexity: O(N) with N being the number of entries shown.
description: Lists recent security events generated due to ACL rules.
group: server
hidden: false
history:
- - 7.2.0
  - Added entry ID, timestamp created, and timestamp last updated.
linkTitle: ACL LOG
railroad_diagram: /images/railroad/acl-log.svg
since: 6.0.0
summary: Lists recent security events generated due to ACL rules.
syntax_fmt: ACL LOG [count | RESET]
syntax_str: ''
title: ACL LOG
---
The command shows a list of recent ACL security events:

1. Failed authentications with [`AUTH`]({{< relref "/commands/auth" >}}) or [`HELLO`]({{< relref "/commands/hello" >}}) (reason = auth)
2. Commands violating the current ACL rules
   - Disallowed commands (reason = command).
   - Disallowed keys (reason = key).
   - Disallowed pub/sub channel (reason = channel).

The optional argument specifies how many entries to show. By default
up to ten failures are returned. The special [`RESET`]({{< relref "/commands/reset" >}}) argument clears the log.
Entries are displayed starting from the most recent.

## Examples

```
> AUTH someuser wrongpassword
(error) WRONGPASS invalid username-password pair
> ACL LOG 1
1)  1) "count"
    2) (integer) 1
    3) "reason"
    4) "auth"
    5) "context"
    6) "toplevel"
    7) "object"
    8) "AUTH"
    9) "username"
   10) "someuser"
   11) "age-seconds"
   12) "8.038"
   13) "client-info"
   14) "id=3 addr=127.0.0.1:57275 laddr=127.0.0.1:6379 fd=8 name= age=16 idle=0 flags=N db=0 sub=0 psub=0 ssub=0 multi=-1 qbuf=48 qbuf-free=16842 argv-mem=25 multi-mem=0 rbs=1024 rbp=0 obl=0 oll=0 omem=0 tot-mem=18737 events=r cmd=auth user=default redir=-1 resp=2"
   15) "entry-id"
   16) (integer) 0
   17) "timestamp-created"
   18) (integer) 1675361492408
   19) "timestamp-last-updated"
   20) (integer) 1675361492408
```

Each log entry is composed of the following fields:

1. `count`: The number of security events detected within a 60 second period that are represented by this entry.
2. `reason`: The reason that the security events were logged. Either `command`, `key`, `channel`, or `auth`.
3. `context`: The context that the security events were detected in. Either `toplevel`, `multi`, `lua`, or `module`.
4. `object`: The resource that the user had insufficient permissions to access. `auth` when the reason is `auth`.
5. `username`: The username that executed the command that caused the security events or the username that had a failed authentication attempt.
6. `age-seconds`: Age of the log entry in seconds.
7. `client-info`: Displays the client info of a client which caused one of the security events.
8. `entry-id`: The sequence number of the entry (starting at 0) since the server process started. Can also be used to check if items were "lost", if they fell between periods.
9. `timestamp-created`: A UNIX timestamp in `milliseconds` at the time the entry was first created.
10. `timestamp-last-updated`: A UNIX timestamp in `milliseconds` at the time the entry was last updated.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="acl-log-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

When called to show security events:
* [Array reply](../../develop/reference/protocol-spec#arrays): an array of [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) elements representing ACL security events.
When called with `RESET`:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the security log was cleared.

-tab-sep-

When called to show security events:
* [Array reply](../../develop/reference/protocol-spec#arrays): an array of [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) elements representing ACL security events.
When called with `RESET`:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the security log was cleared.

{{< /multitabs >}}
