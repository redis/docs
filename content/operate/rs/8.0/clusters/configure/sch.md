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
See [Smart client handoffs]({{< relref "/develop/clients/sch" >}}) for more information about SCH.

SCH is supported for Redis Software from v8.0.2 on, and OSS Cluster API from v8.0.16 on.
The degree of support for SCH depends on the specific upgrade method you use, as detailed in the table below.

{{< embed-md "rs-sch-support.md" >}}

To enable SCH on a Redis Software server, you must use the
[/v1/cluster]({{< relref "/operate/rs/8.0/references/rest-api/requests/cluster#put-cluster" >}})
REST API request to set the `client_maint_notifications` option to `true`.
The example below shows how to do this using the
[`curl`](https://curl.se/) command line utility:

```bash
curl -k -X PUT -H "accept: application/json" \
    -H "content-type: application/json" \
    -u "<username>:<password>" \
    -d '{ "client_maint_notifications": true }' \
    https://<host>:<port>/v1/cluster
```
