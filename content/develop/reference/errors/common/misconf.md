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
description: Redis stopped accepting writes because it couldn't save your data to disk.
linkTitle: MISCONF
title: MISCONF error
weight: 31
error:
  prefix: MISCONF
  message: "MISCONF Redis is configured to save RDB snapshots, but it's currently unable to persist to disk. Commands that may modify the data set are disabled, because this instance is configured to report errors during writes if RDB snapshotting fails (stop-writes-on-bgsave-error option). Please check the Redis logs for details about the RDB error."
  match:
  - unable to persist to disk
  - stop-writes-on-bgsave-error
  - Errors writing to the AOF file
---

Redis returns this error when it can't save your data to disk. So that you notice, Redis refuses commands that change data until saving works again. Commands that read data still work. The message depends on how Redis saves your data:

- **Snapshots.** The last attempt to save a snapshot failed. A snapshot, also called an RDB (Redis Database) file, is a copy of all your data at one point in time:

    ```
    MISCONF Redis is configured to save RDB snapshots, but it's currently unable to persist to disk. Commands that may modify the data set are disabled, because this instance is configured to report errors during writes if RDB snapshotting fails (stop-writes-on-bgsave-error option). Please check the Redis logs for details about the RDB error.
    ```

- **Append-only file.** Redis couldn't write to its append-only file (AOF), which logs every change to your data. The message ends with the reason that the operating system gave:

    ```
    MISCONF Errors writing to the AOF file: No space left on device
    ```

## How to fix it

1. Find out why saving failed. The Redis log gives the reason, for example:

    ```
    Failed opening the temp RDB file temp-56018.rdb (in server root dir /var/lib/redis) for saving: Permission denied
    ```

    To confirm the problem, run [`INFO persistence`](/content/commands/info.md). `rdb_last_bgsave_status:err` means that the last snapshot failed, and `aof_last_write_status:err` means that the last write to the AOF failed.
1. Fix the cause. These are the most common ones:
    - **The disk is full.** Free some space on the disk that holds the Redis data directory. To find the directory, run `CONFIG GET dir`.
    - **Redis can't write to its data directory.** Check that the user that runs Redis can create files in that directory.
    - **Redis couldn't start a snapshot.** Redis saves snapshots in a background process that it creates with `fork()`. On Linux, this can fail when the system is low on memory. The [administration guide](/content/operate/oss_and_stack/management/admin.md) recommends setting `vm.overcommit_memory = 1`.
1. Let Redis save again:
    - For snapshots, run [`BGSAVE`](/content/commands/bgsave.md). When the snapshot succeeds, Redis accepts writes again.
    - For the AOF, you don't need to do anything. Redis tries to write the file again every second, and accepts writes again as soon as a write succeeds.

If you can accept snapshots that may be out of date, you can tell Redis to keep accepting writes after a failed snapshot with `CONFIG SET stop-writes-on-bgsave-error no`. You then won't get this error for snapshots, but you also won't notice when saving stops working. This setting doesn't apply to the AOF. See [Persistence](/content/operate/oss_and_stack/management/persistence.md).
