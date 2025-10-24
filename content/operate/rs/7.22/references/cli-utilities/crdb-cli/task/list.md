---
Title: crdb-cli task list
alwaysopen: false
categories:
- docs
- operate
- rs
description: Lists active and recent Active-Active database tasks.
linkTitle: list
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/crdb-cli/task/list/'
---

Lists active and recent Active-Active database tasks.

```sh
crdb-cli task list
```

### Parameters

None

### Returns

A table listing current and recent Active-Active tasks.  Each entry includes the following:

| Column | Description |
|--------|-------------|
| Task ID | String containing the unique ID associated with the task<br/>Example: `e1c49470-ae0b-4df8-885b-9c755dd614d0` |
| CRDB-GUID | String containing the unique ID associated with the Active-Active database affected by the task<br/>Example: `1d7741cc-1110-4e2f-bc6c-935292783d24` |
| Operation | String describing the task action<br/>Example: `create_crdb` |
| Status | String indicating the task status<br/>Example: `finished` |
| Worker name | String identifying the process handling the task<br/>Example: `crdb_worker:1:0` |
| Started | TimeStamp value indicating when the task started ([UTC](https://en.wikipedia.org/wiki/Coordinated_Universal_Time))<br/>Example: `2022-10-12T09:33:41Z` |
| Ended | TimeStamp value indicating when the task ended (UTC)<br/>Example: ` 2022-10-12T09:33:55Z` |

### Example

```sh
$ crdb-cli task list
TASK-ID    CRDB-GUID  OPERATION    STATUS    WORKER-NAME  STARTED    ENDED               
<task-ID>  <crdb-ID>  <operation>  <result>  <worker-ID>  <started>  <ended>
```
