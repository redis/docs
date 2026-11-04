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
description: XGROUP CREATE tried to create a consumer group that already exists.
linkTitle: BUSYGROUP
title: BUSYGROUP error
weight: 61
error:
  prefix: BUSYGROUP
  message: BUSYGROUP Consumer Group name already exists
  match:
  - Consumer Group name already exists
---

Redis returns this error from [`XGROUP CREATE`](/content/commands/xgroup-create.md) when the stream already has a consumer group with that name.

```
BUSYGROUP Consumer Group name already exists
```

## Example

```
> XGROUP CREATE mystream mygroup $ MKSTREAM
OK
> XGROUP CREATE mystream mygroup $ MKSTREAM
(error) BUSYGROUP Consumer Group name already exists
```

## How to fix it

This error is often harmless. Many apps create their consumer group each time they start, so after the first start, the group already exists. In that case, catch this error in your code and carry on.

- **To change where the group starts reading,** use [`XGROUP SETID`](/content/commands/xgroup-setid.md) instead of creating the group again.
- **To start over,** delete the group with [`XGROUP DESTROY`](/content/commands/xgroup-destroy.md), and then create it again. Deleting a group also deletes its list of pending messages, which are messages that consumers have read but not yet acknowledged.
