---
Title: Enable smart client handoffs (SCH)
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Enable smart client handoffs (SCH) to avoid client disruptions during Redis Enterprise cluster maintenance and upgrades on Kubernetes.
linkTitle: Smart client handoffs
weight: 98
---

[Smart client handoffs]({{< relref "/develop/clients/sch" >}}) (SCH) let a Redis Enterprise cluster notify clients about planned maintenance shortly before it happens, so clients can reconnect or otherwise respond gracefully without significant interruptions in service. SCH is primarily useful during server software or hardware upgrades, where it provides *relaxed timeouts* and transparent *pre-handoffs* to new endpoints. See [Smart client handoffs]({{< relref "/develop/clients/sch" >}}) for a full description of the feature.

This page describes how to enable SCH for a Redis Enterprise cluster (REC) running on Kubernetes when your application and the cluster run within the same Kubernetes pod network, using IP-based access without TLS. External access over TLS with name-based addressing is not yet covered.

## Prerequisites

You need a RedisEnterpriseCluster (REC) running a version of Redis Enterprise Software that supports SCH:

- Redis Enterprise Software 8.0.2-17 or later for standalone (Enterprise cluster mode) connections.
- Redis Enterprise Software 8.0.16-29 or later for [OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}) connections.

In your application code, you need a client library that supports SCH (see [SCH support in Redis client libraries]({{< relref "/develop/clients/sch#sch-support-in-redis-client-libraries" >}}) for
more information).

## Get the cluster credentials

The cluster's admin username and password are stored in a Kubernetes secret named after your cluster. Retrieve and decode them so you can authenticate REST API requests:

```sh
kubectl get secret <cluster-name> -o jsonpath='{.data.username}' | base64 --decode
kubectl get secret <cluster-name> -o jsonpath='{.data.password}' | base64 --decode
```

## Enable SCH

Use the [`/v1/cluster`]({{< relref "/operate/rs/references/rest-api/requests/cluster#put-cluster" >}}) REST API request to enable SCH for both Enterprise cluster mode and OSS Cluster API mode. Set `client_maint_notifications` and `oss_cluster_client_maint_notifications` to `true`.

The following example uses [`curl`](https://curl.se/) and addresses the cluster REST API on port `9443` of the REC service (for example, `rec` in a cluster named `rec`):

```sh
curl -k -X PUT -H "accept: application/json" \
    -H "content-type: application/json" \
    -u "<username>:<password>" \
    -d '{ "client_maint_notifications": true, "oss_cluster_client_maint_notifications": true }' \
    https://<cluster-name>:9443/v1/cluster
```

The REST API service uses a `ClusterIP` and is reachable only from within the Kubernetes pod network. Run the command from a pod in the cluster, or use [`kubectl port-forward`](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#port-forward) to forward a local port to the service and address `https://localhost:9443/v1/cluster` instead:

```sh
kubectl port-forward service/<cluster-name> 9443:9443
```

## Verify SCH is active

The most reliable way to confirm that SCH is active is to inspect your client's logs. With SCH enabled and the client's log level set to `DEBUG`, a supporting client reports the maintenance notifications it receives from the server. For example, a Lettuce client reports its moving-endpoint address type as `INTERNAL_IP`, and a redis-py client logs the notification messages directly.

When a client connects with SCH enabled, the server negotiates a `CLIENT MAINT_NOTIFICATIONS` handshake. The expected handshake depends on the connection mode.

For a standalone (Enterprise cluster mode) client, the handshake includes the moving-endpoint type:

```
CLIENT MAINT_NOTIFICATIONS ON moving-endpoint-type internal-ip
```

The `moving-endpoint-type internal-ip` value means the server pushes the internal (pod) IP changes up to the client. In Enterprise cluster mode, the server can push `FAILING_OVER`, `FAILED_OVER`, `MIGRATING`, `MIGRATED`, and `MOVING` messages to the client.

For a client using the OSS Cluster API, the handshake does not include the moving-endpoint type:

```
CLIENT MAINT_NOTIFICATIONS ON
```

The handshake differs because OSS Cluster API mode aligns with the configuration that determines the output of [`CLUSTER SHARDS`]({{< relref "/commands/cluster-shards" >}}), which contains the internal node IP addresses by default. In this mode, the server pushes `SMIGRATING` and `SMIGRATED` messages to the client. The `SMIGRATED` message carries information about topology changes, including the updated internal IP addresses.

You can also observe the handshake server-side with the [`MONITOR`]({{< relref "/commands/monitor" >}}) command.

## Validate SCH during an upgrade

To confirm that SCH reduces disruption during maintenance, [upgrade the Redis Enterprise cluster]({{< relref "/operate/kubernetes/upgrade" >}}), which adds and removes nodes as the operator performs a rolling upgrade of the pods.

1. Make sure both the source and target Redis Enterprise Software versions support SCH.
1. Enable SCH as described above.
1. Connect your clients and set their log level to `DEBUG`.
1. Start the upgrade and watch the client debug output:
    - For a standalone (Enterprise cluster mode) client, look for the `MOVING` messages that redirect the client to the new endpoint.
    - For an OSS Cluster API client, look for the `SMIGRATED` messages that carry the updated cluster topology.

## Related topics

- [Smart client handoffs]({{< relref "/develop/clients/sch" >}}) - Feature overview and client library support
- [Enable cluster-aware clients (OSS Cluster API)]({{< relref "/operate/kubernetes/networking/cluster-aware-clients" >}}) - Route requests directly with cluster-aware clients
- [Database connectivity]({{< relref "/operate/kubernetes/networking/database-connectivity" >}}) - In-cluster and external database access
- [Upgrade Redis Enterprise for Kubernetes]({{< relref "/operate/kubernetes/upgrade" >}}) - Cluster and database upgrade procedures
