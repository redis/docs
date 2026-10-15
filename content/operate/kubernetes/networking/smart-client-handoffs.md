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

You also need Redis Software for Kubernetes 8.2.2-TBD or later.

In your application code, you need a client library that supports SCH (see [SCH support in Redis client libraries]({{< relref "/develop/clients/sch#sch-support-in-redis-client-libraries" >}}) for
more information).

## Enable SCH

Enable SCH with the `clientMaintenanceNotifications` section of the RedisEnterpriseCluster (REC) custom resource. Each database connection mode has its own setting, and both default to `false`:

| Field | Applies to |
| --- | --- |
| `proxyMode.enabled` | Databases that don't use the OSS Cluster API |
| `ossMode.enabled` | Databases that use the [OSS Cluster API](/content/operate/rs/databases/configure/oss-cluster-api.md) |

1. Edit the REC:

    ```sh
    kubectl edit rec <cluster-name>
    ```

1. Add the `clientMaintenanceNotifications` section to the `spec` section. Enable the modes your databases use:

    ```yaml
    spec:
      clientMaintenanceNotifications:
        proxyMode:
          enabled: true
        ossMode:
          enabled: true
    ```

1. Save your changes. The operator applies the settings to the cluster.

### How the operator manages SCH settings

After you set either `enabled` field for the first time, the operator manages that setting:

- The operator keeps the cluster setting matched to the REC. It overwrites changes made any other way, such as through the REST API.
- If you remove the field from the REC, the operator turns the setting off.
- If the cluster's Redis Software version doesn't support the setting, the operator skips it until you upgrade the cluster.

## Connect your clients

Connect your application to the database's Kubernetes service, for example `<database-name>.<namespace>.svc.cluster.local`. Don't connect directly to pod IP addresses. See [Database connectivity](/content/operate/kubernetes/networking/database-connectivity.md) for the services the operator creates.

For databases that don't use the OSS Cluster API, what SCH provides depends on whether your application pods can reach the Redis Software pods' IP addresses. That depends on your Kubernetes cluster's security configuration.

| Application pods can reach Redis Software pod IPs | Endpoint type | What SCH provides |
| --- | --- | --- |
| Yes | `internal-ip` | Connection handoffs and relaxed timeouts. During maintenance, the server sends the client the new endpoint's pod IP address, and the client moves its connection there. |
| No | `none` | Relaxed timeouts during shard failovers and migrations. The server tells the client to reconnect to the endpoint it already uses, so clients still see a disconnect when an endpoint moves. |

Without TLS, the client library requests `internal-ip` automatically. If your application pods can't reach the pod IP addresses, set the endpoint type to `none` in your client library's SCH configuration. See [SCH support in Redis client libraries](/content/develop/clients/sch.md#sch-support-in-redis-client-libraries).

With `none`, a client might reconnect twice when an endpoint moves.

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
