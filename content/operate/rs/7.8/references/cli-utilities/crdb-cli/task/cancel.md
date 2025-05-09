---
Title: crdb-cli task cancel
alwaysopen: false
categories:
- docs
- operate
- rs
description: Attempts to cancel a specified Active-Active database task.
linkTitle: cancel
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/crdb-cli/task/cancel/'
---

Cancels the Active-Active database task specified by the task ID.

```sh
crdb-cli task cancel --task-id <task_id>
```

### Parameters

| Parameter           | Value  | Description                         |
|---------------------|--------|-------------------------------------|
| task-id \<task_id\>  | string | An Active-Active database task ID (required) |

### Returns

Attempts to cancel an Active-Active database task.

Be aware that tasks may complete before they can be cancelled.

### Example

```sh
$ crdb-cli task cancel --task-id 2901c2a3-2828-4717-80c0-6f27f1dd2d7c 
```
