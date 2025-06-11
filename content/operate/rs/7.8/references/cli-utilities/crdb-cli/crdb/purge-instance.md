---
Title: crdb-cli crdb purge-instance
alwaysopen: false
categories:
- docs
- operate
- rs
description: Deletes data from a local instance and removes it from the Active-Active
  database.
linkTitle: purge-instance
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/crdb-cli/crdb/purge-instance/'
---

Deletes data from a local instance and removes the instance from the Active-Active database.

```sh
crdb-cli crdb purge-instance --crdb-guid <guid>
         --instance-id <instance-id>
         [ --no-wait ]
```

Once this command finishes, the other replicas must remove this instance with [`crdb-cli crdb remove-instance --force`]({{< relref "/operate/rs/7.8/references/cli-utilities/crdb-cli/crdb/remove-instance" >}}).

### Parameters

| Parameter                 | Value  | Description                                      |
|---------------------------|--------|--------------------------------------------------|
| crdb-guid        | string | The GUID of the database (required)              |
| instance-id  | string | The ID of the local instance (required) |
| no-wait                   |        | Does not wait for the task to complete           |

### Returns

Returns the task ID of the task that is purging the local instance.

If `--no-wait` is specified, the command exits. Otherwise, it will wait for the instance to be purged and return `finished`.

### Example

```sh
$ crdb-cli crdb purge-instance --crdb-guid db6365b5-8aca-4055-95d8-7eb0105c0b35 --instance-id 2
Task add0705c-87f1-4c28-ad6a-ab5d98e00c58 created
  ---> Status changed: queued -> started
  ---> Status changed: started -> finished
```
