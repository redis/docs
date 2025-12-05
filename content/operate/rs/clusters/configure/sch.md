---
Title: Smart client handoffs
alwaysopen: false
categories:
- docs
- operate
- rs
description: Enable Smart client handoffs for your Redis Enterprise Software cluster.
linkTitle: Smart client handoffs
weight: 90
---

Smart client handoffs (SCH) is a feature of Redis Cloud and Redis Enterprise servers that lets them actively notify clients about planned server maintenance shortly before it happens. This lets a client reconnect or otherwise respond gracefully without significant interruptions in service.
See [Smart client handoffs]({{< relref "/develop/clients/sch" >}}) for more information about SCH.

To enable SCH on a Redis Enterprise server, you must use the
[v1/cluster]({{< relref "/operate/rs/references/rest-api/requests/cluster" >}})
REST API request to set the `client_maint_notifications` option to `true`.
The example below shows how to do this using the
[`curl`](https://curl.se/) command line utility:

```bash
curl -k -X PUT -H "accept: application/json" \
    -H "content-type: application/json" \
    -u "test@redis.com:test123" \
    -d '{ "client_maint_notifications": true }' \
    https://localhost:9443/v1/cluster
```
