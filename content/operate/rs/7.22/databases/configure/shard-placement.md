---
Title: Configure shard placement
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configure shard placement to improve performance.
linktitle: Shard placement
weight: 60
url: '/operate/rs/7.22/databases/configure/shard-placement/'
---
In Redis Enterprise Software , the location of master and replica shards on the cluster nodes can impact the database and node performance.
Master shards and their corresponding replica shards are always placed on separate nodes for data resiliency.
The [shard placement policy]({{< relref "/operate/rs/7.22/databases/memory-performance/shard-placement-policy.md" >}}) helps to maintain optimal performance and resiliency.

{{< embed-md "shard-placement-intro.md"  >}}

## Default shard placement policy

When you create a new cluster, the cluster configuration has a `dense` default shard placement policy.
When you create a database, this default policy is applied to the new database.

To see the current default shard placement policy, run `rladmin info cluster`:

{{< image filename="/images/rs/shard_placement_info_cluster.png" >}}

To change the default shard placement policy so that new databases are created with the `sparse` shard placement policy, run:

```sh
rladmin tune cluster default_shards_placement [ dense | sparse ]
```

## Shard placement policy for a database

To see the shard placement policy for a database in `rladmin status`.

{{< image filename="/images/rs/shard_placement_rladmin_status.png" >}}

To change the shard placement policy for a database, run:

```sh
rladmin tune db { db:<ID> | <database-name> } shards_placement { dense | sparse }
```
