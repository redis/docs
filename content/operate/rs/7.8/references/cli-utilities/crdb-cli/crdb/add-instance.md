---
Title: crdb-cli crdb add-instance
alwaysopen: false
categories:
- docs
- operate
- rs
description: Adds a peer replica to an Active-Active database.
linkTitle: add-instance
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/crdb-cli/crdb/add-instance/'
---

Adds a peer replica to an existing Active-Active database in order to host the database on another cluster. This creates an additional active instance of the database on the specified cluster.

```sh
crdb-cli crdb add-instance --crdb-guid <guid>
         --instance fqdn=<cluster_fqdn>,username=<username>,password=<password>[,url=<url>,replication_endpoint=<endpoint>]
         [ --compression <0-6> ]
         [ --no-wait ]
```

### Parameters

| Parameter | Value   | Description |
|-----------|---------|-------------|
| crdb-guid | string  | The GUID of the database (required) |
| instance | strings | The connection information for the new participating cluster (required) |
| compression | 0-6     | The level of data compression: 0=Compression disabled <br> <br> 6=High compression and resource load (Default: 3) |
| no-wait | | Does not wait for the task to complete |

### Returns

Returns the task ID of the task that is adding the new instance.

If `--no-wait` is specified, the command exits. Otherwise, it will wait for the instance to be added and return `finished`.

### Example

```sh
$ crdb-cli crdb add-instance --crdb-guid db6365b5-8aca-4055-95d8-7eb0105c0b35 \
        --instance fqdn=cluster2.redis.local,username=admin@redis.local,password=admin-password
Task f809fae7-8e26-4c8f-9955-b74dbbd47949 created
  ---> Status changed: queued -> started
  ---> Status changed: started -> finished
```
