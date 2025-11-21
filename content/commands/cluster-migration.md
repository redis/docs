---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- arguments:
  - arguments:
    - display_text: start-slot
      name: start-slot
      type: integer
    - display_text: end-slot
      name: end-slot
      type: integer
    multiple: true
    name: import
    token: IMPORT
    type: block
  - arguments:
    - display_text: task-id
      name: task-id
      token: ID
      type: string
    - display_text: all
      name: all
      token: ALL
      type: pure-token
    name: cancel
    token: CANCEL
    type: oneof
  - arguments:
    - display_text: task-id
      name: task-id
      optional: true
      token: ID
      type: string
    - display_text: all
      name: all
      optional: true
      token: ALL
      type: pure-token
    name: status
    token: STATUS
    type: block
  name: subcommand
  type: oneof
arity: -4
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
- stale
- no_async_loading
complexity: O(N) where N is the total number of the slots between the start slot and
  end slot arguments.
description: Start, monitor, and cancel atomic slot migration tasks.
group: cluster
hidden: false
linkTitle: CLUSTER MIGRATION
since: 8.4.0
summary: Start, monitor, and cancel atomic slot migration tasks.
syntax_fmt: "CLUSTER MIGRATION <IMPORT\_start-slot end-slot [start-slot end-slot ...]\n\
  \  | CANCEL\_<ID\_task-id | ALL> | STATUS\_<ID\_task-id | ALL>"
syntax_str: ''
title: CLUSTER MIGRATION
---

The `CLUSTER MIGRATION` command provides atomic slot migration functionality for Redis Cluster. This command allows you to import slots from other nodes, monitor the progress of migration tasks, and cancel ongoing migrations.

## Required arguments

<details open><summary><code>subcommand</code></summary>

The subcommand specifies the operation to perform:

- `IMPORT <start-slot> <end-slot> [<start-slot> <end-slot> ...]`: Executes on the destination master. Accepts multiple slot ranges and triggers atomic migration for the specified ranges. Returns a task ID that you can use to monitor the status of the task.

- `CANCEL <ID <task-id> | ALL>`: Cancels an ongoing migration task by its ID or cancels all tasks if `ALL` is specified. Note: Cancelling a task on the source node does not stop the migration on the destination node, which will continue retrying until it is also cancelled there.

- `STATUS [ID <task-id> | ALL]`: Displays the status of current and completed atomic slot migration tasks. If a specific task ID is provided, it returns detailed information for that task only. If `ALL` is specified, it returns the status of all ongoing and completed tasks.

</details>

## Examples

Import slots 0-1000 and 2000-3000 to the current node:

```bash
CLUSTER MIGRATION IMPORT 0 1000 2000 3000
```

Check the status of all migration tasks:

```bash
CLUSTER MIGRATION STATUS ALL
```

Check the status of a specific migration task:

```bash
CLUSTER MIGRATION STATUS ID 24cf41718b20f7f05901743dffc40bc9b15db339
```

Cancel a specific migration task:

```bash
CLUSTER MIGRATION CANCEL ID 24cf41718b20f7f05901743dffc40bc9b15db339
```

Cancel all migration tasks:

```bash
CLUSTER MIGRATION CANCEL ALL
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

For the `IMPORT` subcommand:
[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): task ID on success, or error message on failure.

For the `CANCEL` subcommand:
[Integer reply](../../develop/reference/protocol-spec#integers): number of cancelled tasks.

For the `STATUS` subcommand:
[Array reply](../../develop/reference/protocol-spec#arrays): a list of migration task details. Each task is represented as an array containing field-value pairs:
- `id`: Task identifier
- `slots`: Slot range being imported or migrated
- `source`: Source node ID
- `dest`: Destination node ID
- `operation`: Operation type ("import" or "migrate")
- `state`: Current state ("completed", "in_progress", etc.)
- `last_error`: Last error message (empty if none)
- `retries`: Number of retry attempts
- `create_time`: Task creation timestamp
- `start_time`: Task start timestamp
- `end_time`: Task completion timestamp (if completed)
- `write_pause_ms`: Write pause duration in milliseconds

-tab-sep-

For the `IMPORT` subcommand:
[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): task ID on success, or error message on failure.

For the `CANCEL` subcommand:
[Integer reply](../../develop/reference/protocol-spec#integers): number of cancelled tasks.

For the `STATUS` subcommand:
[Array reply](../../develop/reference/protocol-spec#arrays): a list of migration task details. Each task is represented as an array containing field-value pairs:
- `id`: Task identifier
- `slots`: Slot range being migrated
- `source`: Source node ID
- `dest`: Destination node ID
- `operation`: Operation type (typically "migrate")
- `state`: Current state ("completed", "in_progress", etc.)
- `last_error`: Last error message (empty if none)
- `retries`: Number of retry attempts
- `create_time`: Task creation timestamp
- `start_time`: Task start timestamp
- `end_time`: Task completion timestamp (if completed)
- `write_pause_ms`: Write pause duration in milliseconds

{{< /multitabs >}}

## Notes

- The atomic slot migration feature is available starting from Redis 8.4.0.
- Cancelling a task on the source node does not automatically stop the migration on the destination node.
- In `CLUSTER MIGRATION STATUS` output, the "state" field will show `completed` for successful operations.
- Tasks with empty "last_error" fields indicate no errors occurred during the migration process.

## Key visibility during migration

During atomic slot migration operations, keys in unowned slots may be filtered out from the following commands while importing or trimming is in progress:

- [`KEYS`]({{< relref "/commands/keys" >}})
- [`SCAN`]({{< relref "/commands/scan" >}})
- [`RANDOMKEY`]({{< relref "/commands/randomkey" >}})
- [`CLUSTER GETKEYSINSLOT`]({{< relref "/commands/cluster-getkeysinslot" >}})
- [`DBSIZE`]({{< relref "/commands/dbsize" >}})
- [`CLUSTER COUNTKEYSINSLOT`]({{< relref "/commands/cluster-countkeysinslot" >}})

The [`INFO KEYSPACE`]({{< relref "/commands/info" >}}) command will continue to reflect the actual number of keys, including those being imported.

## Related configuration

- `cluster-slot-migration-handoff-max-lag-bytes`: After slot snapshot completion, if remaining replication stream size falls below this threshold, the source node pauses writes to hand off slot ownership. Higher values trigger handoff earlier but may cause longer write pauses. Lower values result in shorter write pauses but may be harder to reach with steady incoming writes (default: 1MB).
- `cluster-slot-migration-write-pause-timeout`: Maximum duration that the source node pauses writes during ASM handoff. If the destination fails to take over slots within this timeout, the source assumes migration failed and resumes writes (default: 10 seconds).
