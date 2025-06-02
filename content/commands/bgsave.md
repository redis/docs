---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: schedule
  name: schedule
  optional: true
  since: 3.2.2
  token: SCHEDULE
  type: pure-token
arity: -1
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
- no_async_loading
complexity: O(1)
description: Asynchronously saves the database(s) to disk.
group: server
hidden: false
history:
- - 3.2.2
  - Added the `SCHEDULE` option.
linkTitle: BGSAVE
since: 1.0.0
summary: Asynchronously saves the database(s) to disk.
syntax_fmt: BGSAVE [SCHEDULE]
syntax_str: ''
title: BGSAVE
---
Save the DB in background.

Normally the OK code is immediately returned.
Redis forks, the parent continues to serve the clients, the child saves the DB
on disk then exits.

An error is returned if there is already a background save running or if there
is another non-background-save process running, specifically an in-progress AOF
rewrite.

If `BGSAVE SCHEDULE` is used, the command will immediately return `OK` when an
AOF rewrite is in progress and schedule the background save to run at the next
opportunity.

A client may be able to check if the operation succeeded using the [`LASTSAVE`]({{< relref "/commands/lastsave" >}})
command.

See the [persistence documentation]({{< relref "/operate/oss_and_stack/management/persistence" >}}) for detailed information.
