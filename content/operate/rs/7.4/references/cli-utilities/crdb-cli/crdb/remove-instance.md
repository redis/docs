---
Title: crdb-cli crdb remove-instance
alwaysopen: false
categories:
- docs
- operate
- rs
description: Removes a peer replica from an Active-Active database.
linkTitle: remove-instance
weight: $weight
url: '/operate/rs/7.4/references/cli-utilities/crdb-cli/crdb/remove-instance/'
---

Removes a peer replica instance from the Active-Active database and deletes the instance and its data from the participating cluster.

```sh
crdb-cli crdb remove-instance --crdb-guid <guid>
         --instance-id <instance-id>
         [ --force ]
         [ --no-wait ]
```

If the cluster cannot communicate with the instance that you want to remove, you can:

1. Use the `--force` option to remove the instance from the Active-Active database without purging the data from the instance.

1. Run [`crdb-cli crdb purge-instance`]({{< relref "/operate/rs/7.4/references/cli-utilities/crdb-cli/crdb/purge-instance" >}}) from the removed instance to delete the Active-Active database and its data.

### Parameters

| Parameter                    | Value  | Description|
|------------------------------|--------|------------|
| crdb-guid         | string | The GUID of the database (required) |
| instance-id | string | The ID of the local instance to remove (required) |
| force                        |        | Removes the instance without purging data from the instance. <br>If --force is specified, you must run [`crdb-cli crdb purge-instance`]({{< relref "/operate/rs/7.4/references/cli-utilities/crdb-cli/crdb/purge-instance" >}}) from the removed instance. |
| no-wait                      |        | Does not wait for the task to complete |

### Returns

Returns the task ID of the task that is deleting the instance.

If `--no-wait` is specified, the command exits. Otherwise, it will wait for the instance to be removed and return `finished`.

### Example

```sh
$ crdb-cli crdb remove-instance --crdb-guid db6365b5-8aca-4055-95d8-7eb0105c0b35 --instance-id 2 --force
Task b1eba5ba-90de-49e9-8678-d66daa1afb51 created
  ---> Status changed: queued -> started
  ---> Status changed: started -> finished
```
