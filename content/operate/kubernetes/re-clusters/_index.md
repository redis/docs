---
Title: Redis Enterprise clusters (REC)
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Create and manage Redis Enterprise clusters (REC) on Kubernetes using the Redis Enterprise operator.
hideListLinks: true
linkTitle: Redis Enterprise clusters (REC)
weight: 30
---

A Redis Enterprise cluster (REC) is a custom Kubernetes resource that represents a Redis Enterprise cluster deployment. The Redis Enterprise operator manages the lifecycle of REC resources, including deployment, scaling, upgrades, and recovery operations.

REC resources define the cluster configuration, including node specifications, storage requirements, security settings, and networking configuration. After you deploy the cluster, it provides a foundation for creating and managing Redis Enterprise databases (REDB).

## Cluster management

Manage your Redis Enterprise cluster lifecycle and configuration:

- [Connect to admin console]({{< relref "/operate/kubernetes/re-clusters/connect-to-admin-console" >}}) - Access the Redis Enterprise web UI for cluster management
- [Multi-namespace deployment]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}}) - Deploy clusters across multiple Kubernetes namespaces
- [Delete custom resources]({{< relref "/operate/kubernetes/re-clusters/delete-custom-resources" >}}) - Safely remove REC and related resources

### Disconnect clients on password removal

Redis Software 8.0.2 and later can actively disconnect client connections
that authenticated with a removed, revoked, or rotated password. In Redis
Software you configure this setting through the REST API — see the
[cluster object]({{< relref "/operate/rs/references/rest-api/objects/cluster/" >}})
and [bdb object]({{< relref "/operate/rs/references/rest-api/objects/bdb/" >}}).
Starting with operator version X.Y.Z, the operator configures it through
the custom resources instead:

<!-- TODO: replace all occurrences of X.Y.Z with the first operator release
that includes this feature -->

- Cluster-wide policy: `spec.disconnectClientsOnPasswordRemoval` on the REC
  (`Enabled`, `Disabled`, or `Auto`).
- Per-database setting: `spec.disconnectClientsOnPasswordRemoval` on the
  [REDB]({{< relref "/operate/kubernetes/re-databases/db-controller#disconnect-clients-on-password-removal" >}})
  (boolean; the Redis Software default is `false`). Takes effect only when
  the cluster-wide policy is `Auto`.
- Active-Active databases:
  `spec.globalConfigurations.disconnectClientsOnPasswordRemoval` on the
  REAADB, propagated to all participating clusters — see
  [Set global database configurations]({{< relref "/operate/kubernetes/active-active/global-config" >}}).
  Takes effect when the cluster-wide policy on the participating clusters
  is `Auto`.

Set the cluster-wide policy in your REC specification:

```yaml
spec:
  disconnectClientsOnPasswordRemoval: Enabled
```

Allowed values are `Enabled`, `Disabled`, and `Auto`. `Auto` (the Redis
Software default) defers the decision to each database's own setting.
`Enabled` and `Disabled` force the behavior for all databases in the
cluster, ignoring the per-database setting.

Whether the operator owns the setting depends on your upgrade path:

- Resources **created by operator version X.Y.Z or later**: the operator
  owns the setting from creation. Configure it only through the custom
  resource — changes made through the Redis Software REST API or admin
  console are reverted the next time the operator reconciles the resource.
  Removing the field from the spec reverts the setting to its Redis
  Software default (`Auto` for the cluster, `false` for a database); it
  does not keep the last value.
- Resources **that existed before you upgraded to operator version X.Y.Z**:
  values configured through the Redis Software REST API are preserved. The
  operator takes ownership only once you set the field in the custom
  resource. From then on, ownership is permanent — if you later remove the
  field, the setting reverts to the Redis Software default, not to the
  previously configured value.

## Storage and performance

Optimize storage and performance for your Redis Enterprise cluster:

- [Redis Flex]({{< relref "/operate/kubernetes/flex" >}}) - Configure automatic data tiering between RAM and flash storage
- [Expand PVC]({{< relref "/operate/kubernetes/re-clusters/expand-pvc" >}}) - Expand persistent volume claims for additional storage

## Monitoring and observability

Monitor cluster health and performance:

- [Connect to Prometheus operator]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}}) - Integrate with Prometheus for metrics collection and monitoring

### Call home client

The call home client sends health or error data from your deployment(s) back to Redis. You can disable it by adding the following to your REC specification:

```yaml
spec:
  usageMeter:
    callHomeClient:
      disabled: true
```

{{<note>}}
The REST API approach used for Redis Software deployments will have no effect on Kubernetes deployments. You must use the REC specification method shown above.
{{</note>}}

## Recovery and troubleshooting

Handle cluster recovery and troubleshooting scenarios:

- [Cluster recovery]({{< relref "/operate/kubernetes/re-clusters/cluster-recovery" >}}) - Recover from cluster failures and restore operations

## Related topics

- [Redis Enterprise databases (REDB)]({{< relref "/operate/kubernetes/re-databases" >}}) - Create and manage databases on your cluster
- [Security]({{< relref "/operate/kubernetes/security" >}}) - Configure security settings for your cluster
- [Networking]({{< relref "/operate/kubernetes/networking" >}}) - Set up networking and ingress for cluster access
- [REC API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}}) - Complete API specification for REC resources
