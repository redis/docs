---
categories:
- docs
- develop
- stack
- oss
description: How Guardian Community can affect your application's commands, Lua scripts, and connections.
linkTitle: Guardian
title: Guardian and your application
weight: 40
---

If your Redis Open Source servers run [Guardian Community](/content/operate/oss_and_stack/guardian/_index.md),
some requests that match a known vulnerability are refused with an error. Ordinary commands work
as before. This page explains what your application can see and what to do about it.

## Recognize a Guardian denial

When a Guardian rule blocks a request, Redis returns an error that names the rule and the reason:

```text
ERR blocked by signed Redis hotpatch policy rule=<rule-id> reason=<reason>
```

If your team runs its own rule registry, the error reads `blocked by customer Redis hotpatch policy`
instead.

The error never repeats your command's arguments. While the rule is active, retrying the same
request gets the same error.

To get the denial explained, give your Redis administrator:

- The `rule=` and `reason=` values from the error.
- The command, or the Lua script or function, that triggered it.
- Which application user connected.

The administrator can look up the rule's impact with `HOTPATCH.RULES <rule-id>`.

## Lua scripts and functions

Some Guardian rules check Lua code conservatively and can refuse a script that's safe. On Redis 7
and later, your administrator can approve your exact code for that one rule. See
[Approve a Lua script or function](/content/operate/oss_and_stack/guardian/manage.md#approve-a-lua-script-or-function).

An approval covers exact source code:

- **Any change to the code needs a new approval**, even a whitespace change. Plan approvals into
  your release process before you deploy changed scripts.
- **For a function, the approval covers the complete library.** Changing any function in the
  library changes the code that needs approval.
- **Approvals can set limits** on the number of keys and arguments a call passes. A call outside
  those limits is still refused.
- **Approvals are per node.** Each node that runs your code needs its own approval.

Redis access control lists (ACLs) and other Guardian rules still apply to approved code. Approvals aren't available on
Redis 6.2.

## Reconnect during module upgrades

When your administrator upgrades the Guardian module, Redis disconnects every client but keeps
the dataset in memory. To handle this, your application needs to:

- Reconnect and retry after a dropped connection.
- Expect to lose a `MULTI` transaction that was queued but not yet run with `EXEC`.
- Subscribe again to Pub/Sub channels.
- Restore other per-connection state, such as `CLIENT` settings or a selected database.

Most client libraries can reconnect automatically. See your library's documentation under
[Client libraries](/content/develop/clients/_index.md).
