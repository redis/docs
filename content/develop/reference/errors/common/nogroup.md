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
description: A stream command named a consumer group or stream that doesn't exist.
linkTitle: NOGROUP
title: NOGROUP error
weight: 60
error:
  prefix: NOGROUP
  message: NOGROUP No such key '<key>' or consumer group '<group>' in XREADGROUP with GROUP option
  match:
  - or consumer group
  - No such consumer group
  - The XGROUP subcommand requires the key to exist
---

Redis returns this error when a stream command uses a consumer group that doesn't exist. The message names both the stream key and the group, because either one can be missing. Commands such as [`XREADGROUP`](/content/commands/xreadgroup.md), [`XPENDING`](/content/commands/xpending.md), [`XCLAIM`](/content/commands/xclaim.md), and [`XGROUP CREATECONSUMER`](/content/commands/xgroup-createconsumer.md) can return it.

```
NOGROUP No such key 'mystream' or consumer group 'mygroup' in XREADGROUP with GROUP option
```

## Example

```
> XREADGROUP GROUP mygroup consumer1 STREAMS mystream >
(error) NOGROUP No such key 'mystream' or consumer group 'mygroup' in XREADGROUP with GROUP option
```

## How to fix it

- **The group hasn't been created.** Create it with [`XGROUP CREATE`](/content/commands/xgroup-create.md) before any consumer reads from it. Add `MKSTREAM` to create the stream as well, if it doesn't exist yet:

    ```
    > XGROUP CREATE mystream mygroup $ MKSTREAM
    OK
    ```

    Without `MKSTREAM`, you can't create a group for a stream that doesn't exist:

    ```
    ERR The XGROUP subcommand requires the key to exist. Note that for CREATE you may want to use the MKSTREAM option to create an empty stream automatically.
    ```

- **The stream was deleted.** A consumer group is part of its stream. So when the stream key is deleted, or expires, its groups are deleted too. Create the group again.
- **The key or group name is different.** Names are case-sensitive. To list a stream's groups, run [`XINFO GROUPS`](/content/commands/xinfo-groups.md).

If several consumers create the group when they start, see [`BUSYGROUP`](/content/develop/reference/errors/common/busygroup.md). For more about consumer groups, see [Consumer groups](/content/develop/data-types/streams/_index.md#consumer-groups).
