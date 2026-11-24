---
Title: Smart client handoffs
alwaysopen: false
categories:
- docs
- operate
- rs
description: Enable Smart client handoffs for your Redis Software cluster.
linkTitle: Smart client handoffs
weight: 90
url: '/operate/rs/8.0/clusters/configure/sch/'
---

Smart client handoffs (SCH) is a feature of Redis Cloud and Redis Software servers that lets them actively notify clients about planned server maintenance shortly before it happens. This lets a client reconnect or otherwise respond gracefully without significant interruptions in service.
See [Smart client handoffs](/content/develop/clients/sch.md) for more information about SCH.

SCH is supported for Redis Software from v8.0.2 on, and OSS Cluster API from v8.0.16 on.
The degree of support for SCH depends on the specific upgrade method you use, as detailed in the table below.

{{< embed-md "rs-sch-support.md" >}}

To enable SCH on a Redis Software server, you must use the
[/v1/cluster](/content/operate/rs/8.0/references/rest-api/requests/cluster/_index.md#put-cluster)
REST API request. Both options below default to `false`. Each one applies to
databases with a different routing setup, so set the one that matches your databases
(or both):

| Option | Applies to |
| :-- | :-- |
| `client_maint_notifications` | Databases that use standard routing |
| `oss_cluster_client_maint_notifications` | Databases that use the [OSS Cluster API](/content/operate/rs/8.0/databases/configure/oss-cluster-api.md) |

A database checks only the option that matches its routing setup. For example, a
database with the OSS Cluster API enabled ignores `client_maint_notifications`.

The example below shows how to set both options to `true` using the
[`curl`](https://curl.se/) command line utility:

```bash
curl -k -X PUT -H "accept: application/json" \
    -H "content-type: application/json" \
    -u "<username>:<password>" \
    -d '{ "client_maint_notifications": true, "oss_cluster_client_maint_notifications": true }' \
    https://<host>:<port>/v1/cluster
```

## Known limitations

During a rolling upgrade with SCH enabled, when some slot's shards have migrated to a different node but are still reachable from their original node, results of the `SCAN` command might be inconsistent: it might show some of the keys, it might show keys that are not reachable from that node, or it might show no keys. When the slot migration is done, this issue will fix itself.
