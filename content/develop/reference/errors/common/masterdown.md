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
description: A replica lost its link to its primary and is set not to serve data that may be out of date.
linkTitle: MASTERDOWN
title: MASTERDOWN error
weight: 51
error:
  prefix: MASTERDOWN
  message: MASTERDOWN Link with MASTER is down and replica-serve-stale-data is set to 'no'.
  match:
  - Link with MASTER is down
  - MasterDownError
---

A replica returns this error when it has lost its connection to its primary, and its `replica-serve-stale-data` setting is `no`. With this setting, the replica refuses commands while it can't get updates from the primary. This way, it never answers with data that may be out of date.

```
MASTERDOWN Link with MASTER is down and replica-serve-stale-data is set to 'no'.
```

In redis-py, this error is `MasterDownError: Link with MASTER is down and replica-serve-stale-data is set to 'no'.`

## How to fix it

1. On the replica, run [`INFO replication`](/content/commands/info.md). `master_link_status:down` confirms that the link is down. `master_host` and `master_port` show the address of the primary that the replica is trying to reach.
1. Check that the primary is running, and that the replica can reach it at that address.
1. If the primary requires a password, check that the replica has it in its `masterauth` setting. If the primary uses access control list (ACL) users, set `masteruser` too. See [Setting a replica to authenticate to a master](/content/operate/oss_and_stack/management/replication.md#setting-a-replica-to-authenticate-to-a-master).
1. Look in the replica's log for the reason that the link failed.

If your app can use data that may be out of date, set `replica-serve-stale-data yes`, which is the default. The replica then keeps answering commands while the link is down.
